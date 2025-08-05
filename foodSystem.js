import { SeededRandom } from './seededRandom.js';
// Utilisation du système avancé : définition TILE compatible
const TILE = {
  AIR: 0,
  STONE: 1,
  GRASS: 2,
  DIRT: 3,
  // Ajoute d'autres blocs si besoin
};

// === SYSTÈME DE NOURRITURE VIVANT ===

export class FoodSystem {
    constructor() {
        this.foodItems = [];
        this.treeFruits = new Map(); // Fruits qui poussent sur les arbres
        this.growthTimer = 0;
    }
    
    // Définition des aliments et leurs propriétés
    getFoodData() {
        return {
            // Fruits des arbres
            'food_apple': { 
                hunger: 20, health: 5, growsOn: 'tree', biomes: ['plains', 'mountains'], 
                rarity: 0.3, color: '#ff0000' 
            },
            'food_pear': { 
                hunger: 18, health: 4, growsOn: 'tree', biomes: ['plains'], 
                rarity: 0.25, color: '#90EE90' 
            },
            'food_cherry': { 
                hunger: 15, health: 3, growsOn: 'tree', biomes: ['plains', 'jungle'], 
                rarity: 0.4, color: '#DC143C' 
            },
            'food_peach': { 
                hunger: 22, health: 6, growsOn: 'tree', biomes: ['plains', 'savanna'], 
                rarity: 0.2, color: '#FFCBA4' 
            },
            'food_orange': { 
                hunger: 25, health: 8, growsOn: 'tree', biomes: ['jungle', 'savanna'], 
                rarity: 0.15, color: '#FFA500' 
            },
            'food_banana': { 
                hunger: 30, health: 5, growsOn: 'tree', biomes: ['jungle'], 
                rarity: 0.35, color: '#FFFF00' 
            },
            'food_coconut': { 
                hunger: 35, health: 10, growsOn: 'tree', biomes: ['jungle', 'ocean'], 
                rarity: 0.1, color: '#8B4513' 
            },
            
            // Légumes du sol
            'food_carrot': { 
                hunger: 12, health: 2, growsOn: 'ground', biomes: ['plains', 'tundra'], 
                rarity: 0.4, color: '#FFA500' 
            },
            'food_potato': { 
                hunger: 18, health: 3, growsOn: 'ground', biomes: ['plains', 'mountains'], 
                rarity: 0.35, color: '#DEB887' 
            },
            'food_onion': { 
                hunger: 8, health: 1, growsOn: 'ground', biomes: ['plains', 'savanna'], 
                rarity: 0.3, color: '#F5DEB3' 
            },
            'food_tomato': { 
                hunger: 15, health: 4, growsOn: 'ground', biomes: ['plains', 'jungle'], 
                rarity: 0.25, color: '#FF6347' 
            },
            'food_corn': { 
                hunger: 25, health: 5, growsOn: 'ground', biomes: ['plains', 'savanna'], 
                rarity: 0.2, color: '#FFD700' 
            },
            'food_pumpkin': { 
                hunger: 40, health: 8, growsOn: 'ground', biomes: ['plains'], 
                rarity: 0.05, color: '#FF7518' 
            },
            
            // Champignons
            'food_mushroom': { 
                hunger: 10, health: -2, growsOn: 'mushroom', biomes: ['swamp', 'jungle'], 
                rarity: 0.6, color: '#8B4513' 
            },
            
            // Aliments de mer
            'food_fish': { 
                hunger: 30, health: 8, growsOn: 'water', biomes: ['ocean'], 
                rarity: 0.3, color: '#4169E1' 
            },
            'food_salmon': { 
                hunger: 35, health: 12, growsOn: 'water', biomes: ['ocean'], 
                rarity: 0.15, color: '#FA8072' 
            },
            'food_crab': { 
                hunger: 25, health: 6, growsOn: 'water', biomes: ['ocean'], 
                rarity: 0.2, color: '#FF6347' 
            },
            
            // Aliments rares dans les coffres
            'food_cake_slice': { 
                hunger: 50, health: 15, growsOn: 'chest', biomes: ['all'], 
                rarity: 0.05, color: '#FFB6C1' 
            },
            'food_pizza': { 
                hunger: 60, health: 20, growsOn: 'chest', biomes: ['all'], 
                rarity: 0.03, color: '#FF6347' 
            },
            'food_burger': { 
                hunger: 55, health: 18, growsOn: 'chest', biomes: ['all'], 
                rarity: 0.04, color: '#8B4513' 
            }
        };
    }
    
    update(game, delta) {
        this.growthTimer++;
        
        // Croissance des fruits sur les arbres (toutes les 10 secondes)
        if (this.growthTimer > 600) {
            this.growFruitsOnTrees(game);
            this.growthTimer = 0;
        }
        
        // Mettre à jour les aliments existants
        for (let i = this.foodItems.length - 1; i >= 0; i--) {
            const food = this.foodItems[i];
            food.life--;
            
            // Animation de flottement
            food.bobTimer = (food.bobTimer || 0) + 1;
            food.y += Math.sin(food.bobTimer * 0.1) * 0.2;
            
            // Supprimer les aliments expirés
            if (food.life <= 0) {
                this.foodItems.splice(i, 1);
            }
        }
    }
    
    growFruitsOnTrees(game) {
        if (!game.tileMap) return;
        
        const { tileSize } = game.config;
        const foodData = this.getFoodData();
        
        // Parcourir le monde pour trouver les arbres
        for (let x = 0; x < game.tileMap[0]?.length; x++) {
            for (let y = 0; y < game.tileMap.length; y++) {
                const tile = game.tileMap[y][x];
                
                // Vérifier si c'est un arbre (feuilles)
                if (tile === TILE.OAK_LEAVES || tile === TILE.LEAVES) {
                    // Chance de faire pousser un fruit
                    if (SeededRandom.random() < 0.02) { // 2% de chance
                        const biome = this.getBiomeAt(game, x, y);
                        const availableFruits = this.getFruitsForBiome(biome, foodData);
                        
                        if (availableFruits.length > 0) {
                            const fruitType = availableFruits[Math.floor(SeededRandom.random() * availableFruits.length)];
                            const fruitKey = `${x}_${y}`;
                            
                            // Éviter de dupliquer les fruits au même endroit
                            if (!this.treeFruits.has(fruitKey)) {
                                this.treeFruits.set(fruitKey, {
                                    type: fruitType,
                                    x: x * tileSize + SeededRandom.random() * tileSize * 0.5,
                                    y: y * tileSize + SeededRandom.random() * tileSize * 0.5,
                                    tileX: x,
                                    tileY: y,
                                    growthTime: 0,
                                    mature: false
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // Faire mûrir les fruits existants
        this.treeFruits.forEach((fruit, key) => {
            fruit.growthTime++;
            if (fruit.growthTime > 300 && !fruit.mature) { // 5 secondes pour mûrir
                fruit.mature = true;
            }
        });
    }
    
    getFruitsForBiome(biome, foodData) {
        const fruits = [];
        Object.entries(foodData).forEach(([type, data]) => {
            if (data.growsOn === 'tree' && 
                (data.biomes.includes(biome) || data.biomes.includes('all'))) {
                // Ajouter selon la rareté
                const count = Math.ceil(data.rarity * 10);
                for (let i = 0; i < count; i++) {
                    fruits.push(type);
                }
            }
        });
        return fruits;
    }
    
    getBiomeAt(game, tileX, tileY) {
        // Logique simplifiée de détection de biome
        const surfaceTile = game.tileMap[tileY]?.[tileX];
        
        if (surfaceTile === TILE.SAND) return 'desert';
        if (surfaceTile === TILE.SNOW) return 'tundra';
        if (surfaceTile === TILE.WATER) return 'ocean';
        if (surfaceTile === TILE.DIRT) return 'swamp';
        return 'plains';
    }
    
    // Récolter un fruit d'un arbre
    harvestFruit(game, worldX, worldY) {
        const { tileSize } = game.config;
        const tileX = Math.floor(worldX / tileSize);
        const tileY = Math.floor(worldY / tileSize);
        
        // Chercher les fruits proches
        const harvestRadius = 1;
        for (let dx = -harvestRadius; dx <= harvestRadius; dx++) {
            for (let dy = -harvestRadius; dy <= harvestRadius; dy++) {
                const checkKey = `${tileX + dx}_${tileY + dy}`;
                const fruit = this.treeFruits.get(checkKey);
                
                if (fruit && fruit.mature) {
                    // Créer un objet collectible
                    if (!game.collectibles) game.collectibles = [];
                    
                    game.collectibles.push({
                        x: fruit.x,
                        y: fruit.y,
                        w: 12,
                        h: 12,
                        vx: (SeededRandom.random() - 0.5) * 2,
                        vy: -SeededRandom.random() * 3,
                        foodType: fruit.type,
                        life: 600 // 10 secondes
                    });
                    
                    // Supprimer le fruit de l'arbre
                    this.treeFruits.delete(checkKey);
                    return true;
                }
            }
        }
        return false;
    }
    
    // Générer de la nourriture dans les coffres
    generateChestFood(chestType, biome) {
        const foodData = this.getFoodData();
        const chestFoods = [];
        
        Object.entries(foodData).forEach(([type, data]) => {
            if (data.growsOn === 'chest' || SeededRandom.random() < 0.1) {
                if (data.biomes.includes(biome) || data.biomes.includes('all')) {
                    if (SeededRandom.random() < data.rarity) {
                        chestFoods.push({
                            type: type,
                            quantity: 1 + Math.floor(SeededRandom.random() * 3),
                            data: data
                        });
                    }
                }
            }
        });
        
        return chestFoods;
    }
    
    // Faire pousser des légumes au sol
    growGroundVegetables(game) {
        const { tileSize } = game.config;
        const foodData = this.getFoodData();
        
        for (let x = 0; x < game.tileMap[0]?.length; x++) {
            for (let y = 0; y < game.tileMap.length - 1; y++) {
                const tile = game.tileMap[y][x];
                const tileBelow = game.tileMap[y + 1][x];
                
                // Vérifier si c'est de l'air au-dessus de terre/herbe
                if (tile === TILE.AIR && (tileBelow === TILE.GRASS || tileBelow === TILE.DIRT)) {
                    if (SeededRandom.random() < 0.005) { // 0.5% de chance
                        const biome = this.getBiomeAt(game, x, y);
                        const availableVeggies = this.getVegetablesForBiome(biome, foodData);
                        
                        if (availableVeggies.length > 0) {
                            const veggieType = availableVeggies[Math.floor(SeededRandom.random() * availableVeggies.length)];
                            
                            // Créer directement un objet collectible
                            if (!game.collectibles) game.collectibles = [];
                            
                            game.collectibles.push({
                                x: x * tileSize + SeededRandom.random() * tileSize * 0.5,
                                y: y * tileSize,
                                w: 10,
                                h: 10,
                                vx: 0,
                                vy: 0,
                                foodType: veggieType,
                                life: 1200, // 20 secondes
                                isPlant: true
                            });
                        }
                    }
                }
            }
        }
    }
    
    getVegetablesForBiome(biome, foodData) {
        const vegetables = [];
        Object.entries(foodData).forEach(([type, data]) => {
            if (data.growsOn === 'ground' && 
                (data.biomes.includes(biome) || data.biomes.includes('all'))) {
                const count = Math.ceil(data.rarity * 10);
                for (let i = 0; i < count; i++) {
                    vegetables.push(type);
                }
            }
        });
        return vegetables;
    }
    
    draw(ctx, assets, game) {
        // Dessiner les fruits sur les arbres
        this.treeFruits.forEach(fruit => {
            if (fruit.mature) {
                const foodData = this.getFoodData()[fruit.type];
                if (foodData) {
                    // Animation de balancement
                    const sway = Math.sin(Date.now() * 0.003) * 2;
                    
                    ctx.fillStyle = foodData.color;
                    ctx.beginPath();
                    ctx.arc(fruit.x + sway, fruit.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Petit reflet
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.beginPath();
                    ctx.arc(fruit.x + sway - 1, fruit.y - 1, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Fruit en croissance (plus petit)
                ctx.fillStyle = 'rgba(0,255,0,0.5)';
                ctx.beginPath();
                ctx.arc(fruit.x, fruit.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Dessiner les aliments collectibles avec leurs icônes
        if (game.collectibles) {
            game.collectibles.forEach(item => {
                if (item.foodType) {
                    const foodData = this.getFoodData()[item.foodType];
                    if (foodData) {
                        // Fond coloré
                        ctx.fillStyle = foodData.color;
                        ctx.fillRect(item.x - 2, item.y - 2, item.w + 4, item.h + 4);
                        
                        // Bordure
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(item.x - 2, item.y - 2, item.w + 4, item.h + 4);
                        
                        // Effet de brillance
                        const alpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
                        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                        ctx.fillRect(item.x, item.y, item.w, item.h);
                    }
                }
            });
        }
    }
    
    // Consommer de la nourriture
    consumeFood(player, foodType) {
        const foodData = this.getFoodData()[foodType];
        if (!foodData) return false;
        
        // Restaurer la faim et la santé
        if (player.hunger !== undefined) {
            player.hunger = Math.min(100, player.hunger + foodData.hunger);
        }
        if (player.health !== undefined) {
            player.health = Math.min(player.maxHealth || 100, player.health + foodData.health);
        }
        
        return true;
    }
}