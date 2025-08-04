export class ChatSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'chat';
        this.container.classList.add('hidden');
        this.container.innerHTML = `
            <div id="chat-messages"></div>
            <div id="chat-input-wrapper">
                <input id="chat-input" type="text" placeholder="Tapez un message..." />
                <button id="chat-voice" title="Parler">🎤</button>
            </div>`;
        document.body.appendChild(this.container);

        this.messagesEl = this.container.querySelector('#chat-messages');
        this.input = this.container.querySelector('#chat-input');
        this.voiceBtn = this.container.querySelector('#chat-voice');

        // Speech recognition
        this.recognition = null;
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SR();
            this.recognition.lang = 'fr-FR';
            this.recognition.onresult = (e) => {
                const text = e.results[0][0].transcript;
                this.addMessage(`Vous: ${text}`, 'player');
                this.input.value = '';
                this.hide();
            };
        }

        this.voiceBtn.addEventListener('click', () => {
            if (this.recognition) {
                this.recognition.start();
            }
        });

        // Send message on Enter
        this.input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                const text = this.input.value.trim();
                if (text) {
                    this.addMessage(`Vous: ${text}`, 'player');
                    this.input.value = '';
                }
                this.hide();
            }
        });
        this.input.addEventListener('keyup', (e) => e.stopPropagation());

        // Toggle chat with Enter and hide with Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement !== this.input) {
                e.preventDefault();
                this.show();
                this.input.focus();
            } else if (e.key === 'Escape' && this.isOpen()) {
                this.hide();
            }
        });
    }

    addMessage(text, type = 'info') {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        div.textContent = text;
        this.messagesEl.appendChild(div);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

        if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'fr-FR';
            window.speechSynthesis.speak(utter);
        }
    }

    addLog(text, type = 'log') {
        this.addMessage(text, `log ${type}`);
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
        this.input.blur();
    }

    toggle() {
        if (this.isOpen()) this.hide(); else this.show();
    }

    isOpen() {
        return !this.container.classList.contains('hidden');
    }
}
