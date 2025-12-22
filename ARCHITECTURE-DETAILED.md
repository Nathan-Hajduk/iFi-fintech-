# iFi Platform Architecture (Deep Dive)

## 1. Overview
The iFi application is a full‑stack, single–user oriented financial management platform consisting of:
- Frontend: Static HTML pages with modular CSS and page‑specific JavaScript logic.
- Backend: Node.js + Express REST API with a hardened authentication and security layer.
- Persistence: SQLite database (file `server/ifi-users.db`) used for user & security data; client‑side financial/state data stored in `localStorage`.
- Runtime State: A hybrid of server issued auth tokens (secure user identity) and browser `localStorage` (onboarding progress, financial snapshots, UI preferences).

Separation of concerns keeps the server focused on identity/security while the browser handles domain modeling (budgets, investments, transactions) for rapid iteration without schema migrations.

## 2. Frontend Layer

### 2.1 HTML Page Set
Each page lives under `html/` and loads only what it needs:
- `Login.html`, `signup.html`, `forgot-*`, `reset-link-sent.html`, `account-created.html`: Authentication & recovery flow (light theme).
- `dashboard.html`: Central personalized financial hub (dark theme) with dynamic metrics widgets.
- `transactions.html`: CRUD‑style transaction log and filtering UI.
- `investments.html`: Portfolio summary & allocation visualization scaffolding.
- `economy.html`: Market indices, news categories, economic indicators, AI insights.
- `ifi-ai.html`: Future AI assistant surface (shares dark theme styling).
- `onboarding.html`: Captures purpose (personal, business, investing, debt) plus income/expense/investment profile data.
- `settings.html`, `feedback.html`, `contact-us.html`: Ancillary user experience pages.

All pages use semantic sections and utility containers. The dashboard/in-app pages rely on JS injection for data‑driven components (e.g., metrics grid, insights list).

### 2.2 CSS Architecture
Located in `css/` with thematic separation:
- `main.css`: Light theme baseline (auth & marketing style). Defines light variables (`--primary-color`, `--background-color`, etc.).
- `dashboard.css`: Dark theme design system (core variables: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--primary`, `--accent`). Reused by app pages for consistent experience.
- Page‑specific augmentations (e.g., `transactions.css`, `investments.css`, `economy.css`) layer structural and component rules on top of dark theme tokens.
- Specialized styles (confirmation pages, onboarding forms) isolate layout variations without polluting shared tokens.

Key conventions:
- Variables centralize color decisions; component classes reference tokens (`var(--bg-card)`), enabling global palette changes with minimal churn.
- Cards use consistent elevation (border + subtle shadow) while hover interactions employ `--bg-hover` for discoverability.
- Layout responsiveness achieved via CSS grid (`metrics-grid`, `widgets-grid`, `market-indices`) with `repeat(auto-fit, minmax(...))`.
- Glass / subtle translucency applied sparingly (action buttons) to prevent visual noise.

### 2.3 JavaScript Modules
Located in `js/` each file scopes to a page or domain concern:

| File | Responsibility | Key Concepts |
|------|----------------|--------------|
| `auth.js` | Protects restricted pages; redirects unauthenticated users; exposes `logout()` | Validates `ifi_current_user` in `localStorage` |
| `dashboard.js` | Orchestrates personalized dashboard rendering | Purpose‑aware metrics, health score, period toggle, dynamic widget injection |
| `transactions.js` | Transaction creation, storage, filtering, summary computation | Persistent array in `localStorage` (`ifi_transactions`), complex multi-filter pipeline |
| `investments.js` | (Future expansion) portfolio interactions | Placeholder or extended logic for asset management |
| `economy.js` | (Future expansion) real‑time or fetched economic data | Will integrate API news/indicators |
| `onboarding.js` | Captures user financial profile, stores structured object | Generates `ifi_onboarding_data` |
| `login-validation.js` / `signup-validation.js` | Client-side form validation | UX feedback pre-request |

#### 2.3.1 Dashboard Rendering Flow
1. `DOMContentLoaded` triggers initialization functions.
2. `loadOnboardingData()` parses `ifi_onboarding_data` from `localStorage`.
3. `generatePersonalizedContent()` branches by `purpose` to assemble widgets:
   - Business users: Assets/Liabilities/Net Worth + KPI cluster (Working Capital, Asset/Liability Ratio…).
   - Other purposes: Budget widget, investment widget (if data present), debt insights.
4. `setupPeriodToggle()` binds monthly/annual switches; re-renders sensitive components (metrics, cash flow, insights) without page reload.
5. Financial calculations are derived as needed (monthly income normalization, total expenses, ratios) avoiding pre-computed stale caches.

#### 2.3.2 State & Persistence (Frontend)
LocalStorage Keys:
- `ifi_current_user`: Serialized user object post-auth (firstName, email, etc.).
- `ifi_onboarding_data`: Structured financial model (income, expenses, investments, business assets/liabilities, debts, strategy flags).
- `ifi_period`: UI preference for metrics horizon (`monthly` | `annual`).
- `ifi_transactions`: Array of user-entered transaction objects.

Advantages: Fast iteration, offline resilience, zero server migrations for prototype phase. Trade‑off: Multi-device sync & integrity not enforced server-side (acceptable for MVP).

#### 2.3.3 Transactions Pipeline
`transactions.js` implements: 
- Immutable-style filter pipeline: clone array then chain search, category, type, period filtering.
- Period logic computes day deltas for rolling windows (today/week/month/year).
- Derived aggregates (`income`, `expenses`, `netCashFlow`) update summary cards each render.
- CRUD operations: create (form submit), pseudo-edit (remove + re-add), delete (confirmation gate).

#### 2.3.4 Health Score Algorithm
Weighted scoring (0–100):
- Expense ratio tiering (≤50%, ≤70%, ≤90%) up to 30 pts.
- Investments presence 20 pts.
- Positive net cash flow 20 pts.
- Business asset/liability strength up to 20 pts.
Score informs simple qualitative badges in insights list (extendable to risk modeling later).

### 2.4 UI / Component Strategy
- **Metric Cards**: Generated HTML strings inserted into `metricsGrid`; each card renders icon, label, value, optional delta (profit margin etc.).
- **Widgets**: Business widgets dynamically created DOM nodes appended to `.content-grid` enabling conditional existence.
- **Empty States**: Provide guidance for missing onboarding or zero assets/liabilities to prompt next action.
- **Insight Items**: Declarative array of heuristic messages classed by severity (`success`, `warning`, `primary`).

## 3. Backend Layer

### 3.1 Server Composition
Single Express application (`server/server.js`) enhanced beyond minimal CRUD with security & lifecycle features:
- **Auth**: JWT access (short TTL) + refresh tokens (revocable, hashed persistence).
- **Security Hardening**: Rate limiting, MFA (TOTP), password reset tokens (single-use + expiry), email verification workflow.
- **Observability**: Winston structured logging + audit trail table (`audit_logs`).
- **Analytics**: Generic event ingestion endpoint for future user behavior insights.

### 3.2 Database Schema Highlights
Tables:
- `users`: Identity + security fields (verification, MFA secret, timestamps).
- `password_resets`: Token hash + expiry + used flag to prevent replay.
- `refresh_tokens`: Hashed tokens enabling server-side revocation (logout all sessions pattern).
- `audit_logs`: Security event ledger (login success/failure, password change, MFA events).
- `analytics_events`: Arbitrary event sink for frontend tracking.

Rationale: Keeps financial domain ephemeral client-side until production maturity; server persistence focuses on authentication integrity, not budgeting logic yet.

### 3.3 Request Lifecycle (Auth Example)
1. User submits credentials to `POST /api/login`.
2. Server verifies password hash (`bcrypt.compare`).
3. Checks email verification & optionally issues MFA challenge.
4. On success: Issues access + refresh tokens; stores hashed refresh token.
5. Subsequent API calls include `Authorization: Bearer <accessToken>`; middleware validates & attaches `req.user`.
6. Refresh: `POST /api/refresh` validates presented refresh token against stored hashes; returns new access token.

### 3.4 Security Flows
- **Email Verification**: UUID token + timestamp; consumed via `/api/verify-email` then nulled.
- **Password Reset**: Request generates a single-use hashed token; confirmation endpoint validates hash & expiresAt, rotates password hash.
- **MFA Enable**: Generates base32 secret; stores + toggles flag; login gates behind TOTP verification route.
- **Logout**: Bulk revokes refresh tokens (future granular session model possible).
- **Rate Limiting**: Granular limiter factory `makeLimiter()` for sensitive routes (signup/login/password actions).

### 3.5 Logging & Auditing
`logSecurityEvent()` dual writes: audit_logs row + structured `info` log. Central error handler captures unhandled exceptions for operational awareness.

### 3.6 Validation & Sanitization
Joi schemas enforce shape & strength (password complexity regex, phone format). `validator.normalizeEmail` ensures canonical email storage reducing duplicate identity risk.

## 4. Integration Between Frontend & Backend

Current financial computations are entirely client-side; backend supplies only identity & security services. Integration points:
- Post-login, the frontend could exchange access token for user profile via `/api/me` (present scaffolding exists).
- Future phases: Persist transactions, assets, and onboarding data server-side for multi-device continuity.
- Analytics events (`/api/analytics/event`) allow the frontend to log user interactions to inform feature prioritization.

Benefits of this staged approach:
- Fast iteration of financial feature set without altering server schema.
- Security foundation established early (reduces rewrite risk later).
- Clear upgrade path: migrate `localStorage` objects to REST resources incrementally.

## 5. Data Models (Client-Side Structures)

Example `ifi_onboarding_data` shape (conceptual):
```jsonc
{
  "purpose": "business",                // or personal|investing|debt
  "annualIncome": 120000,                // personal income baseline
  "expenses": {                          // monthly expense categories
    "rent": 1800,
    "utilities": 250,
    "food": 600,
    "transportation": 300
  },
  "investments": ["stocks", "etf", "crypto"],
  "portfolioValue": 50000,
  "business": {
    "revenue": 15000,                    // treated as monthly revenue
    "assets": { "cash": 20000, "inventory": 8000, "equipment": 12000 },
    "liabilities": { "loan": 10000, "payables": 4000 }
  },
  "debts": { "credit": 1500, "student": 12000 },
  "debtStrategy": "avalanche",
  "investorProfile": { "riskTolerance": "balanced" }
}
```

Transactions (`ifi_transactions`):
```jsonc
[
  { "id": 1732012345678, "type": "income", "amount": 2500, "date": "2025-11-15", "description": "Consulting", "category": "business" },
  { "id": 1732012445679, "type": "expense", "amount": 1800, "date": "2025-11-15", "description": "Rent", "category": "housing" }
]
```

## 6. Extensibility Roadmap

| Area | Next Step | Rationale |
|------|-----------|-----------|
| Persistence | Migrate transactions to server endpoints | Enable multi‑device sync & backups |
| Portfolio | Integrate third‑party market data API | Real-time valuations & performance charts |
| Economy Page | Fetch live news & macro indicators | Replace placeholder static cards |
| Auth | Add refresh token rotation & device tracking | Enhance revocation granularity |
| Health Score | Incorporate debt ratios & liquidity metrics | More holistic financial wellness insight |
| AI | Connect `ifi-ai.html` to inference API | Personalized advice, anomaly detection |
| Settings | User configurable thresholds (budget %) | Tailored alerts and scoring weights |

## 7. Design & Performance Considerations
- Dark theme improves contrast for dense financial data; limited chroma palette reduces cognitive load.
- Generated HTML strings keep implementation lean; could incrementally refactor to component pattern to reduce duplication.
- LocalStorage operations are O(1) and minimal in size; performance dominated by DOM rendering (bounded by moderate element counts).
- SQLite chosen for zero‑config dev; production upgrade path: Postgres with migration tooling.

## 8. Security Summary
- Passwords: bcrypt hashed (cost 10) server-side; complexity enforced.
- Tokens: Access (short TTL) + Refresh (hashed & revocable); avoids server-side session memory.
- MFA: Optional TOTP secret stored only after enable; verification gating login.
- Email verification prevents account misuse & ensures reachable identity prior to sensitive actions.
- Rate limiting curbs brute force & enumeration on signup/login/reset.
- Audit logs create forensic trail; can feed anomaly detection (e.g., repeated failures). 

## 9. Known Gaps / Trade-offs
- Financial data not persisted server-side (risk of local loss, no multi-device continuity).
- No server-side validation of transaction semantics (amount ranges, category taxonomy).
- Refresh token rotation (single-use) not yet implemented (minor replay exposure if leaked).
- No encryption at rest beyond SQLite defaults (acceptable for dev; upgrade recommended for PII).
- Client-side logic trusts `localStorage` entirely (tampering possible; server persistence will mitigate).

## 10. Glossary
- **KPI**: Key Performance Indicator (e.g., Working Capital).
- **MFA**: Multi-Factor Authentication (2nd factor beyond password).
- **TOTP**: Time-based One-Time Password algorithm (RFC 6238).
- **Expense Ratio**: Monthly expenses / monthly income.
- **Health Score**: Composite heuristic representing financial stability.

---
This document reflects the current MVP architecture and establishes a clear path for incremental hardening and feature depth without large-scale refactors.
