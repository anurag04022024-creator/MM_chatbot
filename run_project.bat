@echo off
title NOVA AI Assistant - Launcher
echo ============================================================
echo   NOVA AI Assistant - Full-Featured Multi-Purpose Workspace
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Express Proxy & Provider Layer on port 3001...
start "NOVA - Express Proxy (Port 3001)" cmd /k call "%~dp0start_server.bat"

echo.
echo Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Starting React Web App on port 5173...
start "NOVA - React Frontend (Claude-Style UI)" cmd /k call "%~dp0start_web.bat"

echo.
echo Waiting for frontend to start...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Opening NOVA Web App in default browser...
start http://localhost:5173

echo.
echo ============================================================
echo   NOVA is running!
echo   - Web App UI:       http://localhost:5173
echo   - Express Proxy:    http://localhost:3001
echo   - Companion RAG:    http://localhost:8000
echo ============================================================
echo.
pause
