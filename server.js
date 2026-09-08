const fs = require('fs');
const path = require('path');
const express = require('express');

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
const { MongoClient } = require('mongodb');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'prohacker';
const SESSION_DAYS = 30;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Create a .env file from .env.example before starting.');
  process.exit(1);
}

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));

let db;
let users;
let sessions;
let guestCounter;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(storedHash, 'hex'));
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
  res.cookie('ph_session', token, cookieOptions());
}

async function getSession(req) {
  const token = getCookie(req, 'ph_session');
  if (!token) return null;
  const session = await sessions.findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) return null;
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
    res.status(500).json({ error: 'Server error' });
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
      createdAt: new Date()
    };
    await users.insertOne(user);

    await createSession(res, { username, guest: false, userId: user._id });
    res.json({ authenticated: true, username, guest: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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

    await createSession(res, { username: user.username, guest: false, userId: user._id });
    res.json({ authenticated: true, username: user.username, guest: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = getCookie(req, 'ph_session');
    if (token) await sessions.deleteOne({ token });
    res.clearCookie('ph_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    res.json({ authenticated: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function start() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  users = db.collection('users');
  sessions = db.collection('sessions');
  guestCounter = db.collection('counters');

  await users.createIndex({ usernameLower: 1 }, { unique: true });
  await sessions.createIndex({ token: 1 }, { unique: true });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  app.listen(PORT, () => console.log(`PRO HACKER running on http://localhost:${PORT}`));
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
