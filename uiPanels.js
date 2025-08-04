export function createPanel(id, title, content) {
    const panel = document.createElement('div');
    panel.id = id;
    panel.classList.add('draggable');
    panel.innerHTML = `
        <div class="panel-header">
            <div class="panel-title"></div>
            <div class="panel-controls">
                <div class="panel-btn minimize-btn">−</div>
            </div>
        </div>
        <div class="panel-content">${content}</div>
        <div class="resize-handle"></div>
    `;
    panel.querySelector('.panel-title').textContent = title;
    return panel;
}

export function createEnvironmentPanel(hud) {
    if (!hud) return;
    const content = `
        <div class="environment-info">
            <i class="fa-solid fa-clock info-icon"></i>
            <span>Temps: </span>
            <span class="info-value" id="gameTime">06:00</span>
        </div>
        <div class="environment-info">
            <i class="fa-solid fa-calendar-day info-icon"></i>
            <span>Date: </span>
            <span class="info-value" id="gameDate">Jour 1</span>
        </div>
        <div class="environment-info">
            <i id="weatherIcon" class="fa-solid fa-sun info-icon"></i>
            <span>Météo: </span>
            <span class="info-value" id="gameWeather">Clair</span>
        </div>
        <div class="environment-info">
            <i class="fa-solid fa-mountain info-icon"></i>
            <span>Biome: </span>
            <span class="info-value" id="currentBiome">Surface</span>
        </div>
    `;
    const panel = createPanel('environmentPanel', 'ENVIRONNEMENT', content);
    hud.appendChild(panel);
    window.makeDraggable?.(panel);
    window.makeResizable?.(panel);
    window.setupMinimize?.(panel);
}

export function createDisasterMenu(hud) {
    if (!hud) return;
    const content = `
        <p><span class="key-hint">F1</span> : Orage</p>
        <p><span class="key-hint">F2</span> : Tremblement de terre</p>
        <p><span class="key-hint">F3</span> : Pluie de météores</p>
    `;
    const panel = createPanel('disasterMenu', 'CATASTROPHES', content);
    hud.appendChild(panel);
    window.makeDraggable?.(panel);
    window.makeResizable?.(panel);
    window.setupMinimize?.(panel);
}

export function createCharacterPanel(hud) {
    if (!hud) return;
    const content = `
        <div class="character-content">
            <div class="character-stat">
                <span class="stat-label">Niveau:</span>
                <span class="stat-value" id="playerLevel">1</span>
            </div>
            <div class="character-stat">
                <span class="stat-label">XP:</span>
                <span class="stat-value" id="playerXP">0/100</span>
            </div>
            <div class="bar-container">
                <div class="bar-fill xp-fill" id="playerXPFill" style="width: 0%"></div>
                <span class="bar-text" id="playerXPText">0/100</span>
            </div>
            <div class="character-stat">
                <span class="stat-label">Santé:</span>
                <span class="stat-value" id="playerHealth">100/100</span>
            </div>
            <div class="bar-container">
                <div class="bar-fill health-fill" id="playerHealthFill" style="width: 100%"></div>
                <span class="bar-text" id="playerHealthText">100/100</span>
            </div>
            <div class="character-stat">
                <span class="stat-label">Faim:</span>
                <span class="stat-value" id="playerHunger">100/100</span>
            </div>
            <div class="bar-container">
                <div class="bar-fill hunger-fill" id="playerHungerFill" style="width: 100%"></div>
                <span class="bar-text" id="playerHungerText">100/100</span>
            </div>
            <div class="character-stat">
                <span class="stat-label">Force:</span>
                <span class="stat-value" id="playerStrength">10</span>
            </div>
            <div class="character-stat">
                <span class="stat-label">Vitesse:</span>
                <span class="stat-value" id="playerSpeed">10</span>
            </div>
            <div class="character-stat">
                <span class="stat-label">Coffres:</span>
                <span class="stat-value" id="chestsOpened">0</span>
            </div>
            <div class="character-stat">
                <span class="stat-label">Animaux:</span>
                <span class="stat-value" id="animalsObserved">0</span>
            </div>
            <div class="character-stat">
                <span class="stat-label">Survie:</span>
                <span class="stat-value" id="survivalItemsFound">0</span>
            </div>
        </div>
    `;
    const panel = createPanel('characterPanel', 'PERSONNAGE', content);
    hud.appendChild(panel);
    window.makeDraggable?.(panel);
    window.makeResizable?.(panel);
    window.setupMinimize?.(panel);
}
