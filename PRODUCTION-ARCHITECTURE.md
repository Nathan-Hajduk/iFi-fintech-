# iFi Production Architecture Blueprint
**Version:** 2.0  
**Date:** December 21, 2025  
**Status:** Implementation Ready

---

## 🎯 EXECUTIVE SUMMARY

This document defines the production-grade architecture for iFi, a fintech SaaS platform with:
- Dual-context navigation (pre-login marketing vs post-login dashboard)
- JWT-based authentication with role-based access control
- Premium AI Financial Advisor (subscription-gated)
- Stripe billing integration
- Design token system for UI consistency
- Security hardening for financial data

**Architecture Philosophy:** Modular, scalable, maintainable, secure

---

## 📐 SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                             │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐         ┌─────────────────┐            │
│  │  PRE-LOGIN UI   │         │ POST-LOGIN UI   │            │
│  │  (Marketing)    │         │  (Dashboard)    │            │
│  ├─────────────────┤         ├─────────────────┤            │
│  │ • Landing       │         │ • Dashboard     │            │
│  │ • Features      │         │ • Portfolio     │            │
│  │ • Pricing       │         │ • Transactions  │            │
│  │ • Sign Up       │         │ • AI Advisor*   │            │
│  │ • Log In        │         │ • Settings      │            │
│  └─────────────────┘         └─────────────────┘            │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│                    API GATEWAY LAYER                          │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Auth      │  │  Rate      │  │  CORS      │            │
│  │  Middleware│  │  Limiter   │  │  Policy    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│                   BACKEND SERVICES                            │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Auth        │ │  AI Advisor  │ │  Billing     │        │
│  │  Service     │ │  Service     │ │  Service     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Plaid       │ │  Market Data │ │  User        │        │
│  │  Integration │ │  Service     │ │  Service     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│                     DATA LAYER                                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │  PostgreSQL          │  │  Redis (Sessions)    │         │
│  │  (Primary DB)        │  │  (Cache)             │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔒 AUTHENTICATION & AUTHORIZATION SYSTEM

### Current State (Security Vulnerability)
```javascript
// ❌ INSECURE: Client-side only
localStorage.getItem('ifi_current_user') // Can be manipulated
```

### Production Solution

#### 1. JWT Authentication Flow
```
1. User submits credentials (email + password)
2. Backend validates against database
3. Backend generates JWT token (httpOnly cookie)
4. Backend returns user object + token
5. Client stores token in httpOnly cookie (XSS-proof)
6. All API requests include cookie automatically
7. Backend validates JWT on every request
8. Backend checks subscription tier for premium features
```

#### 2. Backend Implementation

**File:** `backend/middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Authenticate middleware
function authenticate(req, res, next) {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Premium feature gate
function requirePremium(req, res, next) {
  if (req.user.subscriptionTier !== 'premium' && req.user.subscriptionTier !== 'enterprise') {
    return res.status(403).json({
      error: 'Premium subscription required',
      upgradeUrl: '/pricing',
      feature: 'AI Financial Advisor'
    });
  }
  next();
}

module.exports = { generateToken, authenticate, requirePremium };
```

#### 3. Database Schema

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user', -- 'user', 'premium', 'admin'
  subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'premium', 'enterprise'
  subscription_status VARCHAR(20) DEFAULT 'inactive', -- 'active', 'canceled', 'expired'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

---

## 🎨 DESIGN SYSTEM IMPLEMENTATION

### Design Token Structure

```
/css/
  ├── tokens/
  │   ├── colors.css          ✅ CREATED
  │   ├── typography.css      ✅ CREATED
  │   ├── spacing.css         ✅ CREATED
  │   ├── shadows.css         ✅ CREATED
  │   └── animation.css       ✅ CREATED
  │
  ├── components/
  │   ├── buttons.css         ✅ CREATED
  │   ├── cards.css           🔄 NEXT
  │   ├── forms.css           🔄 NEXT
  │   └── navigation.css      🔄 NEXT
  │
  ├── themes/
  │   ├── pre-login.css       ⏳ PENDING
  │   └── post-login.css      ⏳ PENDING
  │
  └── global.css              ⏳ PENDING (imports all tokens)
```

### Usage Pattern

**In HTML:**
```html
<link rel="stylesheet" href="../css/tokens/colors.css">
<link rel="stylesheet" href="../css/tokens/typography.css">
<link rel="stylesheet" href="../css/tokens/spacing.css">
<link rel="stylesheet" href="../css/tokens/shadows.css">
<link rel="stylesheet" href="../css/tokens/animation.css">
<link rel="stylesheet" href="../css/components/buttons.css">
<link rel="stylesheet" href="../css/themes/pre-login.css">
```

**In Components:**
```css
.custom-card {
  background: var(--bg-elevated);
  padding: var(--space-card-md);
  border-radius: 12px;
  box-shadow: var(--shadow-current-md);
  transition: var(--transition-shadow);
}

.custom-card:hover {
  box-shadow: var(--shadow-current-lg);
}
```

---

## 🧭 DUAL NAVIGATION SYSTEM

### Pre-Login Navigation

**Target Audience:** Anonymous visitors, conversion-focused

**Components:**
```
Logo | Features | Pricing | How It Works | About | [Sign Up] [Log In]
```

**Design:**
- Light theme by default
- High-contrast CTAs (Sign Up = gradient button)
- Sticky header on scroll
- Mobile hamburger menu

**Implementation:** `js/pre-login-nav.js`

### Post-Login Navigation

**Target Audience:** Authenticated users, productivity-focused

**Components:**
```
Logo | Dashboard | Portfolio | Market | Economy | AI Advisor* | [User Menu]
*Premium badge if free tier
```

**Design:**
- Dark theme by default
- Active page indicator
- Notifications badge
- User avatar dropdown

**Implementation:** `js/post-login-nav.js` (already exists as `js/shared-nav.js`)

---

## 🤖 AI FINANCIAL ADVISOR ARCHITECTURE

### System Design

```
┌──────────────────────────────────────────────────────┐
│             USER INTERFACE (Chat Widget)              │
└─────────────────────┬────────────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │   Frontend JS         │
          │   ai-advisor.js       │
          └───────────┬───────────┘
                      │ POST /api/ai/chat
                      │ (requires Premium)
          ┌───────────▼───────────┐
          │   API Gateway         │
          │   - authenticate()    │
          │   - requirePremium()  │
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │   AI Service          │
          │   - NLP Parser        │
          │   - Context Builder   │
          │   - LLM Integration   │
          │   - Response Format   │
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │   Knowledge Base      │
          │   - Market cycles     │
          │   - Asset allocation  │
          │   - Risk models       │
          └───────────────────────┘
```

### API Endpoint

**Endpoint:** `POST /api/ai/chat`

**Request:**
```json
{
  "message": "Should I invest in tech stocks right now?",
  "context": {
    "userAge": 35,
    "riskProfile": "moderate",
    "portfolioValue": 150000,
    "currentAllocation": {
      "stocks": 60,
      "bonds": 30,
      "cash": 10
    }
  }
}
```

**Response:**
```json
{
  "id": "msg_abc123",
  "message": "Based on your moderate risk profile and 10-year horizon...",
  "reasoning": [
    "Your tech allocation is currently 15%, below optimal 25-30%",
    "Tech sector P/E ratios are 18% below historical average",
    "Your cash buffer (8%) is below recommended 12% for volatility"
  ],
  "recommendations": [
    {
      "action": "Gradually increase tech allocation to 22%",
      "timeframe": "6 months",
      "method": "Dollar-cost averaging"
    }
  ],
  "disclaimers": [
    "This is educational guidance, not financial advice",
    "Past performance doesn't guarantee future results"
  ],
  "timestamp": "2025-12-21T10:30:00Z"
}
```

### Premium Gate UI

**For Free Users:**
```html
<div class="premium-gate">
  <div class="premium-gate-icon">
    <i class="fas fa-lock"></i>
  </div>
  <h3>AI Financial Advisor</h3>
  <p>Get personalized insights from our AI with 70 years of market wisdom</p>
  <ul class="premium-features">
    <li>✓ Real-time portfolio analysis</li>
    <li>✓ Personalized investment strategies</li>
    <li>✓ Risk-adjusted recommendations</li>
    <li>✓ 24/7 financial guidance</li>
  </ul>
  <button class="btn btn-premium btn-lg">
    Upgrade to Premium - $29/mo
  </button>
  <a href="/pricing" class="btn-link">View all features →</a>
</div>
```

---

## 💳 STRIPE BILLING INTEGRATION

### Products & Pricing

**Product IDs (Create in Stripe Dashboard):**
```
Premium Monthly:  price_premium_monthly
Premium Annual:   price_premium_annual (20% discount)
Enterprise:       price_enterprise (custom)
```

### Checkout Flow

```
1. User clicks "Upgrade to Premium"
2. Frontend calls POST /api/billing/create-checkout-session
3. Backend creates Stripe Checkout session
4. User redirected to Stripe-hosted checkout
5. User completes payment
6. Stripe webhook fires: checkout.session.completed
7. Backend updates user.subscriptionTier = 'premium'
8. User redirected to /dashboard?upgraded=true
9. Frontend shows success message + unlocks features
```

### Backend Implementation

**File:** `backend/routes/billing.js`
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', authenticate, async (req, res) => {
  const { priceId } = req.body;
  
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: req.user.userId
      }
    });
    
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    
    // Update user subscription
    await db.query(`
      UPDATE users 
      SET subscription_tier = 'premium',
          subscription_status = 'active',
          stripe_customer_id = $1,
          stripe_subscription_id = $2
      WHERE id = $3
    `, [session.customer, session.subscription, userId]);
  }
  
  res.json({ received: true });
});
```

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Week 1)
- [x] Design token system
- [ ] Component library (cards, forms, navigation)
- [ ] Global CSS architecture
- [ ] Theme switcher

### Phase 2: Authentication (Week 2)
- [ ] JWT middleware
- [ ] Secure cookie implementation
- [ ] Password hashing (bcrypt)
- [ ] Role-based access control
- [ ] Session management

### Phase 3: Dual Navigation (Week 2)
- [ ] Pre-login navigation component
- [ ] Post-login navigation (enhance existing)
- [ ] Landing page redesign
- [ ] Features page
- [ ] Pricing page

### Phase 4: AI Advisor (Week 3)
- [ ] Backend AI service
- [ ] Premium gate logic
- [ ] Chat UI component
- [ ] Context management
- [ ] Response streaming

### Phase 5: Billing (Week 3)
- [ ] Stripe integration
- [ ] Checkout flow
- [ ] Webhook handling
- [ ] Subscription management UI
- [ ] Billing portal

### Phase 6: Security & Testing (Week 4)
- [ ] HTTPS enforcement
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Input validation
- [ ] Penetration testing
- [ ] Load testing

---

## 📊 SUCCESS METRICS

### Technical KPIs
- Lighthouse score > 90
- Time to Interactive < 3s
- API latency < 200ms (p95)
- Zero critical security vulnerabilities
- 99.9% uptime

### Business KPIs
- Landing page conversion rate > 5%
- Free-to-premium conversion rate > 10%
- AI Advisor engagement rate > 60%
- Monthly recurring revenue growth > 20%
- Customer churn rate < 5%

---

## 🛡️ SECURITY CHECKLIST

- [x] HTTPS only
- [ ] JWT token rotation
- [ ] Password hashing (bcrypt, 12 rounds)
- [ ] Rate limiting (100 req/min per IP)
- [ ] CSRF tokens
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS prevention (CSP headers)
- [ ] Input validation (all endpoints)
- [ ] Audit logging (all authentication events)
- [ ] Secure cookie flags (httpOnly, secure, sameSite)
- [ ] API key rotation policy
- [ ] Database encryption at rest
- [ ] Regular dependency updates
- [ ] Penetration testing (quarterly)

---

## 📝 NEXT STEPS

1. **Complete component library** (cards, forms, navigation)
2. **Build pre-login landing page** (high-conversion design)
3. **Implement JWT authentication** (backend + frontend)
4. **Create pricing page** (Stripe integration)
5. **Build AI Advisor backend** (premium feature)
6. **Security hardening** (penetration testing)

---

**Document Version:** 2.0  
**Last Updated:** December 21, 2025  
**Status:** 📘 Implementation Ready  
**Review Cycle:** Weekly
