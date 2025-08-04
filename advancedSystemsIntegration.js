// advancedSystemsIntegration.js - Intégration et corrections des systèmes avancés

// Classes de base manquantes pour les systèmes avancés
export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addParticle(x, y, type, options = {}) {
        this.particles.push({
            x,
            y,
            type,
            vx: options.vx || 0,
            vy: options.vy || 0,
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            color: options.color || '#FFD700',
            size: options.size || 2
        });
    }

    update(delta) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.life -= delta;
            return p.life > 0;
        });
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            ctx.restore();
        });
    }
}

export class LightingSystem {
    constructor() {
        this.lights = [];
        this.ambientLight = 0.3;
    }

    addLight(x, y, radius, intensity, color = '#FFD700') {
        this.lights.push({ x, y, radius, intensity, color });
    }

    renderLighting(ctx, canvas) {
        // Simulation simple d'éclairage
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.ambientLight})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'screen';
        this.lights.forEach(light => {
            const gradient = ctx.createRadialGradient(
                light.x,
                light.y,
                0,
                light.x,
                light.y,
                light.radius
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${light.intensity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(
                light.x - light.radius,
                light.y - light.radius,
                light.radius * 2,
                light.radius * 2
            );
        });
        ctx.restore();
    }
}

export class WeatherRenderer {
    constructor() {
        this.currentWeather = 'clear';
        this.particles = [];
    }

    setWeather(type) {
        this.currentWeather = type;
        this.particles = [];

        // Générer des particules selon le type de météo
        switch (type) {
            case 'rain':
                for (let i = 0; i < 100; i++) {
                    this.particles.push({
                        x: Math.random() * 800,
                        y: Math.random() * 600,
                        vx: -2,
                        vy: 10,
                        color: '#87CEEB'
                    });
                }
                break;
            case 'snow':
                for (let i = 0; i < 50; i++) {
                    this.particles.push({
                        x: Math.random() * 800,
                        y: Math.random() * 600,
                        vx: 0,
                        vy: 2,
                        color: '#FFFFFF'
                    });
                }
                break;
        }
    }

    update(delta) {
        this.particles.forEach(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;

            // Recycler les particules
            if (p.y > 600) {
                p.y = -10;
                p.x = Math.random() * 800;
            }
        });
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 2, 8);
        });
        ctx.restore();
    }
}

export class AnimationSystem {
    constructor() {
        this.animations = new Map();
    }

    addAnimation(id, frames, duration) {
        this.animations.set(id, {
            frames,
            duration,
            currentFrame: 0,
            elapsed: 0
        });
    }

    update(delta) {
        this.animations.forEach(anim => {
            anim.elapsed += delta;
            if (anim.elapsed >= anim.duration / anim.frames.length) {
                anim.currentFrame = (anim.currentFrame + 1) % anim.frames.length;
                anim.elapsed = 0;
            }
        });
    }

    getCurrentFrame(id) {
        const anim = this.animations.get(id);
        return anim ? anim.frames[anim.currentFrame] : null;
    }
}

// Classes pour le système de PNJ avancé
export class DialogueSystem {
    constructor() {
        this.currentDialogue = null;
        this.dialogueHistory = [];
    }

    startDialogue(npc, player) {
        this.currentDialogue = {
            npc,
            player,
            currentNode: 'start',
            responses: []
        };

        // Utiliser le WindowManager pour afficher le dialogue
        if (window.windowManager) {
            this.showDialogueWindow(npc);
        }
    }

    showDialogueWindow(npc) {
        const content = `
            <div class="npc-dialogue">
                <div class="npc-portrait">
                    <i class="fas fa-user"></i>
                </div>
                <h3>${npc.name || 'PNJ'}</h3>
                <div class="dialogue-text">
                    ${npc.dialogue || 'Bonjour, voyageur !'}
                </div>
                <div class="dialogue-responses">
                    <button onclick="window.advancedNPCSystem.dialogueSystem.endDialogue()">
                        Au revoir
                    </button>
                </div>
            </div>
        `;

        document.getElementById('dialogueContent').innerHTML = content;
        window.windowManager.showWindow('dialogueWindow');
    }

    endDialogue() {
        this.currentDialogue = null;
        if (window.windowManager) {
            window.windowManager.hideWindow('dialogueWindow');
        }
    }
}

export class QuestSystem {
    constructor() {
        this.quests = new Map();
        this.activeQuests = [];
        this.completedQuests = [];
    }

    addQuest(id, questData) {
        this.quests.set(id, questData);
    }

    startQuest(id) {
        const quest = this.quests.get(id);
        if (quest && !this.activeQuests.find(q => q.id === id)) {
            this.activeQuests.push({ ...quest, id, progress: 0 });
        }
    }

    completeQuest(id) {
        const questIndex = this.activeQuests.findIndex(q => q.id === id);
        if (questIndex !== -1) {
            const quest = this.activeQuests.splice(questIndex, 1)[0];
            this.completedQuests.push(quest);
        }
    }
}

export class RelationshipSystem {
    constructor() {
        this.relationships = new Map();
    }

    setRelationship(npcId, value) {
        this.relationships.set(npcId, Math.max(-100, Math.min(100, value)));
    }

    modifyRelationship(npcId, delta) {
        const current = this.relationships.get(npcId) || 0;
        this.setRelationship(npcId, current + delta);
    }

    getRelationship(npcId) {
        return this.relationships.get(npcId) || 0;
    }
}

export class NPCAISystem {
    constructor() {
        this.behaviors = new Map();
    }

    addBehavior(npcId, behavior) {
        this.behaviors.set(npcId, behavior);
    }

    update(npcs, game, delta) {
        npcs.forEach(npc => {
            const behavior = this.behaviors.get(npc.id);
            if (behavior) {
                behavior.update(npc, game, delta);
            }
        });
    }
}

// --- Intégration des systèmes de jeu avancés existants ---

import { WeatherSystem } from './weatherSystem.js';
import { DisasterManager } from './disasterManager.js';
import { FoodSystem } from './foodSystem.js';
// The animal module exports AnimalManager; alias as AnimalSystem for clarity
import { AnimalManager as AnimalSystem } from './animalSystem.js';
import { ExplorationSystem } from './explorationSystem.js';
import { TimeSystem } from './timeSystem.js';
import { LightingSystem as DynamicLightingSystem } from './lighting.js';
import { WorldAnimator } from './worldAnimator.js';
import { generateMonsters } from './generateurMonstres.js';
import { generateAnimals } from './generateurAnimaux.js';
import { generatePNJ } from './generateurPNJ.js';
import { PNJ } from './PNJ.js';

/**
 * Intègre tous les systèmes de jeu avancés dans l'objet de jeu principal
 * et corrige les dépendances globales manquantes.
 * @param {object} game - L'objet de jeu principal.
 */
export function integrateAdvancedSystems(game) {
    console.log('🔧 Intégration des systèmes avancés...');

    // Corriger les dépendances manquantes
    if (typeof window !== 'undefined') {
        if (!window.ParticleSystem) window.ParticleSystem = ParticleSystem;
        if (!window.LightingSystem) window.LightingSystem = LightingSystem;
        if (!window.WeatherRenderer) window.WeatherRenderer = WeatherRenderer;
        if (!window.AnimationSystem) window.AnimationSystem = AnimationSystem;
        if (!window.DialogueSystem) window.DialogueSystem = DialogueSystem;
        if (!window.QuestSystem) window.QuestSystem = QuestSystem;
        if (!window.RelationshipSystem) window.RelationshipSystem = RelationshipSystem;
        if (!window.NPCAISystem) window.NPCAISystem = NPCAISystem;
    }

    if (!game || !game.config) {
        console.error('❌ Objet de jeu ou configuration manquant pour l\'intégration des systèmes avancés.');
        return false;
    }

    console.log('🔗 Intégration des systèmes de jeu avancés...');

    // 1. Système de temps et de cycle jour/nuit
    // Ce système est fondamental pour beaucoup d'autres (météo, éclairage, etc.)
    game.timeSystem = new TimeSystem(game.config);
    console.log('    -> 🕒 Système de temps initialisé.');

    // 2. Système météorologique dynamique
    // Dépend du système de temps.
    game.weatherSystem = new WeatherSystem(game.canvas, game.config);
    console.log('    -> ☁️ Système météorologique initialisé.');

    // 3. Gestionnaire de désastres et de catastrophes naturelles
    // Dépend de la météo et du temps.
    game.disasterManager = new DisasterManager(game);
    console.log('    -> 🌋 Gestionnaire de désastres initialisé.');

    // 4. Système d'éclairage dynamique
    // Dépend du système de temps.
    game.lightingSystem = new DynamicLightingSystem(game.canvas, game.config.tileSize);
    console.log('    -> 💡 Système d\'éclairage initialisé.');

    // 5. Animateur du monde pour les effets visuels
    game.worldAnimator = new WorldAnimator(game.config, game.assets);
    console.log('    -> ✨ Animateur du monde initialisé.');

    // 6. Système de faune (animaux)
    game.animalManager = new AnimalSystem();
    game.animals = game.animalManager.animals;
    if (typeof generateAnimals === 'function') {
        const animals = generateAnimals(5, game.config, game.tileMap); // Génère 5 animaux
        game.animalManager.animals.push(...animals);
    }
    console.log('    -> 🐾 Système de faune initialisé.');

    // 7. Génération de monstres
    if (typeof generateMonsters === 'function') {
        const monsters = generateMonsters(10, game.config, game.tileMap); // Génère 10 monstres
        game.enemies = [...game.enemies, ...monsters];
    }
    console.log('    -> 👾 Générateur de monstres actif.');

    // 8. Génération de PNJ
    // Assurez-vous que les PNJ ont une configuration valide.
    if (typeof generatePNJ === 'function' && typeof PNJ === 'function') {
        for (let i = 0; i < 5; i++) {
            const pnjData = generatePNJ();
            const spawnPos = findValidSpawn(game.tileMap, game.config.tileSize);
            if (spawnPos) {
                const newPnj = new PNJ(spawnPos.x, spawnPos.y, game.config, pnjData);
                game.pnjs.push(newPnj);
            }
        }
    }
    console.log('    -> 👨‍👩‍👧‍👦 Générateur de PNJ actif.');

    // 9. Système de nourriture et de survie
    game.foodSystem = new FoodSystem(game.player, game.inventory);
    console.log('    -> 🍔 Système de nourriture et survie initialisé.');

    // 10. Système d'exploration et de brouillard de guerre
    game.explorationSystem = new ExplorationSystem(
        game.config.worldWidth,
        game.config.worldHeight,
        game.config.chunkSize
    );
    console.log('    -> 🗺️ Système d\'exploration initialisé.');

    console.log('✅ Tous les systèmes avancés ont été intégrés avec succès !');
    return true;
}

/**
 * Trouve une position de spawn valide sur la surface du monde.
 * @param {Array<Array<number>>} tileMap - La carte du monde.
 * @param {number} tileSize - La taille d'une tuile.
 * @returns {{x: number, y: number}|null}
 */
function findValidSpawn(tileMap, tileSize) {
    const worldWidthInTiles = tileMap[0].length;
    for (let i = 0; i < 100; i++) {
        const x = Math.floor(Math.random() * worldWidthInTiles);
        for (let y = 1; y < tileMap.length; y++) {
            const isGround = tileMap[y][x] > 0;
            const isAirAbove = tileMap[y - 1][x] === 0;
            if (isGround && isAirAbove) {
                return { x: x * tileSize, y: (y - 2) * tileSize };
            }
        }
    }
    return null; // Retourne null si aucun point n'est trouvé
}

// Export par défaut avec toutes les classes et la fonction d'intégration
export default {
    ParticleSystem,
    LightingSystem,
    WeatherRenderer,
    AnimationSystem,
    DialogueSystem,
    QuestSystem,
    RelationshipSystem,
    NPCAISystem,
    integrateAdvancedSystems
};

