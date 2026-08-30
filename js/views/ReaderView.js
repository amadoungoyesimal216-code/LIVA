// LIVA - Mode Lecture Immersif (ReaderView) avec Synthèse Vocale & Suivi Visuel
import { Toast } from '../components/Toast.js';
import { escapeHTML } from '../utils/sanitize.js';
import { VOICE_PERSONAS } from '../features/audioPlayer.js';

export class ReaderView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.story = null;
    this.chapterIndex = 0;
    this.chapter = null;
    this.controlsVisible = true;
    this.scrollTimeout = null;
    this.sentenceChangeListener = null;
    this.stateChangeListener = null;
  }

  render(params = {}) {
    const storyId = params.id;
    this.chapterIndex = parseInt(params.chapterIndex || '0', 10);
    this.story = this.store.getStoryById(storyId) || this.store.getAllStories()[0];
    this.chapter = (this.story?.chapters && this.story.chapters[this.chapterIndex]) || 
                   (this.story?.chapters && this.story.chapters[0]) || 
                   { title: 'Chapitre 1', content: '' };

    const settings = this.store.state.readerSettings;
    const progress = this.store.getReadingProgress(this.story?.id);
    const initialPercent = progress ? progress.progressPercent : 0;

    // Découpage du texte en paragraphes et phrases indexées
    const rawContent = this.chapter.content || '';
    const paragraphs = rawContent.split(/\n\s*\n/).filter(p => p.trim());
    
    let sentenceCounter = 0;
    const renderedParagraphs = paragraphs.map(p => {
      // Découper chaque paragraphe en phrases narratives
      const rawSentences = p.match(/[^.?!…\n]+[.?!…]+|[^.?!…\n]+/g) || [p];
      const spans = rawSentences.map(s => {
        const clean = s.trim();
        if (!clean) return '';
        const idx = sentenceCounter++;
        return `<span class="reader-sentence" data-sentence-index="${idx}">${escapeHTML(clean)}</span>`;
      }).filter(Boolean);

      return `<p>${spans.join(' ')}</p>`;
    });

    const isAudioPlaying = window.appAudioPlayer?.isPlaying && 
                           window.appAudioPlayer?.currentStory?.id === this.story?.id && 
                           window.appAudioPlayer?.currentChapterIndex === this.chapterIndex;

    const currentPersona = VOICE_PERSONAS[window.appAudioPlayer?.activePersonaId] || VOICE_PERSONAS.amira;

    return `
      <div class="reader-view reader-size-${settings.fontSize || 'normal'} reader-font-${settings.fontFamily || 'literata'}" id="reader-root" data-theme="${settings.theme || 'dark'}">
        
        <!-- 1. Topbar de lecture rétractable -->
        <header class="reader-topbar" id="reader-topbar">
          <button class="btn btn-icon" id="btn-reader-back" title="Quitter la lecture">
            ←
          </button>

          <div class="reader-header-center">
            <span class="reader-story-title">${escapeHTML(this.story?.title || 'Histoire')}</span>
            <span class="reader-chapter-title">${escapeHTML(this.chapter.title)}</span>
          </div>

          <div class="reader-header-progress">
            <span id="reader-progress-label">${initialPercent}%</span>
            <button class="btn btn-icon ${isAudioPlaying ? 'active playing' : ''}" id="btn-reader-audio" title="Écouter ce chapitre (Lecture Vocale Narrative)">
              ${isAudioPlaying ? '⏸️' : '🎧'}
            </button>
          </div>

          <!-- Barre de progression continue en haut -->
          <div class="reader-fixed-progress-bar">
            <div class="reader-fixed-progress-fill" id="reader-fixed-progress-fill" style="width: ${initialPercent}%;"></div>
          </div>
        </header>

        <!-- 2. Zone de Défilement du Texte -->
        <main class="reader-content-scroll hide-scrollbar" id="reader-scroll-container">
          <article class="reader-article-container" id="reader-article">
            
            <div class="reader-article-header">
              <div class="reader-article-chapter-num">Chapitre ${this.chapter.number || this.chapterIndex + 1}</div>
              <h1 class="reader-article-chapter-heading">${escapeHTML(this.chapter.title)}</h1>
              <div style="font-size: 0.85rem; color: var(--reader-text-muted); margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
                <span>Écrit par <strong>${escapeHTML(this.story?.authorName || 'Auteur')}</strong></span>
                <span>·</span>
                <span>⏱️ ${escapeHTML(this.chapter.duration || '5 min')}</span>
                <span>·</span>
                <span class="badge badge-blur" style="font-size: 0.72rem; cursor: pointer;" id="badge-quick-listen-trigger">
                  🎙️ Écouter en audio
                </span>
              </div>
            </div>

            <div class="reader-text-body" id="reader-text-body">
              ${renderedParagraphs.length > 0 ? renderedParagraphs.join('') : '<p>Contenu du chapitre vide.</p>'}
            </div>

            <!-- Fin de Chapitre / Navigation -->
            <div style="margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
              ${this.chapterIndex > 0 ? `
                <button class="btn btn-secondary" id="btn-prev-chapter">
                  ← Chapitre précédent
                </button>
              ` : '<div></div>'}

              ${this.chapterIndex < (this.story?.chapters?.length || 1) - 1 ? `
                <button class="btn btn-primary" id="btn-next-chapter">
                  Chapitre suivant →
                </button>
              ` : `
                <button class="btn btn-primary" id="btn-finish-story">
                  Terminer l'histoire ✨
                </button>
              `}
            </div>

          </article>
        </main>

        <!-- 2.5 DOCK AUDIO DÉDIÉ AU LECTEUR (IMMÉDIAT, FLUIDE ET SYNCHRONISÉ) -->
        <div class="reader-audio-dock ${isAudioPlaying || window.appAudioPlayer?.isPaused ? 'active' : ''}" id="reader-audio-dock">
          <div class="reader-audio-dock-inner">
            
            <!-- Scrubber de progression continue de la voix -->
            <div class="reader-audio-progress-track" id="reader-audio-track" title="Cliquer pour naviguer dans la lecture">
              <div class="reader-audio-progress-fill" id="reader-audio-mini-progress-fill" style="width: 0%;"></div>
            </div>

            <div class="reader-audio-info-row">
              <button class="reader-audio-voice-btn" id="btn-reader-voice-studio" title="Changer la voix narrative (Studio Vocale)">
                <span id="reader-audio-voice-emoji">${currentPersona.emoji}</span>
                <span id="reader-audio-voice-name">${escapeHTML(currentPersona.name)}</span>
                <span style="font-size: 0.65rem; opacity: 0.7;">⚙️</span>
              </button>

              <div class="reader-audio-sentence-preview" id="reader-audio-sentence-preview">
                Lecture audio prête · Cliquez sur ▶️ pour écouter
              </div>
            </div>

            <div class="reader-audio-controls-row">
              <button class="btn btn-icon btn-sm" id="btn-reader-audio-rewind" title="Reculer 15s">⏪</button>
              <button class="btn btn-primary btn-icon reader-audio-toggle-btn" id="btn-reader-audio-toggle" style="width: 38px; height: 38px;" title="Lecture / Pause">
                ${isAudioPlaying ? '⏸️' : '▶️'}
              </button>
              <button class="btn btn-icon btn-sm" id="btn-reader-audio-forward" title="Avancer 15s">⏩</button>
              <button class="reader-audio-rate-btn" id="btn-reader-audio-rate" title="Changer la vitesse">${window.appAudioPlayer?.playbackRate || 1}x</button>
              <button class="btn btn-ghost btn-sm" id="btn-reader-audio-close" title="Fermer le lecteur">✕</button>
            </div>

          </div>
        </div>

        <!-- 3. Toolbar Inférieure de Contrôles -->
        <footer class="reader-bottom-bar" id="reader-bottom-bar">
          <div class="reader-ctrl-btn" id="btn-toggle-settings">
            <span style="font-size: 1.25rem; font-weight: 800;">Aa</span>
            <span style="font-size: 0.7rem;">Affichage</span>
          </div>

          <div class="reader-ctrl-btn" id="btn-reader-theme-toggle">
            <span style="font-size: 1.25rem;">🌓</span>
            <span style="font-size: 0.7rem;">Thème</span>
          </div>

          <div class="reader-ctrl-btn" id="btn-reader-audio-bottom" title="Écouter le chapitre">
            <span style="font-size: 1.25rem;">🎙️</span>
            <span style="font-size: 0.7rem;">Audio</span>
          </div>

          <div class="reader-ctrl-btn" id="btn-reader-bookmark">
            <span style="font-size: 1.25rem;">🔖</span>
            <span style="font-size: 0.7rem;">Signet</span>
          </div>

          <div class="reader-ctrl-btn" id="btn-reader-share">
            <span style="font-size: 1.25rem;">📤</span>
            <span style="font-size: 0.7rem;">Partager</span>
          </div>
        </footer>

        <!-- 4. Panneau de Personnalisation de la Lecture (Aa) -->
        <div class="reader-settings-panel" id="reader-settings-panel">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
            <span style="font-weight: 800; font-size: 1rem;">Paramètres de lecture</span>
            <button class="btn btn-ghost btn-sm" id="btn-close-reader-settings">✕</button>
          </div>

          <!-- Taille du Texte -->
          <div class="settings-row">
            <span class="settings-label">Taille du texte</span>
            <div class="settings-options-group">
              <button class="settings-pill-btn ${settings.fontSize === 'small' ? 'active' : ''}" data-setting="fontSize" data-val="small">Petit</button>
              <button class="settings-pill-btn ${settings.fontSize === 'normal' || !settings.fontSize ? 'active' : ''}" data-setting="fontSize" data-val="normal">Normal</button>
              <button class="settings-pill-btn ${settings.fontSize === 'large' ? 'active' : ''}" data-setting="fontSize" data-val="large">Grand</button>
              <button class="settings-pill-btn ${settings.fontSize === 'xlarge' ? 'active' : ''}" data-setting="fontSize" data-val="xlarge">Très grand</button>
            </div>
          </div>

          <!-- Police d'écriture -->
          <div class="settings-row">
            <span class="settings-label">Police</span>
            <div class="settings-options-group">
              <button class="settings-pill-btn ${settings.fontFamily === 'literata' || !settings.fontFamily ? 'active' : ''}" data-setting="fontFamily" data-val="literata" style="font-family: serif;">Serif</button>
              <button class="settings-pill-btn ${settings.fontFamily === 'sans' ? 'active' : ''}" data-setting="fontFamily" data-val="sans" style="font-family: sans-serif;">Sans</button>
              <button class="settings-pill-btn ${settings.fontFamily === 'merriweather' ? 'active' : ''}" data-setting="fontFamily" data-val="merriweather" style="font-family: Georgia, serif;">Livre</button>
              <button class="settings-pill-btn ${settings.fontFamily === 'dyslexic' ? 'active' : ''}" data-setting="fontFamily" data-val="dyslexic">Dyslexie</button>
            </div>
          </div>

          <!-- Thème de fond -->
          <div class="settings-row">
            <span class="settings-label">Ambiance de fond</span>
            <div class="settings-options-group">
              <button class="settings-pill-btn ${settings.theme === 'dark' || !settings.theme ? 'active' : ''}" data-setting="theme" data-val="dark">🌙 Sombre</button>
              <button class="settings-pill-btn ${settings.theme === 'cream' ? 'active' : ''}" data-setting="theme" data-val="cream">📖 Crème</button>
              <button class="settings-pill-btn ${settings.theme === 'light' ? 'active' : ''}" data-setting="theme" data-val="light">☀️ Clair</button>
            </div>
          </div>
        </div>

        <!-- 5. Popover Contextuel lors de la Sélection de Texte -->
        <div class="text-selection-popover" id="text-selection-popover">
          <button class="popover-action-btn" id="btn-popover-speak">
            <span>🎙️</span>
            <span>Écouter ici</span>
          </button>
          <button class="popover-action-btn" id="btn-popover-react">
            <span>❤️</span>
            <span>Réagir</span>
          </button>
          <button class="popover-action-btn" id="btn-popover-comment">
            <span>💬</span>
            <span>Commenter</span>
          </button>
          <button class="popover-action-btn" id="btn-popover-copy">
            <span>📋</span>
            <span>Copier</span>
          </button>
          <button class="popover-action-btn" id="btn-popover-share">
            <span>📤</span>
            <span>Partager</span>
          </button>
        </div>

        <!-- 6. Modale Félicitations Fin d'Histoire -->
        <div class="modal-overlay" id="modal-story-completed">
          <div class="modal-card" style="max-width: 480px; text-align: center; padding: var(--space-6);">
            <div style="font-size: 3.5rem; margin-bottom: var(--space-3); line-height: 1;">🏆</div>
            <h2 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); margin-bottom: 8px;">
              Histoire terminée !
            </h2>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: var(--space-5); line-height: 1.5;">
              Félicitations, vous êtes venu à bout de <strong>« ${escapeHTML(this.story?.title || '')} »</strong> ! Votre progression est enregistrée à 100%.
            </p>

            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              <button class="btn btn-primary" id="btn-modal-rate-story" style="justify-content: center; gap: 8px; width: 100%;">
                ⭐ Donner mon avis & Noter
              </button>
              <button class="btn btn-secondary" id="btn-modal-go-library" style="justify-content: center; gap: 8px; width: 100%;">
                📚 Voir ma bibliothèque
              </button>
              <button class="btn btn-ghost" id="btn-modal-explore-more" style="justify-content: center; gap: 8px; width: 100%;">
                🔍 Découvrir une autre histoire
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  attachEvents(container) {
    const scrollContainer = container.querySelector('#reader-scroll-container');
    const topbar = container.querySelector('#reader-topbar');
    const bottombar = container.querySelector('#reader-bottom-bar');
    const progressLabel = container.querySelector('#reader-progress-label');
    const progressFill = container.querySelector('#reader-fixed-progress-fill');
    const rootEl = container.querySelector('#reader-root');
    const settingsPanel = container.querySelector('#reader-settings-panel');
    const popover = container.querySelector('#text-selection-popover');
    const audioDock = container.querySelector('#reader-audio-dock');

    // 1. Quitter la lecture
    const backBtn = container.querySelector('#btn-reader-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.router.navigate(`/story/${this.story.id}`);
      });
    }

    // 2. Basculer les barres au toucher (si pas de sélection de texte)
    scrollContainer?.addEventListener('click', (e) => {
      if (window.getSelection().toString().trim().length > 0) return;
      if (e.target.closest('button') || e.target.closest('#reader-settings-panel') || e.target.closest('#reader-audio-dock')) return;
      
      this.controlsVisible = !this.controlsVisible;
      topbar?.classList.toggle('hidden', !this.controlsVisible);
      bottombar?.classList.toggle('hidden', !this.controlsVisible);
      if (!this.controlsVisible) {
        settingsPanel?.classList.remove('active');
      }
    });

    // 3. Calcul du Progrès de Défilement
    scrollContainer?.addEventListener('scroll', () => {
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const percent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      if (progressLabel) progressLabel.textContent = `${percent}%`;
      if (progressFill) progressFill.style.width = `${percent}%`;

      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.store.updateReadingProgress(this.story.id, this.chapterIndex, this.chapter.id, percent);
      }, 500);
    });

    // 4. Contrôles Audio Directs (Topbar, Bottom bar & Dock)
    const triggerAudio = () => {
      if (!window.appAudioPlayer) return;

      const isCurrentStory = window.appAudioPlayer.currentStory?.id === this.story.id && 
                            window.appAudioPlayer.currentChapterIndex === this.chapterIndex;

      if (isCurrentStory && (window.appAudioPlayer.isPlaying || window.appAudioPlayer.isPaused)) {
        window.appAudioPlayer.togglePlay();
      } else {
        window.appAudioPlayer.playStory(this.story.id, this.chapterIndex, 0);
      }
      audioDock?.classList.add('active');
    };

    container.querySelector('#btn-reader-audio')?.addEventListener('click', triggerAudio);
    container.querySelector('#btn-reader-audio-bottom')?.addEventListener('click', triggerAudio);
    container.querySelector('#badge-quick-listen-trigger')?.addEventListener('click', triggerAudio);

    // Boutons du Dock Audio
    container.querySelector('#btn-reader-audio-toggle')?.addEventListener('click', () => {
      window.appAudioPlayer?.togglePlay();
    });

    container.querySelector('#btn-reader-audio-rewind')?.addEventListener('click', () => {
      window.appAudioPlayer?.seekBySeconds(-15);
    });

    container.querySelector('#btn-reader-audio-forward')?.addEventListener('click', () => {
      window.appAudioPlayer?.seekBySeconds(15);
    });

    container.querySelector('#btn-reader-audio-rate')?.addEventListener('click', () => {
      window.appAudioPlayer?.cyclePlaybackRate();
      const rateEl = container.querySelector('#btn-reader-audio-rate');
      if (rateEl && window.appAudioPlayer) rateEl.textContent = `${window.appAudioPlayer.playbackRate}x`;
    });

    container.querySelector('#btn-reader-voice-studio')?.addEventListener('click', () => {
      window.appAudioPlayer?.openVoiceStudio();
    });

    container.querySelector('#btn-reader-audio-close')?.addEventListener('click', () => {
      window.appAudioPlayer?.stopAndHide();
      audioDock?.classList.remove('active');
      container.querySelectorAll('.reader-sentence.active-speech').forEach(s => s.classList.remove('active-speech'));
    });

    // Clic sur le scrubber du dock
    container.querySelector('#reader-audio-track')?.addEventListener('click', (e) => {
      const track = container.querySelector('#reader-audio-track');
      if (!track || !window.appAudioPlayer) return;
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetSentence = Math.floor(percent * (window.appAudioPlayer.totalSentences || 1));
      window.appAudioPlayer.seekToSentence(targetSentence);
    });

    // 5. Clic sur n'importe quelle phrase pour démarrer/sauter la lecture à cet endroit précis
    container.querySelectorAll('.reader-sentence').forEach(span => {
      span.addEventListener('click', () => {
        const sentenceIdx = parseInt(span.getAttribute('data-sentence-index'), 10);
        if (window.appAudioPlayer) {
          if (window.appAudioPlayer.currentStory?.id === this.story.id &&
              window.appAudioPlayer.currentChapterIndex === this.chapterIndex) {
            window.appAudioPlayer.seekToSentence(sentenceIdx);
            if (!window.appAudioPlayer.isPlaying) window.appAudioPlayer.resume();
          } else {
            window.appAudioPlayer.playStory(this.story.id, this.chapterIndex, sentenceIdx);
          }
          audioDock?.classList.add('active');
        }
      });
    });

    // 6. Écoute de l'événement de changement de phrase pour la surbrillance Karaoké
    if (this.sentenceChangeListener) {
      window.removeEventListener('liva-audio-sentence-change', this.sentenceChangeListener);
    }
    this.sentenceChangeListener = (e) => {
      const { sentenceIndex, text, progressPercent, storyId, chapterIndex } = e.detail;
      if (storyId !== this.story.id || chapterIndex !== this.chapterIndex) return;

      // Mettre à jour la surbrillance active
      container.querySelectorAll('.reader-sentence.active-speech').forEach(s => s.classList.remove('active-speech'));
      const activeSpan = container.querySelector(`.reader-sentence[data-sentence-index="${sentenceIndex}"]`);
      if (activeSpan) {
        activeSpan.classList.add('active-speech');
        
        // Auto-scroll doux centré sur la phrase
        activeSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Mettre à jour l'aperçu textuel et la barre de progression
      const previewEl = container.querySelector('#reader-audio-sentence-preview');
      if (previewEl && text) {
        previewEl.textContent = text;
      }

      const miniFill = container.querySelector('#reader-audio-mini-progress-fill');
      if (miniFill) {
        miniFill.style.width = `${progressPercent}%`;
      }

      audioDock?.classList.add('active');
    };
    window.addEventListener('liva-audio-sentence-change', this.sentenceChangeListener);

    // 7. Écoute de l'état global du lecteur
    if (this.stateChangeListener) {
      window.removeEventListener('liva-audio-state-change', this.stateChangeListener);
    }
    this.stateChangeListener = (e) => {
      const { isPlaying, persona, playbackRate, story, chapterIndex } = e.detail;
      const isCurrent = story?.id === this.story.id && chapterIndex === this.chapterIndex;

      const topAudioBtn = container.querySelector('#btn-reader-audio');
      const toggleBtn = container.querySelector('#btn-reader-audio-toggle');
      const voiceEmoji = container.querySelector('#reader-audio-voice-emoji');
      const voiceName = container.querySelector('#reader-audio-voice-name');
      const rateBtn = container.querySelector('#btn-reader-audio-rate');

      if (topAudioBtn) {
        topAudioBtn.innerHTML = isPlaying ? '⏸️' : '🎧';
        topAudioBtn.classList.toggle('playing', isPlaying);
      }
      if (toggleBtn) {
        toggleBtn.innerHTML = isPlaying ? '⏸️' : '▶️';
      }
      if (voiceEmoji && persona) voiceEmoji.textContent = persona.emoji || '🌸';
      if (voiceName && persona) voiceName.textContent = persona.name || 'Amira';
      if (rateBtn) rateBtn.textContent = `${playbackRate}x`;

      if (!isPlaying && !window.appAudioPlayer?.isPaused) {
        container.querySelectorAll('.reader-sentence.active-speech').forEach(s => s.classList.remove('active-speech'));
      }
    };
    window.addEventListener('liva-audio-state-change', this.stateChangeListener);

    // 8. Panneau des paramètres de lecture (Aa)
    const toggleSettingsBtn = container.querySelector('#btn-toggle-settings');
    const closeSettingsBtn = container.querySelector('#btn-close-reader-settings');
    if (toggleSettingsBtn) {
      toggleSettingsBtn.addEventListener('click', () => {
        settingsPanel?.classList.toggle('active');
      });
    }
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        settingsPanel?.classList.remove('active');
      });
    }

    container.querySelectorAll('.settings-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const settingKey = btn.getAttribute('data-setting');
        const val = btn.getAttribute('data-val');

        btn.parentElement.querySelectorAll('.settings-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (settingKey === 'fontSize') {
          rootEl.classList.remove('reader-size-small', 'reader-size-normal', 'reader-size-large', 'reader-size-xlarge');
          rootEl.classList.add(`reader-size-${val}`);
          this.store.setReaderSettings({ fontSize: val });
        } else if (settingKey === 'fontFamily') {
          rootEl.classList.remove('reader-font-literata', 'reader-font-sans', 'reader-font-merriweather', 'reader-font-dyslexic');
          rootEl.classList.add(`reader-font-${val}`);
          this.store.setReaderSettings({ fontFamily: val });
        } else if (settingKey === 'theme') {
          rootEl.setAttribute('data-theme', val);
          this.store.setReaderSettings({ theme: val });
        }
      });
    });

    // 9. Thème rapide
    container.querySelector('#btn-reader-theme-toggle')?.addEventListener('click', () => {
      const themes = ['dark', 'cream', 'light'];
      const current = rootEl.getAttribute('data-theme') || 'dark';
      const next = themes[(themes.indexOf(current) + 1) % themes.length];
      rootEl.setAttribute('data-theme', next);
      this.store.setReaderSettings({ theme: next });
      Toast.show(`Ambiance de lecture : ${next}`, 'info', '🌓');
    });

    // 10. Signet & Partage
    container.querySelector('#btn-reader-bookmark')?.addEventListener('click', () => {
      Toast.show('Signet enregistré sur ce passage !', 'success', '🔖');
    });

    container.querySelector('#btn-reader-share')?.addEventListener('click', async () => {
      const shareData = {
        title: `LIVA — ${this.story.title}`,
        text: `Je lis « ${this.story.title} » (Chapitre ${this.chapterIndex + 1}) sur LIVA !`,
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          Toast.show('Merci pour le partage ! ✨', 'success', '📤');
        } catch (err) {
          if (err.name !== 'AbortError' && navigator.clipboard) {
            await navigator.clipboard.writeText(window.location.href);
            Toast.show('Lien du chapitre copié dans le presse-papier !', 'info', '📋');
          }
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        Toast.show('Lien du chapitre copié dans le presse-papier !', 'info', '📋');
      }
    });

    // 11. Navigation chapitres
    container.querySelector('#btn-next-chapter')?.addEventListener('click', () => {
      this.router.navigate(`/reader/${this.story.id}/${this.chapterIndex + 1}`);
    });

    container.querySelector('#btn-prev-chapter')?.addEventListener('click', () => {
      this.router.navigate(`/reader/${this.story.id}/${this.chapterIndex - 1}`);
    });

    container.querySelector('#btn-finish-story')?.addEventListener('click', () => {
      try {
        this.store.markStoryAsFinished(this.story.id);
        Toast.show('Félicitations ! Histoire ajoutée à vos lectures terminées 🏆', 'success', '🎉');
      } catch (e) {
        console.error('[ReaderView] Erreur fin d\'histoire:', e);
      }

      const modal = container.querySelector('#modal-story-completed');
      if (modal) modal.classList.add('active');
      else this.router.navigate('/library');
    });

    container.querySelector('#btn-modal-rate-story')?.addEventListener('click', () => {
      container.querySelector('#modal-story-completed')?.classList.remove('active');
      this.router.navigate(`/story/${this.story.id}`);
    });

    container.querySelector('#btn-modal-go-library')?.addEventListener('click', () => {
      container.querySelector('#modal-story-completed')?.classList.remove('active');
      this.router.navigate('/library');
    });

    container.querySelector('#btn-modal-explore-more')?.addEventListener('click', () => {
      container.querySelector('#modal-story-completed')?.classList.remove('active');
      this.router.navigate('/explore');
    });

    // 12. Popover de sélection de texte
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText.length > 3 && popover) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          popover.style.top = `${Math.max(10, rect.top - 48)}px`;
          popover.style.left = `${rect.left + rect.width / 2}px`;
          popover.classList.add('active');
        } catch (e) {}
      } else if (popover) {
        popover.classList.remove('active');
      }
    });

    container.querySelector('#btn-popover-speak')?.addEventListener('click', () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      if (selectedText && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const persona = VOICE_PERSONAS[window.appAudioPlayer?.activePersonaId] || VOICE_PERSONAS.amira;
        const voiceObj = window.appAudioPlayer?.getBestVoiceForPersona(window.appAudioPlayer?.activePersonaId);
        const utterance = new SpeechSynthesisUtterance(selectedText);
        utterance.lang = voiceObj?.lang || 'fr-FR';
        if (voiceObj) utterance.voice = voiceObj;
        utterance.rate = (persona.rate || 1.0) * (window.appAudioPlayer?.playbackRate || 1.0);
        utterance.pitch = persona.pitch || 1.0;
        window.speechSynthesis.speak(utterance);
        Toast.show('Lecture de la sélection...', 'info', '🎙️', 2000);
      }
      popover.classList.remove('active');
    });

    container.querySelector('#btn-popover-react')?.addEventListener('click', () => {
      Toast.show('Réaction ❤️ enregistrée sur la citation !', 'info', '❤️');
      popover.classList.remove('active');
    });

    container.querySelector('#btn-popover-comment')?.addEventListener('click', () => {
      Toast.show('Ouverture du fil de discussion...', 'info', '💬');
      popover.classList.remove('active');
    });

    container.querySelector('#btn-popover-copy')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.getSelection().toString());
      Toast.show('Citation copiée !', 'info', '📋');
      popover.classList.remove('active');
    });

    container.querySelector('#btn-popover-share')?.addEventListener('click', () => {
      Toast.show('Citation prête à être partagée !', 'info', '📤');
      popover.classList.remove('active');
    });
  }
}
