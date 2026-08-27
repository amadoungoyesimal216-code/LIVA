// LIVA - Espace Créateur / Studio Auteur (CreateView)
import { Toast } from '../components/Toast.js';
import { GENRES_DATA } from '../data/genres.js';
import { escapeHTML } from '../utils/sanitize.js';

export class CreateView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.activeTab = 'all'; // 'all' | 'draft' | 'published'
  }

  render() {
    const authoredStories = this.store.state.authoredStories || [];
    const drafts = authoredStories.filter(s => s.status === 'draft');
    const published = authoredStories.filter(s => s.status === 'published');

    // Calcul des métriques réelles à partir des histoires publiées de l'utilisateur
    let totalReadsCount = 0;
    let totalLikesCount = 0;
    let totalCommentsCount = 0;

    published.forEach(s => {
      totalReadsCount += (s.readsRaw || (s.stats?.reads || 0));
      totalLikesCount += (s.likesCount || (s.stats?.likes || 0));
      totalCommentsCount += (s.reviewsCount || (s.reviews?.length || 0));
    });

    const userFollowersCount = this.store.state.user.stats?.followersCount || 0;

    const formatNum = (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n);
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
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-primary-light); text-transform: uppercase;">Espace Auteur & Création</span>
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
          <p class="empty-state-text">Donnez vie à vos idées, écrivez votre premier chapitre dès aujourd'hui.</p>
          <button class="btn btn-primary" id="btn-empty-create-story">+ Écrire une histoire</button>
        </div>
      `;
    }

    return filtered.map(story => `
      <div class="authored-story-card" data-story-id="${story.id}">
        <div class="authored-story-cover">
          <img src="${story.cover}" alt="${escapeHTML(story.title)}" />
        </div>

        <div class="authored-story-info">
          <div class="authored-story-badges">
            <span class="badge ${story.status === 'published' ? 'badge-primary' : 'badge-gold'}">
              ${story.status === 'published' ? '● Publiée' : '⚡ Brouillon'}
            </span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHTML(story.genre)}</span>
          </div>

          <h3 class="authored-story-title">${escapeHTML(story.title)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHTML(story.description || 'Aucune description...')}
          </p>

          <div class="authored-story-stats">
            <span>📖 ${story.chapters ? story.chapters.length : 1} chapitre(s)</span>
            <span>👁️ ${story.stats?.reads || 0} lectures</span>
            <span>❤️ ${story.stats?.likes || 0} likes</span>
            <span>💬 ${story.stats?.comments || 0} avis</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <button class="btn btn-secondary btn-sm btn-open-editor" data-story-id="${story.id}">
            ✏️ Éditer
          </button>
        </div>
      </div>
    `).join('');
  }

  attachEvents(container) {
    // Tab filtering
    container.querySelectorAll('.studio-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.activeTab = tab;
        container.querySelectorAll('.studio-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const authoredStories = this.store.state.authoredStories || [];
        const containerList = container.querySelector('#authored-stories-container');
        if (containerList) {
          containerList.innerHTML = this.renderStoriesList(tab, authoredStories);
          this.bindListEvents(containerList);
        }
      });
    });

    // Create Story Modal
    const createBtn = container.querySelector('#btn-open-create-story');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateStoryModal());
    }

    this.bindListEvents(container);
  }

  bindListEvents(container) {
    container.querySelectorAll('.btn-open-editor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.getAttribute('data-story-id');
        this.openChapterEditor(storyId);
      });
    });

    const emptyCreate = container.querySelector('#btn-empty-create-story');
    if (emptyCreate) {
      emptyCreate.addEventListener('click', () => this.openCreateStoryModal());
    }
  }

  openCreateStoryModal() {
    const modal = document.getElementById('modal-create-story');
    if (modal) {
      modal.classList.add('active');
    }
  }

  openChapterEditor(storyId) {
    const story = (this.store.state.authoredStories || []).find(s => s.id === storyId);
    if (!story) return;

    const modal = document.getElementById('modal-chapter-editor');
    if (modal) {
      modal.setAttribute('data-editing-story-id', storyId);
      modal.querySelector('#editor-story-title-display').textContent = story.title;

      const chap = story.chapters?.[0] || { title: 'Chapitre 1', content: '' };
      modal.querySelector('#editor-chapter-title-input').value = chap.title || 'Chapitre 1';
      modal.querySelector('#editor-chapter-content-input').value = chap.content || '';

      // Update word count
      this.updateEditorCounts(modal);

      modal.classList.add('active');
    }
  }

  updateEditorCounts(modal) {
    const textarea = modal.querySelector('#editor-chapter-content-input');
    if (!textarea) return;
    const text = textarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const readTimeMin = Math.max(1, Math.ceil(words / 200));

    const wordsEl = modal.querySelector('#editor-word-count');
    const timeEl = modal.querySelector('#editor-read-time');
    if (wordsEl) wordsEl.textContent = `${words} mots`;
    if (timeEl) timeEl.textContent = `⏱️ ~${readTimeMin} min de lecture`;
  }
}
