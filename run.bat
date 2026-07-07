@echo off
echo ==============================================
echo       Starting PrepAgent (Fast Startup)
echo ==============================================
echo.

echo Starting Backend (FastAPI on Port 9001)...
start "PrepAgent Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 9001 --env-file .env"

echo Starting Frontend (Next.js on Port 3000)...
start "PrepAgent Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:9001
echo.
echo To close them, just close the two new command prompt windows.
