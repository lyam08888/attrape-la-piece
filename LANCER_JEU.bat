@echo off
echo ========================================
echo    SUPER PIXEL ADVENTURE 2
echo    Lancement du jeu avec outils ameliores
echo ========================================
echo.

echo Nouvelles fonctionnalités de mouvement:
echo - Saut double: Appuyez deux fois sur Espace
echo - Vol: Appuyez sur V pour activer/désactiver
echo - Glisse: Maintenez la flèche du bas pendant la chute
echo - Glissade murale: Glissez le long des murs
echo - Saut mural: Saut directionnel depuis un mur
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
