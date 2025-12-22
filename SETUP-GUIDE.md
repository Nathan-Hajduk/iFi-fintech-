# iFi Signup System - Setup Guide

## What You've Built

A complete signup validation system with:
- ✅ Real-time form validation (names, email, passwords, phone)
- ✅ Client-side error messages
- ✅ Database duplicate checking
- ✅ Secure password storage
- ✅ RESTful API backend

## Quick Start (After Node.js Installation)

### Step 1: Verify Node.js Installation

Open PowerShell and check:
```powershell
node --version
npm --version
```

You should see version numbers (e.g., v20.x.x and 10.x.x).

### Step 2: Install Dependencies

Navigate to the server folder and install packages:
```powershell
cd "c:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\server"
npm install
```

This will install:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `bcrypt` - Password hashing
- `sqlite3` - Database

### Step 3: Start the Backend Server

```powershell
npm start
```

You should see:
```
Connected to the SQLite database.
Users table ready.
iFi Server running on http://localhost:3000
```

### Step 4: Open the Signup Page

Open your browser and go to:
```
http://localhost:3000/html/signup.html
```

## Testing the Validation System

### Test 1: Name Validation
- Try entering numbers in First/Last Name → ❌ Error appears
- Enter only letters → ✅ Success

### Test 2: Email Validation
- Enter "test" → ❌ "Invalid email" error
- Enter "test@email.com" → ✅ Success
- Try same email twice → ❌ "Already registered" error

### Test 3: Password Matching
- Password: "SecurePass123!"
- Re-enter: "DifferentPass123!" → ❌ "Passwords don't match" error
- Re-enter: "SecurePass123!" → ✅ Success

### Test 4: Phone Validation
- Enter "1234567890" → ❌ "Invalid format" error
- Enter "123-456-7890" → ✅ Success
- Try same phone twice → ❌ "Already registered" error

### Test 5: Submit Button
- With errors → Button is disabled (grayed out)
- All fields valid → Button becomes clickable
- Submit → Redirects to dashboard

## Validation Rules

### First & Last Name
- ✅ Letters only
- ✅ Spaces, hyphens (-), apostrophes (') allowed
- ✅ Minimum 2 characters
- ❌ No numbers or special characters

### Email
- ✅ Format: `username@domain.com`
- ✅ Must be unique (checked against database)
- ✅ Case-insensitive

### Password
- ✅ Minimum 9 characters
- ✅ At least one UPPERCASE letter
- ✅ At least one number (0-9)
- ✅ At least one symbol (!@#$%^&*)
- ✅ Must match re-entered password

### Phone Number
- ✅ Format: `123-456-7890`
- ✅ Must be unique (checked against database)

## Database Management

### View All Registered Users

While server is running:
```
GET http://localhost:3000/api/users
```

Or use PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Get
```

### Database Location
```
c:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\server\ifi-users.db
```

The database is created automatically on first run.

### Reset Database

Stop the server (Ctrl+C), then:
```powershell
Remove-Item "c:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\server\ifi-users.db"
npm start
```

## API Endpoints

### Check Email Availability
```
GET /api/check-email?email=test@example.com
Response: { "exists": true/false }
```

### Check Phone Availability
```
GET /api/check-phone?phone=123-456-7890
Response: { "exists": true/false }
```

### Create New Account
```
POST /api/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "123-456-7890",
  "dateOfBirth": {
    "month": "01",
    "day": "15",
    "year": "1990"
  }
}

Response: { "success": true, "userId": 1 }
```

### Login (Future Use)
```
POST /api/login
Content-Type: application/json

{
  "username": "john@example.com",
  "password": "SecurePass123!"
}

Response: { "success": true, "user": {...} }
```

## Troubleshooting

### "npm is not recognized"
- Node.js installation not complete or not in PATH
- Restart PowerShell after installing Node.js
- Or restart your computer

### Port 3000 Already in Use
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Server Won't Start
- Make sure you're in the server directory
- Check that all dependencies installed: `npm install`
- Look for error messages in the console

### Validation Not Working
- Check browser console (F12) for JavaScript errors
- Ensure `signup-validation.js` is loaded
- Verify Font Awesome CSS is loading

### Database Errors
- Delete `ifi-users.db` and restart server
- Check file permissions in server folder

## File Structure

```
iFi/
├── html/
│   ├── signup.html              # Signup form
│   ├── Login.html               # Login page
│   ├── dashboard.html           # Dashboard
│   └── [other HTML files]       # All HTML pages
├── css/
│   └── signup.css              # Styles + error messages
├── js/
│   └── signup-validation.js    # Client-side validation
└── server/
    ├── server.js               # Backend API
    ├── package.json            # Dependencies
    ├── ifi-users.db            # SQLite database (auto-created)
    └── README.md               # Detailed documentation
```

## Next Steps

Once everything is working:

1. **Test thoroughly** - Try all validation scenarios
2. **Add more features**:
   - Email verification
   - Password strength meter
   - Username availability
   - Profile pictures
3. **Enhance security**:
   - Rate limiting
   - CAPTCHA
   - Email confirmation
4. **Deploy to production**:
   - Use a real database (PostgreSQL, MySQL)
   - Set up HTTPS
   - Configure CORS properly
   - Add authentication tokens (JWT)

## Need Help?

Common commands:
```powershell
# Navigate to server folder
cd "c:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\server"

# Install dependencies
npm install

# Start server
npm start

# Stop server
Ctrl + C

# View all users via API
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Get
```

## Security Notes

⚠️ **Current setup is for development only!**

For production:
- ✅ Passwords are hashed with bcrypt
- ✅ SQL injection protected by parameterized queries
- ✅ Input validation on client AND server
- ❌ No HTTPS (use in production)
- ❌ No rate limiting (add for production)
- ❌ No session management (add JWT tokens)
- ❌ CORS allows all origins (restrict in production)

---

**Ready to test?** Run `npm start` in the server folder! 🚀
