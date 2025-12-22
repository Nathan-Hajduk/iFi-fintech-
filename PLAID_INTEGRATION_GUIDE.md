# Plaid API Integration Guide

## Overview
This guide documents the Plaid Link integration implemented in the iFi onboarding flow. Plaid enables secure bank account connections for real-time transaction tracking and financial insights.

---

## Frontend Implementation ✅ COMPLETE

### Files Modified
1. **html/onboarding.html**
   - Added Plaid Link SDK: `<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>`
   - Inserted Step 2: Bank Connection (between Purpose and Income)
   - Updated progress bar from 4 to 5 steps
   - Updated all step IDs: Step 3 (Income), Step 4 (Expenses), Step 5 (Investments)

2. **js/onboarding.js**
   - Added Plaid handler initialization: `createPlaidLinkHandler()`
   - Implemented `initPlaidLink()` - Opens Plaid Link modal
   - Implemented `exchangePublicToken()` - Exchanges public_token for access_token via backend
   - Implemented `skipBankConnection()` - Allows users to skip step
   - Updated `onboardingData` to store: `bankConnected`, `plaidAccessToken`, `linkedAccounts`

3. **css/onboarding.css**
   - Added `.bank-connect-hero` - Centered hero with benefits list
   - Added `.security-badges` - Grid of 3 security trust badges
   - Added `.benefit-list` - Animated list with checkmarks
   - Added `.btn-large`, `.btn-success`, `.btn-text` styles
   - Responsive styles for mobile devices

---

## User Experience Flow

### Step 2: Connect Bank
1. **User sees compelling benefits:**
   - Automatic transaction tracking
   - Real-time balance updates
   - AI-powered insights
   - Smarter budgeting

2. **Security assurances:**
   - 🔒 Bank-level encryption (256-bit SSL)
   - 👁️ Read-only access (can't move money)
   - ✅ Secure by Plaid (trusted by 11,000+ apps)

3. **User clicks "Connect Bank Account"**
   - Plaid Link modal opens with institution search
   - User selects their bank
   - OAuth authentication flow (credentials never seen by iFi)
   - User selects which accounts to link

4. **Success handling:**
   - Green checkmark button: "Connected Successfully!"
   - Success toast: "Successfully connected X account(s) from [Bank]!"
   - Auto-advances to Step 3 (Income) after 2 seconds

5. **Skip option:**
   - "Skip for now" text button
   - Proceeds to Step 3 without bank connection
   - User can connect later in Settings

---

## Backend Implementation Required ⚠️

### 1. Create Link Token Endpoint
**Endpoint:** `POST /api/plaid/create_link_token`

**Purpose:** Generate a link_token for frontend to initialize Plaid Link

**Request Body:**
```json
{
  "userId": "user123"
}
```

**Server-side Process:**
1. Call Plaid API: `POST /link/token/create`
2. Include:
   - `client_id` (from Plaid Dashboard)
   - `secret` (from Plaid Dashboard)
   - `user.client_user_id`: Your internal user ID
   - `client_name`: "iFi"
   - `products`: ["transactions"]
   - `country_codes`: ["US"]
   - `language`: "en"
   - `webhook`: "https://yourdomain.com/api/plaid/webhook"

**Response:**
```json
{
  "link_token": "link-sandbox-abc123...",
  "expiration": "2024-01-15T10:30:00Z"
}
```

**Implementation (Node.js/Express):**
```javascript
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use 'production' in prod
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

app.post('/api/plaid/create_link_token', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'iFi',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
      webhook: 'https://yourdomain.com/api/plaid/webhook',
    });
    
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});
```

---

### 2. Exchange Public Token Endpoint
**Endpoint:** `POST /api/plaid/exchange_public_token`

**Purpose:** Exchange temporary public_token for permanent access_token

**Request Body:**
```json
{
  "public_token": "public-sandbox-xyz789...",
  "userId": "user123",
  "accounts": [
    {
      "id": "acc_123",
      "name": "Plaid Checking",
      "type": "depository",
      "subtype": "checking"
    }
  ],
  "institution": {
    "name": "Chase",
    "institution_id": "ins_3"
  }
}
```

**Server-side Process:**
1. Call Plaid API: `POST /item/public_token/exchange`
2. Receive: `access_token` and `item_id`
3. **ENCRYPT** the access_token (AES-256)
4. Store in database:
   - `user_id` → User making the connection
   - `item_id` → Plaid's unique identifier for this connection
   - `access_token` (encrypted) → Token for future API calls
   - `institution_name` → Bank name for UI display
   - `connected_accounts` → Array of account IDs and names
   - `created_at` → Timestamp

**Response:**
```json
{
  "success": true,
  "item_id": "item_abc123"
}
```

**Implementation:**
```javascript
app.post('/api/plaid/exchange_public_token', async (req, res) => {
  try {
    const { public_token, userId, accounts, institution } = req.body;
    
    // Exchange public token for access token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });
    
    const { access_token, item_id } = response.data;
    
    // Encrypt access token before storage
    const encryptedToken = encryptToken(access_token);
    
    // Store in database
    await db.plaidConnections.create({
      user_id: userId,
      item_id: item_id,
      access_token: encryptedToken,
      institution_name: institution.name,
      institution_id: institution.institution_id,
      accounts: accounts,
      created_at: new Date(),
      status: 'active'
    });
    
    // Trigger initial transaction sync
    await syncTransactions(access_token, userId);
    
    res.json({ success: true, item_id: item_id });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});
```

---

### 3. Webhook Endpoint
**Endpoint:** `POST /api/plaid/webhook`

**Purpose:** Receive real-time notifications from Plaid

**Webhook Types to Handle:**

#### a) TRANSACTIONS (New transactions available)
```json
{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "DEFAULT_UPDATE",
  "item_id": "item_abc123",
  "new_transactions": 15
}
```

**Action:**
- Fetch new transactions: `POST /transactions/get`
- Categorize with AI
- Update user's budget/spending data
- Send push notification if spending exceeds budget

#### b) ITEM (Connection issue)
```json
{
  "webhook_type": "ITEM",
  "webhook_code": "ITEM_LOGIN_REQUIRED",
  "item_id": "item_abc123",
  "error": {
    "error_code": "ITEM_LOGIN_REQUIRED"
  }
}
```

**Action:**
- Mark connection status as "needs_reauthentication"
- Send email to user: "Please reconnect your bank account"
- Show banner in dashboard

**Implementation:**
```javascript
app.post('/api/plaid/webhook', async (req, res) => {
  const { webhook_type, webhook_code, item_id } = req.body;
  
  if (webhook_type === 'TRANSACTIONS') {
    if (webhook_code === 'DEFAULT_UPDATE' || webhook_code === 'INITIAL_UPDATE') {
      // Fetch and process new transactions
      const connection = await db.plaidConnections.findOne({ item_id });
      const accessToken = decryptToken(connection.access_token);
      await syncTransactions(accessToken, connection.user_id);
    }
  }
  
  if (webhook_type === 'ITEM') {
    if (webhook_code === 'ITEM_LOGIN_REQUIRED') {
      // Mark as needing reauth
      await db.plaidConnections.update(
        { item_id },
        { status: 'reauth_required' }
      );
      
      // Notify user
      const connection = await db.plaidConnections.findOne({ item_id });
      await sendEmail(connection.user_id, 'reconnect-bank');
    }
  }
  
  res.json({ success: true });
});
```

---

### 4. Sync Transactions Function
**Purpose:** Fetch transactions from Plaid and store in database

**Implementation:**
```javascript
async function syncTransactions(accessToken, userId) {
  try {
    const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const endDate = moment().format('YYYY-MM-DD');
    
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 500,
        offset: 0,
      }
    });
    
    const transactions = response.data.transactions;
    
    // Process each transaction
    for (const txn of transactions) {
      // Check if already exists
      const exists = await db.transactions.findOne({
        transaction_id: txn.transaction_id
      });
      
      if (!exists) {
        // Categorize with AI
        const category = await categorizeTransaction(txn);
        
        await db.transactions.create({
          user_id: userId,
          transaction_id: txn.transaction_id,
          account_id: txn.account_id,
          amount: txn.amount,
          date: txn.date,
          name: txn.name,
          merchant_name: txn.merchant_name,
          category: category,
          pending: txn.pending,
          created_at: new Date()
        });
      }
    }
    
    console.log(`Synced ${transactions.length} transactions for user ${userId}`);
  } catch (error) {
    console.error('Error syncing transactions:', error);
  }
}
```

---

## Security Best Practices

### 1. Never Expose Credentials
- Store `PLAID_CLIENT_ID` and `PLAID_SECRET` in environment variables
- Use `.env` file (add to `.gitignore`)
- Never commit secrets to version control

### 2. Encrypt Access Tokens
```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
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

### 3. Validate Webhook Signatures
```javascript
function verifyWebhookSignature(req) {
  const signature = req.headers['plaid-verification'];
  const body = JSON.stringify(req.body);
  
  const hmac = crypto.createHmac('sha256', process.env.PLAID_WEBHOOK_SECRET);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}
```

### 4. Use HTTPS Only
- All API endpoints must use HTTPS in production
- Plaid webhooks require HTTPS

### 5. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const plaidLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: 'Too many requests, please try again later.'
});

app.use('/api/plaid/', plaidLimiter);
```

---

## Environment Configuration

### Development (Sandbox)
```env
PLAID_CLIENT_ID=your_sandbox_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
PLAID_WEBHOOK_SECRET=your_webhook_secret
ENCRYPTION_KEY=your_32_byte_encryption_key
```

### Production
```env
PLAID_CLIENT_ID=your_production_client_id
PLAID_SECRET=your_production_secret
PLAID_ENV=production
PLAID_WEBHOOK_SECRET=your_production_webhook_secret
ENCRYPTION_KEY=your_32_byte_encryption_key
```

---

## Database Schema

### plaid_connections Table
```sql
CREATE TABLE plaid_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  accounts JSONB, -- Array of linked accounts
  status VARCHAR(50) DEFAULT 'active', -- active, reauth_required, disconnected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plaid_user_id ON plaid_connections(user_id);
CREATE INDEX idx_plaid_item_id ON plaid_connections(item_id);
```

### transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  account_id VARCHAR(255),
  amount DECIMAL(10, 2),
  date DATE,
  name VARCHAR(255),
  merchant_name VARCHAR(255),
  category VARCHAR(100),
  pending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transaction_user_id ON transactions(user_id);
CREATE INDEX idx_transaction_date ON transactions(date);
CREATE INDEX idx_transaction_category ON transactions(category);
```

---

## Testing

### 1. Sandbox Test Credentials
Plaid provides test banks in sandbox mode:
- **Username:** `user_good`
- **Password:** `pass_good`
- **Bank:** Any institution in test mode

### 2. Test Scenarios
```javascript
// Test successful connection
POST /api/plaid/create_link_token
→ Returns link_token
→ Open Plaid Link with token
→ Select "First Platypus Bank"
→ Login with user_good / pass_good
→ Select checking account
→ Exchange public_token

// Test connection error
// Use username: user_bad / pass_good
→ Should handle error gracefully

// Test webhook
// Manually trigger webhook in Plaid Dashboard
→ Verify transactions sync
```

### 3. Frontend Testing
```javascript
// Update js/onboarding.js createPlaidLinkHandler()
// Uncomment the fetch call to backend:

fetch(`${API_URL}/plaid/create_link_token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: getCurrentUserId() })
})
.then(response => response.json())
.then(data => {
  initializePlaidHandler(data.link_token);
})
```

---

## Next Steps

### Immediate (Backend Setup)
1. ✅ Create Express/Node.js backend
2. ✅ Install Plaid SDK: `npm install plaid`
3. ✅ Set up environment variables
4. ✅ Implement 3 endpoints: create_link_token, exchange_public_token, webhook
5. ✅ Set up PostgreSQL database with schemas above

### Phase 2 (UI Integration)
6. ✅ Connect frontend to backend endpoints
7. ✅ Test full flow in sandbox mode
8. ✅ Add "Connected Accounts" section to settings.html
9. ✅ Display linked accounts with last sync time
10. ✅ Add manual sync button

### Phase 3 (Data Integration)
11. ✅ Wire real transactions to transactions.html
12. ✅ Replace placeholder data in budget.html with Plaid data
13. ✅ Update net-worth.html with real account balances
14. ✅ Implement AI categorization for transactions

### Phase 4 (Advanced Features)
15. ✅ Recurring expense detection
16. ✅ Anomaly detection (unusual spending alerts)
17. ✅ Budget forecasting based on transaction history
18. ✅ Spending insights and recommendations

### Phase 5 (Production)
19. ✅ Switch from sandbox to production environment
20. ✅ Set up production webhook endpoint
21. ✅ Implement error monitoring (Sentry)
22. ✅ Add user notifications for connection issues
23. ✅ Implement data retention policies

---

## Plaid API Resources

- **Dashboard:** https://dashboard.plaid.com/
- **Documentation:** https://plaid.com/docs/
- **API Reference:** https://plaid.com/docs/api/
- **Node.js Quickstart:** https://github.com/plaid/quickstart
- **Support:** https://plaid.com/contact/

---

## Cost Estimation

### Plaid Pricing (as of 2024)
- **Development (Sandbox):** FREE - Unlimited testing
- **Production:**
  - Transactions API: $0.25 per account/month
  - Auth API: $0.05 per verification
  - Identity API: $0.25 per verification

**Example Cost for 1,000 users:**
- Average 2 accounts/user: 2,000 accounts
- 2,000 × $0.25 = **$500/month**

---

## Troubleshooting

### Error: "Link token expired"
**Cause:** Link tokens expire after 30 minutes  
**Solution:** Fetch a new link token from backend

### Error: "ITEM_LOGIN_REQUIRED"
**Cause:** Bank credentials changed or session expired  
**Solution:** User needs to re-authenticate via Plaid Link update mode

### Error: "PRODUCT_NOT_READY"
**Cause:** Transactions not yet available (can take 5-30 seconds)  
**Solution:** Retry after delay or wait for webhook

### Error: "RATE_LIMIT_EXCEEDED"
**Cause:** Too many API calls in short time  
**Solution:** Implement exponential backoff

---

## Support & Maintenance

### Monitoring
- Track connection success rate
- Monitor webhook response times
- Alert on failed transaction syncs
- Log all API errors

### User Support
- "Why can't I connect my bank?" → Check if bank is supported
- "Transactions not showing" → Verify last sync time, trigger manual sync
- "Connection keeps failing" → Check for ITEM_LOGIN_REQUIRED, guide re-authentication

---

**Implementation Status:** ✅ Frontend Complete | ⚠️ Backend Required  
**Estimated Backend Development Time:** 2-3 days  
**Documentation Updated:** 2024-01-XX
