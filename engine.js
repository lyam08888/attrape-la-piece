// Moteur de jeu générique
export class GameEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        // Désactiver le lissage pour un pixel art net
        this.ctx.imageSmoothingEnabled = false;
        this.config = config;
        this.assets = {};
        this.keys = {
            left: false,
            right: false,
            jump: false,
            action: false,
            fly: false,
            down: false,
            doubleDown: false,
            run: false,
            _lastDown: 0
        };
        this.mouse = { x: 0, y: 0, left: false, right: false };
        this.gameLogic = {}; // Fonctions spécifiques au jeu (init, update, draw)
    }

    // Charge les assets définis dans la configuration
    async loadAssets() {
        const promises = [];
        const allAssetPaths = {};
        const baseUrl = this.config.githubRepoUrl || '';

        for (const [key, path] of Object.entries(this.config.assets)) {
            if (path.startsWith('http')) {
                allAssetPaths[key] = path;
            } else {
                allAssetPaths[key] = baseUrl ? baseUrl + path : path;
            }
        }
        if (this.config.playerAnimations) {
            for (const frames of Object.values(this.config.playerAnimations)) {
                frames.forEach(key => {
                    const path = this.config.assets[key];
                    if (path) {
                        allAssetPaths[key] = baseUrl ? baseUrl + path : path;
                    }
                });
            }
        }
        this.config.skins.forEach((fileName, i) => {
            const skinPath = 'assets/' + fileName;
            allAssetPaths[`player${i+1}`] = baseUrl ? baseUrl + skinPath : skinPath;
        });


        for (const [key, path] of Object.entries(allAssetPaths)) {
            promises.push(new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = path;
                img.onload = () => {
                    this.assets[key] = img;
                    resolve({ status: 'fulfilled', value: key });
                };
                img.onerror = () => {
                    console.warn(`Impossible de charger l'asset: ${path}`);
                    const placeholder = new Image();
                    this.assets[key] = placeholder;
                    resolve({ status: 'rejected', reason: key });
                };
            }));
        }
        await Promise.all(promises);
    }

    // Configure les écouteurs d'événements pour le clavier et la souris
    setupInput() {
        document.addEventListener('keydown', e => {
            // Ne pas traiter les entrées si le jeu est en pause (sauf pour les touches de menu)
            if (this.gameLogic.isPaused && this.gameLogic.isPaused() && !['KeyO', 'Escape', 'KeyI', 'KeyP', 'KeyC', 'KeyJ'].includes(e.code)) return;

            // Commandes de mouvement et d'action
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'KeyE') this.keys.action = true; 

            if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = true;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                if (this.keys.down && Date.now() - this.keys._lastDown < 250) {
                    this.keys.doubleDown = true;
                }
                this.keys.down = true;
                this.keys._lastDown = Date.now();
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.run = true;
            if (e.code === 'KeyV') this.keys.fly = !this.keys.fly;

            // Touches de menu
            if (e.code === 'KeyP' && this.gameLogic.toggleSkills) this.gameLogic.toggleSkills();
            if (e.code === 'KeyI' && this.gameLogic.toggleInventory) this.gameLogic.toggleInventory();
            if (e.code === 'KeyJ' && this.gameLogic.toggleQuestLog) this.gameLogic.toggleQuestLog();
            if (e.code === 'KeyC' && this.gameLogic.toggleCalendar) this.gameLogic.toggleCalendar();
            if ((e.code === 'KeyO' || e.code === 'Escape') && this.gameLogic.toggleMenu) this.gameLogic.toggleMenu('options');
            if (e.code === 'F3' && this.gameLogic.toggleDebug) this.gameLogic.toggleDebug();

            // Sélection d'outil avec les chiffres
            if (e.code.startsWith('Digit')) {
                const index = parseInt(e.code.replace('Digit', '')) - 1;
                if (this.gameLogic.selectTool) this.gameLogic.selectTool(index);
            }
        });

        document.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'KeyE') this.keys.action = false;
            if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.run = false;
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
        this.canvas.addEventListener('mouseup', e => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.left = false;
            this.mouse.right = false;
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


    start(gameLogic) {
        this.gameLogic = gameLogic;
        this.loadAssets()
            .then(() => {
                this.setupInput();
                if (this.gameLogic.init) {
                    try {
                        this.gameLogic.init(this.assets);
                    } catch (error) {
                        console.error("Erreur lors de l'initialisation du jeu:", error);
                        if (this.gameLogic.showError) {
                            this.gameLogic.showError(error);
                        }
                        return;
                    }
                }
                const loop = (time) => {
                    if (!this.gameLogic.isPaused()) {
                        this.gameLogic.update && this.gameLogic.update(this.keys, this.mouse);
                    }
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.gameLogic.draw && this.gameLogic.draw(this.ctx, this.assets);
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            })
            .catch(err => {
                if (this.gameLogic.showError) this.gameLogic.showError(err);
            });
    }
}
