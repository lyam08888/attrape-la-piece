// engine.js - Moteur de jeu générique
export class GameEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Pour un pixel art net
        this.config = config;
        this.assets = {};
        this.keys = {
            left: false, right: false, jump: false, action: false,
            fly: false, down: false, doubleDown: false, run: false,
            _lastDown: 0
        };
        this.mouse = { x: 0, y: 0, left: false, right: false };
        this.gameLogic = {};
    }

    async loadAssets() {
        const promises = [];
        const allAssetPaths = { ...this.config.assets };

        // Ajouter les assets des animations du joueur
        if (this.config.playerAnimations) {
            for (const anim of Object.values(this.config.playerAnimations)) {
                for (const frameKey of anim) {
                    if (this.config.assets[frameKey] && !allAssetPaths[frameKey]) {
                        allAssetPaths[frameKey] = this.config.assets[frameKey];
                    }
                }
            }
        }

        for (const [key, path] of Object.entries(allAssetPaths)) {
            promises.push(new Promise((resolve) => {
                const img = new Image();
                img.src = path; // Les chemins sont relatifs à index.html
                img.onload = () => {
                    this.assets[key] = img;
                    resolve({ status: 'fulfilled', value: key });
                };
                img.onerror = () => {
                    console.warn(`Impossible de charger l'asset: ${path}. Une image placeholder sera utilisée.`);
                    // Créer une image placeholder
                    const placeholder = document.createElement('canvas');
                    placeholder.width = this.config.tileSize || 16;
                    placeholder.height = this.config.tileSize || 16;
                    const pCtx = placeholder.getContext('2d');
                    pCtx.fillStyle = 'magenta';
                    pCtx.fillRect(0, 0, placeholder.width, placeholder.height);
                    this.assets[key] = placeholder;
                    resolve({ status: 'rejected', reason: key });
                };
            }));
        }
        await Promise.all(promises);
        console.log("Tous les assets ont été traités.", this.assets);
    }

    setupInput() {
        document.addEventListener('keydown', e => {
            if (this.gameLogic.isPaused && this.gameLogic.isPaused()) return;

            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'KeyE') this.keys.action = true;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.jump = true;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.run = true;
            
            if (e.code.startsWith('Digit')) {
                const index = parseInt(e.code.replace('Digit', '')) - 1;
                if (this.gameLogic.selectTool) this.gameLogic.selectTool(index);
            }
        });

        document.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'KeyE') this.keys.action = false;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.jump = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.run = false;
        });
        
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener('mousedown', e => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 2) this.mouse.right = true;
        });
        this.canvas.addEventListener('mouseup', e => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        });
        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            if (this.gameLogic.cycleTool) {
                this.gameLogic.cycleTool(e.deltaY < 0 ? -1 : 1);
            }
        });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    start(gameLogic) {
        this.gameLogic = gameLogic;
        this.loadAssets()
            .then(() => {
                this.setupInput();
                if (this.gameLogic.init) {
                    this.gameLogic.init(this.assets);
                }
                const loop = (time) => {
                    if (!this.gameLogic.isPaused()) {
                        this.gameLogic.update(this.keys, this.mouse);
                    }
                    // Le nettoyage du canvas est maintenant géré dans la logique de dessin du jeu
                    this.gameLogic.draw(this.ctx, this.assets);
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            })
            .catch(err => console.error("Erreur critique lors du démarrage du moteur:", err));
    }
}
