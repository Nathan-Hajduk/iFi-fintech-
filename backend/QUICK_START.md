# 🚀 Quick Start Guide - iFi Backend with Plaid

## Prerequisites Check

Before starting, ensure you have:

- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **PostgreSQL 13+** running (`psql --version`)
- [ ] **Plaid Account** (free at https://dashboard.plaid.com/)
- [ ] **Git** installed (for cloning)

---

## Step 1: Install Dependencies (2 minutes)

```powershell
cd backend
npm install
```

Expected output:
```
added 150+ packages in 30s
```

---

## Step 2: Get Plaid Credentials (5 minutes)

1. Go to https://dashboard.plaid.com/
2. Sign up or log in
3. Navigate to **Team Settings** → **Keys**
4. Copy your **Sandbox** credentials:
   - `client_id` (starts with `6d...`)
   - `secret` (starts with `a1...`)

---

## Step 3: Configure Environment (3 minutes)

### Option A: Automated Setup (Recommended)

```powershell
node setup.js
```

This will:
- Generate secure encryption keys
- Create `.env` file from template
- Create logs directory

### Option B: Manual Setup

```powershell
# Copy template
cp .env.example .env

# Generate encryption key
openssl rand -hex 32

# Edit .env with your values
notepad .env
```

Edit these values in `.env`:
```env
PLAID_CLIENT_ID=your_sandbox_client_id_here
PLAID_SECRET=your_sandbox_secret_here
DB_PASSWORD=your_postgres_password
```

---

## Step 4: Set Up Database (2 minutes)

### Option A: Using psql

```powershell
# Open PostgreSQL command line
psql -U postgres

# Run these commands:
CREATE DATABASE ifi_db;
CREATE USER ifi_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE ifi_db TO ifi_user;
\q
```

### Option B: Using pgAdmin

1. Open pgAdmin
2. Right-click **Databases** → **Create** → **Database**
3. Name: `ifi_db`
4. Save
5. Right-click **Login/Group Roles** → **Create** → **Login/Group Role**
6. Name: `ifi_user`
7. Password: (set your password)
8. Privileges: Check all boxes
9. Save

---

## Step 5: Start the Server (1 minute)

```powershell
# Production mode
npm start

# OR Development mode (auto-reload)
npm run dev
```

Expected output:
```
🚀 Starting iFi Backend Server...

📦 Connecting to database...
Database connection successful: 2024-12-19 15:30:00

📊 Initializing database tables...
Database tables initialized successfully

✅ Server running successfully!

   Environment: development
   Port: 3000
   API URL: http://localhost:3000/api
   Health Check: http://localhost:3000/health
   Plaid Environment: sandbox

📚 API Endpoints:
   POST   /api/plaid/create_link_token
   POST   /api/plaid/exchange_public_token
   GET    /api/plaid/connections/:userId
   POST   /api/plaid/sync/:itemId
   POST   /api/plaid/webhook
   DELETE /api/plaid/connection/:itemId

🔒 Security: Rate limiting enabled
   API: 100 requests per 15 minutes
   Plaid: 50 requests per 15 minutes

👀 Ready for connections!
```

---

## Step 6: Test the Backend (2 minutes)

### Test 1: Health Check

Open browser: http://localhost:3000/health

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-19T15:30:00.000Z",
  "uptime": 12.5,
  "environment": "development",
  "version": "v1"
}
```

### Test 2: API Root

Open browser: http://localhost:3000

Expected response:
```json
{
  "name": "iFi Backend API",
  "version": "v1",
  "environment": "development",
  "status": "running"
}
```

### Test 3: Create Link Token (using PowerShell)

```powershell
# Create link token
Invoke-RestMethod -Uri "http://localhost:3000/api/plaid/create_link_token" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"userId":"123"}'
```

Expected response:
```json
{
  "success": true,
  "link_token": "link-sandbox-...",
  "expiration": "2024-12-19T16:00:00Z"
}
```

---

## Step 7: Test with Frontend (5 minutes)

1. Open the iFi frontend in browser:
   ```
   http://localhost:3000/html/onboarding.html
   ```
   (Note: You may need to serve the frontend with a simple HTTP server)

2. Complete Step 1 (Purpose Selection)

3. Click **"Connect Bank Account"** in Step 2

4. In Plaid Link modal:
   - Select any test bank (e.g., "First Platypus Bank")
   - Username: `user_good`
   - Password: `pass_good`
   - Select accounts (checking, savings)

5. Verify success:
   - Green checkmark appears
   - Success toast: "Successfully connected 2 account(s) from..."
   - Auto-advances to Step 3 after 2 seconds

6. Check backend logs for:
   ```
   Creating link token for user 123
   Exchanging public token for user 123
   Public token exchanged successfully. Item ID: item_abc123
   Plaid connection stored for user 123
   Initial sync completed: 15 transactions
   ```

---

## Troubleshooting

### ❌ Database Connection Failed

**Problem:** `Database connection failed: password authentication failed`

**Solution:**
```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# If not running, start it
Start-Service postgresql-x64-13

# Reset password in psql
psql -U postgres
ALTER USER ifi_user WITH PASSWORD 'new_password';
\q

# Update .env with new password
```

---

### ❌ Port 3000 Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F

# OR change port in .env
# PORT=3001
```

---

### ❌ Plaid: Invalid Credentials

**Problem:** `Failed to create link token: invalid credentials`

**Solution:**
1. Verify credentials in Plaid Dashboard
2. Ensure using **Sandbox** credentials (not Development or Production)
3. Check `.env` file has correct values
4. Restart server after changing `.env`

---

### ❌ Frontend Can't Connect to Backend

**Problem:** Browser console: `Failed to fetch`

**Solution:**
1. Ensure backend is running (`npm start`)
2. Check backend URL in `js/onboarding.js`:
   ```javascript
   const API_URL = 'http://localhost:3000/api';
   ```
3. Verify CORS is configured in `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```
4. Restart backend server

---

### ❌ Missing Dependencies

**Problem:** `Cannot find module 'express'`

**Solution:**
```powershell
cd backend
npm install
```

---

## Success Checklist

- [x] Backend starts without errors
- [x] Health check returns 200 OK
- [x] Database tables created automatically
- [x] Link token API returns valid token
- [x] Frontend can connect to backend
- [x] Plaid Link modal opens
- [x] Test bank connection succeeds
- [x] Transactions sync automatically
- [x] Backend logs show all operations

---

## Next Steps

1. **Production Setup**
   - Get Production Plaid credentials
   - Change `PLAID_ENV=production` in `.env`
   - Set up SSL/HTTPS with Nginx
   - Deploy to cloud (AWS, Azure, Heroku)

2. **Frontend Integration**
   - Wire real transaction data to dashboard
   - Display linked accounts in settings
   - Add manual sync button

3. **Advanced Features**
   - AI transaction categorization
   - Recurring expense detection
   - Anomaly detection (fraud alerts)
   - Budget forecasting

---

## Monitoring & Logs

### View Live Logs

```powershell
# Watch logs in real-time
Get-Content -Path "logs\app.log" -Wait -Tail 50
```

### Common Log Patterns

✅ **Success:**
```
Creating link token for user 123
Public token exchanged successfully
Synced 15 transactions for item item_abc123
```

⚠️ **Warnings:**
```
CORS blocked origin: http://example.com
Rate limit exceeded for IP: 192.168.1.1
```

❌ **Errors:**
```
Database query error: relation "users" does not exist
Plaid exchangePublicToken error: invalid public token
```

---

## Support Resources

- **Backend README:** [README.md](README.md)
- **Integration Guide:** [../PLAID_INTEGRATION_GUIDE.md](../PLAID_INTEGRATION_GUIDE.md)
- **Plaid Docs:** https://plaid.com/docs/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**Estimated Total Setup Time:** 15-20 minutes

**Status:** ✅ Ready for development and testing

**Next:** Start building features with real-time bank data!
