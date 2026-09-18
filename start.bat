@echo off
title RailSync Launcher
echo ===================================================
echo              Starting RailSync Services
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend Server (FastAPI / Uvicorn)...
start "RailSync - Backend Server" cmd /k "cd /d "%~dp0" && py -3.12 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Frontend Dashboard (Vite / React)...
start "RailSync - Frontend Dashboard" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo   RailSync services launched in separate windows!
echo ===================================================
echo   - Backend API:         http://127.0.0.1:8000
echo   - Swagger Docs:        http://127.0.0.1:8000/docs
echo   - Frontend Dashboard:  http://localhost:5173
echo ===================================================
echo.
pause
