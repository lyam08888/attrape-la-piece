// combatSystem.js - Système de combat et statistiques

export class PlayerStats {
    constructor() {
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        
        // Statistiques de base
        this.maxHealth = 100;
        this.health = 100;
        this.strength = 10;
        this.defense = 5;
        this.speed = 10;
        this.mining = 10;
        this.luck = 5;
        
        // Effets temporaires
        this.effects = new Map();

        // Équipement (initialisé vide)
        this.equipment = new Map();

        // Statistiques dérivées
        this.attackDamage = this.calculateAttackDamage();
        this.moveSpeed = this.calculateMoveSpeed();
        this.miningSpeed = this.calculateMiningSpeed();
        
        // Statistiques de jeu
        this.blocksMinedTotal = 0;
        this.enemiesKilledTotal = 0;
        this.distanceWalkedTotal = 0;
        this.itemsCraftedTotal = 0;
        this.deathCount = 0;
        this.playTime = 0;
    }

    addXP(amount) {
        this.xp += amount;
        let levelsGained = 0;
        
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level++;
            levelsGained++;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2); // Augmentation de 20% par niveau
            
            // Bonus de statistiques par niveau
            this.maxHealth += 5;
            this.health = this.maxHealth; // Restaure la santé au level up
            this.strength += 2;
            this.defense += 1;
            this.speed += 1;
            this.mining += 1;
            this.luck += 1;
        }
        
        if (levelsGained > 0) {
            this.updateDerivedStats();
            return levelsGained;
        }
        
        return 0;
    }

    getXPForNextLevel() {
        return this.xpToNextLevel;
    }

    takeDamage(amount, source = 'unknown') {
        const actualDamage = Math.max(1, amount - this.defense);
        this.health = Math.max(0, this.health - actualDamage);
        
        if (this.health <= 0) {
            this.die(source);
        }
        
        return actualDamage;
    }

    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health - oldHealth;
    }

    die(source) {
        this.deathCount++;
        this.health = 0;
        
        // Événement de mort
        document.dispatchEvent(new CustomEvent('player-death', {
            detail: { source, stats: this }
        }));
    }

    respawn() {
        this.health = this.maxHealth;
        // Perte d'XP à la mort (10% de l'XP actuel)
        const xpLoss = Math.floor(this.xp * 0.1);
        this.xp = Math.max(0, this.xp - xpLoss);
    }

    addEffect(name, duration, modifier) {
        this.effects.set(name, {
            duration,
            modifier,
            startTime: Date.now()
        });
        this.updateDerivedStats();
    }

    removeEffect(name) {
        this.effects.delete(name);
        this.updateDerivedStats();
    }

    updateEffects(deltaTime) {
        const now = Date.now();
        const toRemove = [];
        
        for (const [name, effect] of this.effects) {
            if (now - effect.startTime >= effect.duration) {
                toRemove.push(name);
            }
        }
        
        toRemove.forEach(name => this.removeEffect(name));
    }

    calculateAttackDamage() {
        let damage = this.strength;
        
        // Appliquer les effets
        for (const effect of this.effects.values()) {
            if (effect && effect.modifier && effect.modifier.attackDamage) {
                damage += effect.modifier.attackDamage;
            }
        }
        
        return Math.max(1, damage);
    }

    calculateMoveSpeed() {
        let speed = this.speed;
        
        for (const effect of this.effects.values()) {
            if (effect && effect.modifier && effect.modifier.speed) {
                speed += effect.modifier.speed;
            }
        }
        
        return Math.max(1, speed);
    }

    calculateMiningSpeed() {
        let mining = this.mining;
        
        for (const effect of this.effects.values()) {
            if (effect && effect.modifier && effect.modifier.mining) {
                mining += effect.modifier.mining;
            }
        }
        
        return Math.max(1, mining);
    }

    updateDerivedStats() {
        this.attackDamage = this.calculateAttackDamage();
        this.moveSpeed = this.calculateMoveSpeed();
        this.miningSpeed = this.calculateMiningSpeed();
    }

    // Méthodes pour les statistiques de jeu
    addBlockMined() {
        this.blocksMinedTotal++;
    }

    addEnemyKilled() {
        this.enemiesKilledTotal++;
    }

    addDistanceWalked(distance) {
        this.distanceWalkedTotal += distance;
    }

    addItemCrafted() {
        this.itemsCraftedTotal++;
    }

    updatePlayTime(deltaTime) {
        this.playTime += deltaTime;
    }

    // Sérialisation
    serialize() {
        return {
            level: this.level,
            xp: this.xp,
            xpToNextLevel: this.xpToNextLevel,
            maxHealth: this.maxHealth,
            health: this.health,
            strength: this.strength,
            defense: this.defense,
            speed: this.speed,
            mining: this.mining,
            luck: this.luck,
            blocksMinedTotal: this.blocksMinedTotal,
            enemiesKilledTotal: this.enemiesKilledTotal,
            distanceWalkedTotal: this.distanceWalkedTotal,
            itemsCraftedTotal: this.itemsCraftedTotal,
            deathCount: this.deathCount,
            playTime: this.playTime
        };
    }

    deserialize(data) {
        Object.assign(this, data);
        this.updateDerivedStats();
    }
}

export class CombatSystem {
    constructor() {
        this.combatLog = [];
        this.damageNumbers = [];
    }

    attack(attacker, target, weapon = null) {
        let damage = attacker.stats ? attacker.stats.attackDamage : attacker.damage || 10;
        
        // Modificateur d'arme
        if (weapon) {
            damage += this.getWeaponDamage(weapon);
        }
        
        // Calcul des critiques
        const critChance = attacker.stats ? attacker.stats.luck / 100 : 0.05;
        const isCrit = Math.random() < critChance;
        if (isCrit) {
            damage *= 2;
        }
        
        // Variation aléatoire (±10%)
        const variation = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variation);
        
        // Appliquer les dégâts
        const actualDamage = target.takeDamage ? target.takeDamage(damage, attacker) : damage;
        
        // Ajouter au log de combat
        this.addToCombatLog({
            attacker: attacker.name || 'Joueur',
            target: target.name || 'Cible',
            damage: actualDamage,
            isCrit,
            weapon: weapon?.name
        });
        
        // Créer un nombre de dégâts flottant
        this.createDamageNumber(target.x + target.w/2, target.y, actualDamage, isCrit);
        
        return actualDamage;
    }

    getWeaponDamage(weapon) {
        const weaponDamage = {
            'sword': 15,
            'axe': 12,
            'pickaxe': 8,
            'shovel': 6,
            'knife': 10,
            'bow': 20
        };
        
        let baseDamage = weaponDamage[weapon.name] || 5;
        
        // Modificateur de matériau
        if (weapon.metadata?.material) {
            const materialMultiplier = {
                'wood': 1.0,
                'stone': 1.5,
                'iron': 2.0,
                'gold': 1.2, // L'or est rapide mais fragile
                'diamond': 3.0
            };
            baseDamage *= materialMultiplier[weapon.metadata.material] || 1.0;
        }
        
        return Math.floor(baseDamage);
    }

    addToCombatLog(entry) {
        entry.timestamp = Date.now();
        this.combatLog.unshift(entry);
        
        // Garder seulement les 50 dernières entrées
        if (this.combatLog.length > 50) {
            this.combatLog = this.combatLog.slice(0, 50);
        }
    }

    createDamageNumber(x, y, damage, isCrit = false) {
        this.damageNumbers.push({
            x, y,
            damage,
            isCrit,
            life: 60, // 1 seconde à 60fps
            vy: -2,
            alpha: 1
        });
    }

    updateDamageNumbers() {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dmgNum = this.damageNumbers[i];
            dmgNum.y += dmgNum.vy;
            dmgNum.vy *= 0.95; // Ralentissement
            dmgNum.life--;
            dmgNum.alpha = dmgNum.life / 60;
            
            if (dmgNum.life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    drawDamageNumbers(ctx, camera) {
        ctx.save();
        ctx.font = 'bold 14px "VT323"';
        ctx.textAlign = 'center';
        
        this.damageNumbers.forEach(dmgNum => {
            const screenX = dmgNum.x - camera.x;
            const screenY = dmgNum.y - camera.y;
            
            ctx.globalAlpha = dmgNum.alpha;
            ctx.fillStyle = dmgNum.isCrit ? '#ff6b6b' : '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            const text = dmgNum.isCrit ? `${dmgNum.damage}!` : dmgNum.damage.toString();
            
            ctx.strokeText(text, screenX, screenY);
            ctx.fillText(text, screenX, screenY);
        });
        
        ctx.restore();
    }

    getCombatLog(limit = 10) {
        return this.combatLog.slice(0, limit);
    }
}

// Système de biomes avec effets sur le joueur
export class BiomeSystem {
    constructor() {
        this.biomes = {
            'surface': {
                name: 'Surface',
                effects: {},
                ambientSound: 'surface',
                skyColor: ['#87CEEB', '#4682B4']
            },
            'underground': {
                name: 'Souterrain',
                effects: { mining: 2 },
                ambientSound: 'underground',
                skyColor: ['#2c3e50', '#34495e']
            },
            'deep_underground': {
                name: 'Profondeurs',
                effects: { mining: 5, speed: -2 },
                ambientSound: 'core',
                skyColor: ['#1a1a1a', '#2c2c2c']
            },
            'hell': {
                name: 'Enfer',
                effects: { attackDamage: 5, health: -1 }, // Dégâts continus
                ambientSound: 'hell',
                skyColor: ['#8b0000', '#ff4500']
            },
            'paradise': {
                name: 'Paradis',
                effects: { health: 1, luck: 10 }, // Régénération
                ambientSound: 'paradise',
                skyColor: ['#ffd700', '#ffffe0']
            },
            'water': {
                name: 'Aquatique',
                effects: { speed: -5 },
                ambientSound: 'nucleus',
                skyColor: ['#006994', '#4682B4']
            },
            'space': {
                name: 'Espace',
                effects: { speed: 3, health: -2 },
                ambientSound: 'space',
                skyColor: ['#000000', '#191970']
            }
        };
        
        this.currentBiome = 'surface';
        this.biomeEffectDuration = 1000; // 1 seconde
    }

    getBiome(y, tileMap, tileSize) {
        const worldHeight = tileMap.length * tileSize;
        const relativeY = y / worldHeight;
        
        if (relativeY < 0.1) return 'space';
        if (relativeY < 0.4) return 'paradise';
        if (relativeY < 0.6) return 'surface';
        if (relativeY < 0.8) return 'underground';
        if (relativeY < 0.95) return 'deep_underground';
        return 'hell';
    }

    updatePlayerBiome(player, game) {
        const newBiome = this.getBiome(player.y, game.tileMap, game.config.tileSize);
        
        if (newBiome !== this.currentBiome) {
            // Retirer les effets de l'ancien biome
            if (player.stats) {
                player.stats.removeEffect('biome');
            }
            
            // Appliquer les effets du nouveau biome
            const biomeData = this.biomes[newBiome];
            if (biomeData.effects && Object.keys(biomeData.effects).length > 0) {
                if (player.stats) {
                    player.stats.addEffect('biome', this.biomeEffectDuration, biomeData.effects);
                }
            }
            
            // Changer la musique d'ambiance
            if (game.sound) {
                game.sound.startAmbient(biomeData.ambientSound);
            }
            
            // Mettre à jour l'affichage du biome
            this.updateBiomeDisplay(biomeData.name);
            
            this.currentBiome = newBiome;
            
            // Log du changement de biome
            if (game.logger) {
                game.logger.log(`Biome: ${biomeData.name}`);
            }
        }
    }

    updateBiomeDisplay(biomeName) {
        const biomeDisplay = document.getElementById('currentBiome');
        if (biomeDisplay) {
            biomeDisplay.textContent = biomeName;
        }
    }

    getCurrentBiome() {
        return this.biomes[this.currentBiome];
    }
}

// Fonctions utilitaires pour l'interface
export function updatePlayerStatsUI(stats) {
    const elements = {
        playerLevel: document.getElementById('playerLevel'),
        playerXP: document.getElementById('playerXP'),
        playerHealth: document.getElementById('playerHealth'),
        playerStrength: document.getElementById('playerStrength'),
        playerSpeed: document.getElementById('playerSpeed'),
        healthFill: document.getElementById('healthFill'),
        healthText: document.getElementById('healthText')
    };

    if (elements.playerLevel) elements.playerLevel.textContent = stats.level;
    if (elements.playerXP) elements.playerXP.textContent = `${stats.xp}/${stats.xpToNextLevel}`;
    if (elements.playerHealth) elements.playerHealth.textContent = `${stats.health}/${stats.maxHealth}`;
    if (elements.playerStrength) elements.playerStrength.textContent = stats.strength;
    if (elements.playerSpeed) elements.playerSpeed.textContent = stats.speed;
    
    if (elements.healthFill) {
        const healthPercent = (stats.health / stats.maxHealth) * 100;
        elements.healthFill.style.width = `${healthPercent}%`;
    }
    
    if (elements.healthText) {
        elements.healthText.textContent = `${stats.health}/${stats.maxHealth}`;
    }
}