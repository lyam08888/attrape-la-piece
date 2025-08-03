// saveSystem.js - Système de sauvegarde et chargement

export class SaveSystem {
    constructor() {
        this.saveSlots = 3;
        this.currentSlot = 0;
        this.autoSaveInterval = 30000; // 30 secondes
        this.lastAutoSave = 0;
    }

    saveGame(game, slot = this.currentSlot) {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                player: this.serializePlayer(game.player),
                world: this.serializeWorld(game),
                inventory: game.inventory.serialize(),
                quests: game.questSystem ? game.questSystem.serialize() : null,
                stats: game.player.stats ? game.player.stats.serialize() : null,
                timeSystem: game.timeSystem ? game.timeSystem.serialize() : null,
                settings: game.config
            };

            const saveKey = `attrape_la_piece_save_${slot}`;
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            
            game.logger.log(`Jeu sauvegardé dans l'emplacement ${slot + 1}`);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            game.logger.log('Erreur lors de la sauvegarde');
            return false;
        }
    }

    loadGame(game, slot = this.currentSlot) {
        try {
            const saveKey = `attrape_la_piece_save_${slot}`;
            const saveData = localStorage.getItem(saveKey);
            
            if (!saveData) {
                game.logger.log(`Aucune sauvegarde trouvée dans l'emplacement ${slot + 1}`);
                return false;
            }

            const data = JSON.parse(saveData);
            
            // Vérifier la version
            if (data.version !== '1.0.0') {
                game.logger.log('Version de sauvegarde incompatible');
                return false;
            }

            // Charger les données
            this.deserializePlayer(game.player, data.player);
            this.deserializeWorld(game, data.world);
            
            if (data.inventory) {
                game.inventory.deserialize(data.inventory);
            }
            
            if (data.quests) {
                game.questSystem.deserialize(data.quests);
            }
            
            if (data.stats && game.player.stats) {
                game.player.stats.deserialize(data.stats);
            }
            
            if (data.timeSystem && game.timeSystem) {
                game.timeSystem.deserialize(data.timeSystem);
            }

            game.logger.log(`Jeu chargé depuis l'emplacement ${slot + 1}`);
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            game.logger.log('Erreur lors du chargement');
            return false;
        }
    }

    serializePlayer(player) {
        return {
            x: player.x,
            y: player.y,
            vx: player.vx,
            vy: player.vy,
            dir: player.dir,
            tools: player.tools,
            selectedToolIndex: player.selectedToolIndex,
            inventory: player.inventory
        };
    }

    deserializePlayer(player, data) {
        player.x = data.x || player.x;
        player.y = data.y || player.y;
        player.vx = data.vx || 0;
        player.vy = data.vy || 0;
        player.dir = data.dir || 1;
        player.tools = data.tools || player.tools;
        player.selectedToolIndex = data.selectedToolIndex || 0;
        player.inventory = data.inventory || {};
    }

    serializeWorld(game) {
        // Sauvegarder seulement les chunks modifiés
        const modifiedChunks = {};
        const chunkSize = game.config.chunkSize || 16;
        
        for (let y = 0; y < game.tileMap.length; y++) {
            for (let x = 0; x < game.tileMap[y].length; x++) {
                const chunkX = Math.floor(x / chunkSize);
                const chunkY = Math.floor(y / chunkSize);
                const chunkKey = `${chunkX},${chunkY}`;
                
                if (!modifiedChunks[chunkKey]) {
                    modifiedChunks[chunkKey] = {
                        x: chunkX,
                        y: chunkY,
                        tiles: []
                    };
                }
                
                const localX = x % chunkSize;
                const localY = y % chunkSize;
                modifiedChunks[chunkKey].tiles.push({
                    x: localX,
                    y: localY,
                    type: game.tileMap[y][x]
                });
            }
        }

        return {
            seed: game.worldSeed || 0,
            generatedRange: game.generatedRange,
            modifiedChunks: modifiedChunks,
            collectibles: game.collectibles.map(c => ({
                x: c.x,
                y: c.y,
                tileType: c.tileType
            }))
        };
    }

    deserializeWorld(game, data) {
        if (data.seed) game.worldSeed = data.seed;
        if (data.generatedRange) game.generatedRange = data.generatedRange;
        
        // Recharger les chunks modifiés
        if (data.modifiedChunks) {
            const chunkSize = game.config.chunkSize || 16;
            
            Object.values(data.modifiedChunks).forEach(chunk => {
                chunk.tiles.forEach(tile => {
                    const worldX = chunk.x * chunkSize + tile.x;
                    const worldY = chunk.y * chunkSize + tile.y;
                    
                    if (game.tileMap[worldY] && game.tileMap[worldY][worldX] !== undefined) {
                        game.tileMap[worldY][worldX] = tile.type;
                    }
                });
            });
        }
        
        // Recharger les collectibles
        if (data.collectibles) {
            game.collectibles = data.collectibles.map(c => ({
                x: c.x,
                y: c.y,
                w: game.config.tileSize,
                h: game.config.tileSize,
                vy: 0,
                tileType: c.tileType
            }));
        }
    }

    autoSave(game) {
        const now = Date.now();
        if (now - this.lastAutoSave >= this.autoSaveInterval) {
            this.saveGame(game, this.currentSlot);
            this.lastAutoSave = now;
        }
    }

    getSaveInfo(slot) {
        try {
            const saveKey = `attrape_la_piece_save_${slot}`;
            const saveData = localStorage.getItem(saveKey);
            
            if (!saveData) return null;
            
            const data = JSON.parse(saveData);
            return {
                slot: slot,
                timestamp: data.timestamp,
                playerLevel: data.stats ? data.stats.level : 1,
                playTime: data.stats ? data.stats.playTime : 0,
                version: data.version
            };
        } catch (error) {
            return null;
        }
    }

    getAllSaves() {
        const saves = [];
        for (let i = 0; i < this.saveSlots; i++) {
            saves.push(this.getSaveInfo(i));
        }
        return saves;
    }

    deleteSave(slot) {
        try {
            const saveKey = `attrape_la_piece_save_${slot}`;
            localStorage.removeItem(saveKey);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            return false;
        }
    }

    exportSave(slot) {
        try {
            const saveKey = `attrape_la_piece_save_${slot}`;
            const saveData = localStorage.getItem(saveKey);
            
            if (!saveData) return null;
            
            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `attrape_la_piece_save_${slot}_${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            return false;
        }
    }

    importSave(file, slot) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    
                    // Vérifier la validité
                    if (!saveData.version || !saveData.player) {
                        reject(new Error('Fichier de sauvegarde invalide'));
                        return;
                    }
                    
                    const saveKey = `attrape_la_piece_save_${slot}`;
                    localStorage.setItem(saveKey, JSON.stringify(saveData));
                    
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }
}

// Interface utilisateur pour les sauvegardes
export function createSaveUI(saveSystem, game) {
    const saveMenu = document.getElementById('saveMenu');
    if (!saveMenu) return;

    const saves = saveSystem.getAllSaves();
    saveMenu.innerHTML = '';

    // Titre
    const title = document.createElement('h2');
    title.textContent = 'Sauvegardes';
    saveMenu.appendChild(title);

    // Liste des sauvegardes
    saves.forEach((save, index) => {
        const saveSlot = document.createElement('div');
        saveSlot.className = 'save-slot';
        
        if (save) {
            const date = new Date(save.timestamp).toLocaleString();
            const playTimeHours = Math.floor(save.playTime / 3600000);
            const playTimeMinutes = Math.floor((save.playTime % 3600000) / 60000);
            
            saveSlot.innerHTML = `
                <div class="save-info">
                    <h3>Emplacement ${index + 1}</h3>
                    <p>Niveau: ${save.playerLevel}</p>
                    <p>Temps de jeu: ${playTimeHours}h ${playTimeMinutes}m</p>
                    <p>Sauvegardé: ${date}</p>
                </div>
                <div class="save-actions">
                    <button onclick="loadSave(${index})">Charger</button>
                    <button onclick="saveTo(${index})">Sauvegarder</button>
                    <button onclick="deleteSave(${index})">Supprimer</button>
                    <button onclick="exportSave(${index})">Exporter</button>
                </div>
            `;
        } else {
            saveSlot.innerHTML = `
                <div class="save-info">
                    <h3>Emplacement ${index + 1}</h3>
                    <p>Vide</p>
                </div>
                <div class="save-actions">
                    <button onclick="saveTo(${index})">Sauvegarder</button>
                    <label for="import-${index}" class="import-button">Importer</label>
                    <input type="file" id="import-${index}" accept=".json" onchange="importSave(event, ${index})" style="display: none;">
                </div>
            `;
        }
        
        saveMenu.appendChild(saveSlot);
    });

    // Fonctions globales pour les boutons
    window.loadSave = (slot) => {
        if (saveSystem.loadGame(game, slot)) {
            saveSystem.currentSlot = slot;
            document.getElementById('saveMenu').classList.remove('active');
        }
    };

    window.saveTo = (slot) => {
        if (saveSystem.saveGame(game, slot)) {
            saveSystem.currentSlot = slot;
            createSaveUI(saveSystem, game); // Rafraîchir l'interface
        }
    };

    window.deleteSave = (slot) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) {
            saveSystem.deleteSave(slot);
            createSaveUI(saveSystem, game); // Rafraîchir l'interface
        }
    };

    window.exportSave = (slot) => {
        saveSystem.exportSave(slot);
    };

    window.importSave = async (event, slot) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await saveSystem.importSave(file, slot);
            game.logger.log('Sauvegarde importée avec succès');
            createSaveUI(saveSystem, game); // Rafraîchir l'interface
        } catch (error) {
            game.logger.log('Erreur lors de l\'import: ' + error.message);
        }
    };
}