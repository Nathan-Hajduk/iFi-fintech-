@echo off
title iFi Application Server
echo.
echo ============================================
echo   Starting iFi Application Server
echo ============================================
echo.
echo Backend API: http://localhost:3000
echo Frontend: Opening Login page...
echo.
echo Please wait while the server starts...
echo.

REM Change to backend directory
cd /d "%~dp0backend"

REM Check if Node modules are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the backend server
echo Starting backend server...
start "iFi Backend Server" cmd /k "node server.js"

REM Wait for server to be ready
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Check if Live Server is running on port 5500
echo Checking for frontend server...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5500' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo Live Server detected! Opening iFi...
    cd /d "%~dp0"
    start http://127.0.0.1:5500/html/Login.html
) else (
    echo No frontend server detected. Starting one now...
    cd /d "%~dp0"
    echo Starting frontend server on port 5500...
    start "iFi Frontend Server" cmd /k "npx http-server . -p 5500 -c-1"
    
    echo Waiting for frontend server to start...
    timeout /t 3 /nobreak >nul
    
    echo Opening iFi in your browser...
    start http://127.0.0.1:5500/html/Login.html
)

echo.
echo ============================================
echo   iFi Servers Running Successfully!
echo ============================================
echo.
echo Backend API: http://localhost:3000
echo Frontend App: http://localhost:5500
echo.
echo Two server windows are now open:
echo   - iFi Backend Server (Node.js)
echo   - iFi Frontend Server (http-server)
echo.
echo To stop: Close both server windows or run STOP_IFI.bat
echo.
echo WHY CAN'T I USE FILE:// DIRECTLY?
echo Direct file access (file://) is blocked by browsers due to
echo CORS security. API calls to localhost:3000 will fail.
echo You MUST use an HTTP server (this is now automatic).
echo.
pause
