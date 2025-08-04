export function createPanel(id, title, content) {
    const panel = document.createElement('div');
    panel.id = id;
    panel.classList.add('draggable');
    panel.innerHTML = `
        <div class="panel-header">
            <div class="panel-title">${title}</div>
            <div class="panel-controls">
                <div class="panel-btn minimize-btn">−</div>
            </div>
        </div>
        <div class="panel-content">${content}</div>
        <div class="resize-handle"></div>
    `;
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
