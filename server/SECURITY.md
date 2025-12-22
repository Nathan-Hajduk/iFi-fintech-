# Security Notes

This project has two modes. The Core mode is intentionally simple. The Advanced mode adds security controls often discussed in interviews.

## Core Mode (Simple)
- Passwords: hashed with bcrypt.
- No sessions/tokens: frontend treats a successful login as "logged in".
- Pros: easy to understand and explain.
- Cons: not suitable for production as-is.

## Advanced Mode (Hardening)
- Email verification: blocks login until email is verified.
- Password reset: one-time, hashed, time-limited tokens.
- Validation/sanitization: Joi + validator for safer inputs.
- Auth: JWT access + refresh tokens; hashed refresh tokens for revocation.
- Rate limiting: protects login/reset/signup from brute force.
- MFA (TOTP): optional second factor.
- Logging: structured logs + security audit trail.
- Analytics: basic event capture.

## How to talk about trade-offs
- Core: great for learning request/response cycles and database basics.
- Advanced: demonstrates awareness of real-world risks and mitigations, but adds complexity.
- Rule of thumb: only keep features you can explain end-to-end.