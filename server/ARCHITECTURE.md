# Architecture (Beginner-Friendly)

## Big Picture
- Browser (your HTML/CSS pages) talks to the server using HTTP.
- Server is Node.js + Express.
- Data is stored in a SQLite database file (`server/ifi-users.db`).

## Request Flow
1. The browser sends JSON (e.g., to `/api/signup`).
2. Express parses the JSON (`express.json()` middleware).
3. We read/write to SQLite using SQL queries.
4. Server responds with JSON (success/failure, data).

## Core Endpoints
- `POST /api/signup`
  - Input: `firstName, lastName, email, password, phone` (+ optional DOB)
  - Hashes password with bcrypt; inserts a user row.
- `POST /api/login`
  - Input: `username` (email or phone), `password`
  - Finds user by email/phone; compares password hash; returns success.
- `GET /api/users`
  - Returns list of users (for testing/learning).
- `GET /api/health`
  - Returns server/DB status.

## Data Model (Core)
- `users(id, firstName, lastName, email, phone, passwordHash, dateOfBirth, createdAt)`

## What’s intentionally omitted (Core)
- Sessions/tokens (JWT)
- Email verification
- Password reset tokens
- Rate limiting
- MFA/TOTP

These appear in the advanced server (`server.js`).