# PRO HACKER Authentication

This version keeps the existing site and adds:
- Account registration with username/password.
- Login/logout using secure HTTP-only session cookies.
- Guest mode with automatic names: Guest 1, Guest 2, Guest 3...
- Arabic/English authentication UI following the site's existing language switch.
- MongoDB persistence for users, sessions, and the guest counter.

## Setup

1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Put your MongoDB connection string in `MONGODB_URI`.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

Do not put the MongoDB connection string inside `index.html` or frontend JavaScript. Keep it in `.env` on the server.

## Admin dashboard

Open `/admin.html` on the running site. Configure `ADMIN_USERNAME` and `ADMIN_PASSWORD` as server environment variables (Railway Variables are recommended). The dashboard can view usernames and account activity and reset a user's password. Passwords are never displayed or stored in plaintext; resets generate a new secure password hash and invalidate the user's existing sessions.


## Admin / authentication update

- The admin credentials now have a built-in fallback in `config.js`, so the dashboard no longer returns `Admin credentials are not configured on the server` when `ADMIN_USERNAME` / `ADMIN_PASSWORD` are missing.
- Environment variables still override the values in `config.js`.
- New and reset user passwords are encrypted for admin-only display. Existing accounts created before this update cannot have their original password recovered; reset their password once to make it displayable.
- The registration/login interface has been enlarged and redesigned while keeping the Arabic/English language switch.
- `PASSWORD_VIEW_KEY` must remain stable if you want previously encrypted passwords to remain viewable.

### Default admin login
- Username: `prohacker`
- Password: `prohacker`

Change these in `config.js` before making the project public.
