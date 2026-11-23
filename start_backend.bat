@echo off
title MM Chatbot - Backend (FastAPI)
echo ============================================================
echo   MM Chatbot - Starting Backend (FastAPI on Port 8000)
echo ============================================================
echo.

cd /d "%~dp0"
set PYTHONPATH=%~dp0

set PYTHON_CMD=python
if exist "C:\Python314\python.exe" set PYTHON_CMD=C:\Python314\python.exe

echo Using Python: %PYTHON_CMD%
echo.

"%PYTHON_CMD%" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend failed to start or crashed with exit code %ERRORLEVEL%.
    pause
)
