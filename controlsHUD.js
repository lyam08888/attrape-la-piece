// controlsHUD.js - Interface d'aide pour les contrôles

export class ControlsHUD {
    constructor() {
        this.visible = true;
        this.fadeTimer = 10; // Afficher pendant 10 secondes au début
        this.alpha = 1;
    }

    update(delta) {
        if (this.fadeTimer > 0) {
            this.fadeTimer -= delta;
            if (this.fadeTimer <= 3) {
                // Commencer à faire disparaître dans les 3 dernières secondes
                this.alpha = Math.max(0, this.fadeTimer / 3);
            }
        } else {
            this.visible = false;
        }
    }

    draw(ctx) {
        if (!this.visible || this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;

        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 300, 200);

        // Bordure
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 300, 200);

        // Titre
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 16px VT323, monospace';
        ctx.fillText('CONTRÔLES', 20, 35);

        // Contrôles
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px VT323, monospace';
        
        const controls = [
            'Flèches / WASD : Se déplacer',
            'Espace / W : Sauter',
            'E : Action / Miner',
            'F : Attaquer',
            'Clic gauche : Miner',
            'Clic droit : Construire',
            'I : Inventaire',
            'P : Personnage',
            'Q : Quêtes',
            'F12 : Debug'
        ];

        controls.forEach((control, index) => {
            ctx.fillText(control, 20, 55 + index * 16);
        });

        ctx.restore();
    }

    show() {
        this.visible = true;
        this.fadeTimer = 10;
        this.alpha = 1;
    }

    hide() {
        this.visible = false;
    }
}