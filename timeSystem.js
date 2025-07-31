export class TimeSystem {
    constructor() {
        this.totalMinutes = 6 * 60; // start at 06:00
        this.lastUpdate = performance.now();
        this.minutesPerDay = 24 * 60;
        this.daysPerMonth = 30;
        this.monthsPerYear = 12;
    }

    reset() {
        this.totalMinutes = 6 * 60;
        this.lastUpdate = performance.now();
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
        const year = Math.floor(minutes / minutesPerYear) + 1;
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
        const { hour } = this.getTime();
        if (hour >= 5 && hour < 7) return 'aube';
        if (hour >= 7 && hour < 12) return 'matin';
        if (hour === 12) return 'midi';
        if (hour > 12 && hour < 17) return 'après-midi';
        if (hour >= 17 && hour < 19) return 'soir';
        if (hour >= 19 || hour < 5) return 'nuit';
        return 'jour';
    }

    getSunPosition(width, height) {
        const { hour, minute } = this.getTime();
        const t = (hour + minute / 60) / 24;
        const angle = t * Math.PI * 2 - Math.PI / 2;
        const radiusX = width / 2;
        const radiusY = height / 2;
        const centerX = width / 2;
        const centerY = height / 2;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY * 0.6;
        return { x, y };
    }

    getMoonPosition(width, height) {
        const { hour, minute } = this.getTime();
        const t = (hour + minute / 60) / 24;
        const angle = t * Math.PI * 2 + Math.PI / 2;
        const radiusX = width / 2;
        const radiusY = height / 2;
        const centerX = width / 2;
        const centerY = height / 2;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY * 0.6;
        return { x, y };
    }

    formatDateTime() {
        const { year, month, day } = this.getDate();
        const { hour, minute } = this.getTime();
        const pad = n => n.toString().padStart(2, '0');
        return `${day}/${month}/${year} ${pad(hour)}:${pad(minute)}`;
    }
}
