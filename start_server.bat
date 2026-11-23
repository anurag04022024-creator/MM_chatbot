@echo off
title NOVA - Express Proxy Server (Port 3001)
echo ============================================================
echo   NOVA AI Assistant - Express Backend Proxy (Port 3001)
echo ============================================================
echo.

cd /d "%~dp0server"

echo Starting Express proxy server...
node index.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Express server stopped with code %ERRORLEVEL%.
    pause
)
