@echo off
cd /d "%~dp0"
echo Tentative de demarrage du serveur...

REM Essayer Python
python simple_server.py
if %errorlevel% equ 0 goto :eof

REM Essayer Python3
python3 simple_server.py
if %errorlevel% equ 0 goto :eof

REM Essayer Node.js
node simple_server.js
if %errorlevel% equ 0 goto :eof

echo.
echo Aucun serveur disponible. Veuillez installer Python ou Node.js
echo Ou ouvrez index.html directement dans votre navigateur
pause