@echo off
REM iFi Production Database Connection Script
echo.
echo ========================================
echo   iFi Production Database Access
echo ========================================
echo.

REM Check if production environment variables are set
if "%PROD_DB_HOST%"=="" (
    echo ERROR: Production database environment variables not set!
    echo.
    echo Please set the following environment variables:
    echo   PROD_DB_HOST     - Database hostname
    echo   PROD_DB_PORT     - Database port (usually 5432)
    echo   PROD_DB_NAME     - Database name
    echo   PROD_DB_USER     - Database username
    echo   PROD_DB_PASSWORD - Database password
    echo.
    echo Example:
    echo   set PROD_DB_HOST=your-db-host.com
    echo   set PROD_DB_PORT=5432
    echo   set PROD_DB_NAME=ifi_db
    echo   set PROD_DB_USER=ifi_user
    echo   set PROD_DB_PASSWORD=your_secure_password
    echo.
    
    REM Prompt for manual entry
    echo Would you like to enter them now? (Y/N)
    set /p enter_now=
    
    if /i "%enter_now%"=="Y" (
        echo.
        set /p PROD_DB_HOST="Enter database host: "
        set /p PROD_DB_PORT="Enter database port [5432]: "
        if "%PROD_DB_PORT%"=="" set PROD_DB_PORT=5432
        set /p PROD_DB_NAME="Enter database name [ifi_db]: "
        if "%PROD_DB_NAME%"=="" set PROD_DB_NAME=ifi_db
        set /p PROD_DB_USER="Enter database user [ifi_user]: "
        if "%PROD_DB_USER%"=="" set PROD_DB_USER=ifi_user
        set /p PROD_DB_PASSWORD="Enter database password: "
    ) else (
        exit /b 1
    )
)

echo.
echo Connecting to production database...
echo Host: %PROD_DB_HOST%
echo Port: %PROD_DB_PORT%
echo Database: %PROD_DB_NAME%
echo User: %PROD_DB_USER%
echo.

REM Set password for psql
set PGPASSWORD=%PROD_DB_PASSWORD%

REM Try to find psql
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"
if not exist %PSQL% set PSQL="C:\Program Files\PostgreSQL\17\bin\psql.exe"
if not exist %PSQL% set PSQL="C:\Program Files\PostgreSQL\16\bin\psql.exe"
if not exist %PSQL% set PSQL=psql

REM Connect with SSL required
echo Attempting secure connection...
%PSQL% "postgresql://%PROD_DB_USER%:%PROD_DB_PASSWORD%@%PROD_DB_HOST%:%PROD_DB_PORT%/%PROD_DB_NAME%?sslmode=require"

if errorlevel 1 (
    echo.
    echo Connection failed! Possible issues:
    echo   - Wrong credentials
    echo   - Firewall blocking connection
    echo   - Database not accessible from your IP
    echo   - SSL certificate issues
    echo.
    echo Try checking your database provider dashboard for connection details.
)

REM Clear password
set PGPASSWORD=
echo.
pause
