const fs = require('fs');
const path = require('path');
const express = require('express');
const appConfig = require('./config');

// Load local .env without requiring an extra package.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const crypto = require('crypto');
const dns = require('dns');
// Use public DNS resolvers for MongoDB SRV records when the local DNS resolver blocks them.
try { dns.setServers(['1.1.1.1', '8.8.8.8']); } catch (_) {}
const { MongoClient } = require('mongodb');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || appConfig.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || appConfig.MONGODB_DB || 'prohacker';

// Local development MUST work even when ADMIN_USERNAME / ADMIN_PASSWORD are blank
// in .env. Railway variables can still override these values.
const DEFAULT_ADMIN_USERNAME = 'prohacker';
const DEFAULT_ADMIN_PASSWORD = 'prohacker';
const DEFAULT_PASSWORD_VIEW_KEY = 'prohacker-local-password-view-key';
const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || appConfig.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim() || DEFAULT_ADMIN_USERNAME;
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || appConfig.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD);
const PASSWORD_VIEW_KEY = String(process.env.PASSWORD_VIEW_KEY || appConfig.PASSWORD_VIEW_KEY || DEFAULT_PASSWORD_VIEW_KEY);
const SESSION_DAYS = 30;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Create a .env file from .env.example before starting.');
  process.exit(1);
}

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api/health', async (req, res) => {
  try {
    await db.command({ ping: 1 });
    res.json({ ok: true, database: DB_NAME });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ ok: false, error: 'DATABASE_UNAVAILABLE', detail: process.env.NODE_ENV !== 'production' ? err.message : undefined });
  }
});

app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(path.join(__dirname)));


let db;
let users;
let sessions;
let guestCounter;
let bookmarks;
let ratings;
let adminSessions;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(storedHash, 'hex'));
}

function encryptPasswordForAdmin(password) {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(String(PASSWORD_VIEW_KEY || '')).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(password), 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    data: encrypted.toString('base64'),
    tag: cipher.getAuthTag().toString('base64')
  };
}

function decryptPasswordForAdmin(record) {
  try {
    if (!record?.iv || !record?.data || !record?.tag || !PASSWORD_VIEW_KEY) return null;
    const key = crypto.createHash('sha256').update(String(PASSWORD_VIEW_KEY)).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(record.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(record.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(record.data, 'base64')),
      decipher.final()
    ]).toString('utf8');
  } catch (_) {
    return null;
  }
}

function normalizeUsername(value) {
  return String(value || '').trim();
}

function validUsername(username) {
  return /^[A-Za-z0-9_\-]{3,24}$/.test(username);
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

// Express does not provide res.cookie()/res.clearCookie() unless cookie-parser is used.
// Keep this project dependency-free and set the cookie header directly.
function setSessionCookie(res, token) {
  const o = cookieOptions();
  const parts = [
    `ph_session=${encodeURIComponent(token)}`,
    `Max-Age=${Math.floor(o.maxAge / 1000)}`,
    `Path=${o.path}`,
    'HttpOnly',
    'SameSite=Lax'
  ];
  if (o.secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  const parts = ['ph_session=', 'Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const item = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

async function createSession(res, sessionData) {
  const token = crypto.randomBytes(32).toString('hex');
  await sessions.insertOne({
    token,
    ...sessionData,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  });
  setSessionCookie(res, token);
}

async function getSession(req) {
  const token = getCookie(req, 'ph_session');
  if (!token) return null;
  const session = await sessions.findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return session;
}

async function getRegisteredUser(req) {
  const session = await getSession(req);
  if (!session || session.guest === true || !session.userId) return null;
  return session;
}

const ADMIN_SESSION_DAYS = 1;
function setAdminCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [`ph_admin=${encodeURIComponent(token)}`, `Max-Age=${ADMIN_SESSION_DAYS * 86400}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
function clearAdminCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = ['ph_admin=', 'Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
async function getAdminSession(req) {
  const token = getCookie(req, 'ph_admin');
  if (!token) return null;
  return db.collection('adminSessions').findOne({ token, expiresAt: { $gt: new Date() } });
}
async function requireAdmin(req, res) {
  const session = await getAdminSession(req);
  if (!session) { res.status(401).json({ error: 'ADMIN_LOGIN_REQUIRED' }); return null; }
  return session;
}
function adminCredentialsConfigured() {
  // Always configured because the server has safe local defaults.
  // Environment variables/config.js override them when provided.
  return true;
}
function safeAdminCompare(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

app.get('/api/admin/me', async (req, res) => {
  try { const session = await getAdminSession(req); res.json({ authenticated: !!session }); }
  catch (err) { res.status(500).json({ error: 'SERVER_ERROR' }); }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    if (!adminCredentialsConfigured()) return res.status(503).json({ error: 'Admin credentials are not configured on the server.' });
    if (!safeAdminCompare(req.body.username, ADMIN_USERNAME) || !safeAdminCompare(req.body.password, ADMIN_PASSWORD)) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    await db.collection('adminSessions').insertOne({ token, createdAt: new Date(), expiresAt: new Date(Date.now() + ADMIN_SESSION_DAYS * 86400000) });
    setAdminCookie(res, token);
    res.json({ authenticated: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'SERVER_ERROR' }); }
});

app.post('/api/admin/logout', async (req, res) => {
  try { const token = getCookie(req, 'ph_admin'); if (token) await db.collection('adminSessions').deleteOne({ token }); clearAdminCookie(res); res.json({ authenticated: false }); }
  catch (err) { res.status(500).json({ error: 'SERVER_ERROR' }); }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const admin = await requireAdmin(req, res); if (!admin) return;
    const docs = await users.find({}, { projection: { username: 1, usernameLower: 1, createdAt: 1, lastLoginAt: 1, passwordUpdatedAt: 1, passwordEncrypted: 1 } }).sort({ createdAt: -1 }).toArray();
    const ids = docs.map(x => x._id);
    const [bm, rt, ss] = await Promise.all([
      bookmarks.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]).toArray(),
      ratings.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]).toArray(),
      sessions.aggregate([{ $match: { userId: { $in: ids }, guest: false, expiresAt: { $gt: new Date() } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]).toArray()
    ]);
    const bmMap = new Map(bm.map(x => [String(x._id), x.count]));
    const rtMap = new Map(rt.map(x => [String(x._id), x.count]));
    const ssMap = new Map(ss.map(x => [String(x._id), x.count]));
    res.json({ users: docs.map(u => ({
      id: String(u._id),
      username: u.username,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || null,
      passwordUpdatedAt: u.passwordUpdatedAt || null,
      bookmarks: bmMap.get(String(u._id)) || 0,
      ratings: rtMap.get(String(u._id)) || 0,
      activeSessions: ssMap.get(String(u._id)) || 0,
      password: decryptPasswordForAdmin(u.passwordEncrypted) || 'غير متاحة — غيّر كلمة السر'
    })) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'SERVER_ERROR' }); }
});

app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const admin = await requireAdmin(req, res); if (!admin) return;
    const username = normalizeUsername(req.body.username);
    const newPassword = req.body.newPassword;
    if (!validPassword(newPassword)) return res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
    const user = await users.findOne({ usernameLower: username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { salt, hash } = hashPassword(newPassword);
    await users.updateOne({ _id: user._id }, { $set: { passwordHash: hash, passwordSalt: salt, passwordUpdatedAt: new Date(), passwordEncrypted: encryptPasswordForAdmin(newPassword) } });
    await sessions.deleteMany({ userId: user._id });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'SERVER_ERROR' }); }
});


function preferenceKey(gameIndex, tab, scriptIndex) {
  return `${Number(gameIndex)}:${tab === 'nokey' ? 'nokey' : 'key'}:${Number(scriptIndex)}`;
}

async function requireRegisteredUser(req, res) {
  const session = await getRegisteredUser(req);
  if (!session) {
    res.status(401).json({ error: 'LOGIN_REQUIRED' });
    return null;
  }
  return session;
}

app.get('/api/auth/me', async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.json({ authenticated: false });
    return res.json({
      authenticated: true,
      username: session.username,
      guest: session.guest === true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error', detail: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (!validUsername(username)) {
      return res.status(400).json({ error: 'Username must be 3-24 characters and use only letters, numbers, _ or -.' });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const exists = await users.findOne({ usernameLower: username.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Username is already taken.' });

    const { salt, hash } = hashPassword(password);
    const user = {
      username,
      usernameLower: username.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      passwordUpdatedAt: new Date(),
      passwordEncrypted: encryptPasswordForAdmin(password)
    };
    await users.insertOne(user);

    await createSession(res, { username, guest: false, userId: user._id });
    res.json({ authenticated: true, username, guest: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error', detail: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = req.body.password;
    const user = await users.findOne({ usernameLower: username.toLowerCase() });

    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    await users.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date(), passwordEncrypted: encryptPasswordForAdmin(password), passwordUpdatedAt: user.passwordUpdatedAt || new Date() } }
    );
    await createSession(res, { username: user.username, guest: false, userId: user._id });
    res.json({ authenticated: true, username: user.username, guest: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error', detail: err.message });
  }
});

app.post('/api/auth/guest', async (req, res) => {
  try {
    const counter = await guestCounter.findOneAndUpdate(
      { _id: 'guest_counter' },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const number = counter.value?.value || counter.value || 1;
    const username = `Guest ${number}`;
    await createSession(res, { username, guest: true });
    res.json({ authenticated: true, username, guest: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error', detail: err.message });
  }
});

app.get('/api/user/preferences', async (req, res) => {
  try {
    const session = await getRegisteredUser(req);
    if (!session) return res.status(401).json({ error: 'LOGIN_REQUIRED' });

    const [bookmarkDocs, ratingDocs] = await Promise.all([
      bookmarks.find({ userId: session.userId }).toArray(),
      ratings.find({ userId: session.userId }).toArray()
    ]);

    const ratingMap = {};
    ratingDocs.forEach(doc => { ratingMap[doc.scriptKey] = doc.rating; });

    return res.json({
      bookmarks: bookmarkDocs.map(doc => doc.scriptKey),
      ratings: ratingMap
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error', detail: err.message });
  }
});

app.post('/api/user/bookmark', async (req, res) => {
  try {
    const session = await requireRegisteredUser(req, res);
    if (!session) return;

    const scriptKey = String(req.body.scriptKey || '');
    const bookmarked = req.body.bookmarked === true;
    if (!/^\d+:(?:key|nokey):\d+$/.test(scriptKey)) {
      return res.status(400).json({ error: 'Invalid script.' });
    }

    if (bookmarked) {
      await bookmarks.updateOne(
        { userId: session.userId, scriptKey },
        { $set: { userId: session.userId, username: session.username, scriptKey, updatedAt: new Date() } },
        { upsert: true }
      );
    } else {
      await bookmarks.deleteOne({ userId: session.userId, scriptKey });
    }

    res.json({ ok: true, bookmarked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error', detail: err.message });
  }
});

app.post('/api/user/rating', async (req, res) => {
  try {
    const session = await requireRegisteredUser(req, res);
    if (!session) return;

    const scriptKey = String(req.body.scriptKey || '');
    const rating = Number(req.body.rating);
    if (!/^\d+:(?:key|nokey):\d+$/.test(scriptKey) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating.' });
    }

    await ratings.updateOne(
      { userId: session.userId, scriptKey },
      { $set: { userId: session.userId, username: session.username, scriptKey, rating, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true, rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error', detail: err.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = getCookie(req, 'ph_session');
    if (token) await sessions.deleteOne({ token });
    clearSessionCookie(res);
    res.json({ authenticated: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error', detail: err.message });
  }
});

async function start() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  users = db.collection('users');
  sessions = db.collection('sessions');
  guestCounter = db.collection('counters');
  bookmarks = db.collection('bookmarks');
  ratings = db.collection('ratings');
  adminSessions = db.collection('adminSessions');

  await users.createIndex({ usernameLower: 1 }, { unique: true });
  await sessions.createIndex({ token: 1 }, { unique: true });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await bookmarks.createIndex({ userId: 1, scriptKey: 1 }, { unique: true });
  await ratings.createIndex({ userId: 1, scriptKey: 1 }, { unique: true });
  await adminSessions.createIndex({ token: 1 }, { unique: true });
  await adminSessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PRO HACKER server listening on port ${PORT}`);
    console.log(`Admin login is configured locally for username: ${ADMIN_USERNAME}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
