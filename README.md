# PRO HACKER

## Run locally

1. Make sure Node.js 18+ is installed.
2. Keep your existing `.env` file in this folder if you already have one with your MongoDB URI.
3. If you do not have `.env`, copy `.env.example` to `.env` and fill in `MONGODB_URI`.
4. Run `npm install` once.
5. Run `npm start` or double-click `start-local.bat`.
6. Open `http://localhost:3000`.

### Local admin login

The server has built-in local fallback credentials, so blank `ADMIN_USERNAME` / `ADMIN_PASSWORD` variables no longer cause the **Admin credentials are not configured on the server** error.

- Username: `prohacker`
- Password: `prohacker`

Railway environment variables still override these defaults.

### Passwords in the admin dashboard

New registrations are encrypted with a server-side key so the admin dashboard can display the password as normal text after admin authentication. Existing accounts created before this feature may show unavailable until the user logs in again or the admin resets the password. The login flow now updates the encrypted copy after a successful login.
