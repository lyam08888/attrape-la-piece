// welcomeMessage.js - Message de bienvenue avec les nouvelles fonctionnalités

export class WelcomeMessage {
    constructor() {
        this.visible = false;
        this.alpha = 0;
        this.fadeSpeed = 2;
        this.displayTime = 15; // 15 secondes
        this.currentTime = 0;
        this.phase = 'hidden'; // hidden, fadein, display, fadeout
    }

    show() {
        this.visible = true;
        this.phase = 'fadein';
        this.alpha = 0;
        this.currentTime = 0;
    }

    update(delta) {
        if (!this.visible) return;

        this.currentTime += delta;

        switch (this.phase) {
            case 'fadein':
                this.alpha += this.fadeSpeed * delta;
                if (this.alpha >= 1) {
                    this.alpha = 1;
                    this.phase = 'display';
                    this.currentTime = 0;
                }
                break;

            case 'display':
                if (this.currentTime >= this.displayTime) {
                    this.phase = 'fadeout';
                }
                break;

            case 'fadeout':
                this.alpha -= this.fadeSpeed * delta;
                if (this.alpha <= 0) {
                    this.alpha = 0;
                    this.visible = false;
                    this.phase = 'hidden';
                }
                break;
        }
    }

    draw(ctx) {
        if (!this.visible || this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;

        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;

        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Titre principal
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 32px VT323, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 SUPER PIXEL ADVENTURE 2 - AMÉLIORÉ! 🎮', centerX, centerY - 200);

        // Sous-titre
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px VT323, monospace';
        ctx.fillText('Nouvelles fonctionnalités ajoutées!', centerX, centerY - 160);

        // Liste des améliorations
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px VT323, monospace';
        ctx.textAlign = 'left';

        const improvements = [
            '🌍 GÉNÉRATION DE MONDE AMÉLIORÉE:',
            '  • Terrain naturel avec collines et vallées',
            '  • Biomes variés (Plaines, Forêts, Déserts, Montagnes)',
            '  • Cavernes et structures générées procéduralement',
            '  • Minerais et ressources répartis intelligemment',
            '',
            '🐾 SYSTÈME DE FAUNE VIVANT:',
            '  • 18+ espèces d\'animaux différentes',
            '  • Comportements IA réalistes',
            '  • Animaux adaptés aux biomes',
            '  • Interactions avec l\'environnement',
            '',
            '🗺️ INTERFACE AMÉLIORÉE:',
            '  • Minimap avec exploration',
            '  • HUD des contrôles',
            '  • Optimisations de performance',
            '  • Meilleure gestion des assets',
            '',
            '🎮 CONTRÔLES:',
            '  • Flèches ou WASD pour se déplacer',
            '  • Espace/W pour sauter',
            '  • E pour miner, F pour attaquer',
            '  • M pour basculer la minimap'
        ];

        const startY = centerY - 120;
        const lineHeight = 18;

        improvements.forEach((line, index) => {
            const y = startY + index * lineHeight;
            
            if (line.startsWith('🌍') || line.startsWith('🐾') || 
                line.startsWith('🗺️') || line.startsWith('🎮')) {
                ctx.fillStyle = '#4CAF50';
                ctx.font = 'bold 16px VT323, monospace';
            } else if (line.startsWith('  •')) {
                ctx.fillStyle = '#87CEEB';
                ctx.font = '14px VT323, monospace';
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '14px VT323, monospace';
            }
            
            ctx.fillText(line, centerX - 300, y);
        });

        // Instructions de fermeture
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px VT323, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Appuyez sur ENTRÉE pour commencer l\'aventure!', centerX, centerY + 180);

        // Barre de progression
        const progressWidth = 400;
        const progressHeight = 6;
        const progressX = centerX - progressWidth / 2;
        const progressY = centerY + 200;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
        
        const progress = Math.max(0, (this.displayTime - this.currentTime) / this.displayTime);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);

        ctx.restore();
    }

    hide() {
        this.phase = 'fadeout';
    }

    isVisible() {
        return this.visible;
    }
}