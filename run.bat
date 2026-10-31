@echo off
REM ShopEase full-stack launcher (Windows)
REM Seeds the database (if empty) and starts the Python backend,
REM which also serves the frontend at http://localhost:8000/
cd /d "%~dp0"

echo [run] seeding database...
python backend\seed.py
if errorlevel 1 (
  echo [run] seed failed. Make sure Python 3 is installed and on PATH.
  pause
  exit /b 1
)

echo [run] starting ShopEase backend...
python backend\app.py
pause
