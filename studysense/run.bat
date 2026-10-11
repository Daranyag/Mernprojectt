@echo off
title StudySense LMS - Single Terminal Launcher
echo ====================================================
echo Starting StudySense: Backend + Frontend in One CMD...
echo ====================================================

:: Launch Backend in its own background CMD process
start "StudySense Server (Backend - Port 5000)" cmd /k "cd /d %~dp0server && npm run dev"

:: Launch Frontend in its own background CMD process
start "StudySense Client (Frontend - Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo [SUCCESS] Both Backend and Frontend processes launched!
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:5173
echo.
echo You can close this window now.
pause
