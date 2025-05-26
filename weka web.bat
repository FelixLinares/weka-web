@echo off
REM —=== WEKA BACKEND ===—
start cmd /k "pushd C:\Users\Felix Linares\Desktop\weka-web\backend && call venv\Scripts\activate.bat && python app.py"

REM Esperamos un par de segundos para que el backend esté arriba
timeout /t 3 /nobreak >nul

REM —=== WEKA FRONTEND ===—
start cmd /k "pushd C:\Users\Felix Linares\Desktop\weka-web\frontend && npm start"

exit
