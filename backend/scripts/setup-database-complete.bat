@echo off
REM iFi Complete Database Setup Script
echo.
echo ========================================
echo   iFi Complete Database Setup
echo ========================================
echo.

REM Check if PostgreSQL is running
echo Checking PostgreSQL service...
sc query postgresql-x64-18 | find "RUNNING" >nul
if errorlevel 1 (
    echo [ERROR] PostgreSQL is not running. Please start the service first.
    pause
    exit /b 1
)
echo [OK] PostgreSQL is running
echo.

REM Create .env file
echo Creating .env file...
cd /d "%~dp0.."
(
echo # Database Configuration
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=ifi_db
echo DB_USER=ifi_user
echo DB_PASSWORD=iFi_Secure_Pass_2024!
echo.
echo # JWT Configuration
echo JWT_SECRET=your_jwt_secret_key_change_this_in_production
echo JWT_REFRESH_SECRET=your_jwt_refresh_secret_change_this_in_production
echo JWT_EXPIRES_IN=1h
echo JWT_REFRESH_EXPIRES_IN=7d
echo.
echo # Server Configuration
echo PORT=3000
echo NODE_ENV=development
echo.
echo # CORS Configuration
echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500
echo.
echo # Plaid Configuration
echo PLAID_CLIENT_ID=your_plaid_client_id
echo PLAID_SECRET=your_plaid_secret
echo PLAID_ENV=sandbox
echo.
echo # OpenAI Configuration
echo OPENAI_API_KEY=your_openai_api_key
echo.
echo # Encryption
echo ENCRYPTION_KEY=your_encryption_key_change_this
) > .env
echo [OK] .env file created
echo.

REM Ask for PostgreSQL password
echo.
echo Please enter the PostgreSQL 'postgres' user password:
set /p PGPASSWORD=
echo.

REM Run SQL setup script
echo Setting up database and user...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f scripts\setup-complete-database.sql
if errorlevel 1 (
    echo [WARNING] Error creating database. You may need to run this manually.
    echo Run: psql -U postgres -f scripts\setup-complete-database.sql
) else (
    echo [OK] Database and user created successfully
)
echo.

REM Initialize base tables
echo Creating base database tables...
node scripts\init-database.js
if errorlevel 1 (
    echo [WARNING] Error creating base tables
) else (
    echo [OK] Base tables created successfully
)
echo.

REM Initialize enhanced analytics tables
echo Creating enhanced analytics tables...
node scripts\init-database-enhanced.js
if errorlevel 1 (
    echo [WARNING] Error creating enhanced tables
) else (
    echo [OK] Enhanced analytics tables created successfully
)
echo.

REM Create analytics views
echo Creating analytics views...
set PGPASSWORD=iFi_Secure_Pass_2024!
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U ifi_user -d ifi_db -f scripts\create-analytics-views.sql
if errorlevel 1 (
    echo [WARNING] Error creating views
) else (
    echo [OK] Analytics views created successfully
)
echo.

REM Summary
echo.
echo ========================================
echo   Database Setup Complete!
echo ========================================
echo.
echo Database Information:
echo   Database: ifi_db
echo   User: ifi_user
echo   Password: iFi_Secure_Pass_2024!
echo   Host: localhost
echo   Port: 5432
echo.
echo Tables Created:
echo   - 14 Core tables
echo   - 15 Enhanced analytics tables
echo   - 17 Analytics views
echo.
echo Next Steps:
echo   1. Update .env with your Plaid and OpenAI credentials
echo   2. Start the backend: npm start
echo   3. Create test user: node scripts\create-test-user.js
echo.
echo View Analytics:
echo   psql -U ifi_user -d ifi_db
echo   SELECT * FROM vw_business_dashboard;
echo.
pause
