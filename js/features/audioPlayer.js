// LIVA - Lecteur Audio Haute-Fidélité & Synthèse Vocale Narrative (TTS)
import { Toast } from '../components/Toast.js';
import { escapeHTML } from '../utils/sanitize.js';

export const VOICE_PERSONAS = {
  amira: {
    id: 'amira',
    name: 'Amira',
    gender: 'female',
    tagline: 'Voix Chaleureuse & Narrative',
    description: 'Diction douce, intonation bienveillante et émotive. Idéale pour les romances, drames et tranches de vie.',
    emoji: '🌸',
    pitch: 1.04,
    rate: 0.94,
    preferredVoices: ['Amélie', 'Audrey', 'Denise', 'Eloise', 'Google français', 'French', 'fr-FR']
  },
  thomas: {
    id: 'thomas',
    name: 'Thomas',
    gender: 'male',
    tagline: 'Voix Profonde & Immersive',
    description: 'Timbre grave, posé et captivant. Idéal pour les thrillers, science-fiction, fantastique et enquêtes.',
    emoji: '🎙️',
    pitch: 0.86,
    rate: 0.90,
    preferredVoices: ['Thomas', 'Henri', 'Paul', 'Google français', 'French', 'fr-FR']
  },
  aurelie: {
    id: 'aurelie',
    name: 'Aurélie',
    gender: 'female',
    tagline: 'Voix Claire & Expressive',
    description: 'Énergique, vivante et rythmée. Idéale pour les dialogues animés, la jeunesse et les récits d\'action.',
    emoji: '✨',
    pitch: 1.08,
    rate: 1.00,
    preferredVoices: ['Aurelie', 'Vivienne', 'Julie', 'Google français', 'French', 'fr-FR']
  },
  henri: {
    id: 'henri',
    name: 'Henri',
    gender: 'male',
    tagline: 'Voix Conteuse Classique',
    description: 'Noblesse littéraire et diction soignée. Idéale pour les contes, romans historiques et grandes épopées.',
    emoji: '📜',
    pitch: 0.92,
    rate: 0.88,
    preferredVoices: ['Henri', 'Thomas', 'Paul', 'Google français', 'French', 'fr-FR']
  },
  system: {
    id: 'system',
    name: 'Voix de l\'Appareil',
    gender: 'neutral',
    tagline: 'Sélection Manuelle Système',
    description: 'Utilise directement la meilleure voix installée sur votre navigateur ou téléphone.',
    emoji: '⚙️',
    pitch: 1.0,
    rate: 1.0,
    preferredVoices: []
  }
};

const TEST_SAMPLE_TEXT = "Bonjour, je suis votre voix narrative LIVA. Installez-vous confortablement et laissez-vous emporter par votre histoire.";

export class AudioPlayer {
  constructor(store) {
    this.store = store;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStory = null;
    this.currentChapterIndex = 0;
    this.currentChapter = null;
    
    // Segmented sentences for human-like reading
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.totalSentences = 0;
    
    // Playback settings
    this.playbackRate = 1.0;
    this.activePersonaId = 'amira';
    this.selectedVoiceURI = null;
    this.customPitch = 1.0;
    this.autoHighlight = true;
    
    // Timer & Speech Utterance
    this.timer = null;
    this.currentUtterance = null;
    this.availableVoices = [];
    this.isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    
    // Load saved preferences
    this.loadSavedSettings();
    
    // Initialize voices
    this.initVoices();
  }

  loadSavedSettings() {
    try {
      const saved = localStorage.getItem('liva_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activePersonaId && (VOICE_PERSONAS[parsed.activePersonaId] || parsed.activePersonaId === 'system')) {
          this.activePersonaId = parsed.activePersonaId;
        }
        if (parsed.playbackRate) this.playbackRate = parseFloat(parsed.playbackRate) || 1.0;
        if (parsed.selectedVoiceURI) this.selectedVoiceURI = parsed.selectedVoiceURI;
        if (parsed.customPitch) this.customPitch = parseFloat(parsed.customPitch) || 1.0;
        if (typeof parsed.autoHighlight === 'boolean') this.autoHighlight = parsed.autoHighlight;
      }
    } catch (e) {
      console.warn('[AudioPlayer] Impossible de charger les préférences audio:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('liva_audio_settings', JSON.stringify({
        activePersonaId: this.activePersonaId,
        playbackRate: this.playbackRate,
        selectedVoiceURI: this.selectedVoiceURI,
        customPitch: this.customPitch,
        autoHighlight: this.autoHighlight
      }));
    } catch (e) {}
  }

  initVoices() {
    if (!this.isSpeechSupported) return;

    const populate = () => {
      const all = window.speechSynthesis.getVoices() || [];
      // Prioritize French voices, but keep all available
      this.availableVoices = all.filter(v => (v.lang || '').toLowerCase().startsWith('fr'));
      if (this.availableVoices.length === 0) {
        this.availableVoices = all;
      }
    };

    populate();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populate;
    }
  }

  getBestVoiceForPersona(personaId) {
    if (!this.isSpeechSupported || this.availableVoices.length === 0) return null;

    if (this.selectedVoiceURI && personaId === 'system') {
      const exact = this.availableVoices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (exact) return exact;
    }

    const persona = VOICE_PERSONAS[personaId] || VOICE_PERSONAS.amira;
    const preferredList = persona.preferredVoices || [];

    // 1. Try to match preferred voice names (e.g. Thomas, Aurelie, Amelie, etc.)
    for (const pref of preferredList) {
      const match = this.availableVoices.find(v => 
        (v.name || '').toLowerCase().includes(pref.toLowerCase()) ||
        (v.voiceURI || '').toLowerCase().includes(pref.toLowerCase())
      );
      if (match) return match;
    }

    // 2. Try to find any French voice
    const frVoice = this.availableVoices.find(v => (v.lang || '').toLowerCase().startsWith('fr'));
    if (frVoice) return frVoice;

    // 3. Fallback to first available
    return this.availableVoices[0] || null;
  }

  init() {
    this.container = document.getElementById('floating-audio-bar');
    if (!this.container) return;

    this.playBtn = this.container.querySelector('#audio-play-toggle');
    this.titleEl = this.container.querySelector('#audio-bar-title');
    this.voiceEl = this.container.querySelector('#audio-bar-voice');
    this.coverEl = this.container.querySelector('#audio-bar-cover-img');
    this.scrubberFill = this.container.querySelector('#audio-scrubber-fill');
    this.rateBtn = this.container.querySelector('#audio-rate-btn');
    this.closeBtn = this.container.querySelector('#audio-close-btn');

    this.bindEvents();
    this.injectVoiceStudioModal();
  }

  bindEvents() {
    if (this.playBtn) {
      this.playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    }

    if (this.rateBtn) {
      this.rateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cyclePlaybackRate();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopAndHide();
      });
    }

    const skipBack = this.container.querySelector('#audio-skip-back');
    if (skipBack) {
      skipBack.addEventListener('click', (e) => {
        e.stopPropagation();
        this.seekBySeconds(-15);
      });
    }

    const skipForward = this.container.querySelector('#audio-skip-forward');
    if (skipForward) {
      skipForward.addEventListener('click', (e) => {
        e.stopPropagation();
        this.seekBySeconds(15);
      });
    }

    // Open Voice Studio on clicking voice chip or player info
    const voiceChip = this.container.querySelector('#audio-bar-voice');
    if (voiceChip) {
      voiceChip.style.cursor = 'pointer';
      voiceChip.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openVoiceStudio();
      });
    }

    const track = this.container.querySelector('#audio-scrubber-track');
    if (track) {
      track.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = track.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const targetSentence = Math.floor(percent * (this.totalSentences || 1));
        this.seekToSentence(targetSentence);
      });
    }
  }

  /**
   * Découpage du texte du chapitre en phrases narratives fluides
   */
  prepareChapterSentences(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') return [];

    // Nettoyer les balises de mise en forme (Markdown, astérisques, dièses, tirets superflus)
    const cleanText = rawContent
      .replace(/^#{1,6}\s+.+$/gm, '') // Titres markdown
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Gras
      .replace(/\*([^*]+)\*/g, '$1') // Italique
      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    // Découpage intelligent par phrases avec ponctuation (., !, ?, …, guillemets)
    const rawSegments = cleanText.match(/[^.?!…\n]+[.?!…]+|[^.?!…\n]+/g) || [];
    
    const sentences = [];
    rawSegments.forEach((seg, idx) => {
      const trimmed = seg.trim();
      if (trimmed.length > 0) {
        sentences.push({
          index: sentences.length,
          text: trimmed,
          rawIndex: idx
        });
      }
    });

    return sentences;
  }

  /**
   * Lancement d'une histoire et d'un chapitre
   */
  playStory(storyId, chapterIndex = 0, startSentenceIndex = 0) {
    const story = this.store.getStoryById(storyId) || this.store.getAllStories().find(s => String(s.id) === String(storyId));
    if (!story) {
      Toast.show('Histoire introuvable.', 'warning', '⚠️');
      return;
    }

    const chapters = story.chapters || [];
    const chapter = chapters[chapterIndex] || chapters[0] || { title: 'Chapitre 1', content: '' };

    this.currentStory = story;
    this.currentChapterIndex = chapterIndex;
    this.currentChapter = chapter;

    // Découper le texte en phrases narratives
    this.sentences = this.prepareChapterSentences(chapter.content);
    this.totalSentences = this.sentences.length;
    this.currentSentenceIndex = Math.max(0, Math.min(startSentenceIndex, this.totalSentences - 1));

    // Mettre à jour l'interface du lecteur flottant
    this.updateBarMeta();
    if (this.container) {
      this.container.classList.add('active');
    }

    // Démarrer la lecture vocale
    this.startSpeechLoop();

    const persona = VOICE_PERSONAS[this.activePersonaId] || VOICE_PERSONAS.amira;
    Toast.show(`Lecture audio : ${chapter.title} (${persona.name})`, 'info', persona.emoji || '🎧', 3500);

    this.broadcastState();
  }

  updateBarMeta() {
    if (!this.container) return;
    const persona = VOICE_PERSONAS[this.activePersonaId] || VOICE_PERSONAS.amira;

    if (this.titleEl && this.currentStory) {
      this.titleEl.textContent = `${this.currentStory.title} · ${this.currentChapter?.title || 'Chapitre'}`;
    }
    if (this.voiceEl) {
      this.voiceEl.innerHTML = `<span style="font-size: 0.95rem;">${persona.emoji}</span> <strong>${persona.name}</strong> · ${persona.tagline} <span style="opacity: 0.6; font-size: 0.65rem; margin-left: 2px;">(Modifier ⚙️)</span>`;
    }
    if (this.coverEl && this.currentStory) {
      this.coverEl.src = this.currentStory.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
    }
    if (this.rateBtn) {
      this.rateBtn.textContent = `${this.playbackRate}x`;
    }
    this.updateProgressUI();
  }

  startSpeechLoop() {
    this.isPlaying = true;
    this.isPaused = false;
    this.updatePlayBtnUI();

    if (!this.isSpeechSupported) {
      Toast.show('La synthèse vocale n\'est pas prise en charge sur ce navigateur.', 'warning', '🎙️');
      return;
    }

    this.speakCurrentSentence();
  }

  speakCurrentSentence() {
    if (!this.isPlaying) return;

    if (this.currentSentenceIndex >= this.totalSentences || this.totalSentences === 0) {
      this.onChapterCompleted();
      return;
    }

    const currentItem = this.sentences[this.currentSentenceIndex];
    if (!currentItem || !currentItem.text) {
      this.currentSentenceIndex++;
      this.speakCurrentSentence();
      return;
    }

    window.speechSynthesis.cancel();

    const persona = VOICE_PERSONAS[this.activePersonaId] || VOICE_PERSONAS.amira;
    const voiceObj = this.getBestVoiceForPersona(this.activePersonaId);

    const utterance = new SpeechSynthesisUtterance(currentItem.text);
    utterance.lang = voiceObj?.lang || 'fr-FR';
    if (voiceObj) {
      utterance.voice = voiceObj;
    }

    // Paramètres expressifs de tonalité et de rythme
    utterance.rate = (persona.rate || 1.0) * this.playbackRate;
    utterance.pitch = (this.activePersonaId === 'system' ? this.customPitch : persona.pitch) || 1.0;
    utterance.volume = 1.0;

    this.currentUtterance = utterance;

    // Événement début de phrase
    utterance.onstart = () => {
      this.updateProgressUI();
      this.notifySentenceChange(currentItem);
    };

    // Événement fin de phrase : avancer naturellement
    utterance.onend = () => {
      if (!this.isPlaying || this.isPaused) return;

      this.currentSentenceIndex++;
      this.updateProgressUI();

      // Pause respiratoire naturelle entre phrases (micro-délai narratif)
      const pauseDelay = currentItem.text.endsWith('\n') ? 220 : 90;
      setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          this.speakCurrentSentence();
        }
      }, pauseDelay);
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('[AudioPlayer] Utterance error:', e);
      if (this.isPlaying && !this.isPaused) {
        this.currentSentenceIndex++;
        setTimeout(() => this.speakCurrentSentence(), 100);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  notifySentenceChange(sentenceItem) {
    // Émettre un événement global personnalisé pour ReaderView
    const event = new CustomEvent('liva-audio-sentence-change', {
      detail: {
        sentenceIndex: sentenceItem.index,
        text: sentenceItem.text,
        progressPercent: this.getProgressPercent(),
        storyId: this.currentStory?.id,
        chapterIndex: this.currentChapterIndex
      }
    });
    window.dispatchEvent(event);
  }

  getProgressPercent() {
    if (!this.totalSentences || this.totalSentences === 0) return 0;
    return Math.min(100, Math.round((this.currentSentenceIndex / this.totalSentences) * 100));
  }

  updateProgressUI() {
    const percent = this.getProgressPercent();
    if (this.scrubberFill) {
      this.scrubberFill.style.width = `${percent}%`;
    }

    // Mettre à jour l'indicateur dans ReaderView si actif
    const readerProgress = document.getElementById('reader-audio-mini-progress-fill');
    if (readerProgress) {
      readerProgress.style.width = `${percent}%`;
    }
  }

  pause() {
    this.isPlaying = false;
    this.isPaused = true;
    this.updatePlayBtnUI();
    if (this.isSpeechSupported) {
      window.speechSynthesis.cancel();
    }
    this.broadcastState();
  }

  resume() {
    if (!this.currentStory || !this.currentChapter) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.updatePlayBtnUI();
    this.speakCurrentSentence();
    this.broadcastState();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else if (this.isPaused || this.currentStory) {
      this.resume();
    } else if (this.currentStory) {
      this.playStory(this.currentStory.id, this.currentChapterIndex, this.currentSentenceIndex);
    }
  }

  seekToSentence(index) {
    const target = Math.max(0, Math.min(index, this.totalSentences - 1));
    this.currentSentenceIndex = target;
    this.updateProgressUI();
    if (this.isPlaying) {
      this.speakCurrentSentence();
    }
  }

  seekBySeconds(seconds) {
    // Estimer le saut en phrases (~3-4 secondes par phrase)
    const sentenceJump = Math.round(seconds / 3.5);
    const target = Math.max(0, Math.min(this.currentSentenceIndex + sentenceJump, this.totalSentences - 1));
    this.seekToSentence(target);
    Toast.show(seconds > 0 ? '+15s' : '-15s', 'info', '⏱️', 1000);
  }

  cyclePlaybackRate() {
    const rates = [0.75, 0.9, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(this.playbackRate);
    this.playbackRate = rates[(currentIndex + 1) % rates.length];

    if (this.rateBtn) {
      this.rateBtn.textContent = `${this.playbackRate}x`;
    }

    this.saveSettings();
    Toast.show(`Vitesse narrative : ${this.playbackRate}x`, 'info', '⚡', 1500);

    // Re-speak current sentence with new rate
    if (this.isPlaying) {
      this.speakCurrentSentence();
    }
    this.broadcastState();
  }

  setPersona(personaId) {
    if (!VOICE_PERSONAS[personaId] && personaId !== 'system') return;
    this.activePersonaId = personaId;
    this.saveSettings();
    this.updateBarMeta();

    const persona = VOICE_PERSONAS[personaId] || VOICE_PERSONAS.amira;
    Toast.show(`Voix narrative sélectionnée : ${persona.name} (${persona.tagline})`, 'success', persona.emoji || '✨', 3000);

    if (this.isPlaying) {
      this.speakCurrentSentence();
    }
    this.broadcastState();
  }

  setCustomVoice(voiceURI, pitch = 1.0) {
    this.activePersonaId = 'system';
    this.selectedVoiceURI = voiceURI;
    this.customPitch = pitch;
    this.saveSettings();
    this.updateBarMeta();

    if (this.isPlaying) {
      this.speakCurrentSentence();
    }
    this.broadcastState();
  }

  stopAndHide() {
    this.pause();
    this.isPaused = false;
    this.currentSentenceIndex = 0;
    if (this.isSpeechSupported) {
      window.speechSynthesis.cancel();
    }
    if (this.container) {
      this.container.classList.remove('active');
    }
    this.broadcastState();
  }

  onChapterCompleted() {
    this.pause();
    this.isPaused = false;
    this.currentSentenceIndex = 0;
    Toast.show(`Fin du chapitre : « ${this.currentChapter?.title || ''} » ✨`, 'success', '🎧', 4000);

    // Passer automatiquement au chapitre suivant si disponible
    if (this.currentStory?.chapters && this.currentChapterIndex < this.currentStory.chapters.length - 1) {
      const nextIndex = this.currentChapterIndex + 1;
      setTimeout(() => {
        this.playStory(this.currentStory.id, nextIndex, 0);
      }, 1200);
    }
  }

  updatePlayBtnUI() {
    const isActuallyPlaying = this.isPlaying && !this.isPaused;
    if (this.playBtn) {
      this.playBtn.innerHTML = isActuallyPlaying ? '⏸️' : '▶️';
      this.playBtn.title = isActuallyPlaying ? 'Mettre en pause' : 'Reprendre la lecture';
    }

    const waveEl = this.container?.querySelector('.audio-waves');
    if (waveEl) {
      waveEl.style.opacity = isActuallyPlaying ? '1' : '0.25';
    }

    // Reader UI buttons sync
    document.querySelectorAll('.reader-audio-toggle-btn').forEach(btn => {
      btn.innerHTML = isActuallyPlaying ? '⏸️' : '▶️';
      btn.classList.toggle('playing', isActuallyPlaying);
    });

    const readerTopAudioBtn = document.getElementById('btn-reader-audio');
    if (readerTopAudioBtn) {
      readerTopAudioBtn.innerHTML = isActuallyPlaying ? '⏸️' : '🎧';
      readerTopAudioBtn.classList.toggle('active', isActuallyPlaying);
    }
  }

  broadcastState() {
    const event = new CustomEvent('liva-audio-state-change', {
      detail: {
        isPlaying: this.isPlaying && !this.isPaused,
        isPaused: this.isPaused,
        story: this.currentStory,
        chapterIndex: this.currentChapterIndex,
        chapter: this.currentChapter,
        persona: VOICE_PERSONAS[this.activePersonaId] || VOICE_PERSONAS.amira,
        playbackRate: this.playbackRate,
        progressPercent: this.getProgressPercent()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Tester un extrait d'une voix (Écoute échantillon)
   */
  testVoiceSample(personaId) {
    if (!this.isSpeechSupported) return;

    window.speechSynthesis.cancel();
    const persona = VOICE_PERSONAS[personaId] || VOICE_PERSONAS.amira;
    const voiceObj = this.getBestVoiceForPersona(personaId);

    const utterance = new SpeechSynthesisUtterance(
      `Bonjour, je suis ${persona.name}. ${persona.description}`
    );
    utterance.lang = voiceObj?.lang || 'fr-FR';
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = (persona.rate || 1.0) * this.playbackRate;
    utterance.pitch = (persona.pitch || 1.0);

    Toast.show(`Test audio : ${persona.name}...`, 'info', persona.emoji || '🎙️', 2500);
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Injection et ouverture de la Modale "Studio des Voix Narratives"
   */
  injectVoiceStudioModal() {
    if (document.getElementById('modal-voice-studio')) return;

    const modalHtml = `
      <div class="modal-overlay" id="modal-voice-studio" style="z-index: 10000;">
        <div class="modal-card voice-studio-modal-box" style="max-width: 640px; width: 95%;">
          
          <div class="modal-header" style="padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; font-family: var(--font-display); color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                🎙️ Studio des Voix Narratives LIVA
              </h3>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin: 2px 0 0;">
                Sélectionnez une voix expressive avec intonation naturelle pour vos lectures audio.
              </p>
            </div>
            <button class="btn btn-ghost btn-sm" id="btn-close-voice-studio" style="font-size: 1.1rem; padding: 4px 8px;">✕</button>
          </div>

          <div class="modal-body" style="padding: var(--space-5); max-height: 75vh; overflow-y: auto;">
            
            <!-- Grille des Personas Vocaux -->
            <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-primary-light); margin-bottom: var(--space-3);">
              Personas Narratifs Professionnels
            </div>

            <div class="voice-personas-grid" id="voice-personas-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-5);">
              ${Object.values(VOICE_PERSONAS).filter(p => p.id !== 'system').map(p => `
                <div class="voice-persona-card ${p.id === this.activePersonaId ? 'active' : ''}" data-persona-id="${p.id}" style="border: 1px solid ${p.id === this.activePersonaId ? 'var(--color-primary)' : 'var(--border-subtle)'}; background: ${p.id === this.activePersonaId ? 'rgba(121, 40, 202, 0.12)' : 'var(--bg-surface)'}; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); cursor: pointer; transition: all 0.2s ease;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 1.4rem;">${p.emoji}</span>
                      <div>
                        <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary);">${escapeHTML(p.name)}</div>
                        <div style="font-size: 0.72rem; color: var(--color-primary-light); font-weight: 600;">${escapeHTML(p.tagline)}</div>
                      </div>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-test-voice" data-test-persona="${p.id}" title="Écouter un extrait" style="padding: 4px 8px; font-size: 0.75rem; border-radius: var(--radius-full); background: rgba(255,255,255,0.06);">
                      ▶️ Tester
                    </button>
                  </div>
                  <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
                    ${escapeHTML(p.description)}
                  </p>
                </div>
              `).join('')}
            </div>

            <!-- Réglages avancés (Vitesse & Voix Appareil) -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-4);">
              <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); margin-bottom: var(--space-3);">
                ⚙️ Ajustements & Voix Système
              </div>

              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                <div>
                  <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">
                    Voix installée sur l'appareil (Optionnel)
                  </label>
                  <select class="form-select" id="voice-studio-system-select" style="width: 100%; font-size: 0.82rem; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--text-primary);">
                    <option value="">Sélection automatique par persona</option>
                    ${this.availableVoices.map(v => `
                      <option value="${v.voiceURI}" ${this.selectedVoiceURI === v.voiceURI ? 'selected' : ''}>
                        ${escapeHTML(v.name)} (${escapeHTML(v.lang)})
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);">
                  <div style="flex: 1;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">
                      Vitesse de narration (<span id="voice-studio-rate-val">${this.playbackRate}x</span>)
                    </label>
                    <input type="range" id="voice-studio-rate-slider" min="0.75" max="1.75" step="0.05" value="${this.playbackRate}" style="width: 100%; accent-color: var(--color-primary);" />
                  </div>
                  <button class="btn btn-secondary btn-sm" id="btn-voice-studio-test-sample" style="align-self: flex-end; padding: 8px 14px; white-space: nowrap;">
                    ▶️ Tester la voix
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div class="modal-footer" style="padding: var(--space-3) var(--space-5); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">
              💡 Vos préférences sont sauvegardées automatiquement.
            </span>
            <button class="btn btn-primary" id="btn-save-voice-studio" style="padding: 8px 20px;">
              Appliquer ✨
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.bindVoiceStudioEvents();
  }

  bindVoiceStudioEvents() {
    const modal = document.getElementById('modal-voice-studio');
    if (!modal) return;

    const closeBtn = modal.querySelector('#btn-close-voice-studio');
    const saveBtn = modal.querySelector('#btn-save-voice-studio');
    const systemSelect = modal.querySelector('#voice-studio-system-select');
    const rateSlider = modal.querySelector('#voice-studio-rate-slider');
    const rateVal = modal.querySelector('#voice-studio-rate-val');
    const testSampleBtn = modal.querySelector('#btn-voice-studio-test-sample');

    const closeModal = () => modal.classList.remove('active');
    closeBtn?.addEventListener('click', closeModal);
    saveBtn?.addEventListener('click', closeModal);

    // Sélection d'un persona
    modal.querySelectorAll('.voice-persona-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-test-voice')) return;
        const personaId = card.getAttribute('data-persona-id');
        this.setPersona(personaId);
        
        modal.querySelectorAll('.voice-persona-card').forEach(c => {
          const isTarget = c.getAttribute('data-persona-id') === personaId;
          c.classList.toggle('active', isTarget);
          c.style.borderColor = isTarget ? 'var(--color-primary)' : 'var(--border-subtle)';
          c.style.background = isTarget ? 'rgba(121, 40, 202, 0.12)' : 'var(--bg-surface)';
        });
      });
    });

    // Test individuel d'un persona
    modal.querySelectorAll('.btn-test-voice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const personaId = btn.getAttribute('data-test-persona');
        this.testVoiceSample(personaId);
      });
    });

    // Curseur de vitesse
    rateSlider?.addEventListener('input', (e) => {
      this.playbackRate = parseFloat(e.target.value);
      if (rateVal) rateVal.textContent = `${this.playbackRate.toFixed(2)}x`;
      if (this.rateBtn) this.rateBtn.textContent = `${this.playbackRate.toFixed(2)}x`;
      this.saveSettings();
    });

    // Sélection voix système
    systemSelect?.addEventListener('change', (e) => {
      const uri = e.target.value;
      if (uri) {
        this.setCustomVoice(uri, 1.0);
      } else {
        this.setPersona(this.activePersonaId);
      }
    });

    // Tester l'échantillon global
    testSampleBtn?.addEventListener('click', () => {
      this.testVoiceSample(this.activePersonaId);
    });
  }

  openVoiceStudio() {
    this.injectVoiceStudioModal();
    const modal = document.getElementById('modal-voice-studio');
    if (modal) {
      modal.classList.add('active');
    }
  }
}
