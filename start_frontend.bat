@echo off
title MM Chatbot - Frontend (Streamlit)
echo ============================================================
echo   MM Chatbot - Starting Frontend (Streamlit on Port 8501)
echo ============================================================
echo.

cd /d "%~dp0"
set PYTHONPATH=%~dp0

set PYTHON_CMD=python
if exist "C:\Python314\python.exe" set PYTHON_CMD=C:\Python314\python.exe

echo Using Python: %PYTHON_CMD%
echo.

"%PYTHON_CMD%" -m streamlit run streamlit_app/app.py --server.port 8501 --server.address 0.0.0.0 --server.headless true --browser.gatherUsageStats false

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Streamlit frontend failed to start or crashed with exit code %ERRORLEVEL%.
    pause
)
