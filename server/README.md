# iFi Backend - Two Tracks

This backend offers two ways to run the API depending on your comfort level.

- Core (beginner-friendly): minimal features you can explain clearly.
- Advanced (security features): email verification, password reset tokens, JWT, rate limiting, MFA, etc.

## Prerequisites

- Node.js 18+ installed
- PowerShell (on Windows)

## Install

```
Push-Location "c:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\server"
npm install
Pop-Location
```

## Run (Core)

```
Push-Location "c:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\server"
npm run start:core
```

Open http://localhost:3000 and hit the endpoints in `requests.http`.

## Run (Advanced)

```
Push-Location "c:\Users\Nathan Hajduk\OneDrive\Desktop\fullstack-journey\iFi\server"
npm start
```

See `ARCHITECTURE.md` and `SECURITY.md` for details.

## Common Endpoints

- `GET /api/health` – server and DB status
- `POST /api/signup` – create account
- `POST /api/login` – login with email/phone + password
- `GET /api/users` – list users (for testing)

## Troubleshooting

- If port 3000 is busy: stop existing Node processes:

```
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

- If `npm start` fails: ensure dependencies are installed with `npm install`.
# iFi Signup Validation & Database System

## Features Implemented

### Client-Side Validation
- **Name Validation**: First and last names must contain only letters (spaces, hyphens, apostrophes allowed)
- **Email Validation**: Proper email format validation (e.g., user@domain.com)
- **Password Matching**: Verifies password and re-entered password match
- **Phone Validation**: Ensures phone number follows 123-456-7890 format
- **Real-time Error Messages**: Shows specific error messages as user types
- **Disabled Submit Button**: Button is disabled until all validations pass

### Backend Database System
- **SQLite Database**: Stores user information securely
- **Duplicate Prevention**: Checks if email or phone already exists
- **Password Security**: Passwords are hashed using bcrypt before storage
- **RESTful API**: Endpoints for user registration and validation

## Setup Instructions

### 1. Install Node.js Dependencies

Navigate to the server directory and install required packages:

```powershell
cd server
npm install
```

This will install:
- `express` - Web server framework
- `cors` - Enable cross-origin requests
- `bcrypt` - Password hashing
- `sqlite3` - Database management

### 2. Start the Backend Server

```powershell
npm start
```

The server will start on `http://localhost:3000`

For development with auto-restart:
```powershell
npm run dev
```

### 3. Open the Signup Page

Open `signup.html` in your browser or navigate to:
```
http://localhost:3000/signup.html
```

## API Endpoints

### Check Email Availability
```
GET /api/check-email?email=user@example.com
Response: { "exists": true/false }
```

### Check Phone Availability
```
GET /api/check-phone?phone=123-456-7890
Response: { "exists": true/false }
```

### Create Account
```
POST /api/signup
Body: {
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

### Get All Users (Testing)
```
GET /api/users
Response: { "users": [...] }
```

## Validation Rules

### First & Last Name
- Must contain only letters
- Spaces, hyphens, and apostrophes are allowed
- Minimum 2 characters
- Error shown if numbers or special characters detected

### Email
- Must follow standard email format: `user@domain.com`
- Checked against database for duplicates
- Case-insensitive storage

### Password
- Minimum 9 characters
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&*)
- Must match re-entered password

### Phone Number
- Format: 123-456-7890
- Checked against database for duplicates

## Database Schema

**Users Table:**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    dateOfBirth TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastLogin DATETIME
)
```

## Testing the System

1. **Test Name Validation**:
   - Enter numbers in name fields → Error appears
   - Enter letters → Success

2. **Test Email Validation**:
   - Enter invalid email (no @) → Error appears
   - Enter valid email → Success
   - Try same email twice → "Already registered" error

3. **Test Password Matching**:
   - Enter different passwords → Error appears
   - Enter matching passwords → Success

4. **Test Phone Validation**:
   - Enter wrong format → Error appears
   - Enter correct format → Success
   - Try same phone twice → "Already registered" error

5. **Test Submit Button**:
   - Leave fields empty → Button disabled
   - Fill all correctly → Button enabled
   - Submit with errors → Form error appears

## Files Structure

```
iFi/
├── signup.html              # Signup form page
├── css/
│   └── signup.css          # Styles including error messages
├── js/
│   └── signup-validation.js # Client-side validation logic
└── server/
    ├── server.js           # Backend API server
    ├── package.json        # Node.js dependencies
    ├── ifi-users.db        # SQLite database (auto-created)
    └── README.md           # This file
```

## Troubleshooting

**Server won't start:**
- Make sure Node.js is installed: `node --version`
- Ensure all dependencies are installed: `npm install`
- Check if port 3000 is available

**Validation not working:**
- Check browser console for JavaScript errors
- Ensure `signup-validation.js` is loaded
- Verify Font Awesome is loading for error icons

**Database errors:**
- Database file is created automatically on first run
- Check file permissions in the server directory
- Delete `ifi-users.db` to reset database

## Security Notes

- Passwords are hashed using bcrypt (never stored in plain text)
- Email addresses are stored in lowercase for consistency
- Input validation on both client and server side
- CORS enabled for local development (configure for production)
