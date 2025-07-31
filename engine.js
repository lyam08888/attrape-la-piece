diff --git a/engine.js b/engine.js
index 2e21c84d3326e8879296549d53a8f96f1c2afb2c..ef313a848c31b7d03f388a7e1e32fa8c435b5142 100644
--- a/engine.js
+++ b/engine.js
@@ -1,104 +1,134 @@
 // Moteur de jeu générique
 export class GameEngine {
     constructor(canvas, config) {
         this.canvas = canvas;
         this.ctx = canvas.getContext('2d');
         this.config = config;
         this.assets = {};
-        this.keys = { left: false, right: false, jump: false, action: false, fly: false };
+        this.keys = {
+            left: false,
+            right: false,
+            jump: false,
+            action: false,
+            fly: false,
+            down: false,
+            doubleDown: false,
+            run: false,
+            _lastDown: 0
+        };
         this.mouse = { x: 0, y: 0, left: false, right: false };
         this.gameLogic = {}; // Fonctions spécifiques au jeu (init, update, draw)
     }
 
     // Charge les assets définis dans la configuration
     async loadAssets() {
         const promises = [];
         const allAssetPaths = {};
         const baseUrl = this.config.githubRepoUrl || '';
 
         for (const [key, path] of Object.entries(this.config.assets)) {
             // CORRECTION: On utilise le chemin relatif simple, sans le './'
             if (path.startsWith('http')) {
                 allAssetPaths[key] = path;
             } else {
                 allAssetPaths[key] = baseUrl ? baseUrl + path : path;
             }
         }
+        if (this.config.playerAnimations) {
+            for (const frames of Object.values(this.config.playerAnimations)) {
+                frames.forEach(key => {
+                    const path = this.config.assets[key];
+                    if (path) {
+                        allAssetPaths[key] = baseUrl ? baseUrl + path : path;
+                    }
+                });
+            }
+        }
         this.config.skins.forEach((fileName, i) => {
             const skinPath = 'assets/' + fileName;
             allAssetPaths[`player${i+1}`] = baseUrl ? baseUrl + skinPath : skinPath;
         });
 
         const custom = localStorage.getItem('customPlayer1');
         if (custom) {
             allAssetPaths['player1'] = custom;
         }
 
         for (const [key, path] of Object.entries(allAssetPaths)) {
             promises.push(new Promise((resolve) => { // On utilise resolve dans tous les cas
                 const img = new Image();
                 img.crossOrigin = "Anonymous";
                 img.src = path;
                 img.onload = () => {
                     this.assets[key] = img;
                     resolve({ status: 'fulfilled', value: key });
                 };
                 img.onerror = () => {
                     console.warn(`Impossible de charger l'asset: ${path}`); // Affiche une alerte mais ne bloque pas
                     resolve({ status: 'rejected', reason: key });
                 };
             }));
         }
         await Promise.all(promises); // Attend que toutes les tentatives de chargement soient terminées
     }
 
     // Configure les écouteurs d'événements pour le clavier et la souris
     setupInput() {
         document.addEventListener('keydown', e => {
             if (this.gameLogic.isPaused && this.gameLogic.isPaused() && e.code !== 'KeyC' && e.code !== 'KeyO' && e.code !== 'Escape') return;
 
             if (e.code === 'ArrowLeft') this.keys.left = true;
             if (e.code === 'ArrowRight') this.keys.right = true;
             if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = true;
+            if (e.code === 'ArrowDown') {
+                if (this.keys.down && Date.now() - this.keys._lastDown < 250) {
+                    this.keys.doubleDown = true;
+                }
+                this.keys.down = true;
+                this.keys._lastDown = Date.now();
+            }
+            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.run = true;
             if (e.code === 'KeyA') this.keys.action = true;
             if (e.code === 'KeyV') this.keys.fly = true;
             if (e.code === 'KeyP' && this.gameLogic.toggleSkills) this.gameLogic.toggleSkills();
             if (e.code === 'KeyI' && this.gameLogic.toggleInventory) this.gameLogic.toggleInventory();
             if (e.code === 'KeyC' && this.gameLogic.toggleMenu) this.gameLogic.toggleMenu('controls');
             if (e.code === 'KeyO' && this.gameLogic.toggleMenu) this.gameLogic.toggleMenu('options');
             if (e.code === 'Escape' && this.gameLogic.toggleMenu) this.gameLogic.toggleMenu('options');
 
             if (e.code.startsWith('Digit')) {
                 const index = parseInt(e.code.replace('Digit', '')) - 1;
                 if (this.gameLogic.selectTool) this.gameLogic.selectTool(index);
             }
         });
         document.addEventListener('keyup', e => {
             if (e.code === 'ArrowLeft') this.keys.left = false;
             if (e.code === 'ArrowRight') this.keys.right = false;
             if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = false;
+            if (e.code === 'ArrowDown') this.keys.down = false;
+            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.run = false;
             if (e.code === 'KeyA') this.keys.action = false;
             if (e.code === 'KeyV') this.keys.fly = false;
         });
         
         this.canvas.addEventListener('mousemove', e => {
             const rect = this.canvas.getBoundingClientRect();
             this.mouse.x = e.clientX - rect.left;
             this.mouse.y = e.clientY - rect.top;
         });
         this.canvas.addEventListener('mousedown', e => {
             if (this.gameLogic.isPaused && this.gameLogic.isPaused()) return;
             if (e.button === 0) this.mouse.left = true;
             if (e.button === 2) this.mouse.right = true;
         });
         this.canvas.addEventListener('wheel', e => {
             if (this.gameLogic.isPaused && this.gameLogic.isPaused()) return;
             if (this.gameLogic.cycleTool) {
                 if (e.deltaY < 0) this.gameLogic.cycleTool(-1);
                 else if (e.deltaY > 0) this.gameLogic.cycleTool(1);
             }
             e.preventDefault();
         });
         this.canvas.addEventListener('contextmenu', e => e.preventDefault());
     }
 
