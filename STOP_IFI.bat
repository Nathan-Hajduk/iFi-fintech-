@echo off
title Stop iFi Server
echo.
echo ============================================
echo   Stopping iFi Backend Server
echo ============================================
echo.

REM Kill Node.js processes running server.js
echo Stopping backend server...
taskkill /F /FI "WINDOWTITLE eq iFi Backend Server*" >nul 2>&1
taskkill /F /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq *server.js*" >nul 2>&1

echo.
echo iFi server stopped!
echo.
pause
