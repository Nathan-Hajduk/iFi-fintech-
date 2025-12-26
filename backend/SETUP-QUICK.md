# iFi Backend - Quick Setup Guide

## The Error You're Seeing

**Error:** "Failed to execute 'json' on 'Response': Unexpected end of JSON input"

**Cause:** The PostgreSQL database hasn't been created and initialized yet.

---

## Step-by-Step Setup

### 1. Install PostgreSQL (if not already installed)

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run the installer
- Remember your PostgreSQL password!

**Verify installation:**
```powershell
psql --version
```

### 2. Create the Database

Open PowerShell as Administrator and run:

```powershell
# Connect to PostgreSQL
psql -U postgres

# Then in the PostgreSQL prompt:
CREATE DATABASE ifi_db;
CREATE USER ifi_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ifi_db TO ifi_user;
\q
```

### 3. Configure Environment Variables

Navigate to the backend folder:
```powershell
cd C:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\backend
```

Create a `.env` file with this content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ifi_db
DB_USER=ifi_user
DB_PASSWORD=your_secure_password

# JWT Secret (generate a random string)
JWT_SECRET=your_jwt_secret_here_use_a_long_random_string
JWT_REFRESH_SECRET=your_refresh_secret_here_use_a_long_random_string

# Encryption Key (64 character hex string)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI API Key (for AI features - optional for now)
OPENAI_API_KEY=your_openai_api_key_here

# Plaid Configuration (optional - for bank connections)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
```

**Important:** Replace `your_secure_password` with the actual password you used when creating the database user!

### 4. Install Dependencies

```powershell
npm install
```

### 5. Initialize the Database

Run the database initialization script:

```powershell
node scripts/init-database.js
```

You should see:
```
🗄️  Initializing iFi Database...

Creating users table...
✓ Users table created
Creating session_tokens table...
✓ Session tokens table created
...
✅ Database initialization complete!
```

### 6. Start the Backend Server

```powershell
node server.js
```

You should see:
```
🚀 iFi Backend Server
====================
Environment: development
Port: 3000
Database: Connected to ifi_db at localhost:5432

✅ Server running at http://localhost:3000
```

### 7. Test Login Again

Now try logging in through the frontend. It should work!

---

## Troubleshooting

### Error: "password authentication failed for user ifi_user"

**Solution:** The password in your `.env` file doesn't match the database user password.

1. Reset the password:
```powershell
psql -U postgres
ALTER USER ifi_user WITH PASSWORD 'new_password';
\q
```

2. Update `.env` with the new password

### Error: "database ifi_db does not exist"

**Solution:** Create the database:
```powershell
psql -U postgres
CREATE DATABASE ifi_db;
GRANT ALL PRIVILEGES ON DATABASE ifi_db TO ifi_user;
\q
```

### Error: "role ifi_user does not exist"

**Solution:** Create the user:
```powershell
psql -U postgres
CREATE USER ifi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ifi_db TO ifi_user;
\q
```

### Backend server won't start

**Check:**
1. Is PostgreSQL running? Open Services and look for "PostgreSQL"
2. Is port 3000 available? Try changing PORT in `.env`
3. Are all dependencies installed? Run `npm install` again

### Still can't login?

**Create a test user manually:**
```powershell
node scripts/create-test-user.js
```

---

## Quick Commands Reference

```powershell
# Navigate to backend
cd C:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\backend

# Initialize database
node scripts/init-database.js

# Start server
node server.js

# Check PostgreSQL status
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Start PostgreSQL if stopped
Start-Service postgresql-x64-14  # (version may vary)
```

---

## Need More Help?

1. Check if PostgreSQL is running in Windows Services
2. Verify `.env` file has correct database credentials
3. Look at backend logs when server starts
4. Check browser console for detailed error messages
