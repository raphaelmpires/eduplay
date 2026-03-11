// ============================================================
// EduPlay Library v1.1
// Biblioteca central para jogos educativos
// ============================================================

// ---------- TEXT-TO-SPEECH ----------
const TTS = {
  speak(text, lang = 'en-US', rate = 0.85) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = 1.1;
    window.speechSynthesis.speak(utter);
  },
  stop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
};

// ---------- PROGRESS STORAGE (por usuário) ----------
const Progress = {
  _user() {
    return (localStorage.getItem('eduplay_current_user') || 'default')
      .toLowerCase().replace(/\s+/g, '_');
  },
  key(gameId) {
    return `eduplay_${this._user()}_progress_${gameId}`;
  },
  save(gameId, data) {
    try { localStorage.setItem(this.key(gameId), JSON.stringify(data)); } catch (e) { }
  },
  load(gameId) {
    try {
      const d = localStorage.getItem(this.key(gameId));
      return d ? JSON.parse(d) : null;
    } catch (e) { return null; }
  },
  clear(gameId) {
    try { localStorage.removeItem(this.key(gameId)); } catch (e) { }
  },
  // Apaga todo o progresso do usuário atual
  clearAll() {
    const prefix = `eduplay_${this._user()}_progress_`;
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));
  }
};

// ---------- QUIZ ENGINE ----------
class QuizEngine {
  constructor(sections, options = {}) {
    this.sections = sections;           // array de { title, questions[] }
    this.options = {
      maxRepeats: 2,                    // repetições para erros
      onSectionComplete: null,
      onAllComplete: null,
      onQuestionShow: null,
      ...options
    };
    this.reset();
  }

  reset() {
    this.currentSection = 0;
    this.queue = [];
    this.errors = {};                   // questionId -> repeat count restante
    this.score = { correct: 0, total: 0 };
    this.phase = 'quiz';               // 'quiz' | 'reward' | 'done'
    this._buildQueue(0);
  }

  _buildQueue(sectionIdx) {
    const section = this.sections[sectionIdx];
    if (!section) return;
    this.queue = [...section.questions.map((q, i) => ({ ...q, _idx: i, _sectionIdx: sectionIdx }))];
    this._shuffle(this.queue);
    this.errors = {};
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  current() {
    return this.queue[0] || null;
  }

  answer(questionId, correct) {
    this.score.total++;
    if (correct) {
      this.score.correct++;
      this.queue.shift();
    } else {
      const q = this.queue.shift();
      const repeatsLeft = (this.errors[questionId] ?? this.options.maxRepeats);
      if (repeatsLeft > 0) {
        this.errors[questionId] = repeatsLeft - 1;
        const alreadyInQueue = this.queue.some(x => x.id === questionId);
        if (!alreadyInQueue) this.queue.push(q);
      }
    }

    if (this.queue.length === 0) {
      this._onSectionDone();
    }
  }

  _onSectionDone() {
    if (this.options.onSectionComplete) {
      this.options.onSectionComplete(this.currentSection, this.score);
    }
    const nextSection = this.currentSection + 1;
    if (nextSection < this.sections.length) {
      this.phase = 'reward';
      this._pendingNext = nextSection;
    } else {
      this.phase = 'done';
      if (this.options.onAllComplete) this.options.onAllComplete(this.score);
    }
  }

  advanceAfterReward() {
    if (this._pendingNext !== undefined) {
      this.currentSection = this._pendingNext;
      this._buildQueue(this.currentSection);
      this.phase = 'quiz';
      delete this._pendingNext;
    }
  }

  // Retorna quantas perguntas ÚNICAS já foram respondidas nesta seção
  sectionProgress() {
    const section = this.sections[this.currentSection];
    const total = section ? section.questions.length : 0;
    const uniqueRemaining = new Set(this.queue.map(q => q.id)).size;
    const done = Math.max(0, total - uniqueRemaining);
    return { done, total };
  }

  progress() {
    const { done, total } = this.sectionProgress();
    return { section: this.currentSection, totalSections: this.sections.length, done, total };
  }
}

// ---------- UI HELPERS ----------
const UI = {
  // Cria botão de play/falar
  playBtn(text, lang = 'en-US') {
    const btn = document.createElement('button');
    btn.className = 'ep-play-btn';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    btn.title = `Listen: ${text}`;
    btn.onclick = (e) => {
      e.stopPropagation();
      btn.classList.add('playing');
      TTS.speak(text, lang);
      setTimeout(() => btn.classList.remove('playing'), 2000);
    };
    return btn;
  },

  // Animação de confete
  confetti(container, count = 60) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'ep-confetti';
      el.style.cssText = `
        left:${Math.random() * 100}%;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        width:${6 + Math.random() * 8}px;
        height:${6 + Math.random() * 8}px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        animation-delay:${Math.random() * 1}s;
        animation-duration:${1.5 + Math.random() * 1.5}s;
      `;
      container.appendChild(el);
      setTimeout(() => el.remove(), 3500);
    }
  },

  // Toast de feedback
  feedback(container, correct, message) {
    const el = document.createElement('div');
    el.className = `ep-feedback ${correct ? 'ep-feedback-ok' : 'ep-feedback-err'}`;
    el.innerHTML = message;
    container.appendChild(el);
    setTimeout(() => { el.classList.add('ep-feedback-hide'); setTimeout(() => el.remove(), 400); }, 1400);
  }
};

// ---------- TRANSLATION ----------
const Translation = {
  init() {
    if (this._initialized) return;
    this._initialized = true;

    const style = document.createElement('style');
    style.textContent = `
      .ep-translate-wrap {
        display: inline-block;
        position: relative;
      }
      .ep-translate-wrap .ep-translate {
        cursor: pointer;
        border-bottom: 2px dashed rgba(26, 111, 196, 0.4);
        transition: border-color 0.2s, background 0.2s;
        border-radius: 4px;
        padding: 0 2px;
      }
      .ep-translate-wrap.show-tooltip .ep-translate, 
      .ep-translate-wrap:hover .ep-translate {
        border-bottom-color: #1a6fc4;
        background: rgba(26, 111, 196, 0.05);
      }
      .ep-translate-tooltip {
        visibility: hidden;
        opacity: 0;
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(5px);
        background: #2d3561;
        color: #fff;
        font-family: 'Nunito', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 8px;
        white-space: nowrap;
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(45, 53, 97, 0.2);
        margin-bottom: 8px;
      }
      .ep-translate-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px;
        border-style: solid;
        border-color: #2d3561 transparent transparent transparent;
      }
      .ep-translate-wrap.show-tooltip .ep-translate-tooltip {
        visibility: visible;
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('click', (e) => {
      const active = document.querySelectorAll('.ep-translate-wrap.show-tooltip');
      active.forEach(el => {
        if (!el.contains(e.target)) el.classList.remove('show-tooltip');
      });
    });

    // Auto-translate static elements
    document.querySelectorAll('[data-pt]').forEach(el => {
      const en = el.getAttribute('data-en') || el.innerHTML;
      const pt = el.getAttribute('data-pt');
      el.innerHTML = this.t(en, pt);
      el.removeAttribute('data-pt');
    });
  },

  t(en, pt) {
    const safePt = pt.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    return `<span class="ep-translate-wrap" onclick="document.querySelectorAll('.ep-translate-wrap.show-tooltip').forEach(el => { if(el !== this) el.classList.remove('show-tooltip'); }); this.classList.toggle('show-tooltip');"><span class="ep-translate">${en}</span><span class="ep-translate-tooltip">🇧🇷 ${safePt}</span></span>`;
  }
};

// Exporta globalmente
window.EduPlay = { TTS, Progress, QuizEngine, UI, Translation };
