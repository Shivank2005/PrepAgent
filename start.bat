@echo off
title PrepAgent - Starting...
echo.
echo  ============================================
echo   PrepAgent - AI Placement Preparation App
echo  ============================================
echo.

:: Start Backend
echo [1/3] Starting Backend on port 9001...
cd /d "%~dp0backend"
start "PrepAgent-Backend" cmd /k "title PrepAgent Backend & python run_server.py"

:: Wait for backend to be ready
echo [2/3] Waiting for backend to be ready...
:wait_backend
timeout /t 3 /nobreak >nul
python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:9001/health')" >nul 2>&1
if errorlevel 1 (
    echo        Still waiting...
    goto wait_backend
)
echo        Backend is ready!

:: Start Frontend
echo [3/3] Starting Frontend on port 3000...
cd /d "%~dp0frontend"
start "PrepAgent-Frontend" cmd /k "title PrepAgent Frontend & npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo  ============================================
echo   PrepAgent is running!
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:9001
echo  ============================================
echo.

start http://localhost:3000
pause
