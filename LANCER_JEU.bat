@echo off
echo ========================================
echo    SUPER PIXEL ADVENTURE 2
echo    Lancement du jeu avec outils ameliores
echo ========================================
echo.

cd /d "%~dp0"

echo Tentative de lancement du serveur local...
echo.

REM Essayer de lancer un serveur
call start_server.bat

REM Si aucun serveur n'est disponible, ouvrir directement le fichier
if %errorlevel% neq 0 (
    echo.
    echo Aucun serveur disponible, ouverture directe du fichier...
    start "" "index.html"
)

echo.
echo Le jeu devrait s'ouvrir dans votre navigateur.
echo Si ce n'est pas le cas, ouvrez manuellement index.html
echo.
pause