# Plaid Backend Quick Start

## Required Endpoints (3)

### 1. Create Link Token
```javascript
POST /api/plaid/create_link_token

// Request
{ "userId": "user123" }

// Response
{ "link_token": "link-sandbox-abc123..." }

// Implementation
const response = await plaidClient.linkTokenCreate({
  user: { client_user_id: userId },
  client_name: 'iFi',
  products: ['transactions'],
  country_codes: ['US'],
  language: 'en',
  webhook: 'https://yourdomain.com/api/plaid/webhook'
});
```

### 2. Exchange Public Token
```javascript
POST /api/plaid/exchange_public_token

// Request
{
  "public_token": "public-sandbox-xyz789...",
  "userId": "user123",
  "accounts": [...],
  "institution": {...}
}

// Response
{ "success": true, "item_id": "item_abc123" }

// Implementation
const response = await plaidClient.itemPublicTokenExchange({ public_token });
const { access_token, item_id } = response.data;
// ENCRYPT access_token before storing
await db.plaidConnections.create({ user_id, item_id, access_token: encryptToken(access_token), ... });
```

### 3. Webhook Handler
```javascript
POST /api/plaid/webhook

// Plaid sends
{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "DEFAULT_UPDATE",
  "item_id": "item_abc123",
  "new_transactions": 15
}

// Implementation
if (webhook_type === 'TRANSACTIONS') {
  await syncTransactions(access_token, user_id);
}
if (webhook_code === 'ITEM_LOGIN_REQUIRED') {
  await markAsReauthRequired(item_id);
  await notifyUser(user_id);
}
```

---

## Setup Checklist

### 1. Install Dependencies
```bash
npm install plaid express dotenv pg crypto
```

### 2. Environment Variables (.env)
```env
PLAID_CLIENT_ID=your_sandbox_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
PLAID_WEBHOOK_SECRET=your_webhook_secret
ENCRYPTION_KEY=your_32_byte_key  # Generate: openssl rand -hex 32
```

### 3. Initialize Plaid Client
```javascript
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);
```

### 4. Database Tables
```sql
-- Plaid Connections
CREATE TABLE plaid_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  item_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted
  institution_name VARCHAR(255),
  accounts JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10, 2),
  date DATE,
  name VARCHAR(255),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Encryption Functions
```javascript
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

function encryptToken(token) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(token);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptToken(encryptedToken) {
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

---

## Testing

### Sandbox Credentials
- Bank: "First Platypus Bank" (any test bank)
- Username: `user_good`
- Password: `pass_good`

### Test Flow
1. Start backend: `node server.js`
2. Open iFi onboarding: http://localhost:3000/html/onboarding.html
3. Select purpose → Click "Connect Bank Account"
4. Select test bank → Login with credentials above
5. Verify token exchange succeeds
6. Check database for new plaid_connections entry

---

## Frontend Integration

Update `js/onboarding.js` line 60:
```javascript
function createPlaidLinkHandler() {
  fetch(`${API_URL}/plaid/create_link_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: getCurrentUserId() })
  })
  .then(response => response.json())
  .then(data => {
    initializePlaidHandler(data.link_token);
  })
  .catch(error => {
    console.error('Error creating Plaid link token:', error);
    showError('Unable to initialize bank connection. Please try again later.');
  });
}
```

---

## Production Deployment

1. **Switch to Production Environment**
   - Change `PLAID_ENV=production` in .env
   - Use production client_id and secret from Plaid Dashboard

2. **Set up HTTPS**
   - Webhooks require HTTPS endpoint
   - Use Let's Encrypt or Cloudflare SSL

3. **Configure Webhook URL**
   - In Plaid Dashboard → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/plaid/webhook`

4. **Monitor**
   - Log all API calls
   - Set up alerts for failed token exchanges
   - Track connection success rate

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| INVALID_ACCESS_TOKEN | Token not found or revoked | User needs to reconnect |
| ITEM_LOGIN_REQUIRED | Bank credentials changed | Trigger Plaid Link update mode |
| RATE_LIMIT_EXCEEDED | Too many requests | Implement rate limiting |
| PRODUCT_NOT_READY | Transactions not synced yet | Wait 30 seconds, retry |

---

## Resources
- **Plaid Quickstart:** https://github.com/plaid/quickstart
- **API Docs:** https://plaid.com/docs/api/
- **Dashboard:** https://dashboard.plaid.com/

---

**Time to Implement:** 2-3 hours (with this guide)  
**Status:** Frontend ✅ Complete | Backend ⚠️ Required
