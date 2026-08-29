// LIVA - Mode Lecture Immersif (ReaderView)
import { Toast } from '../components/Toast.js';
import { escapeHTML } from '../utils/sanitize.js';

export class ReaderView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.story = null;
    this.chapterIndex = 0;
    this.chapter = null;
    this.controlsVisible = true;
    this.scrollTimeout = null;
  }

  render(params = {}) {
    const storyId = params.id;
    this.chapterIndex = parseInt(params.chapterIndex || '0', 10);
    this.story = this.store.getStoryById(storyId) || this.store.getAllStories()[0];
    this.chapter = (this.story.chapters && this.story.chapters[this.chapterIndex]) || (this.story.chapters && this.story.chapters[0]) || { title: 'Chapitre 1', content: '' };

    const settings = this.store.state.readerSettings;
    const progress = this.store.getReadingProgress(this.story.id);
    const initialPercent = progress ? progress.progressPercent : 0;

    const rawContent = this.chapter.content || '';
    const paragraphs = rawContent.split(/\n\s*\n/).filter(p => p.trim());

    return `
      <div class="reader-view reader-size-${settings.fontSize || 'normal'} reader-font-${settings.fontFamily || 'literata'}" id="reader-root" data-theme="${settings.theme || 'dark'}">
        
        <!-- 1. Topbar de lecture rétractable -->
        <header class="reader-topbar" id="reader-topbar">
          <button class="btn btn-icon" id="btn-reader-back" title="Quitter la lecture">
            ←
          </button>

          <div class="reader-header-center">
            <span class="reader-story-title">${escapeHTML(this.story.title)}</span>
            <span class="reader-chapter-title">${escapeHTML(this.chapter.title)}</span>
          </div>

          <div class="reader-header-progress">
            <span id="reader-progress-label">${initialPercent}%</span>
            <button class="btn btn-icon" id="btn-reader-audio" title="Écouter ce chapitre">
              🎧
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
              <div style="font-size: 0.85rem; color: var(--reader-text-muted); margin-top: 6px;">
                Écrit par ${escapeHTML(this.story.authorName || 'Auteur')} · ⏱️ ${escapeHTML(this.chapter.duration || '5 min')} de lecture
              </div>
            </div>

            <div class="reader-text-body" id="reader-text-body">
              ${paragraphs.length > 0 ? paragraphs.map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br/>')}</p>`).join('') : '<p>Contenu du chapitre vide.</p>'}
            </div>

            <!-- Fin de Chapitre / Navigation -->
            <div style="margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
              ${this.chapterIndex > 0 ? `
                <button class="btn btn-secondary" id="btn-prev-chapter">
                  ← Chapitre précédent
                </button>
              ` : '<div></div>'}

              ${this.chapterIndex < this.story.chapters.length - 1 ? `
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
              Félicitations, vous êtes venu à bout de <strong>« ${escapeHTML(this.story.title)} »</strong> ! Votre progression est enregistrée à 100%.
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

    // Back to story detail
    const backBtn = container.querySelector('#btn-reader-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.router.navigate(`/story/${this.story.id}`);
      });
    }

    // Toggle bars on single tap/click in text area (if not selecting text)
    scrollContainer.addEventListener('click', (e) => {
      if (window.getSelection().toString().trim().length > 0) return;
      if (e.target.closest('button') || e.target.closest('#reader-settings-panel')) return;
      
      this.controlsVisible = !this.controlsVisible;
      topbar.classList.toggle('hidden', !this.controlsVisible);
      bottombar.classList.toggle('hidden', !this.controlsVisible);
      if (!this.controlsVisible) {
        settingsPanel.classList.remove('active');
      }
    });

    // Scroll Progress Calculation
    scrollContainer.addEventListener('scroll', () => {
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const percent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      if (progressLabel) progressLabel.textContent = `${percent}%`;
      if (progressFill) progressFill.style.width = `${percent}%`;

      // Save progress throttled
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.store.updateReadingProgress(this.story.id, this.chapterIndex, this.chapter.id, percent);
      }, 500);
    });

    // Audio button in reader
    const audioBtn = container.querySelector('#btn-reader-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        window.appAudioPlayer?.playStory(this.story.id, this.chapterIndex);
      });
    }

    // Toggle Settings Panel
    const toggleSettingsBtn = container.querySelector('#btn-toggle-settings');
    const closeSettingsBtn = container.querySelector('#btn-close-reader-settings');
    if (toggleSettingsBtn) {
      toggleSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('active');
      });
    }
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
      });
    }

    // Reading Settings controls (font size, family, theme)
    container.querySelectorAll('.settings-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const settingKey = btn.getAttribute('data-setting');
        const val = btn.getAttribute('data-val');

        // Update active in row
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

    // Theme Toggle quick button
    const themeBtn = container.querySelector('#btn-reader-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const themes = ['dark', 'cream', 'light'];
        const current = rootEl.getAttribute('data-theme') || 'dark';
        const next = themes[(themes.indexOf(current) + 1) % themes.length];
        rootEl.setAttribute('data-theme', next);
        this.store.setReaderSettings({ theme: next });
        Toast.show(`Ambiance de lecture : ${next}`, 'info', '🌓');
      });
    }

    // Bookmark button
    const bookmarkBtn = container.querySelector('#btn-reader-bookmark');
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', () => {
        Toast.show('Signet enregistré sur ce passage !', 'success', '🔖');
      });
    }

    // Share button
    const shareBtn = container.querySelector('#btn-reader-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
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
            if (err.name !== 'AbortError') {
              if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                Toast.show('Lien du chapitre copié dans le presse-papier !', 'info', '📋');
              }
            }
          }
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          Toast.show('Lien du chapitre copié dans le presse-papier !', 'info', '📋');
        }
      });
    }

    // Next / Prev chapters
    const nextBtn = container.querySelector('#btn-next-chapter');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.router.navigate(`/reader/${this.story.id}/${this.chapterIndex + 1}`);
      });
    }

    const prevBtn = container.querySelector('#btn-prev-chapter');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.router.navigate(`/reader/${this.story.id}/${this.chapterIndex - 1}`);
      });
    }

    const finishBtn = container.querySelector('#btn-finish-story');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        try {
          this.store.markStoryAsFinished(this.story.id);
          Toast.show('Félicitations ! Histoire ajoutée à vos lectures terminées 🏆', 'success', '🎉');
        } catch (e) {
          console.error('[ReaderView] Erreur fin d\'histoire:', e);
        }

        const modal = container.querySelector('#modal-story-completed');
        if (modal) {
          modal.classList.add('active');
        } else {
          this.router.navigate('/library');
        }
      });
    }

    // Modal story completed buttons
    container.querySelector('#btn-modal-rate-story')?.addEventListener('click', () => {
      const modal = container.querySelector('#modal-story-completed');
      if (modal) modal.classList.remove('active');
      this.router.navigate(`/story/${this.story.id}`);
    });

    container.querySelector('#btn-modal-go-library')?.addEventListener('click', () => {
      const modal = container.querySelector('#modal-story-completed');
      if (modal) modal.classList.remove('active');
      this.router.navigate('/library');
    });

    container.querySelector('#btn-modal-explore-more')?.addEventListener('click', () => {
      const modal = container.querySelector('#modal-story-completed');
      if (modal) modal.classList.remove('active');
      this.router.navigate('/explore');
    });

    // Text Selection Event Listener & Floating Popover
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText.length > 3 && popover) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        popover.style.top = `${Math.max(10, rect.top - 48)}px`;
        popover.style.left = `${rect.left + rect.width / 2}px`;
        popover.classList.add('active');
      } else if (popover) {
        popover.classList.remove('active');
      }
    });

    // Popover actions
    container.querySelector('#btn-popover-react')?.addEventListener('click', () => {
      Toast.show('Réaction ❤️ enregistrée sur la citation !', 'info', '❤️');
      popover.classList.remove('active');
    });

    container.querySelector('#btn-popover-comment')?.addEventListener('click', () => {
      Toast.show('Ouverture du fil de discussion sur ce passage...', 'info', '💬');
      popover.classList.remove('active');
    });

    container.querySelector('#btn-popover-copy')?.addEventListener('click', () => {
      const text = window.getSelection().toString();
      navigator.clipboard?.writeText(text);
      Toast.show('Citation copiée dans le presse-papier !', 'info', '📋');
      popover.classList.remove('active');
    });

    container.querySelector('#btn-popover-share')?.addEventListener('click', () => {
      Toast.show('Citation prête à être partagée !', 'info', '📤');
      popover.classList.remove('active');
    });
  }
}
