// enemySystem.js - Système d'ennemis pour le jeu RPG

export class Enemy {
    constructor(x, y, type, level = 1) {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 20;
        this.type = type;
        this.level = level;
        
        // Données de base selon le type
        this.data = this.getEnemyData(type);
        
        // Stats calculées selon le niveau
        this.maxHealth = Math.floor(this.data.baseHealth * (1 + (level - 1) * 0.2));
        this.health = this.maxHealth;
        this.attack = Math.floor(this.data.baseAttack * (1 + (level - 1) * 0.15));
        this.defense = Math.floor(this.data.baseDefense * (1 + (level - 1) * 0.1));
        this.speed = this.data.baseSpeed;
        this.xpReward = Math.floor(this.data.baseXP * level);
        
        // IA et mouvement
        this.vx = 0;
        this.vy = 0;
        this.facing = 1;
        this.isGrounded = false;
        this.aiState = 'idle'; // idle, patrol, chase, attack, flee
        this.aiTimer = 0;
        this.patrolDistance = 100;
        this.detectionRange = 80;
        this.attackRange = 25;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // ms
        
        // Position de départ pour la patrouille
        this.startX = x;
        this.patrolDirection = Math.random() > 0.5 ? 1 : -1;
        
        // Effets visuels
        this.damageFlash = 0;
        this.isDead = false;
        this.deathTimer = 0;
    }

    getEnemyData(type) {
        const enemyTypes = {
            'goblin': {
                name: 'Gobelin',
                icon: '👹',
                color: '#8B4513',
                baseHealth: 30,
                baseAttack: 8,
                baseDefense: 2,
                baseSpeed: 1.5,
                baseXP: 15,
                aggressive: true,
                dropTable: [
                    { item: 'health_potion', chance: 0.3, quantity: 1 },
                    { item: 'iron_sword', chance: 0.1, quantity: 1 }
                ]
            },
            'skeleton': {
                name: 'Squelette',
                icon: '💀',
                color: '#F5F5DC',
                baseHealth: 25,
                baseAttack: 12,
                baseDefense: 1,
                baseSpeed: 1.2,
                baseXP: 20,
                aggressive: true,
                dropTable: [
                    { item: 'health_potion', chance: 0.2, quantity: 1 },
                    { item: 'assassin_dagger', chance: 0.15, quantity: 1 }
                ]
            },
            'orc': {
                name: 'Orc',
                icon: '👺',
                color: '#228B22',
                baseHealth: 50,
                baseAttack: 15,
                baseDefense: 5,
                baseSpeed: 1.0,
                baseXP: 30,
                aggressive: true,
                dropTable: [
                    { item: 'health_potion', chance: 0.4, quantity: 2 },
                    { item: 'steel_sword', chance: 0.08, quantity: 1 },
                    { item: 'chain_mail', chance: 0.12, quantity: 1 }
                ]
            },
            'slime': {
                name: 'Slime',
                icon: '🟢',
                color: '#32CD32',
                baseHealth: 20,
                baseAttack: 5,
                baseDefense: 0,
                baseSpeed: 0.8,
                baseXP: 10,
                aggressive: false,
                dropTable: [
                    { item: 'mana_potion', chance: 0.5, quantity: 1 }
                ]
            },
            'dragon': {
                name: 'Dragon',
                icon: '🐉',
                color: '#DC143C',
                baseHealth: 200,
                baseAttack: 35,
                baseDefense: 15,
                baseSpeed: 2.0,
                baseXP: 150,
                aggressive: true,
                dropTable: [
                    { item: 'health_potion', chance: 0.8, quantity: 5 },
                    { item: 'mana_potion', chance: 0.8, quantity: 3 },
                    { item: 'holy_mace', chance: 0.3, quantity: 1 }
                ]
            }
        };

        return enemyTypes[type] || enemyTypes['goblin'];
    }

    update(game, delta) {
        if (this.isDead) {
            this.deathTimer += delta;
            if (this.deathTimer > 2) {
                // Marquer pour suppression
                this.shouldRemove = true;
            }
            return;
        }

        // Mettre à jour l'IA
        this.updateAI(game, delta);
        
        // Appliquer la physique
        this.applyPhysics(game, delta);
        
        // Mettre à jour les effets visuels
        if (this.damageFlash > 0) {
            this.damageFlash -= delta;
        }
    }

    updateAI(game, delta) {
        if (!game.player) return;

        const playerDistance = Math.hypot(this.x - game.player.x, this.y - game.player.y);
        this.aiTimer += delta;

        switch (this.aiState) {
            case 'idle':
                if (this.aiTimer > 1) {
                    this.aiState = 'patrol';
                    this.aiTimer = 0;
                }
                break;

            case 'patrol':
                this.patrol(delta);
                if (this.data.aggressive && playerDistance < this.detectionRange) {
                    this.aiState = 'chase';
                    this.aiTimer = 0;
                }
                break;

            case 'chase':
                this.chasePlayer(game.player, delta);
                if (playerDistance > this.detectionRange * 1.5) {
                    this.aiState = 'patrol';
                    this.aiTimer = 0;
                } else if (playerDistance < this.attackRange) {
                    this.aiState = 'attack';
                    this.aiTimer = 0;
                }
                break;

            case 'attack':
                this.attackPlayer(game, delta);
                if (playerDistance > this.attackRange) {
                    this.aiState = 'chase';
                    this.aiTimer = 0;
                }
                break;

            case 'flee':
                this.fleeFromPlayer(game.player, delta);
                if (playerDistance > this.detectionRange * 2) {
                    this.aiState = 'patrol';
                    this.aiTimer = 0;
                }
                break;
        }
    }

    patrol(delta) {
        const distanceFromStart = Math.abs(this.x - this.startX);
        
        if (distanceFromStart > this.patrolDistance) {
            this.patrolDirection *= -1;
        }
        
        this.vx = this.patrolDirection * this.speed * 0.5;
        this.facing = this.patrolDirection;
    }

    chasePlayer(player, delta) {
        const dx = player.x - this.x;
        const direction = dx > 0 ? 1 : -1;
        
        this.vx = direction * this.speed;
        this.facing = direction;
    }

    fleeFromPlayer(player, delta) {
        const dx = player.x - this.x;
        const direction = dx > 0 ? -1 : 1;
        
        this.vx = direction * this.speed * 1.5;
        this.facing = direction;
    }

    attackPlayer(game, delta) {
        const now = Date.now();
        if (now - this.lastAttackTime > this.attackCooldown) {
            this.performAttack(game);
            this.lastAttackTime = now;
        }
        
        // Arrêter le mouvement pendant l'attaque
        this.vx = 0;
    }

    performAttack(game) {
        if (!game.player) return;

        const damage = Math.max(1, this.attack - game.player.stats.defense);
        game.player.takeDamage(damage);
        
        // Effets visuels et sonores
        game.ambianceSystem?.playSound('damage');
        game.ambianceSystem?.particleSystem?.createExplosion(
            game.player.x + game.player.w/2, 
            game.player.y + game.player.h/2, 
            '#FF4444'
        );
        
        // Notification de dégâts
        game.modularInterface?.showNotification(`-${damage} HP`, 'error', 1500);
    }

    applyPhysics(game, delta) {
        // Gravité
        this.vy += game.config.physics.gravity;
        if (this.vy > game.config.physics.maxFallSpeed) {
            this.vy = game.config.physics.maxFallSpeed;
        }

        // Friction
        this.vx *= 0.9;

        // Mouvement
        this.x += this.vx;
        this.y += this.vy;

        // Collisions basiques avec le monde
        this.handleWorldCollisions(game);
    }

    handleWorldCollisions(game) {
        if (!game.tileMap) return;

        const tileSize = game.config.tileSize;
        const tileX = Math.floor(this.x / tileSize);
        const tileY = Math.floor((this.y + this.h) / tileSize);

        // Collision avec le sol
        if (game.tileMap[tileY] && game.tileMap[tileY][tileX] > 0) {
            this.y = tileY * tileSize - this.h;
            this.vy = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Empêcher de sortir du monde
        if (this.x < 0) this.x = 0;
        if (this.x > game.config.worldWidth - this.w) {
            this.x = game.config.worldWidth - this.w;
        }
        if (this.y > game.config.worldHeight) {
            this.takeDamage(this.maxHealth); // Mort par chute
        }
    }

    takeDamage(amount, attacker = null) {
        if (this.isDead) return;

        this.health -= amount;
        this.damageFlash = 0.3;

        if (this.health <= 0) {
            this.die(attacker);
        } else {
            // Entrer en mode fuite si la santé est faible
            if (this.health < this.maxHealth * 0.3 && !this.data.aggressive) {
                this.aiState = 'flee';
                this.aiTimer = 0;
            }
        }
    }

    die(killer = null) {
        this.isDead = true;
        this.health = 0;
        this.vx = 0;
        this.vy = 0;

        // Donner de l'XP au joueur
        if (killer && killer === window.game?.player) {
            killer.gainXP(this.xpReward, window.game);
            window.game?.modularInterface?.showNotification(`+${this.xpReward} XP`, 'success', 2000);
            
            // Mettre à jour les quêtes de kill
            window.game?.questManager?.updateQuestProgress('kill', this.type, 1);
        }

        // Faire apparaître des objets
        this.dropLoot();

        // Effets visuels et sonores
        window.game?.ambianceSystem?.playSound('pickup');
        window.game?.ambianceSystem?.particleSystem?.createExplosion(
            this.x + this.w/2, 
            this.y + this.h/2, 
            this.data.color
        );
    }

    dropLoot() {
        if (!this.data.dropTable || !window.game?.equipmentManager) return;

        this.data.dropTable.forEach(drop => {
            if (Math.random() < drop.chance) {
                window.game.equipmentManager.addToInventory(drop.item, drop.quantity);
                window.game?.modularInterface?.showNotification(
                    `Objet trouvé: ${drop.item}`, 
                    'success', 
                    2000
                );
            }
        });
    }

    draw(ctx, assets) {
        if (this.isDead && this.deathTimer > 1) return;

        // Effet de flash de dégâts
        if (this.damageFlash > 0) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4);
            ctx.restore();
        }

        // Corps de l'ennemi
        ctx.fillStyle = this.isDead ? '#666' : this.data.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Icône de l'ennemi
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeText(this.data.icon, this.x + this.w/2, this.y + this.h/2 + 5);
        ctx.fillText(this.data.icon, this.x + this.w/2, this.y + this.h/2 + 5);

        // Barre de vie
        if (!this.isDead && this.health < this.maxHealth) {
            const barWidth = this.w;
            const barHeight = 3;
            const barX = this.x;
            const barY = this.y - 8;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.2 ? '#FFC107' : '#F44336';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }

        // Niveau de l'ennemi
        if (this.level > 1) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeText(`Lv.${this.level}`, this.x + this.w/2, this.y - 10);
            ctx.fillText(`Lv.${this.level}`, this.x + this.w/2, this.y - 10);
        }
    }
}

export class EnemySpawner {
    constructor() {
        this.spawnPoints = [];
        this.enemies = [];
        this.maxEnemies = 20;
        this.spawnTimer = 0;
        this.spawnInterval = 5000; // 5 secondes
    }

    addSpawnPoint(x, y, enemyType, level = 1, spawnRate = 1.0) {
        this.spawnPoints.push({
            x, y, enemyType, level, spawnRate,
            lastSpawn: 0,
            active: true
        });
    }

    update(game, delta) {
        this.spawnTimer += delta * 1000;

        // Nettoyer les ennemis morts
        this.enemies = this.enemies.filter(enemy => !enemy.shouldRemove);

        // Spawner de nouveaux ennemis
        if (this.enemies.length < this.maxEnemies && this.spawnTimer > this.spawnInterval) {
            this.trySpawnEnemy(game);
            this.spawnTimer = 0;
        }

        // Mettre à jour tous les ennemis
        this.enemies.forEach(enemy => enemy.update(game, delta));
    }

    trySpawnEnemy(game) {
        if (!game.player || this.spawnPoints.length === 0) return;

        // Choisir un point de spawn aléatoire
        const spawnPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        
        if (!spawnPoint.active) return;

        // Vérifier la distance avec le joueur (ne pas spawner trop près)
        const distanceToPlayer = Math.hypot(spawnPoint.x - game.player.x, spawnPoint.y - game.player.y);
        if (distanceToPlayer < 100) return;

        // Créer l'ennemi
        const enemy = new Enemy(spawnPoint.x, spawnPoint.y, spawnPoint.enemyType, spawnPoint.level);
        this.enemies.push(enemy);

        console.log(`Ennemi spawné: ${enemy.data.name} niveau ${enemy.level}`);
    }

    // Spawner des ennemis aléatoirement dans le monde
    generateRandomSpawns(game) {
        const enemyTypes = ['goblin', 'skeleton', 'slime', 'orc'];
        const spawnCount = 10;

        for (let i = 0; i < spawnCount; i++) {
            const x = Math.random() * (game.config.worldWidth - 100) + 50;
            const y = Math.random() * (game.config.worldHeight - 200) + 100;
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const level = Math.floor(Math.random() * 3) + 1;

            this.addSpawnPoint(x, y, enemyType, level);
        }

        // Ajouter quelques boss
        this.addSpawnPoint(
            game.config.worldWidth * 0.8, 
            game.config.worldHeight * 0.3, 
            'dragon', 
            5, 
            0.1
        );
    }

    getEnemies() {
        return this.enemies;
    }

    removeAllEnemies() {
        this.enemies = [];
    }
}