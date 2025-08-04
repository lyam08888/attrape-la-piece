// windowManager.js - Gestionnaire de fenêtres modulaires type Windows 10
export class WindowManager {
    constructor() {
        this.windows = new Map();
        this.zIndexCounter = 1000;
        this.activeWindow = null;
        this.windowPositions = new Map();
        this.init();
    }

    init() {
        // Créer le conteneur principal pour les fenêtres
        this.container = document.createElement('div');
        this.container.id = 'windowContainer';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        document.body.appendChild(this.container);

        // Créer la barre des tâches
        this.createTaskbar();
        
        // Charger les positions sauvegardées
        this.loadWindowPositions();
    }

    createTaskbar() {
        this.taskbar = document.createElement('div');
        this.taskbar.id = 'gameTaskbar';
        this.taskbar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50px;
            background: linear-gradient(to bottom, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.95));
            border-top: 2px solid #555;
            display: flex;
            align-items: center;
            padding: 0 10px;
            gap: 5px;
            pointer-events: all;
            z-index: 200;
            backdrop-filter: blur(10px);
        `;
        this.container.appendChild(this.taskbar);

        // Bouton menu principal
        this.createMainMenuButton();
    }

    createMainMenuButton() {
        const menuBtn = document.createElement('button');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        menuBtn.style.cssText = `
            width: 40px;
            height: 40px;
            background: linear-gradient(to bottom, #4a4a4a, #2a2a2a);
            border: 1px solid #666;
            border-radius: 6px;
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        
        menuBtn.addEventListener('click', () => this.toggleMainMenu());
        menuBtn.addEventListener('mouseenter', () => {
            menuBtn.style.background = 'linear-gradient(to bottom, #5a5a5a, #3a3a3a)';
        });
        menuBtn.addEventListener('mouseleave', () => {
            menuBtn.style.background = 'linear-gradient(to bottom, #4a4a4a, #2a2a2a)';
        });
        
        this.taskbar.appendChild(menuBtn);
    }

    createWindow(id, title, content, options = {}) {
        if (this.windows.has(id)) {
            this.focusWindow(id);
            return this.windows.get(id);
        }

        const defaultOptions = {
            width: 400,
            height: 300,
            x: 100 + (this.windows.size * 30),
            y: 100 + (this.windows.size * 30),
            resizable: true,
            minimizable: true,
            closable: true,
            icon: 'fas fa-window-maximize'
        };

        const opts = { ...defaultOptions, ...options };
        
        // Récupérer la position sauvegardée si elle existe
        if (this.windowPositions.has(id)) {
            const saved = this.windowPositions.get(id);
            opts.x = saved.x;
            opts.y = saved.y;
            opts.width = saved.width;
            opts.height = saved.height;
        }

        const windowEl = document.createElement('div');
        windowEl.className = 'game-window';
        windowEl.id = `window-${id}`;
        windowEl.style.cssText = `
            position: absolute;
            left: ${opts.x}px;
            top: ${opts.y}px;
            width: ${opts.width}px;
            height: ${opts.height}px;
            background: linear-gradient(to bottom, rgba(45, 45, 45, 0.98), rgba(25, 25, 25, 0.98));
            border: 2px solid #555;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            pointer-events: all;
            z-index: ${++this.zIndexCounter};
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        `;

        // Header de la fenêtre
        const header = document.createElement('div');
        header.className = 'window-header';
        header.style.cssText = `
            height: 35px;
            background: linear-gradient(to bottom, #4a4a4a, #2a2a2a);
            border-bottom: 1px solid #666;
            display: flex;
            align-items: center;
            padding: 0 10px;
            cursor: move;
            user-select: none;
        `;

        // Icône et titre
        const titleArea = document.createElement('div');
        titleArea.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            color: #fff;
            font-size: 14px;
            font-weight: bold;
        `;
        titleArea.innerHTML = `<i class="${opts.icon}"></i><span>${title}</span>`;

        // Boutons de contrôle
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 2px;
        `;

        if (opts.minimizable) {
            const minBtn = this.createControlButton('−', () => this.minimizeWindow(id));
            controls.appendChild(minBtn);
        }

        const maxBtn = this.createControlButton('□', () => this.toggleMaximizeWindow(id));
        controls.appendChild(maxBtn);

        if (opts.closable) {
            const closeBtn = this.createControlButton('×', () => this.closeWindow(id));
            closeBtn.style.background = 'linear-gradient(to bottom, #e74c3c, #c0392b)';
            controls.appendChild(closeBtn);
        }

        header.appendChild(titleArea);
        header.appendChild(controls);

        // Contenu de la fenêtre
        const contentArea = document.createElement('div');
        contentArea.className = 'window-content';
        contentArea.style.cssText = `
            flex: 1;
            padding: 15px;
            overflow: auto;
            color: #fff;
            font-family: 'VT323', monospace;
        `;
        contentArea.innerHTML = content;

        // Handle de redimensionnement
        if (opts.resizable) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.style.cssText = `
                position: absolute;
                bottom: 0;
                right: 0;
                width: 15px;
                height: 15px;
                background: linear-gradient(135deg, transparent 50%, #666 50%);
                cursor: se-resize;
                z-index: 10;
            `;
            windowEl.appendChild(resizeHandle);
            this.makeResizable(windowEl, resizeHandle);
        }

        windowEl.appendChild(header);
        windowEl.appendChild(contentArea);

        // Rendre la fenêtre déplaçable
        this.makeDraggable(windowEl, header);

        // Gestion du focus
        windowEl.addEventListener('mousedown', () => this.focusWindow(id));

        this.container.appendChild(windowEl);

        // Créer le bouton dans la barre des tâches
        this.createTaskbarButton(id, title, opts.icon);

        // Stocker la fenêtre
        const windowData = {
            element: windowEl,
            id,
            title,
            options: opts,
            isMinimized: false,
            isMaximized: false,
            originalBounds: null
        };

        this.windows.set(id, windowData);
        this.focusWindow(id);

        return windowData;
    }

    createControlButton(text, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            width: 25px;
            height: 25px;
            background: linear-gradient(to bottom, #5a5a5a, #3a3a3a);
            border: 1px solid #666;
            border-radius: 3px;
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.2s;
        `;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'linear-gradient(to bottom, #6a6a6a, #4a4a4a)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'linear-gradient(to bottom, #5a5a5a, #3a3a3a)';
        });

        return btn;
    }

    createTaskbarButton(windowId, title, icon) {
        const btn = document.createElement('button');
        btn.className = 'taskbar-button';
        btn.id = `taskbar-${windowId}`;
        btn.innerHTML = `<i class="${icon}"></i><span>${title}</span>`;
        btn.style.cssText = `
            height: 35px;
            padding: 0 12px;
            background: linear-gradient(to bottom, #3a3a3a, #2a2a2a);
            border: 1px solid #555;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            transition: all 0.2s;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        btn.addEventListener('click', () => {
            const window = this.windows.get(windowId);
            if (window.isMinimized) {
                this.restoreWindow(windowId);
            } else if (this.activeWindow === windowId) {
                this.minimizeWindow(windowId);
            } else {
                this.focusWindow(windowId);
            }
        });

        this.taskbar.appendChild(btn);
    }

    makeDraggable(windowEl, handle) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        handle.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(windowEl.style.left);
            startTop = parseInt(windowEl.style.top);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            windowEl.style.transition = 'none';
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Contraintes pour éviter que la fenêtre sorte de l'écran
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 100));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - 100));
            
            windowEl.style.left = newLeft + 'px';
            windowEl.style.top = newTop + 'px';
        };

        const onMouseUp = () => {
            isDragging = false;
            windowEl.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Sauvegarder la position
            this.saveWindowPosition(windowEl.id.replace('window-', ''));
        };
    }

    makeResizable(windowEl, handle) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(windowEl.style.width);
            startHeight = parseInt(windowEl.style.height);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            windowEl.style.transition = 'none';
        });

        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth = Math.max(200, startWidth + deltaX);
            let newHeight = Math.max(150, startHeight + deltaY);
            
            windowEl.style.width = newWidth + 'px';
            windowEl.style.height = newHeight + 'px';
        };

        const onMouseUp = () => {
            isResizing = false;
            windowEl.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Sauvegarder la taille
            this.saveWindowPosition(windowEl.id.replace('window-', ''));
        };
    }

    focusWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        // Retirer le focus des autres fenêtres
        this.windows.forEach((w, id) => {
            w.element.style.zIndex = w.element.style.zIndex || this.zIndexCounter;
            const taskbarBtn = document.getElementById(`taskbar-${id}`);
            if (taskbarBtn) {
                taskbarBtn.style.background = 'linear-gradient(to bottom, #3a3a3a, #2a2a2a)';
            }
        });

        // Donner le focus à la fenêtre
        window.element.style.zIndex = ++this.zIndexCounter;
        this.activeWindow = windowId;
        
        const taskbarBtn = document.getElementById(`taskbar-${windowId}`);
        if (taskbarBtn) {
            taskbarBtn.style.background = 'linear-gradient(to bottom, #4a4a4a, #3a3a3a)';
        }
    }

    minimizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.element.style.transform = 'scale(0.1)';
        window.element.style.opacity = '0';
        window.element.style.pointerEvents = 'none';
        window.isMinimized = true;

        setTimeout(() => {
            window.element.style.display = 'none';
        }, 300);
    }

    restoreWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.element.style.display = 'flex';
        window.element.style.pointerEvents = 'all';
        
        setTimeout(() => {
            window.element.style.transform = 'scale(1)';
            window.element.style.opacity = '1';
            window.isMinimized = false;
            this.focusWindow(windowId);
        }, 10);
    }

    toggleMaximizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        if (window.isMaximized) {
            // Restaurer
            if (window.originalBounds) {
                window.element.style.left = window.originalBounds.left + 'px';
                window.element.style.top = window.originalBounds.top + 'px';
                window.element.style.width = window.originalBounds.width + 'px';
                window.element.style.height = window.originalBounds.height + 'px';
            }
            window.isMaximized = false;
        } else {
            // Maximiser
            window.originalBounds = {
                left: parseInt(window.element.style.left),
                top: parseInt(window.element.style.top),
                width: parseInt(window.element.style.width),
                height: parseInt(window.element.style.height)
            };
            
            window.element.style.left = '0px';
            window.element.style.top = '0px';
            window.element.style.width = '100%';
            window.element.style.height = 'calc(100% - 50px)'; // Moins la hauteur de la taskbar
            window.isMaximized = true;
        }
    }

    closeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        // Animation de fermeture
        window.element.style.transform = 'scale(0.8)';
        window.element.style.opacity = '0';

        setTimeout(() => {
            window.element.remove();
            
            // Supprimer le bouton de la barre des tâches
            const taskbarBtn = document.getElementById(`taskbar-${windowId}`);
            if (taskbarBtn) taskbarBtn.remove();
            
            this.windows.delete(windowId);
            
            if (this.activeWindow === windowId) {
                this.activeWindow = null;
            }
        }, 300);
    }

    saveWindowPosition(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        const position = {
            x: parseInt(window.element.style.left),
            y: parseInt(window.element.style.top),
            width: parseInt(window.element.style.width),
            height: parseInt(window.element.style.height)
        };

        this.windowPositions.set(windowId, position);
        localStorage.setItem('gameWindowPositions', JSON.stringify(Array.from(this.windowPositions.entries())));
    }

    loadWindowPositions() {
        try {
            const saved = localStorage.getItem('gameWindowPositions');
            if (saved) {
                const positions = JSON.parse(saved);
                this.windowPositions = new Map(positions);
            }
        } catch (e) {
            console.warn('Impossible de charger les positions des fenêtres:', e);
        }
    }

    toggleMainMenu() {
        // TODO: Implémenter le menu principal
        console.log('Menu principal à implémenter');
    }

    // Méthodes utilitaires
    isWindowOpen(windowId) {
        return this.windows.has(windowId);
    }

    getWindow(windowId) {
        return this.windows.get(windowId);
    }

    updateWindowContent(windowId, content) {
        const window = this.windows.get(windowId);
        if (window) {
            const contentArea = window.element.querySelector('.window-content');
            if (contentArea) {
                contentArea.innerHTML = content;
            }
        }
    }
}

// Instance globale
export const windowManager = new WindowManager();