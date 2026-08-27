// LIVA - Page Bibliothèque (LibraryView)
import { StoryCard } from '../components/StoryCard.js';
import { Toast } from '../components/Toast.js';

export class LibraryView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.activeTab = 'reading'; // 'reading' | 'saved' | 'finished' | 'collections'
  }

  render() {
    const library = this.store.state.library;
    const allStories = this.store.getAllStories();

    // Map reading stories
    const readingItems = (library.reading || []).map(r => {
      const story = allStories.find(s => s.id === r.storyId);
      return { progress: r, story };
    }).filter(item => item.story);

    // Map saved stories
    const savedStories = (library.saved || []).map(id => allStories.find(s => s.id === id)).filter(Boolean);

    // Map finished stories
    const finishedStories = (library.finished || []).map(id => allStories.find(s => s.id === id)).filter(Boolean);

    // Collections
    const collections = library.collections || [];

    return `
      <div class="library-view page-container animate-fade-in">
        
        <!-- 1. En-tête de la Bibliothèque -->
        <div class="library-header">
          <h1 class="library-title">Ma Bibliothèque 📚</h1>
          <button class="btn btn-primary btn-sm" id="btn-open-create-collection">
            + Nouvelle collection
          </button>
        </div>

        <!-- 2. Barre d'Onglets -->
        <div class="library-tabs-bar">
          <button class="library-tab-btn ${this.activeTab === 'reading' ? 'active' : ''}" data-tab="reading">
            En cours (${readingItems.length})
          </button>
          <button class="library-tab-btn ${this.activeTab === 'saved' ? 'active' : ''}" data-tab="saved">
            À lire (${savedStories.length})
          </button>
          <button class="library-tab-btn ${this.activeTab === 'finished' ? 'active' : ''}" data-tab="finished">
            Terminées (${finishedStories.length})
          </button>
          <button class="library-tab-btn ${this.activeTab === 'collections' ? 'active' : ''}" data-tab="collections">
            Collections (${collections.length})
          </button>
        </div>

        <!-- 3. Contenu de l'Onglet Actif -->
        <div class="library-content-area" id="library-tab-content">
          ${this.renderTabContent(this.activeTab, readingItems, savedStories, finishedStories, collections)}
        </div>

      </div>
    `;
  }

  renderTabContent(tab, readingItems, savedStories, finishedStories, collections) {
    if (tab === 'reading') {
      if (readingItems.length === 0) {
        return this.renderEmptyState('📖', 'Aucune lecture en cours', 'Commencez à lire une histoire et retrouvez facilement votre progression ici.');
      }
      return `
        <div class="reading-now-list">
          ${readingItems.map(item => StoryCard.renderReadingNow(item.progress, item.story, this.store)).join('')}
        </div>
      `;
    }

    if (tab === 'saved') {
      if (savedStories.length === 0) {
        return this.renderEmptyState('❤️', 'Votre liste "À lire" est vide', 'Ajoutez des histoires en cliquant sur le cœur ou "Ajouter à ma bibliothèque".');
      }
      return `
        <div class="search-results-grid">
          ${savedStories.map(story => StoryCard.renderVertical(story, this.store)).join('')}
        </div>
      `;
    }

    if (tab === 'finished') {
      if (finishedStories.length === 0) {
        return this.renderEmptyState('🏆', 'Aucune histoire terminée pour l\'instant', 'Terminez votre première histoire pour débloquer votre premier badge de lecture !');
      }
      return `
        <div class="search-results-grid">
          ${finishedStories.map(story => StoryCard.renderVertical(story, this.store)).join('')}
        </div>
      `;
    }

    if (tab === 'collections') {
      const allStories = this.store.getAllStories();
      return `
        <div class="collections-grid">
          <!-- Carte d'Ajout Rapide -->
          <div class="collection-card create-collection-card" id="card-new-collection">
            <span style="font-size: 2.2rem; color: var(--color-primary-light);">+</span>
            <span style="font-weight: 700; font-size: 1rem; color: var(--text-primary);">Créer une collection</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Organisez vos histoires selon vos thèmes</span>
          </div>

          ${collections.map(col => {
            const colStories = col.storyIds.map(id => allStories.find(s => s.id === id)).filter(Boolean);
            return `
              <div class="collection-card" data-col-id="${col.id}">
                <div class="collection-card-top">
                  <span class="collection-icon">${col.icon || '📚'}</span>
                  <button class="btn btn-ghost btn-sm btn-delete-collection" data-col-id="${col.id}" title="Supprimer la collection">🗑️</button>
                </div>

                <div>
                  <h3 class="collection-name">${col.name}</h3>
                  <span class="collection-count">${colStories.length} histoires</span>
                </div>

                <div class="collection-thumbnails-stack">
                  ${colStories.slice(0, 4).map(s => `
                    <div class="collection-thumb">
                      <img src="${s.cover}" alt="${s.title}" />
                    </div>
                  `).join('')}
                  ${colStories.length === 0 ? '<span style="font-size: 0.78rem; color: var(--text-muted);">Aucune histoire ajoutée</span>' : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    return '';
  }

  renderEmptyState(icon, title, text) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-text">${text}</p>
        <button class="btn btn-primary btn-explore-stories">
          Explorer les histoires ✨
        </button>
      </div>
    `;
  }

  attachEvents(container) {
    // Tabs switching
    container.querySelectorAll('.library-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.activeTab = tab;
        container.querySelectorAll('.library-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const library = this.store.state.library;
        const allStories = this.store.getAllStories();
        const readingItems = (library.reading || []).map(r => ({ progress: r, story: allStories.find(s => s.id === r.storyId) })).filter(item => item.story);
        const savedStories = (library.saved || []).map(id => allStories.find(s => s.id === id)).filter(Boolean);
        const finishedStories = (library.finished || []).map(id => allStories.find(s => s.id === id)).filter(Boolean);
        const collections = library.collections || [];

        const contentEl = container.querySelector('#library-tab-content');
        if (contentEl) {
          contentEl.innerHTML = this.renderTabContent(tab, readingItems, savedStories, finishedStories, collections);
          this.bindTabEvents(contentEl);
        }
      });
    });

    // Create Collection Modal triggers
    const openModalBtn = container.querySelector('#btn-open-create-collection');
    if (openModalBtn) {
      openModalBtn.addEventListener('click', () => this.openCreateCollectionModal());
    }

    this.bindTabEvents(container);
  }

  bindTabEvents(container) {
    // Continue reading buttons
    container.querySelectorAll('.btn-continue-reading').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.getAttribute('data-story-id');
        const chapIndex = btn.getAttribute('data-chapter-index') || 0;
        this.router.navigate(`/reader/${storyId}/${chapIndex}`);
      });
    });

    // Reading cards click
    container.querySelectorAll('.reading-now-card, .story-card-vertical').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const storyId = card.getAttribute('data-story-id');
        if (storyId) this.router.navigate(`/story/${storyId}`);
      });
    });

    // Explore button from empty state
    container.querySelectorAll('.btn-explore-stories').forEach(btn => {
      btn.addEventListener('click', () => {
        this.router.navigate('/explore');
      });
    });

    // New collection card
    const newColCard = container.querySelector('#card-new-collection');
    if (newColCard) {
      newColCard.addEventListener('click', () => this.openCreateCollectionModal());
    }

    // Collection cards click (to view collection details)
    container.querySelectorAll('.collection-card[data-col-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-collection')) return;
        const colId = card.getAttribute('data-col-id');
        this.openCollectionDetailsModal(colId);
      });
    });

    // Delete collection
    container.querySelectorAll('.btn-delete-collection').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const colId = btn.getAttribute('data-col-id');
        this.store.deleteCollection(colId);
        Toast.show('Collection supprimée', 'info', '🗑️');
        // Refresh view
        this.router.refresh();
      });
    });
  }

  openCollectionDetailsModal(colId) {
    const col = (this.store.state.library.collections || []).find(c => c.id === colId);
    if (!col) return;

    const modal = document.getElementById('modal-collection-details');
    if (!modal) return;

    const allStories = this.store.getAllStories();
    const colStories = (col.storyIds || []).map(id => allStories.find(s => s.id === id)).filter(Boolean);

    const titleEl = modal.querySelector('#col-detail-title');
    const iconEl = modal.querySelector('#col-detail-icon');
    const listEl = modal.querySelector('#col-detail-stories-list');

    if (titleEl) titleEl.textContent = col.name;
    if (iconEl) iconEl.textContent = col.icon || '📚';

    if (listEl) {
      if (colStories.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding: var(--space-4) 0;">
            <div class="empty-state-icon">📚</div>
            <h4 class="empty-state-title">Cette collection est vide</h4>
            <p class="empty-state-text">Ajoutez des histoires depuis la page d'une histoire ou explorez le catalogue.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = colStories.map(story => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3); background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); gap: var(--space-3);">
            <div style="display: flex; align-items: center; gap: var(--space-3); min-width: 0;">
              <img src="${story.cover}" alt="${story.title}" style="width: 48px; height: 64px; object-fit: cover; border-radius: var(--radius-xs);" />
              <div style="min-width: 0;">
                <h4 style="font-size: 0.95rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${story.title}</h4>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${story.genre} · ${story.authorName}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <button class="btn btn-primary btn-sm btn-col-read-story" data-story-id="${story.id}">Lire 📖</button>
              <button class="btn btn-ghost btn-sm btn-col-remove-story" data-story-id="${story.id}" data-col-id="${col.id}" title="Retirer de la collection">✕</button>
            </div>
          </div>
        `).join('');

        // Bind Read & Remove in collection modal
        listEl.querySelectorAll('.btn-col-read-story').forEach(btn => {
          btn.addEventListener('click', () => {
            const sId = btn.getAttribute('data-story-id');
            modal.classList.remove('active');
            this.router.navigate(`/story/${sId}`);
          });
        });

        listEl.querySelectorAll('.btn-col-remove-story').forEach(btn => {
          btn.addEventListener('click', () => {
            const sId = btn.getAttribute('data-story-id');
            const cId = btn.getAttribute('data-col-id');
            this.store.removeStoryFromCollection(cId, sId);
            Toast.show('Histoire retirée de la collection', 'info', '🗑️');
            this.openCollectionDetailsModal(cId);
          });
        });
      }
    }

    modal.classList.add('active');
  }

  openCreateCollectionModal() {
    const modal = document.getElementById('modal-create-collection');
    if (modal) {
      modal.classList.add('active');
      const input = modal.querySelector('#new-col-name');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  }
}
