# iFi - Your Intelligent Financial Future 💰🤖

<div align="center">

![iFi Logo](https://img.shields.io/badge/iFi-Financial_Intelligence-00d4ff?style=for-the-badge&logo=chart-line&logoColor=white)

**AI-Powered Personal Finance Management Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13.0+-blue.svg)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991.svg)](https://openai.com/)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

iFi is a **comprehensive, full-stack personal finance management platform** that combines beautiful UI/UX with powerful AI-driven insights. Built with modern web technologies, iFi helps users take control of their financial future through intelligent budgeting, goal tracking, investment analysis, and 24/7 AI financial advisory.

### 🎯 Key Highlights

- 🤖 **AI-Powered Financial Advisor** - 24/7 personalized advice using OpenAI GPT-4
- 🏦 **Bank Integration** - Secure Plaid integration (12,000+ banks)
- 📊 **Smart Dashboard** - Real-time visualizations and animated insights
- 🎯 **Goal Tracking** - Comprehensive financial goal management
- 💳 **Debt Elimination** - Avalanche & Snowball strategy calculators
- 📈 **Investment Tracking** - Portfolio management and analysis
- 🌍 **Real-Time Markets** - Live stock prices and economic indicators
- 🔐 **Bank-Level Security** - JWT authentication, encryption, rate limiting

---

## ✨ Features

### Core Functionality

#### 1. **Comprehensive Onboarding**
- 5-step personalized setup process
- Purpose-driven configuration (Personal, Business, Investing, Debt Management)
- Secure bank connection via Plaid
- Detailed financial profile capture (income, expenses, assets, debts, investments)
- Subscription plan selection with PayPal integration

#### 2. **Intelligent Dashboard**
- Personalized metrics based on user purpose
- Animated cash flow visualizations with floating money graphics
- Budget vs. Actual dual pie charts
- AI-powered recommendations with animated brain widget
- Financial health scoring
- Interactive tip system for each widget

#### 3. **iFi AI Financial Advisor** 🤖
- Natural language conversational AI
- Context-aware financial analysis
- Educational content with regulatory compliance (SEC/FINRA)
- Spending pattern analysis
- Debt payoff calculations
- Budget optimization suggestions
- Investment education (no specific securities recommendations)
- Subscription-gated (Premium feature)

#### 4. **Financial Management Tools**
- **Budget & Cash Flow** - 12-month forecasting, category tracking, variance analysis
- **Goals** - Create, track, and achieve financial milestones
- **Investments** - Portfolio tracking, asset allocation, performance charts
- **Debt Manager** - Strategic payoff planning, interest tracking
- **Net Worth** - Comprehensive assets vs. liabilities dashboard
- **Transactions** - (Coming soon) Bank transaction categorization

#### 5. **Market Intelligence**
- Real-time stock prices for major indices (S&P 500, NASDAQ, Dow Jones)
- Individual stock tracking (AAPL, MSFT, GOOGL, AMZN, TSLA)
- Cryptocurrency prices (BTC-USD)
- Sector performance analysis
- Financial news feed
- Auto-refresh every 60 seconds

#### 6. **Security & Privacy**
- JWT authentication with refresh tokens
- Bcrypt password hashing
- AES-256 encryption for sensitive data
- Rate limiting (API: 100 req/15min)
- Helmet.js security headers
- CORS configuration
- SQL injection prevention

---

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations, gradients, glassmorphism
- **Vanilla JavaScript** - No framework dependencies
- **Chart.js** - Data visualizations
- **Font Awesome** - Icon library
- **Space Grotesk** - Typography

#### Backend
- **Node.js** (v18.0+) - JavaScript runtime
- **Express.js** (v4.18.2) - Web framework
- **PostgreSQL** (v13.0+) - Relational database
- **JWT** - Authentication
- **Bcrypt** - Password hashing

#### Integrations
- **Plaid API** - Bank connections & transaction sync
- **OpenAI API** - GPT-4 for financial intelligence
- **PayPal SDK** - Payment processing

#### Security & Middleware
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - DDoS protection
- **Compression** - Response compression
- **Morgan** - HTTP logging

### Database Schema

14 PostgreSQL tables with comprehensive relationships:
- `users` - User accounts & authentication
- `session_tokens` - JWT refresh token storage
- `user_onboarding` - Financial profile data (JSONB)
- `plaid_items` - Bank connections
- `accounts` - Individual bank accounts
- `transactions` - Bank transactions
- `ai_conversations` - Chat history
- `user_analytics` - Engagement metrics
- `subscription_history` - Payment tracking
- `audit_log` - Security events
- And more... (see [docs/COMPLETE_FUNCTIONALITY_DOCUMENTATION.md](docs/COMPLETE_FUNCTIONALITY_DOCUMENTATION.md))

---

## 🚀 Installation

### Prerequisites

- **Node.js** v18.0 or higher
- **PostgreSQL** v13.0 or higher
- **Git**
- **Plaid Account** (free sandbox: https://dashboard.plaid.com/)
- **OpenAI API Key** (https://platform.openai.com/)

### Quick Start

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ifi.git
cd ifi
```

#### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
# Required: Database credentials, JWT secrets, Plaid keys, OpenAI key
```

#### 4. Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE ifi_db;
CREATE USER ifi_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ifi_db TO ifi_user;
\q
```

#### 5. Initialize Database
```bash
# Run the initialization script
node scripts/init-database.js
```

#### 6. Start the Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

Server will start at: `http://localhost:3000`

#### 7. Open the Frontend

Open `html/Login.html` in your browser or use a live server:

```bash
# Using VS Code Live Server extension (recommended)
# Right-click on Login.html → "Open with Live Server"

# Or use Python's built-in server
python -m http.server 5500
```

Frontend will be at: `http://localhost:5500/html/Login.html`

---

## 📖 Documentation

### Comprehensive Documentation Available

- **[COMPLETE_FUNCTIONALITY_DOCUMENTATION.md](docs/COMPLETE_FUNCTIONALITY_DOCUMENTATION.md)** - 900+ lines covering every feature, page, API endpoint, and database table in detail
- **[TECHNOLOGY_STACK_REPORT.md](docs/TECHNOLOGY_STACK_REPORT.md)** - Full architecture analysis
- **[PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)** - Deployment readiness checklist
- **[Backend README](backend/README.md)** - API documentation and backend setup

### API Documentation

#### Authentication Endpoints
```
POST   /api/auth/register        - Create new user
POST   /api/auth/login           - User login
POST   /api/auth/refresh         - Refresh access token
POST   /api/auth/logout          - Logout user
GET    /api/auth/me              - Get current user
POST   /api/auth/forgot-password - Password reset
```

#### User Data Endpoints (Authenticated)
```
GET    /api/user/profile         - Get user profile
GET    /api/user/analytics       - Get engagement metrics
GET    /api/user/onboarding      - Get onboarding data
POST   /api/user/onboarding      - Save onboarding data
```

#### Plaid Integration (Authenticated)
```
POST   /api/plaid/create_link_token      - Initialize Plaid Link
POST   /api/plaid/exchange_public_token  - Exchange token & store connection
GET    /api/plaid/connections/:userId    - Get bank connections
POST   /api/plaid/sync/:itemId           - Sync transactions
```

#### AI Financial Advisor (Premium)
```
POST   /api/ai/chat              - Send message to AI
POST   /api/ai/chat/stream       - Streaming response (SSE)
GET    /api/ai/quick-tip         - Get personalized tip
POST   /api/ai/analyze-spending  - Analyze transaction patterns
```

---

## 🎨 Screenshots

### Landing Page
Modern, animated hero section with gradient background and floating geometric shapes.

### Dashboard
Personalized financial overview with animated cash flow visualization, budget comparison, and AI recommendations.

### iFi AI Chat
Conversational financial advisor with context-aware responses and regulatory compliance.

### Onboarding Flow
5-step process capturing comprehensive financial profile with Plaid bank connection.

---

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Password Hashing** - Bcrypt with 10 salt rounds
- **Encryption** - AES-256 for sensitive data (Plaid tokens)
- **Rate Limiting** - Prevent abuse and DDoS attacks
- **CORS** - Controlled cross-origin access
- **Helmet.js** - Security headers (CSP, HSTS, etc.)
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Input sanitization
- **Session Management** - Secure token storage and expiration

---

## 🌐 API Keys & Environment Setup

### Required API Keys

#### 1. Plaid (Bank Integration)
- Sign up: https://dashboard.plaid.com/
- Get sandbox credentials (free)
- Add to `.env`: `PLAID_CLIENT_ID` and `PLAID_SECRET`

#### 2. OpenAI (AI Financial Advisor)
- Sign up: https://platform.openai.com/
- Create API key
- Add to `.env`: `OPENAI_API_KEY`

#### 3. PayPal (Optional - Payments)
- Sign up: https://developer.paypal.com/
- Get sandbox credentials
- Add to `.env`: `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET`

### Generate Secure Secrets

```bash
# Generate JWT secrets (run in Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Use output for JWT_SECRET and JWT_REFRESH_SECRET
```

---

## 📊 Project Status

### Completion Status

| Feature | Status | Completeness |
|---------|--------|--------------|
| Authentication System | ✅ Complete | 100% |
| User Onboarding | ✅ Complete | 100% |
| Dashboard | ✅ Complete | 95% |
| iFi AI Chat | ✅ Complete | 100% |
| Economy/Markets Page | ✅ Complete | 100% |
| Budget Page | ⚠️ Partial | 60% |
| Goals Page | ⚠️ Partial | 50% |
| Investments Page | ⚠️ Partial | 40% |
| Debt Manager | ⚠️ Partial | 50% |
| Net Worth | ⚠️ Partial | 50% |
| Transactions | ⏳ Coming Soon | 10% |
| Settings | ⚠️ Partial | 40% |

**Overall Project Completion: ~80%**

### High Priority To-Do
- [ ] Email service integration (password reset, notifications)
- [ ] Transaction page frontend implementation
- [ ] Connect mock data pages to real user data
- [ ] Production environment setup
- [ ] Comprehensive testing suite
- [ ] Investment market data API integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write descriptive commit messages
- Add comments for complex logic
- Update documentation if needed
- Test thoroughly before submitting PR

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Keep discussions professional

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Nathan Hajduk**

- GitHub: [@yourusername](https://github.com/yourusername)
- Portfolio: [your-website.com](https://your-website.com)

---

## 🙏 Acknowledgments

- **OpenAI** - GPT-4 API for financial intelligence
- **Plaid** - Bank integration and transaction data
- **Chart.js** - Beautiful data visualizations
- **Font Awesome** - Icon library
- **PostgreSQL** - Robust database system
- **Express.js** - Fast, minimalist web framework

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ifi/issues)
- **Email**: support@ifi-app.com (placeholder)

---

## 🗺️ Roadmap

### Q1 2026
- [ ] Email service integration
- [ ] Transaction page completion
- [ ] Production deployment
- [ ] Mobile responsive improvements

### Q2 2026
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Tax optimization features
- [ ] Multi-currency support

### Q3 2026
- [ ] Social features & community
- [ ] Automated bill pay
- [ ] Receipt scanning (OCR)
- [ ] Voice commands (AI)

### Q4 2026
- [ ] Premium features expansion
- [ ] White-label solutions
- [ ] API for third-party integrations
- [ ] International expansion

---

<div align="center">

**Built with ❤️ by developers, for everyone who wants smarter finances**

⭐ Star this repo if you found it helpful!

</div>
