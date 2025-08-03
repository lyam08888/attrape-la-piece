@echo off
echo ========================================
echo    Démarrage du serveur de jeu
echo ========================================
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js détecté. Démarrage du serveur...
    echo.
    echo Le jeu sera accessible à l'adresse: http://localhost:3000
    echo.
    echo Fermez cette fenêtre pour arrêter le serveur.
    echo.
    node server.js
) else (
    echo Node.js non trouvé.
    echo.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    echo ou utilisez un autre serveur HTTP local.
    echo.
    pause
    exit /b
)
