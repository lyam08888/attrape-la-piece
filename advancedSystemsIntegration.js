// advancedSystemsIntegration.js - Intégration et corrections des systèmes avancés

// Classes de base manquantes pour les systèmes avancés
export class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    addParticle(x, y, type, options = {}) {
        this.particles.push({
            x, y, type,
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
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
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
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${light.intensity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(
                light.x - light.radius, light.y - light.radius,
                light.radius * 2, light.radius * 2
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

// Fonction d'intégration principale
export function integrateAdvancedSystems(game) {
    console.log("🔧 Intégration des systèmes avancés...");
    
    // Corriger les dépendances manquantes
    if (!window.ParticleSystem) window.ParticleSystem = ParticleSystem;
    if (!window.LightingSystem) window.LightingSystem = LightingSystem;
    if (!window.WeatherRenderer) window.WeatherRenderer = WeatherRenderer;
    if (!window.AnimationSystem) window.AnimationSystem = AnimationSystem;
    if (!window.DialogueSystem) window.DialogueSystem = DialogueSystem;
    if (!window.QuestSystem) window.QuestSystem = QuestSystem;
    if (!window.RelationshipSystem) window.RelationshipSystem = RelationshipSystem;
    if (!window.NPCAISystem) window.NPCAISystem = NPCAISystem;
    
    console.log("✅ Systèmes avancés intégrés avec succès !");
    return true;
}

// Export par défaut
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