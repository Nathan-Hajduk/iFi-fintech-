@echo off
title Stop iFi Server
echo.
echo ============================================
echo   Stopping iFi Application
echo ============================================
echo.

REM Kill all Node.js processes (more aggressive)
echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

REM Wait for ports to be released
timeout /t 2 /nobreak >nul

echo.
echo All iFi servers stopped!
echo Port 3000 is now available.
echo.
pause
