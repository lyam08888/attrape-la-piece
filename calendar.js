export class TimeSystem {
    constructor() {
        this.totalMinutes = 6 * 60; // start at 06:00
        this.lastUpdate = performance.now();
        this.minutesPerDay = 24 * 60;
        this.daysPerMonth = 30;
        this.monthsPerYear = 12;
    }

    update() {
        const now = performance.now();
        const deltaSeconds = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        this.totalMinutes += deltaSeconds; // 1 real second = 1 in-game minute
    }

    getDate() {
        const minutesPerMonth = this.minutesPerDay * this.daysPerMonth;
        const minutesPerYear = minutesPerMonth * this.monthsPerYear;
        let minutes = Math.floor(this.totalMinutes);
        const year = Math.floor(minutes / minutesPerYear) + 2025;
        minutes %= minutesPerYear;
        const month = Math.floor(minutes / minutesPerMonth) + 1;
        minutes %= minutesPerMonth;
        const day = Math.floor(minutes / this.minutesPerDay) + 1;
        return { year, month, day };
    }

    getTime() {
        let minutes = Math.floor(this.totalMinutes) % this.minutesPerDay;
        const hour = Math.floor(minutes / 60);
        const minute = Math.floor(minutes % 60);
        return { hour, minute };
    }

    getStage() {
        const { hour, minute } = this.getTime();
        const t = hour + minute / 60;
        if (t >= 4.5 && t < 6) return 'Aube';
        if (t >= 6 && t < 9) return 'Matin';
        if (t >= 9 && t < 12) return 'Fin de matinée';
        if (t >= 12 && t < 14) return 'Midi';
        if (t >= 14 && t < 17.5) return 'Après-midi';
        if (t >= 17.5 && t < 19.5) return 'Soir';
        if (t >= 19.5 && t < 21) return 'Crépuscule';
        return 'Nuit';
    }

    getSunPosition(width, height) {
        const { hour, minute } = this.getTime();
        const t = (hour + minute / 60 - 6) / 12; // 6h -> 0, 18h -> 1
        const angle = t * Math.PI; // horizon to horizon
        const radiusX = width / 2;
        const radiusY = height / 2;
        const centerX = width / 2;
        const centerY = height * 0.9;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY - Math.sin(angle) * radiusY;
        return { x, y };
    }

    getMoonPosition(width, height) {
        const { hour, minute } = this.getTime();
        const t = (hour + minute / 60 - 18) / 12; // 18h -> 0, 6h -> 1
        const angle = t * Math.PI;
        const radiusX = width / 2;
        const radiusY = height / 2;
        const centerX = width / 2;
        const centerY = height * 0.9;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY - Math.sin(angle) * radiusY;
        return { x, y };
    }

    getSkyGradient() {
        const { hour, minute } = this.getTime();
        const t = hour + minute / 60;
        if (t < 6) return ['#1b2236','#101022'];
        if (t < 8) return ['#FFD580','#568DC8'];
        if (t < 11) return ['#AEE6FF','#86B1E2'];
        if (t < 15) return ['#87CEEB','#FFFACD'];
        if (t < 18) return ['#FFD580','#FFB347'];
        if (t < 21) return ['#FF9A22','#7A3A1D'];
        return ['#1b2236','#101022'];
    }

    formatDateTime() {
        const { year, month, day } = this.getDate();
        const { hour, minute } = this.getTime();
        const pad = n => n.toString().padStart(2, '0');
        return `${day}/${month}/${year} ${pad(hour)}:${pad(minute)}`;
    }
}

export function updateCalendarUI(timeSystem, elements) {
    if (!elements) return;
    const { day, month, year } = timeSystem.getDate();
    const { hour, minute } = timeSystem.getTime();
    const pad = n => n.toString().padStart(2, '0');
    if (elements.date) elements.date.textContent = `Jour ${day}, Mois ${month}, Année ${year}`;
    if (elements.time) elements.time.textContent = `${pad(hour)}:${pad(minute)}`;
    if (elements.stage) elements.stage.textContent = timeSystem.getStage();
}
