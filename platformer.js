<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pixel Platformer</title>
    <style>
        body {
            background-color: #1a1a1a;
            color: #ffffff;
            font-family: 'Press Start 2P', cursive; /* Police pixel art */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            image-rendering: -moz-crisp-edges;
            image-rendering: -webkit-crisp-edges;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        }
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        #gameContainer {
            position: relative;
            border: 4px solid #555;
            box-shadow: 0 0 20px #000;
        }

        canvas {
            display: block;
            background-color: #000;
        }

        #hud, #menu, #gameover {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            z-index: 10;
            text-shadow: 2px 2px #000;
        }

        #menu, #gameover {
            background-color: rgba(0, 0, 0, 0.7);
        }
        
        #hud {
            justify-content: flex-start;
            pointer-events: none;
        }

        .hud-info {
            width: 100%;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            box-sizing: border-box;
        }

        h1 {
            font-size: 48px;
            color: #ffde00;
            margin-bottom: 20px;
        }
        
        button {
            font-family: 'Press Start 2P', cursive;
            font-size: 20px;
            padding: 15px 30px;
            background-color: #4CAF50;
            color: white;
            border: 2px solid #fff;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 5px #999;
            transition: all 0.1s ease-in-out;
        }

        button:hover {
            background-color: #45a049;
        }
        button:active {
            transform: translateY(4px);
            box-shadow: 0 1px #666;
        }
        
        #controls {
            display: none; /* Caché par défaut, activé via JS */
            position: fixed;
            bottom: 20px;
            width: 100%;
            justify-content: space-around;
            z-index: 20;
        }

        .control-btn {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.3);
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            user-select: none;
        }
    </style>
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas"></canvas>
        
        <!-- Menu Principal -->
        <div id="menu">
            <h1>Pixel Platformer</h1>
            <button id="btnStart">Démarrer</button>
        </div>

        <!-- Interface de jeu (HUD) -->
        <div id="hud" style="display: none;">
            <div class="hud-info">
                <span id="score">SCORE: 0</span>
                <span id="lives">VIES: 3</span>
                <span id="timer">TEMPS: 120</span>
            </div>
        </div>

        <!-- Écran de Game Over -->
        <div id="gameover" style="display: none;">
            <h1 id="message">Game Over</h1>
            <button id="btnRestart">Recommencer</button>
        </div>
    </div>

    <!-- Contrôles Tactiles -->
    <div id="controls">
        <div id="btnLeft" class="control-btn">⬅️</div>
        <div id="btnRight" class="control-btn">➡️</div>
        <div id="btnJump" class="control-btn">⬆️</div>
    </div>

    <script src="platformer.js"></script>
</body>
</html>
```javascript
// =================================================================================
// PLATEFORMER.JS - REFACTORISÉ POUR UN JEU DE PLATEFORME À BASE DE TUILES
// =================================================================================

// --- SÉLECTION DES ÉLÉMENTS DU DOM ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('score');
const hudLives = document.getElementById('lives');
const hudTimer = document.getElementById('timer');
const btnStart = document.getElementById('btnStart');
const btnRestart = document.getElementById('btnRestart');
const menuDiv = document.getElementById('menu');
const gameoverDiv = document.getElementById('gameover');
const msgEnd = document.getElementById('message');
const hudDiv = document.getElementById('hud');
const controlsDiv = document.getElementById('controls');

// --- CONFIGURATION DU JEU ---
const TILE_SIZE = 16; // Taille de chaque tuile en pixels
const GRAVITY = 0.3;
const JUMP_FORCE = 7.5;
const PLAYER_SPEED = 2;

// Résolution interne du jeu (sera mise à l'échelle)
const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// --- DÉFINITION DE LA CARTE DU NIVEAU (TILEMAP) ---
// 0 = Vide, 1 = Sol, 2 = Brique, 3 = Bloc ?, 4 = Pièce, 5 = Pique, 9 = Fin
const levelData = [
    "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -",
    "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             -",
    "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        -",
    "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               -",
    "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -",
    "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 -",
    "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         -",
    "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             -",
t'a pas fini le code'];

const WORLD_WIDTH_TILES = levelData[0].length;
const WORLD_HEIGHT_TILES = levelData.length;

// --- ÉTAT DU JEU ---
let game, keys = {}, lastTime = 0;

// --- GESTION DES ENTRÉES (CLAVIER & TACTILE) ---
function setupInput() {
    keys = { right: false, left: false, jump: false };
    
    document.addEventListener('keydown', e => {
        if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") keys.jump = true;
    });

    document.addEventListener('keyup', e => {
        if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") keys.jump = false;
    });

    // Contrôles tactiles
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) {
        controlsDiv.style.display = "flex";
        document.getElementById('btnLeft').addEventListener('touchstart', () => keys.left = true);
        document.getElementById('btnLeft').addEventListener('touchend', () => keys.left = false);
        document.getElementById('btnRight').addEventListener('touchstart', () => keys.right = true);
        document.getElementById('btnRight').addEventListener('touchend', () => keys.right = false);
        document.getElementById('btnJump').addEventListener('touchstart', () => keys.jump = true);
        document.getElementById('btnJump').addEventListener('touchend', () => keys.jump = false);
    }
}

// --- INITIALISATION DU JEU ---
function initGame() {
    game = {
        player: {
            x: 50, y: 150,
            vx: 0, vy: 0,
            w: TILE_SIZE - 2, h: TILE_SIZE * 2 - 4, // Le joueur fait presque 2 tuiles de haut
            grounded: false,
            canJump: true,
            dir: 1, // 1 pour droite, -1 pour gauche
            frame: 0
        },
        camera: {
            x: 0, y: 0
        },
        enemies: [],
        particles: [],
        tileMap: [],
        score: 0,
        lives: 3,
        time: 120,
        timeLast: Date.now(),
        over: false,
        win: false
    };

    // Transformer la carte de chaînes de caractères en un tableau 2D d'objets
    game.tileMap = levelData.map((row, y) => {
        return row.split('').map((tile, x) => {
            const tileType = parseInt(tile, 10);
            if (tileType === 4) { // Pièce
                return { type: tileType, collected: false, initialY: y * TILE_SIZE };
            }
            return { type: tileType };
        });
    });
    
    // Ajouter un ennemi simple pour la démonstration
    game.enemies.push(createEnemy(30 * TILE_SIZE, 13 * TILE_SIZE));

    updateHUD();
    menuDiv.style.display = "none";
    gameoverDiv.style.display = "none";
    hudDiv.style.display = "flex";
}

// --- BOUCLE DE JEU PRINCIPALE ---
function gameLoop(timestamp) {
    if (game.over) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// --- MISE À JOUR DE LA LOGIQUE DU JEU ---
function update(deltaTime) {
    updatePlayer();
    updateEnemies();
    updateParticles();
    updateCamera();
    updateTimer();
}

function updatePlayer() {
    const p = game.player;

    // Mouvement horizontal
    if (keys.left) {
        p.vx = -PLAYER_SPEED;
        p.dir = -1;
    } else if (keys.right) {
        p.vx = PLAYER_SPEED;
        p.dir = 1;
    } else {
        p.vx = 0;
    }

    // Saut
    if (keys.jump && p.grounded && p.canJump) {
        p.vy = -JUMP_FORCE;
        p.grounded = false;
        p.canJump = false; // Empêche le saut continu si la touche est maintenue
        createParticles(p.x + p.w / 2, p.y + p.h, 10, '#d2b48c'); // Poussière de saut
    }
    if (!keys.jump) {
        p.canJump = true;
    }

    // Gravité
    p.vy += GRAVITY;

    // Application du mouvement et gestion des collisions
    handleCollisions();

    // Animation du joueur
    if (p.grounded && (keys.left || keys.right)) {
        p.frame = (p.frame + 0.2) % 4; // 4 images pour la marche
    } else if (!p.grounded) {
        p.frame = 4; // Image de saut
    } else {
        p.frame = 0; // Image statique
    }
    
    // Tomber hors du monde
    if (p.y > WORLD_HEIGHT_TILES * TILE_SIZE) {
        loseLife();
    }
}

function updateEnemies() {
    game.enemies.forEach(enemy => {
        enemy.vy += GRAVITY;
        
        let oldX = enemy.x;
        enemy.x += enemy.vx;
        
        // Collision de l'ennemi avec les murs
        if (getTileAt(enemy.x + (enemy.vx > 0 ? enemy.w : 0), enemy.y + enemy.h - 1) > 0 ||
            getTileAt(enemy.x + (enemy.vx > 0 ? enemy.w : 0), enemy.y) > 0) {
            enemy.x = oldX;
            enemy.vx *= -1;
        }

        // Vérifier si l'ennemi est sur le point de tomber
        const checkX = enemy.vx > 0 ? enemy.x + enemy.w + 1 : enemy.x - 1;
        if (getTileAt(checkX, enemy.y + enemy.h + 1) === 0) {
           enemy.x = oldX;
           enemy.vx *= -1;
        }
        
        enemy.y += enemy.vy;
        
        // Collision verticale de l'ennemi
        if (enemy.vy > 0) { // Tombe
            if (getTileAt(enemy.x, enemy.y + enemy.h) > 0 || getTileAt(enemy.x + enemy.w, enemy.y + enemy.h) > 0) {
                enemy.y = Math.floor((enemy.y + enemy.h) / TILE_SIZE) * TILE_SIZE - enemy.h;
                enemy.vy = 0;
            }
        }
        
        // Collision avec le joueur
        if (rectCollide(game.player, enemy)) {
            // Le joueur saute sur l'ennemi
            if (game.player.vy > 0 && game.player.y + game.player.h < enemy.y + enemy.h / 2) {
                game.enemies.splice(game.enemies.indexOf(enemy), 1);
                game.score += 100;
                game.player.vy = -JUMP_FORCE / 2; // Petit rebond
                createParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 15, '#555');
            } else {
                loseLife();
            }
        }
    });
}

function updateParticles() {
    game.particles = game.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY / 2;
        p.life--;
        return p.life > 0;
    });
}

function updateCamera() {
    const p = game.player;
    const targetCamX = p.x - GAME_WIDTH / 2;
    const targetCamY = p.y - GAME_HEIGHT / 2;

    // Interpolation douce (lerp) pour un mouvement de caméra fluide
    game.camera.x += (targetCamX - game.camera.x) * 0.1;
    game.camera.y += (targetCamY - game.camera.y) * 0.1;
    
    // Bloquer la caméra aux limites du monde
    game.camera.x = Math.max(0, Math.min(game.camera.x, WORLD_WIDTH_TILES * TILE_SIZE - GAME_WIDTH));
    game.camera.y = Math.max(0, Math.min(game.camera.y, WORLD_HEIGHT_TILES * TILE_SIZE - GAME_HEIGHT));
}

function updateTimer() {
    if (Date.now() - game.timeLast > 1000) {
        game.time--;
        game.timeLast = Date.now();
        updateHUD();
        if (game.time <= 0) {
            endGame(false);
        }
    }
}

// --- GESTION DES COLLISIONS AVEC LE TILEMAP ---
function handleCollisions() {
    const p = game.player;
    
    // Collision sur l'axe X
    p.x += p.vx;
    let leftTile = Math.floor(p.x / TILE_SIZE);
    let rightTile = Math.floor((p.x + p.w) / TILE_SIZE);
    let topTile = Math.floor(p.y / TILE_SIZE);
    let bottomTile = Math.floor((p.y + p.h) / TILE_SIZE);

    for (let y = topTile; y <= bottomTile; y++) {
        for (let x = leftTile; x <= rightTile; x++) {
            const tile = getTile(x, y);
            if (tile.type > 0 && tile.type < 5) { // Si c'est un bloc solide
                if (p.vx > 0) { // Collision à droite
                    p.x = x * TILE_SIZE - p.w;
                } else if (p.vx < 0) { // Collision à gauche
                    p.x = (x + 1) * TILE_SIZE;
                }
            }
            checkTileInteraction(x, y);
        }
    }
    
    // Collision sur l'axe Y
    p.y += p.vy;
    p.grounded = false;
    leftTile = Math.floor(p.x / TILE_SIZE);
    rightTile = Math.floor((p.x + p.w) / TILE_SIZE);
    topTile = Math.floor(p.y / TILE_SIZE);
    bottomTile = Math.floor((p.y + p.h) / TILE_SIZE);

    for (let y = topTile; y <= bottomTile; y++) {
        for (let x = leftTile; x <= rightTile; x++) {
            const tile = getTile(x, y);
            if (tile.type > 0 && tile.type < 5) { // Si c'est un bloc solide
                if (p.vy > 0) { // Collision en bas (atterrissage)
                    p.y = y * TILE_SIZE - p.h;
                    p.vy = 0;
                    p.grounded = true;
                } else if (p.vy < 0) { // Collision en haut (se cogne la tête)
                    p.y = (y + 1) * TILE_SIZE;
                    p.vy = 0;
                    
                    // Interaction avec les blocs '?'
                    if (tile.type === 3) {
                        setTile(x, y, 0); // Le bloc devient vide
                        createParticles(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE, 10, '#ffd700');
                        game.score += 50;
                    }
                }
            }
            checkTileInteraction(x, y);
        }
    }
}

function checkTileInteraction(x, y) {
    const tile = getTile(x, y);
    const p = game.player;
    const playerBounds = { x: p.x, y: p.y, w: p.w, h: p.h };
    const tileBounds = { x: x * TILE_SIZE, y: y * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };

    if (rectCollide(playerBounds, tileBounds)) {
        // Collecter une pièce
        if (tile.type === 4 && !tile.collected) {
            tile.collected = true;
            game.score += 10;
            createParticles(tileBounds.x + TILE_SIZE / 2, tileBounds.y + TILE_SIZE / 2, 8, '#ffd700');
        }
        // Toucher un pique
        if (tile.type === 5) {
            loseLife();
        }
        // Atteindre la fin
        if (tile.type === 9) {
            endGame(true);
        }
    }
}


// --- FONCTIONS DE DESSIN ---
function draw() {
    // Fond dynamique
    ctx.fillStyle = '#639bff';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawParallaxBackgrounds();

    ctx.save();
    ctx.translate(-game.camera.x, -game.camera.y);
    
    drawTilemap();
    drawEnemies();
    drawPlayer();
    drawParticles();

    ctx.restore();
}

function drawParallaxBackgrounds() {
    const camX = game.camera.x;
    
    // Montagnes lointaines (boucle)
    ctx.fillStyle = '#4d72aa';
    for (let i = 0; i < 3; i++) {
        let bgX = (-camX * 0.2) % GAME_WIDTH + i * GAME_WIDTH;
        ctx.beginPath();
        ctx.moveTo(bgX, GAME_HEIGHT - 50);
        ctx.lineTo(bgX + 150, GAME_HEIGHT - 150);
        ctx.lineTo(bgX + 300, GAME_HEIGHT - 80);
        ctx.lineTo(bgX + 480, GAME_HEIGHT - 50);
        ctx.closePath();
        ctx.fill();
    }
    
    // Collines proches (boucle)
    ctx.fillStyle = '#5a8f4a';
    for (let i = 0; i < 3; i++) {
        let bgX = (-camX * 0.5) % GAME_WIDTH + i * GAME_WIDTH;
        ctx.beginPath();
        ctx.moveTo(bgX, GAME_HEIGHT - 20);
        ctx.arc(bgX + 120, GAME_HEIGHT - 20, 100, Math.PI, 0, false);
        ctx.arc(bgX + 360, GAME_HEIGHT - 20, 120, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
    }
}

function drawTilemap() {
    const startCol = Math.floor(game.camera.x / TILE_SIZE);
    const endCol = startCol + (GAME_WIDTH / TILE_SIZE) + 1;
    const startRow = Math.floor(game.camera.y / TILE_SIZE);
    const endRow = startRow + (GAME_HEIGHT / TILE_SIZE) + 1;

    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            const tile = getTile(x, y);
            if (tile.type === 0) continue; // Ne rien dessiner pour le vide

            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;

            switch (tile.type) {
                case 1: // Sol
                    ctx.fillStyle = '#d2b48c';
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#8c7853'; // Ombre
                    ctx.fillRect(tileX, tileY, TILE_SIZE, 2);
                    break;
                case 2: // Brique
                    ctx.fillStyle = '#b95e23';
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#733a12';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tileX + 0.5, tileY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
                    break;
                case 3: // Bloc ?
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 12px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillText('?', tileX + TILE_SIZE / 2, tileY + TILE_SIZE - 4);
                    break;
                case 4: // Pièce
                    if (!tile.collected) {
                        ctx.fillStyle = '#ffd700';
                        const bounce = Math.sin(Date.now() / 200 + tileX) * 2;
                        ctx.fillRect(tileX + 4, tile.initialY + 4 + bounce, TILE_SIZE - 8, TILE_SIZE - 8);
                        ctx.fillStyle = '#ffec8b'; // Reflet
                        ctx.fillRect(tileX + 5, tile.initialY + 5 + bounce, 2, 2);
                    }
                    break;
                case 5: // Pique
                    ctx.fillStyle = '#888';
                    ctx.beginPath();
                    ctx.moveTo(tileX, tileY + TILE_SIZE);
                    ctx.lineTo(tileX + TILE_SIZE / 2, tileY);
                    ctx.lineTo(tileX + TILE_SIZE, tileY + TILE_SIZE);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 9: // Fin (Drapeau)
                    ctx.fillStyle = '#ccc';
                    ctx.fillRect(tileX + TILE_SIZE/2 - 1, tileY, 2, TILE_SIZE);
                    ctx.fillStyle = 'green';
                    ctx.beginPath();
                    ctx.moveTo(tileX + TILE_SIZE/2 + 1, tileY);
                    ctx.lineTo(tileX + TILE_SIZE, tileY + TILE_SIZE/4);
                    ctx.lineTo(tileX + TILE_SIZE/2 + 1, tileY + TILE_SIZE/2);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        }
    }
}

function drawPlayer() {
    const p = game.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Retourner le sprite si le joueur va à gauche
    if (p.dir === -1) {
        ctx.scale(-1, 1);
        ctx.translate(-p.w, 0);
    }

    // Corps du joueur (style simple pixel art)
    const frameIndex = Math.floor(p.frame);
    
    // Tête
    ctx.fillStyle = '#ffb87f'; // Couleur peau
    ctx.fillRect(0, 0, p.w, p.h / 2);
    
    // Yeux
    ctx.fillStyle = 'white';
    ctx.fillRect(p.w / 4 - 1, p.h / 8, 2, 2);
    ctx.fillRect(p.w * 3 / 4 - 1, p.h / 8, 2, 2);

    // Torse
    ctx.fillStyle = '#e53935'; // Rouge
    ctx.fillRect(0, p.h / 2, p.w, p.h / 4);

    // Jambes (animation de marche simple)
    ctx.fillStyle = '#42a5f5'; // Bleu
    if (frameIndex === 1 || frameIndex === 3) {
        ctx.fillRect(0, p.h * 3 / 4, p.w / 2, p.h / 4);
    } else {
        ctx.fillRect(p.w / 2, p.h * 3 / 4, p.w / 2, p.h / 4);
    }

    ctx.restore();
}

function drawEnemies() {
    game.enemies.forEach(enemy => {
        // Style Goomba simple
        ctx.fillStyle = '#8b4513'; // Marron
        ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
        // Yeux
        ctx.fillStyle = 'white';
        ctx.fillRect(enemy.x + 2, enemy.y + 2, 4, 4);
        ctx.fillRect(enemy.x + enemy.w - 6, enemy.y + 2, 4, 4);
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.x + 4, enemy.y + 4, 1, 1);
        ctx.fillRect(enemy.x + enemy.w - 4, enemy.y + 4, 1, 1);
    });
}

function drawParticles() {
    game.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
}

// --- FONCTIONS UTILITAIRES ---
function rectCollide(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.h > rect2.y;
}

function getTile(x, y) {
    if (y < 0 || y >= WORLD_HEIGHT_TILES || x < 0 || x >= WORLD_WIDTH_TILES) {
        return { type: 0 }; // Vide en dehors des limites
    }
    return game.tileMap[y][x];
}

function getTileAt(pixelX, pixelY) {
    const tileX = Math.floor(pixelX / TILE_SIZE);
    const tileY = Math.floor(pixelY / TILE_SIZE);
    return getTile(tileX, tileY).type;
}

function setTile(x, y, type) {
    if (y >= 0 && y < WORLD_HEIGHT_TILES && x >= 0 && x < WORLD_WIDTH_TILES) {
        game.tileMap[y][x].type = type;
    }
}

function createEnemy(x, y) {
    return {
        x, y,
        w: TILE_SIZE, h: TILE_SIZE,
        vx: -0.5, vy: 0
    };
}

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 20 + Math.random() * 20,
            maxLife: 40,
            color,
            size: Math.random() * 3 + 1
        });
    }
}

// --- GESTION DE L'ÉTAT DU JEU (VIE, SCORE, FIN) ---
function updateHUD() {
    hudScore.textContent = `SCORE: ${game.score}`;
    hudLives.textContent = `VIES: ${game.lives}`;
    hudTimer.textContent = `TEMPS: ${game.time}`;
}

function loseLife() {
    game.lives--;
    if (game.lives <= 0) {
        endGame(false);
    } else {
        // Réapparition au début (ou à un checkpoint si implémenté)
        game.player.x = 50;
        game.player.y = 150;
        game.player.vx = 0;
        game.player.vy = 0;
    }
    updateHUD();
}

function endGame(win) {
    if (game.over) return;
    game.over = true;
    game.win = win;

    if (win) {
        msgEnd.innerHTML = `🎉 Victoire! 🎉<br>Score: ${game.score}`;
    } else {
        msgEnd.innerHTML = `💀 Game Over 💀<br>Score: ${game.score}`;
    }
    
    setTimeout(() => {
        hudDiv.style.display = "none";
        gameoverDiv.style.display = "flex";
    }, 1000);
}

// --- DÉMARRAGE ---
btnStart.onclick = () => {
    initGame();
    setupInput();
    requestAnimationFrame(gameLoop);
};

btnRestart.onclick = () => {
    initGame();
};

window.onload = () => {
    // Affiche le menu au chargement
    menuDiv.style.display = "flex";
};
