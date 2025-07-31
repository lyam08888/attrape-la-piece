// Moteur de jeu générique
export class GameEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.assets = {};
        this.keys = { left: false, right: false, jump: false, action: false };
        this.mouse = { x: 0, y: 0, left: false, right: false };
        this.gameLogic = {}; // Fonctions spécifiques au jeu (init, update, draw)
    }

    // Charge les assets définis dans la configuration
    async loadAssets() {
        const promises = [];
        const allAssetPaths = {};
        const baseUrl = this.config.githubRepoUrl || '';

        for (const [key, path] of Object.entries(this.config.assets)) {
            allAssetPaths[key] = path.startsWith('http') ? path : baseUrl + path;
        }
        this.config.skins.forEach((fileName, i) => {
            allAssetPaths[`player${i+1}`] = baseUrl + 'assets/' + fileName;
        });

        for (const [key, path] of Object.entries(allAssetPaths)) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = path;
                img.onload = () => { this.assets[key] = img; resolve(); };
                img.onerror = () => reject(`Impossible de charger l'asset: ${path}`);
            }));
        }
        await Promise.all(promises);
    }

    // Configure les écouteurs d'événements pour le clavier et la souris
    setupInput() {
        document.addEventListener('keydown', e => {
            if (this.gameLogic.isPaused && this.gameLogic.isPaused() && e.code !== 'KeyC') return;

            if (e.code === 'ArrowLeft') this.keys.left = true;
            if (e.code === 'ArrowRight') this.keys.right = true;
            if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = true;
            if (e.code === 'KeyA') this.keys.action = true;
            if (e.code === 'KeyC' && this.gameLogic.toggleMenu) this.gameLogic.toggleMenu();

            if (e.code.startsWith('Digit')) {
                const index = parseInt(e.code.replace('Digit', '')) - 1;
                if (this.gameLogic.selectTool) this.gameLogic.selectTool(index);
            }
        });
        document.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft') this.keys.left = false;
            if (e.code === 'ArrowRight') this.keys.right = false;
            if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = false;
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
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    // La boucle de jeu principale
    gameLoop() {
        if (!this.gameLogic.isPaused || !this.gameLogic.isPaused()) {
            if (this.gameLogic.update) {
                this.gameLogic.update(this.keys, this.mouse);
            }
        }
        if (this.gameLogic.draw) {
            this.gameLogic.draw(this.ctx, this.assets);
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    // Point d'entrée pour démarrer le moteur
    async start(gameLogic) {
        this.gameLogic = gameLogic;
        try {
            await this.loadAssets();
            this.setupInput();
            if (this.gameLogic.init) {
                this.gameLogic.init(this.assets);
            }
            this.gameLoop();
        } catch (error) {
            console.error("Erreur du moteur de jeu:", error);
            if (this.gameLogic.showError) {
                this.gameLogic.showError(error);
            }
        }
    }
}
