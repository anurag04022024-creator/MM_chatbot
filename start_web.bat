@echo off
title NOVA - React Frontend (Port 5173)
echo ============================================================
echo   NOVA AI Assistant - React Web App (Claude-Style UI)
echo ============================================================
echo.

cd /d "%~dp0frontend"

echo Starting Vite development server on http://localhost:5173...
echo.

call npm run dev -- --host 0.0.0.0 --port 5173

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend failed to start with code %ERRORLEVEL%.
    pause
)
