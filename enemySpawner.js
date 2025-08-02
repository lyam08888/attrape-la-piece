// enemySpawner.js - Système de génération d'ennemis

import { Golem } from './enemy.js';
import { TILE } from './world.js';

export class EnemySpawner {
    constructor(config) {
        this.config = config;
        this.spawnTimer = 0;
        this.spawnInterval = 5000; // 5 secondes
        this.maxEnemies = 20;
        this.spawnDistance = 300; // Distance minimum du joueur pour spawn
        this.despawnDistance = 500; // Distance pour despawn
    }

    update(game, delta) {
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.trySpawnEnemy(game);
        }
        
        // Nettoyer les ennemis morts ou trop éloignés
        this.cleanupEnemies(game);
    }

    trySpawnEnemy(game) {
        if (!game.player || game.enemies.length >= this.maxEnemies) return;
        
        const player = game.player;
        const attempts = 10;
        
        for (let i = 0; i < attempts; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.spawnDistance + Math.random() * 100;
            
            const spawnX = player.x + Math.cos(angle) * distance;
            const spawnY = player.y + Math.sin(angle) * distance;
            
            if (this.isValidSpawnLocation(game, spawnX, spawnY)) {
                const enemyType = this.selectEnemyType(game, spawnY);
                const enemy = this.createEnemy(enemyType, spawnX, spawnY, game.config);
                
                if (enemy) {
                    game.enemies.push(enemy);
                    game.logger.log(`${enemyType} apparaît !`);
                    break;
                }
            }
        }
    }

    isValidSpawnLocation(game, x, y) {
        const { tileSize } = this.config;
        const tileX = Math.floor(x / tileSize);
        const tileY = Math.floor(y / tileSize);
        
        // Vérifier que la position est dans les limites du monde
        if (tileY < 0 || tileY >= game.tileMap.length || 
            tileX < 0 || tileX >= (game.tileMap[0]?.length || 0)) {
            return false;
        }
        
        // Vérifier qu'il y a de l'espace libre (2 blocs de hauteur)
        const groundTile = game.tileMap[tileY]?.[tileX];
        const aboveTile = game.tileMap[tileY - 1]?.[tileX];
        const above2Tile = game.tileMap[tileY - 2]?.[tileX];
        
        // Il faut un sol solide et de l'espace libre au-dessus
        return groundTile > TILE.AIR && 
               (aboveTile === TILE.AIR || aboveTile === undefined) &&
               (above2Tile === TILE.AIR || above2Tile === undefined);
    }

    selectEnemyType(game, spawnY) {
        const worldHeight = game.tileMap.length * this.config.tileSize;
        const depth = spawnY / worldHeight;
        
        // Sélection basée sur la profondeur
        if (depth < 0.3) {
            return Math.random() < 0.7 ? 'Slime' : 'Frog';
        } else if (depth < 0.6) {
            return Math.random() < 0.5 ? 'Golem' : 'Slime';
        } else if (depth < 0.8) {
            return Math.random() < 0.6 ? 'Golem' : 'Demon';
        } else {
            return Math.random() < 0.8 ? 'Demon' : 'Dragon';
        }
    }

    createEnemy(type, x, y, config) {
        switch (type) {
            case 'Slime':
                return new Slime(x, y, config);
            case 'Frog':
                return new Frog(x, y, config);
            case 'Golem':
                return new Golem(x, y, config);
            case 'Demon':
                return new Demon(x, y, config);
            case 'Dragon':
                return new Dragon(x, y, config);
            default:
                return new Golem(x, y, config);
        }
    }

    cleanupEnemies(game) {
        if (!game.player) return;
        
        const player = game.player;
        
        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            
            // Supprimer les ennemis morts depuis longtemps
            if (enemy.isDead && enemy.deathTime && 
                Date.now() - enemy.deathTime > 5000) {
                game.enemies.splice(i, 1);
                continue;
            }
            
            // Supprimer les ennemis trop éloignés
            const distance = Math.sqrt(
                Math.pow(enemy.x - player.x, 2) + 
                Math.pow(enemy.y - player.y, 2)
            );
            
            if (distance > this.despawnDistance) {
                game.enemies.splice(i, 1);
            }
        }
    }
}

// Classes d'ennemis étendues
class Slime extends Golem {
    constructor(x, y, config) {
        super(x, y, config);
        this.name = 'Slime';
        this.health = 30;
        this.maxHealth = 30;
        this.damage = 8;
        this.speed = 0.3;
        this.jumpForce = -3;
        this.color = '#00ff00';
        this.bounceTimer = 0;
    }

    update(game) {
        super.update(game);
        
        if (!this.isDead && this.grounded) {
            this.bounceTimer++;
            if (this.bounceTimer > 60) { // Sauter toutes les secondes
                this.vy = this.jumpForce;
                this.bounceTimer = 0;
            }
        }
    }

    draw(ctx, assets) {
        if (this.isDead) return;
        
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        
        // Corps gélatineux
        const squish = Math.abs(this.vy) * 0.1;
        ctx.fillRect(this.x - squish, this.y + squish, this.w + squish * 2, this.h - squish);
        
        // Yeux
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 5, this.y + 5, 3, 3);
        ctx.fillRect(this.x + this.w - 8, this.y + 5, 3, 3);
        
        ctx.restore();
    }
}

class Frog extends Golem {
    constructor(x, y, config) {
        super(x, y, config);
        this.name = 'Frog';
        this.health = 25;
        this.maxHealth = 25;
        this.damage = 6;
        this.speed = 0.2;
        this.jumpForce = -4;
        this.color = '#228b22';
        this.jumpCooldown = 0;
    }

    update(game) {
        super.update(game);
        
        if (!this.isDead && this.grounded && this.jumpCooldown <= 0) {
            const player = game.player;
            const distance = Math.sqrt(
                Math.pow(this.x - player.x, 2) + 
                Math.pow(this.y - player.y, 2)
            );
            
            if (distance < 100) {
                this.vy = this.jumpForce;
                this.vx = (player.x > this.x ? 1 : -1) * 2;
                this.jumpCooldown = 90; // 1.5 secondes
            }
        }
        
        if (this.jumpCooldown > 0) this.jumpCooldown--;
    }

    draw(ctx, assets) {
        if (this.isDead) return;
        
        ctx.save();
        ctx.fillStyle = this.color;
        
        // Corps
        ctx.fillRect(this.x, this.y + this.h * 0.3, this.w, this.h * 0.7);
        
        // Tête
        ctx.fillRect(this.x + this.w * 0.1, this.y, this.w * 0.8, this.h * 0.5);
        
        // Yeux
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x + 2, this.y - 2, 4, 4);
        ctx.fillRect(this.x + this.w - 6, this.y - 2, 4, 4);
        
        ctx.restore();
    }
}

class Demon extends Golem {
    constructor(x, y, config) {
        super(x, y, config);
        this.name = 'Demon';
        this.health = 80;
        this.maxHealth = 80;
        this.damage = 20;
        this.speed = 1.5;
        this.color = '#8b0000';
        this.fireballCooldown = 0;
    }

    update(game) {
        super.update(game);
        
        if (!this.isDead && this.fireballCooldown <= 0) {
            const player = game.player;
            const distance = Math.sqrt(
                Math.pow(this.x - player.x, 2) + 
                Math.pow(this.y - player.y, 2)
            );
            
            if (distance < 150 && distance > 50) {
                this.shootFireball(game, player);
                this.fireballCooldown = 120; // 2 secondes
            }
        }
        
        if (this.fireballCooldown > 0) this.fireballCooldown--;
    }

    shootFireball(game, target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const fireball = {
            x: this.x + this.w / 2,
            y: this.y + this.h / 2,
            vx: (dx / distance) * 3,
            vy: (dy / distance) * 3,
            w: 8,
            h: 8,
            damage: 15,
            life: 180, // 3 secondes
            type: 'fireball'
        };
        
        if (!game.projectiles) game.projectiles = [];
        game.projectiles.push(fireball);
        
        game.createParticles(this.x + this.w/2, this.y + this.h/2, 5, '#ff4500');
    }

    draw(ctx, assets) {
        if (this.isDead) return;
        
        ctx.save();
        ctx.fillStyle = this.color;
        
        // Corps
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
        // Cornes
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 2, this.y - 5, 3, 5);
        ctx.fillRect(this.x + this.w - 5, this.y - 5, 3, 5);
        
        // Yeux rouges
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 4, this.y + 4, 2, 2);
        ctx.fillRect(this.x + this.w - 6, this.y + 4, 2, 2);
        
        ctx.restore();
    }
}

class Dragon extends Golem {
    constructor(x, y, config) {
        super(x, y, config);
        this.name = 'Dragon';
        this.health = 150;
        this.maxHealth = 150;
        this.damage = 35;
        this.speed = 0.8;
        this.color = '#4b0082';
        this.canFly = true;
        this.breathCooldown = 0;
        this.flyHeight = 0;
    }

    update(game) {
        if (this.isDead) return;
        
        // Vol
        if (this.canFly) {
            this.flyHeight += Math.sin(Date.now() * 0.005) * 0.5;
            this.y += this.flyHeight * 0.1;
        }
        
        super.update(game);
        
        if (this.breathCooldown <= 0) {
            const player = game.player;
            const distance = Math.sqrt(
                Math.pow(this.x - player.x, 2) + 
                Math.pow(this.y - player.y, 2)
            );
            
            if (distance < 200) {
                this.breathFire(game, player);
                this.breathCooldown = 180; // 3 secondes
            }
        }
        
        if (this.breathCooldown > 0) this.breathCooldown--;
    }

    breathFire(game, target) {
        const fireCount = 5;
        for (let i = 0; i < fireCount; i++) {
            const angle = Math.atan2(target.y - this.y, target.x - this.x) + 
                         (Math.random() - 0.5) * 0.5;
            
            const fire = {
                x: this.x + this.w / 2,
                y: this.y + this.h / 2,
                vx: Math.cos(angle) * (2 + Math.random()),
                vy: Math.sin(angle) * (2 + Math.random()),
                w: 6,
                h: 6,
                damage: 25,
                life: 120,
                type: 'dragonfire'
            };
            
            if (!game.projectiles) game.projectiles = [];
            game.projectiles.push(fire);
        }
        
        game.createParticles(this.x + this.w/2, this.y + this.h/2, 10, '#ff6600');
    }

    draw(ctx, assets) {
        if (this.isDead) return;
        
        ctx.save();
        ctx.fillStyle = this.color;
        
        // Corps principal
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
        // Ailes
        ctx.fillStyle = '#301934';
        const wingFlap = Math.sin(Date.now() * 0.01) * 5;
        ctx.fillRect(this.x - 10, this.y + wingFlap, 8, this.h * 0.6);
        ctx.fillRect(this.x + this.w + 2, this.y + wingFlap, 8, this.h * 0.6);
        
        // Yeux
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x + 3, this.y + 3, 3, 3);
        ctx.fillRect(this.x + this.w - 6, this.y + 3, 3, 3);
        
        ctx.restore();
    }
}

// Exporter les classes pour utilisation externe
export { Slime, Frog, Demon, Dragon };