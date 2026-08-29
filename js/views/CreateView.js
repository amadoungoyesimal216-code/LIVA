// LIVA - Espace Créateur / Studio Auteur (CreateView)
import { Toast } from '../components/Toast.js';
import { GENRES_DATA } from '../data/genres.js';
import { escapeHTML } from '../utils/sanitize.js';

export class CreateView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.activeTab = 'all'; // 'all' | 'draft' | 'published'

    // État du wizard de création / édition
    this.wizardState = {
      isEdit: false,
      storyId: null,
      title: '',
      genre: 'Romance',
      secondaryGenre: '',
      description: '',
      tags: [],
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      currentChapterIndex: 0,
      chapters: [
        { title: 'Chapitre 1 : Les Premières Lueurs', content: '' }
      ]
    };
  }

  getAuthoredStories() {
    const currentUserId = this.store.state.user?.id;
    const localAuthored = this.store.state.authoredStories || [];
    const globalAuthored = (this.store.stories || []).filter(s => 
      s.authorId === currentUserId || s.author_id === currentUserId || (currentUserId && s.authorId === 'user-current')
    );

    const map = new Map();
    localAuthored.forEach(s => map.set(s.id, s));
    globalAuthored.forEach(s => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    return Array.from(map.values());
  }

  render() {
    const authoredStories = this.getAuthoredStories();
    const drafts = authoredStories.filter(s => s.status === 'draft');
    const published = authoredStories.filter(s => s.status === 'published');

    // Calcul des métriques réelles à partir des histoires publiées de l'utilisateur
    let totalReadsCount = 0;
    let totalLikesCount = 0;
    let totalCommentsCount = 0;

    published.forEach(s => {
      totalReadsCount += (Number(s.readsRaw) || (s.stats?.reads || 0));
      totalLikesCount += (Number(s.likesCount) || (s.stats?.likes || 0));
      totalCommentsCount += (Number(s.reviewsCount) || (s.reviews?.length || 0));
    });

    const userFollowersCount = this.store.state.user.stats?.followersCount || 0;

    const formatNum = (n) => {
      const num = Number(n) || 0;
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return String(num);
    };

    const readsTrend = totalReadsCount > 0 ? '↑ En progression' : 'Total cumulé';
    const likesTrend = totalLikesCount > 0 ? '↑ Avis positifs' : 'Cœurs reçus';
    const commentsTrend = totalCommentsCount > 0 ? `↑ +${totalCommentsCount}` : 'Avis lecteurs';
    const followersTrend = userFollowersCount > 0 ? `↑ +${userFollowersCount}` : 'Lecteurs fidèles';

    return `
      <div class="author-studio-view page-container animate-fade-in">
        
        <!-- 1. En-tête du Studio Auteur -->
        <div class="studio-header">
          <div>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-primary-light); text-transform: uppercase; letter-spacing: 0.5px;">Espace Auteur & Création</span>
            <h1 class="studio-title">Studio d'Écriture ✍️</h1>
          </div>
          <button class="btn btn-primary btn-lg" id="btn-open-create-story">
            + Nouvelle histoire
          </button>
        </div>

        <!-- 2. Métriques de Performance Réelles -->
        <div class="studio-metrics-grid">
          <div class="metric-card">
            <div class="metric-card-top">
              <span class="metric-card-label">Lectures</span>
              <span class="metric-card-icon">👁️</span>
            </div>
            <div class="metric-card-value">${formatNum(totalReadsCount)}</div>
            <div class="metric-card-trend trend-up">${readsTrend}</div>
          </div>

          <div class="metric-card">
            <div class="metric-card-top">
              <span class="metric-card-label">Appréciations</span>
              <span class="metric-card-icon">❤️</span>
            </div>
            <div class="metric-card-value">${formatNum(totalLikesCount)}</div>
            <div class="metric-card-trend trend-up">${likesTrend}</div>
          </div>

          <div class="metric-card">
            <div class="metric-card-top">
              <span class="metric-card-label">Commentaires</span>
              <span class="metric-card-icon">💬</span>
            </div>
            <div class="metric-card-value">${formatNum(totalCommentsCount)}</div>
            <div class="metric-card-trend trend-up">${commentsTrend}</div>
          </div>

          <div class="metric-card">
            <div class="metric-card-top">
              <span class="metric-card-label">Abonnés</span>
              <span class="metric-card-icon">👥</span>
            </div>
            <div class="metric-card-value">${formatNum(userFollowersCount)}</div>
            <div class="metric-card-trend trend-up">${followersTrend}</div>
          </div>
        </div>

        <!-- 3. Gestionnaire des Histoires (Onglets & Liste) -->
        <div class="studio-stories-manager">
          <div class="studio-tabs-bar">
            <button class="studio-tab-btn ${this.activeTab === 'all' ? 'active' : ''}" data-tab="all">
              Toutes (${authoredStories.length})
            </button>
            <button class="studio-tab-btn ${this.activeTab === 'published' ? 'active' : ''}" data-tab="published">
              Publiées (${published.length})
            </button>
            <button class="studio-tab-btn ${this.activeTab === 'draft' ? 'active' : ''}" data-tab="draft">
              Brouillons (${drafts.length})
            </button>
          </div>

          <div class="authored-stories-list" id="authored-stories-container">
            ${this.renderStoriesList(this.activeTab, authoredStories)}
          </div>
        </div>

      </div>
    `;
  }

  renderStoriesList(tab, allStories) {
    let filtered = allStories;
    if (tab === 'published') filtered = allStories.filter(s => s.status === 'published');
    if (tab === 'draft') filtered = allStories.filter(s => s.status === 'draft');

    if (filtered.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3 class="empty-state-title">Aucune histoire dans cet onglet</h3>
          <p class="empty-state-text">Donnez vie à vos idées, écrivez votre histoire manuellement étape par étape.</p>
          <button class="btn btn-primary" id="btn-empty-create-story">+ Écrire une histoire</button>
        </div>
      `;
    }

    return filtered.map(story => `
      <div class="authored-story-card" data-story-id="${story.id}">
        <div class="authored-story-cover">
          <img src="${story.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'}" alt="${escapeHTML(story.title)}" />
        </div>

        <div class="authored-story-info">
          <div class="authored-story-badges">
            <span class="badge ${story.status === 'published' ? 'badge-primary' : 'badge-gold'}">
              ${story.status === 'published' ? '● Publiée' : '⚡ Brouillon'}
            </span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHTML(story.genre)}</span>
            ${story.secondaryGenre ? `<span style="font-size: 0.75rem; color: var(--text-muted);">· ${escapeHTML(story.secondaryGenre)}</span>` : ''}
          </div>

          <h3 class="authored-story-title">${escapeHTML(story.title)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHTML(story.description || 'Aucune description...')}
          </p>

          <div class="authored-story-stats">
            <span>📖 ${story.chapters ? story.chapters.length : (story.chaptersCount || 1)} chapitre(s)</span>
            <span>👁️ ${story.readsRaw || story.reads_raw || (story.stats?.reads || 0)} lectures</span>
            <span>❤️ ${story.likesCount || (story.stats?.likes || 0)} likes</span>
            <span>💬 ${story.reviewsCount || (story.stats?.comments || 0)} avis</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-2);">
          ${story.status === 'published' ? `
            <a href="#/story/${story.id}" class="btn btn-ghost btn-sm" title="Voir la fiche publique">
              👁️
            </a>
          ` : ''}
          <button class="btn btn-secondary btn-sm btn-open-editor" data-story-id="${story.id}">
            ✏️ Éditer
          </button>
        </div>
      </div>
    `).join('');
  }

  attachEvents(container) {
    // 1. Tab filtering
    container.querySelectorAll('.studio-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.activeTab = tab;
        container.querySelectorAll('.studio-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const authoredStories = this.getAuthoredStories();
        const containerList = container.querySelector('#authored-stories-container');
        if (containerList) {
          containerList.innerHTML = this.renderStoriesList(tab, authoredStories);
          this.bindListEvents(containerList);
        }
      });
    });

    // 2. Open Create Story Modal Button
    const createBtn = container.querySelector('#btn-open-create-story');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateWizard(false));
    }

    this.bindListEvents(container);
    this.initWizardModalHandlers();
  }

  bindListEvents(container) {
    container.querySelectorAll('.btn-open-editor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.getAttribute('data-story-id');
        this.openCreateWizard(true, storyId);
      });
    });

    const emptyCreate = container.querySelector('#btn-empty-create-story');
    if (emptyCreate) {
      emptyCreate.addEventListener('click', () => this.openCreateWizard(false));
    }
  }

  /**
   * Initialise et ouvre le Wizard 2 étapes (Création / Édition)
   */
  openCreateWizard(isEdit = false, storyId = null) {
    const modal = document.getElementById('modal-create-story');
    if (!modal) return;

    if (isEdit && storyId) {
      const authoredStories = this.getAuthoredStories();
      const story = authoredStories.find(s => s.id === storyId);
      if (story) {
        this.wizardState = {
          isEdit: true,
          storyId: story.id,
          title: story.title || '',
          genre: story.genre || 'Romance',
          secondaryGenre: story.secondaryGenre || '',
          description: story.description || '',
          tags: Array.isArray(story.tags) ? story.tags : [],
          cover: story.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          currentChapterIndex: 0,
          chapters: story.chapters && story.chapters.length > 0 
            ? story.chapters.map((c, i) => ({ title: c.title || `Chapitre ${i + 1}`, content: c.content || '' }))
            : [{ title: 'Chapitre 1 : Les Premières Lueurs', content: '' }]
        };
      }
    } else {
      // Nouvelle histoire (Reset propre)
      this.wizardState = {
        isEdit: false,
        storyId: null,
        title: '',
        genre: 'Romance',
        secondaryGenre: '',
        description: '',
        tags: [],
        cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        currentChapterIndex: 0,
        chapters: [
          { title: 'Chapitre 1 : Les Premières Lueurs', content: '' }
        ]
      };
    }

    // Populate Form Step 1
    const heading = modal.querySelector('#create-story-modal-heading');
    if (heading) heading.textContent = isEdit ? '✏️ Modifier l\'Histoire' : '✍️ Créer une Histoire';

    const titleInput = modal.querySelector('#create-story-title');
    const genreSelect = modal.querySelector('#create-story-genre');
    const secGenreInput = modal.querySelector('#create-story-secondary-genre');
    const descTextarea = modal.querySelector('#create-story-desc');
    const tagsInput = modal.querySelector('#create-story-tags');
    const coverUrlInput = modal.querySelector('#create-story-cover-url');
    const coverPreview = modal.querySelector('#create-story-cover-preview');

    if (titleInput) titleInput.value = this.wizardState.title;
    if (genreSelect) genreSelect.value = this.wizardState.genre;
    if (secGenreInput) secGenreInput.value = this.wizardState.secondaryGenre;
    if (descTextarea) descTextarea.value = this.wizardState.description;
    if (tagsInput) tagsInput.value = (this.wizardState.tags || []).join(', ');
    if (coverUrlInput) coverUrlInput.value = this.wizardState.cover;
    if (coverPreview) coverPreview.src = this.wizardState.cover;

    // Reset view to Step 1
    this.goToWizardStep(1, modal);

    modal.classList.add('active');
  }

  goToWizardStep(stepNumber, modal) {
    const step1Pane = modal.querySelector('#create-story-step-1');
    const step2Pane = modal.querySelector('#create-story-step-2');
    const badge1 = modal.querySelector('#step-badge-1');
    const badge2 = modal.querySelector('#step-badge-2');
    const footerStep1Left = modal.querySelector('#footer-step1-left');
    const footerStep2Left = modal.querySelector('#footer-step2-left');
    const btnGotoStep2 = modal.querySelector('#btn-goto-step2');
    const btnSaveDraft = modal.querySelector('#btn-save-as-draft');
    const btnPublish = modal.querySelector('#btn-publish-story');

    if (stepNumber === 1) {
      if (step1Pane) step1Pane.style.display = 'block';
      if (step2Pane) step2Pane.style.display = 'none';
      if (badge1) badge1.classList.add('active');
      if (badge2) badge2.classList.remove('active');
      if (footerStep1Left) footerStep1Left.style.display = 'block';
      if (footerStep2Left) footerStep2Left.style.display = 'none';
      if (btnGotoStep2) btnGotoStep2.style.display = 'inline-flex';
      if (btnSaveDraft) btnSaveDraft.style.display = 'none';
      if (btnPublish) btnPublish.style.display = 'none';
    } else if (stepNumber === 2) {
      if (step1Pane) step1Pane.style.display = 'none';
      if (step2Pane) step2Pane.style.display = 'block';
      if (badge1) badge1.classList.remove('active');
      if (badge2) badge2.classList.add('active');
      if (footerStep1Left) footerStep1Left.style.display = 'none';
      if (footerStep2Left) footerStep2Left.style.display = 'block';
      if (btnGotoStep2) btnGotoStep2.style.display = 'none';
      if (btnSaveDraft) btnSaveDraft.style.display = 'inline-flex';
      if (btnPublish) btnPublish.style.display = 'inline-flex';

      // Update Step 2 Preview Banner
      const titlePrev = modal.querySelector('#step2-story-title-preview');
      const genrePrev = modal.querySelector('#step2-story-genre-preview');
      if (titlePrev) titlePrev.textContent = this.wizardState.title;
      if (genrePrev) genrePrev.textContent = this.wizardState.genre;

      // Render chapters bar & active chapter
      this.renderChapterTabs(modal);
      this.loadActiveChapter(modal);
    }
  }

  renderChapterTabs(modal) {
    const tabsContainer = modal.querySelector('#create-chapters-tabs-bar');
    if (!tabsContainer) return;

    const chapters = this.wizardState.chapters;
    let tabsHtml = chapters.map((c, idx) => `
      <button class="chapter-tab-pill ${idx === this.wizardState.currentChapterIndex ? 'active' : ''}" data-chapter-idx="${idx}">
        ${escapeHTML(c.title ? (c.title.length > 18 ? c.title.substring(0, 18) + '...' : c.title) : `Chapitre ${idx + 1}`)}
      </button>
    `).join('');

    tabsHtml += `<button class="btn btn-ghost btn-sm" id="btn-add-new-chapter-tab" style="font-size: 0.8rem; padding: 4px 10px;">+ Ajouter un chapitre</button>`;
    tabsContainer.innerHTML = tabsHtml;

    // Attach click events on chapter pills
    tabsContainer.querySelectorAll('.chapter-tab-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-chapter-idx'), 10);
        this.saveCurrentChapterFromDOM(modal);
        this.wizardState.currentChapterIndex = idx;
        this.renderChapterTabs(modal);
        this.loadActiveChapter(modal);
      });
    });

    // Add new chapter tab
    const addTabBtn = tabsContainer.querySelector('#btn-add-new-chapter-tab');
    if (addTabBtn) {
      addTabBtn.addEventListener('click', () => {
        this.saveCurrentChapterFromDOM(modal);
        const newNum = this.wizardState.chapters.length + 1;
        this.wizardState.chapters.push({
          title: `Chapitre ${newNum} : `,
          content: ''
        });
        this.wizardState.currentChapterIndex = this.wizardState.chapters.length - 1;
        this.renderChapterTabs(modal);
        this.loadActiveChapter(modal);
      });
    }
  }

  saveCurrentChapterFromDOM(modal) {
    const titleInput = modal.querySelector('#create-chapter-title');
    const contentArea = modal.querySelector('#create-chapter-content');
    const idx = this.wizardState.currentChapterIndex;
    if (this.wizardState.chapters[idx]) {
      if (titleInput) this.wizardState.chapters[idx].title = titleInput.value.trim() || `Chapitre ${idx + 1}`;
      if (contentArea) this.wizardState.chapters[idx].content = contentArea.value.trim();
    }
  }

  loadActiveChapter(modal) {
    const idx = this.wizardState.currentChapterIndex;
    const chap = this.wizardState.chapters[idx] || { title: `Chapitre ${idx + 1}`, content: '' };

    const titleInput = modal.querySelector('#create-chapter-title');
    const contentArea = modal.querySelector('#create-chapter-content');

    if (titleInput) titleInput.value = chap.title || `Chapitre ${idx + 1}`;
    if (contentArea) contentArea.value = chap.content || '';

    this.updateLiveCounts(modal);
  }

  updateLiveCounts(modal) {
    const textarea = modal.querySelector('#create-chapter-content');
    if (!textarea) return;
    const text = textarea.value.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const readTimeMin = Math.max(1, Math.ceil(words / 200));

    const wordEl = modal.querySelector('#manual-word-count');
    const timeEl = modal.querySelector('#manual-read-time');
    if (wordEl) wordEl.textContent = `${words} mots (${chars} car.)`;
    if (timeEl) timeEl.textContent = `⏱️ ~${readTimeMin} min de lecture`;
  }

  initWizardModalHandlers() {
    const modal = document.getElementById('modal-create-story');
    if (!modal || modal.dataset.wizardBound) return;
    modal.dataset.wizardBound = 'true';

    // 1. Fermeture
    const closeBtn = modal.querySelector('#btn-close-create-story-modal');
    const cancelBtn = modal.querySelector('#btn-cancel-create-story');
    const closeModal = () => modal.classList.remove('active');
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // 2. Presets de couverture
    modal.querySelectorAll('.cover-preset-thumb').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        modal.querySelectorAll('.cover-preset-thumb').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const src = e.currentTarget.getAttribute('data-src');
        const urlInput = modal.querySelector('#create-story-cover-url');
        const prevImg = modal.querySelector('#create-story-cover-preview');
        if (urlInput) urlInput.value = src;
        if (prevImg) prevImg.src = src;
        this.wizardState.cover = src;
      });
    });

    // 3. Upload image locale
    const fileInput = modal.querySelector('#create-story-cover-file');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          const urlInput = modal.querySelector('#create-story-cover-url');
          const prevImg = modal.querySelector('#create-story-cover-preview');
          if (urlInput) urlInput.value = dataUrl;
          if (prevImg) prevImg.src = dataUrl;
          this.wizardState.cover = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    });

    // URL input live preview
    const urlInput = modal.querySelector('#create-story-cover-url');
    urlInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const prevImg = modal.querySelector('#create-story-cover-preview');
      if (prevImg && val) prevImg.src = val;
      this.wizardState.cover = val;
    });

    // 4. Passage à l'Étape 2 (Validation Étape 1)
    const btnGotoStep2 = modal.querySelector('#btn-goto-step2');
    btnGotoStep2?.addEventListener('click', () => {
      const title = modal.querySelector('#create-story-title')?.value.trim();
      const genre = modal.querySelector('#create-story-genre')?.value;
      const secGenre = modal.querySelector('#create-story-secondary-genre')?.value.trim();
      const desc = modal.querySelector('#create-story-desc')?.value.trim();
      const tagsRaw = modal.querySelector('#create-story-tags')?.value.trim();
      const cover = modal.querySelector('#create-story-cover-url')?.value.trim();

      if (!title) {
        Toast.show('Veuillez renseigner le titre de votre histoire.', 'warning', '⚠️');
        modal.querySelector('#create-story-title')?.focus();
        return;
      }
      if (!desc) {
        Toast.show('Veuillez écrire un synopsis ou résumé pour donner envie aux lecteurs.', 'warning', '⚠️');
        modal.querySelector('#create-story-desc')?.focus();
        return;
      }

      this.wizardState.title = title;
      this.wizardState.genre = genre || 'Romance';
      this.wizardState.secondaryGenre = secGenre || '';
      this.wizardState.description = desc;
      this.wizardState.tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [genre];
      this.wizardState.cover = cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';

      this.goToWizardStep(2, modal);
    });

    // 5. Retour à l'Étape 1
    const btnBackToStep1 = modal.querySelector('#btn-back-to-step1');
    btnBackToStep1?.addEventListener('click', () => {
      this.saveCurrentChapterFromDOM(modal);
      this.goToWizardStep(1, modal);
    });

    // 6. Live word count in chapter textarea
    const chapterContentArea = modal.querySelector('#create-chapter-content');
    chapterContentArea?.addEventListener('input', () => {
      this.updateLiveCounts(modal);
    });

    // 7. Enregistrer comme Brouillon
    const btnSaveDraft = modal.querySelector('#btn-save-as-draft');
    btnSaveDraft?.addEventListener('click', async () => {
      await this.finalizeStory(modal, 'draft');
    });

    // 8. Publier l'Histoire
    const btnPublish = modal.querySelector('#btn-publish-story');
    btnPublish?.addEventListener('click', async () => {
      await this.finalizeStory(modal, 'published');
    });
  }

  async finalizeStory(modal, targetStatus = 'published') {
    this.saveCurrentChapterFromDOM(modal);

    // Validation du contenu
    const chapters = this.wizardState.chapters;
    const hasAnyContent = chapters.some(c => (c.content || '').trim().length > 0);

    if (!hasAnyContent) {
      Toast.show('Veuillez écrire au moins quelques phrases dans votre chapitre.', 'warning', '✍️');
      modal.querySelector('#create-chapter-content')?.focus();
      return;
    }

    const isPublish = targetStatus === 'published';
    const btn = isPublish ? modal.querySelector('#btn-publish-story') : modal.querySelector('#btn-save-as-draft');
    if (btn) {
      btn.disabled = true;
      btn.textContent = isPublish ? '🚀 Publication en cours...' : '💾 Enregistrement...';
    }

    try {
      const currentUser = this.store.state.user || {};
      const storyId = this.wizardState.storyId || `story-${Date.now()}`;

      // Calcul de la durée totale estimée
      let totalMinutes = 0;
      const mappedChapters = chapters.map((c, idx) => {
        const words = (c.content || '').trim().split(/\s+/).filter(Boolean).length;
        const min = Math.max(1, Math.ceil(words / 200));
        totalMinutes += min;
        return {
          id: `${storyId}-chap-${idx + 1}`,
          number: idx + 1,
          title: c.title || `Chapitre ${idx + 1}`,
          duration: `${min} min`,
          readTimeMin: min,
          content: c.content || ''
        };
      });

      const storyPayload = {
        id: storyId,
        title: this.wizardState.title,
        subtitle: this.wizardState.secondaryGenre || '',
        authorId: currentUser.id || 'user-current',
        authorName: currentUser.name || currentUser.username || 'Auteur LIVA',
        authorAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        cover: this.wizardState.cover,
        banner: this.wizardState.cover,
        genre: this.wizardState.genre,
        secondaryGenre: this.wizardState.secondaryGenre,
        description: this.wizardState.description,
        tags: this.wizardState.tags,
        status: targetStatus,
        chapters: mappedChapters,
        chaptersCount: mappedChapters.length,
        estimatedTime: `${totalMinutes} min`,
        rating: 5.0,
        reviewsCount: 0,
        readsCount: isPublish ? '1' : '0',
        readsRaw: isPublish ? 1 : 0,
        likesCount: 0,
        isTrending: false,
        isHero: false,
        isShort: totalMinutes <= 15
      };

      await this.store.saveAuthoredStory(storyPayload);

      modal.classList.remove('active');

      if (isPublish) {
        Toast.show(`Félicitations ! Votre histoire "${storyPayload.title}" est maintenant publiée sur Liva 🌟`, 'success', '🚀');
      } else {
        Toast.show(`Brouillon "${storyPayload.title}" enregistré avec succès !`, 'info', '💾');
      }

      this.router.refresh();
    } catch (err) {
      console.error('[CreateView] Erreur finalizeStory:', err);
      Toast.show('Erreur lors de la sauvegarde de l\'histoire.', 'error', '❌');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = isPublish ? '🚀 Publier l\'Histoire' : '💾 Enregistrer Brouillon';
      }
    }
  }
}
