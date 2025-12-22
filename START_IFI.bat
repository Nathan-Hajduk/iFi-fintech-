@echo off
title iFi Application Server
echo.
echo ============================================
echo   Starting iFi Application Server
echo ============================================
echo.
echo Server will start on http://localhost:3000
echo.
echo Please wait while the server starts...
echo.
cd /d "%~dp0server"

REM Start the server in the background
start /B node server.core.js

REM Wait for server to be ready
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:3000/html/Login.html

echo.
echo Server is running! Press Ctrl+C to stop.
echo.
pause
