// engine.js - Moteur de jeu générique (Corrigé)
// Utilisation du système avancé : définition TILE compatible
const TILE = {
  AIR: 0,
  STONE: 1,
  GRASS: 2,
  DIRT: 3,
  // Ajoute d'autres blocs si besoin
};

export class GameEngine {
    constructor(canvas, config = {}, logger) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.logger = logger;
        this.ctx.imageSmoothingEnabled = false;

        // Provide default key bindings when none are supplied. This prevents
        // the player from being unable to move if the configuration misses
        // the `keyBindings` section or only defines a subset of controls.
        const defaultBindings = {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: ' ',
            down: 'ArrowDown',
            up: 'ArrowUp',
            action: 'e',
            attack: 'f',
            run: 'Shift',
            fly: 'v',
            repair: 'r',
            inventory: 'i',
            character: 'p',
            quests: 'q',
            pause: 'Escape',
            options: 'o',
            tool1: '1',
            tool2: '2',
            tool3: '3',
            tool4: '4',
            tool5: '5',
            tool6: '6',
        };

        // Merge provided bindings with defaults in a new config object to
        // avoid leaving the player without movement controls.
        this.config = {
            ...config,
            keyBindings: { ...defaultBindings, ...(config.keyBindings || {}) },
        };

        this.assets = {};
        this.keys = {
            left: false, right: false, jump: false, action: false,
            fly: false, down: false, run: false, repair: false,
            up: false,
        };
        this.mouse = { x: 0, y: 0, left: false, right: false };
        this.gameLogic = {};
        
        // Interface RPG
        this.rpgInterface = null;
    }

    async loadAssets() {
        this.logger.log("Démarrage du chargement des assets...", 'debug');
        const promises = [];

        // Assurer la présence d'une structure d'assets même si la config
        // chargée n'en fournit pas. Cela évite un crash lorsque config.json
        // n'est pas disponible et que le jeu tente tout de même de charger
        // les ressources par défaut.
        const configAssets = this.config.assets || {};

        const allAssetKeys = new Set(Object.keys(configAssets));

        if (Array.isArray(this.config.skins)) {
            for (const skinPath of this.config.skins) {
                const key = skinPath.replace(/^.*[\\\/]/, '').replace(/\.png$/i, '');
                allAssetKeys.add(key);
                if (!configAssets[key]) {
                    configAssets[key] = `assets/${skinPath}`;
                }
            }
        }

        // Ajouter automatiquement les assets des tuiles connues. Ainsi, le
        // moteur peut fonctionner avec une configuration minimale et générer
        // le monde sans écran noir.
        Object.keys(TILE).forEach(key => {
            if (key !== 'AIR') {
                allAssetKeys.add(`tile_${key.toLowerCase()}`);
            }
        });

        // Ajouter automatiquement les assets des outils
        const toolKeys = ['tool_pickaxe', 'tool_shovel', 'tool_axe', 'tool_sword', 'tool_knife', 'tool_bow', 'tool_fishing_rod'];
        toolKeys.forEach(key => {
            allAssetKeys.add(key);
        });

        if (this.config.playerAnimations) {
            for (const animFrames of Object.values(this.config.playerAnimations)) {
                for (const frameKey of animFrames) {
                    allAssetKeys.add(frameKey);
                }
            }
        }

        let loadedCount = 0;
        const totalAssets = Array.from(allAssetKeys).length;

        for (const key of allAssetKeys) {
            let path = configAssets[key];

            // If the asset is referenced (e.g. in an animation) but not
            // explicitly listed in the config, fall back to the conventional
            // "assets/<key>.png" path so that all player frames and tools can
            // still be loaded.
            if (!path) {
                path = `assets/${key}.png`;
            }

            promises.push(new Promise((resolve) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    this.assets[key] = img;
                    loadedCount++;
                    this.logger.log(`Asset chargé: ${key}`, 'asset');
                    resolve();
                };
                img.onerror = () => {
                    this.logger.warn(`Échec du chargement de l'asset: ${path}`);
                    resolve();
                };
            }));
        }
        await Promise.allSettled(promises);
        this.logger.success(`${loadedCount}/${totalAssets} assets chargés avec succès.`);
    }

    setupInput() {
        // Normalise les noms de touches pour gérer les variations selon les navigateurs.
        // Certains retournent "Space" ou "Spacebar" pour la barre d'espace, ce qui empêchait
        // les commandes de saut ou de vol d'être détectées correctement.
        const normalizeKey = k => {
            if (k === ' ' || k === 'Spacebar' || k === 'Space') return ' ';
            return k.length === 1 ? k.toLowerCase() : k;
        };
        document.addEventListener('keydown', e => {
            const binds = this.config.keyBindings || {};
            const key = normalizeKey(e.key);
            if (this.gameLogic.isPaused && this.gameLogic.isPaused() && ![binds.pause, 'F3'].includes(key)) return;
            if (key === binds.left) this.keys.left = true;
            if (key === binds.right) this.keys.right = true;
            if (key === binds.action) this.keys.action = true;
            if (key === binds.up) this.keys.up = true;
            if (key === binds.jump) {
                this.keys.jump = true;
                this.keys.up = true;
            }
            if (key === binds.down) this.keys.down = true;
            if (key === binds.run) this.keys.run = true;
            if (key === binds.repair) this.keys.repair = true;
            if (key === binds.fly && !e.repeat) this.keys.fly = !this.keys.fly;
            if (key === binds.attack) this.keys.attack = true;
            for (let i = 1; i <= 6; i++) {
                if (key === binds[`tool${i}`] && this.gameLogic.selectTool) {
                    this.gameLogic.selectTool(i - 1);
                }
            }
            // L'ouverture des menus est gérée côté interface.
        });
        document.addEventListener('keyup', e => {
            const binds = this.config.keyBindings || {};
            const key = normalizeKey(e.key);
            if (key === binds.left) this.keys.left = false;
            if (key === binds.right) this.keys.right = false;
            if (key === binds.action) this.keys.action = false;
            if (key === binds.up) this.keys.up = false;
            if (key === binds.jump) {
                this.keys.jump = false;
                this.keys.up = false;
            }
            if (key === binds.down) this.keys.down = false;
            if (key === binds.run) this.keys.run = false;
            if (key === binds.repair) this.keys.repair = false;
            if (key === binds.attack) this.keys.attack = false;
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
            if (this.gameLogic.cycleTool) this.gameLogic.cycleTool(e.deltaY < 0 ? -1 : 1);
        });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    start(gameLogic) {
        this.gameLogic = gameLogic;
        return this.loadAssets()
            .then(() => {
                this.setupInput();
                if (this.gameLogic.init) this.gameLogic.init(this.assets);
                
                // Intégrer l'interface RPG si disponible
                if (window.game && window.game.rpgInterface) {
                    this.rpgInterface = window.game.rpgInterface;
                    console.log("✅ Interface RPG intégrée dans le moteur");
                }

                let lastTime = 0;
                const loop = (time) => {
                    if (!lastTime) lastTime = time;
                    const delta = (time - lastTime) / 1000;
                    lastTime = time;

                    // FIXED: Check if isPaused method exists before calling
                    if (!this.gameLogic.isPaused || !this.gameLogic.isPaused()) {
                        // CORRECTION : Passe maintenant delta, keys, et mouse à la logique de jeu.
                        this.gameLogic.update(delta, this.keys, this.mouse);
                    }
                    // Passe également delta au rendu afin que la logique de dessin
                    this.gameLogic.draw(this.ctx, this.assets, delta);
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            })
            .catch(err => console.error("Erreur critique lors du démarrage du moteur:", err));
    }
}