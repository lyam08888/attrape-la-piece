// engine.js - Moteur de jeu générique (Corrigé)
import { TILE } from './world.js';

export class GameEngine {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Provide default key bindings when none are supplied. This prevents
        // the player from being unable to move if the configuration misses
        // the `keyBindings` section or only defines a subset of controls.
        const defaultBindings = {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'Space',
            down: 'ArrowDown',
            up: 'ArrowUp',
            action: 'KeyE',
            run: 'ShiftLeft',
            fly: 'KeyV',
            repair: 'KeyR',
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
    }

    async loadAssets() {
        console.log("Chargement des assets...");
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
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Impossible de charger l'asset: ${path}. Une image placeholder sera utilisée.`);
                    const placeholder = document.createElement('canvas');
                    placeholder.width = this.config.tileSize || 16;
                    placeholder.height = this.config.tileSize || 16;
                    const pCtx = placeholder.getContext('2d');
                    pCtx.fillStyle = 'magenta';
                    pCtx.fillRect(0, 0, placeholder.width, placeholder.height);
                    this.assets[key] = placeholder;
                    resolve();
                };
            }));
        }
        await Promise.allSettled(promises);
        console.log("Tous les assets ont été traités.", Object.keys(this.assets).length, "assets chargés.");
    }

    setupInput() {
        document.addEventListener('keydown', e => {
            if (this.gameLogic.isPaused && this.gameLogic.isPaused() && !['KeyO', 'Escape', 'F3'].includes(e.code)) return;
            const binds = this.config.keyBindings || {};
            if (e.code === binds.left) this.keys.left = true;
            if (e.code === binds.right) this.keys.right = true;
            if (e.code === binds.action) this.keys.action = true;
            if (e.code === binds.up) this.keys.up = true;
            if (e.code === binds.jump) {
                this.keys.jump = true;
                this.keys.up = true;
            }
            if (e.code === binds.down) this.keys.down = true;
            if (e.code === binds.run) this.keys.run = true;
            if (e.code === binds.repair) this.keys.repair = true;
            if (e.code === binds.fly && !e.repeat) this.keys.fly = !this.keys.fly;
            if (e.code.startsWith('Digit')) {
                const digit = parseInt(e.code.slice(5));
                if (digit >= 1 && digit <= 6 && this.gameLogic.selectTool) {
                    this.gameLogic.selectTool(digit - 1);
                }
            }
            if (e.code === 'KeyO' || e.code === 'Escape') {
                e.preventDefault();
                if (this.gameLogic.toggleMenu) this.gameLogic.toggleMenu('options');
            }
        });
        document.addEventListener('keyup', e => {
            const binds = this.config.keyBindings || {};
            if (e.code === binds.left) this.keys.left = false;
            if (e.code === binds.right) this.keys.right = false;
            if (e.code === binds.action) this.keys.action = false;
            if (e.code === binds.up) this.keys.up = false;
            if (e.code === binds.jump) {
                this.keys.jump = false;
                this.keys.up = false;
            }
            if (e.code === binds.down) this.keys.down = false;
            if (e.code === binds.run) this.keys.run = false;
            if (e.code === binds.repair) this.keys.repair = false;
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

                let lastTime = 0;
                const loop = (time) => {
                    if (!lastTime) lastTime = time;
                    const delta = (time - lastTime) / 1000;
                    lastTime = time;

                    if (!this.gameLogic.isPaused()) {
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
