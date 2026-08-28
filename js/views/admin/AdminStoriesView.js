// LIVA ADMIN — Vue Gestion des Histoires (CRUD, Filtres, Publication, Suppression)
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';
import { GENRES_DATA } from '../../data/genres.js';

export class AdminStoriesView {
  constructor(store, router, adminService, params = {}) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.params = params;
    this.stories = [];
    this.filterSearch = '';
    this.filterGenre = 'all';
    this.filterStatus = 'all';
  }

  async render() {
    this.stories = await this.adminService.getStories({
      search: this.filterSearch,
      genre: this.filterGenre,
      status: this.filterStatus
    });

    const formatK = (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n || 0);
    };

    return `
      <div class="admin-stories-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Gestion des Histoires 📚
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Consultez, éditez, publiez, dépubliez ou supprimez les histoires du catalogue Liva.
            </p>
          </div>

          <button class="btn btn-primary" id="btn-open-create-story-modal">
            + Ajouter une histoire
          </button>
        </div>

        <!-- BARRE DE FILTRES ET RECHERCHE -->
        <div class="admin-toolbar">
          <div class="admin-toolbar-filters">
            <input 
              type="text" 
              class="admin-search-input" 
              id="admin-story-search" 
              placeholder="🔍 Rechercher par titre..." 
              value="${escapeHTML(this.filterSearch)}" 
            />

            <select class="admin-select" id="admin-story-genre-filter">
              <option value="all" ${this.filterGenre === 'all' ? 'selected' : ''}>Tous les genres</option>
              ${GENRES_DATA.map(g => `<option value="${g.name}" ${this.filterGenre === g.name ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select>

            <select class="admin-select" id="admin-story-status-filter">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Tous les statuts</option>
              <option value="published" ${this.filterStatus === 'published' ? 'selected' : ''}>Publiée</option>
              <option value="draft" ${this.filterStatus === 'draft' ? 'selected' : ''}>Brouillon</option>
              <option value="hidden" ${this.filterStatus === 'hidden' ? 'selected' : ''}>Masquée</option>
            </select>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);">
            <strong style="color: var(--text-primary);">${this.stories.length}</strong> histoire(s) trouvée(s)
          </div>
        </div>

        <!-- TABLEAU DES HISTOIRES -->
        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Histoire</th>
                  <th>Auteur</th>
                  <th>Genre</th>
                  <th>Statut</th>
                  <th>Lectures</th>
                  <th>Likes</th>
                  <th>Chapitres</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.stories.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucune histoire ne correspond à vos critères de recherche.
                    </td>
                  </tr>
                ` : this.stories.map(st => `
                  <tr data-story-id="${st.id}">
                    <td>
                      <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <img src="${st.cover}" alt="${escapeHTML(st.title)}" style="width: 38px; height: 52px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);" />
                        <div>
                          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${escapeHTML(st.title)}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(st.id)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style="font-weight: 500;">${escapeHTML(st.author_name)}</span>
                    </td>
                    <td>
                      <span class="badge badge-blur" style="font-size: 0.72rem;">${escapeHTML(st.genre)}</span>
                    </td>
                    <td>
                      <span class="admin-badge badge-status-${st.status || 'published'}">
                        ${st.status === 'published' ? 'Publiée' : st.status === 'draft' ? 'Brouillon' : 'Masquée'}
                      </span>
                    </td>
                    <td style="font-weight: 600;">👁️ ${formatK(st.reads_raw)}</td>
                    <td style="font-weight: 600; color: var(--color-accent-rose);">❤️ ${formatK(st.likes_count)}</td>
                    <td style="font-weight: 600;">📑 ${st.chapters_count || 1}</td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; align-items: center; gap: 4px;">
                        <a href="#/admin/chapters?storyId=${encodeURIComponent(st.id)}" class="btn btn-ghost btn-sm" title="Gérer les chapitres" style="padding: 6px 10px; font-size: 0.8rem;">
                          📑 Chapitres
                        </a>
                        <button class="btn btn-secondary btn-sm btn-edit-story" data-story-id="${st.id}" title="Modifier" style="padding: 6px 10px; font-size: 0.8rem;">
                          ✏️
                        </button>
                        <button class="btn btn-ghost btn-sm btn-toggle-publish" data-story-id="${st.id}" data-current-status="${st.status}" title="${st.status === 'published' ? 'Dépublier' : 'Publier'}" style="padding: 6px 10px; font-size: 0.8rem;">
                          ${st.status === 'published' ? '🚫' : '🚀'}
                        </button>
                        <button class="btn btn-ghost btn-sm btn-delete-story" data-story-id="${st.id}" data-title="${escapeHTML(st.title)}" title="Supprimer" style="padding: 6px 10px; font-size: 0.8rem; color: #F87171;">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- MODALE CRÉATION / ÉDITION HISTOIRE -->
        <div class="admin-modal-backdrop" id="modal-admin-story-form">
          <div class="admin-modal-box">
            <div class="admin-modal-header">
              <h3 class="admin-card-title" id="admin-story-modal-title">✨ Nouvelle Histoire</h3>
              <button class="btn btn-ghost btn-sm" id="btn-close-story-modal">✕</button>
            </div>
            
            <form id="admin-story-form">
              <input type="hidden" id="form-story-id" value="" />
              <div class="admin-modal-body">
                
                <div class="form-group">
                  <label class="form-label">Titre de l'histoire *</label>
                  <input type="text" id="form-story-title" class="form-input" placeholder="Ex: Le Chant des Étoiles" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Nom de l'auteur *</label>
                  <input type="text" id="form-story-author" class="form-input" placeholder="Ex: Amadou Kanté" required />
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                  <div class="form-group">
                    <label class="form-label">Genre Principal *</label>
                    <select id="form-story-genre" class="form-input">
                      ${GENRES_DATA.map(g => `<option value="${g.name}">${g.name}</option>`).join('')}
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Statut *</label>
                    <select id="form-story-status" class="form-input">
                      <option value="published">Publiée (En ligne)</option>
                      <option value="draft">Brouillon</option>
                      <option value="hidden">Masquée</option>
                    </select>
                  </div>
                </div>

                <!-- Image de couverture -->
                <div class="form-group">
                  <label class="form-label">Image de Couverture</label>
                  <div style="display: flex; gap: var(--space-3); align-items: center;">
                    <img id="form-story-cover-preview" src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" style="width: 50px; height: 70px; border-radius: 4px; object-fit: cover;" />
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                      <input type="file" id="form-story-cover-file" accept="image/*" style="display: none;" />
                      <button type="button" class="btn btn-secondary btn-sm" id="btn-browse-story-cover">
                        📷 Importer une image depuis l'appareil
                      </button>
                      <input type="text" id="form-story-cover-url" class="form-input" placeholder="Ou coller une URL d'image..." style="font-size: 0.8rem;" />
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Description / Synopsis</label>
                  <textarea id="form-story-desc" class="form-textarea" rows="4" placeholder="Synopsis captivant de l'histoire..."></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Tags (séparés par des virgules)</label>
                  <input type="text" id="form-story-tags" class="form-input" placeholder="Ex: Magie, Amour interdit, Mystère" />
                </div>

              </div>

              <div class="admin-modal-footer">
                <button type="button" class="btn btn-ghost" id="btn-cancel-story-modal">Annuler</button>
                <button type="submit" class="btn btn-primary" id="btn-save-story">Enregistrer l'histoire ✨</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  }

  attachEvents(container) {
    // 1. Filtres
    const searchInput = container.querySelector('#admin-story-search');
    const genreSelect = container.querySelector('#admin-story-genre-filter');
    const statusSelect = container.querySelector('#admin-story-status-filter');

    const handleFilterChange = async () => {
      this.filterSearch = searchInput?.value || '';
      this.filterGenre = genreSelect?.value || 'all';
      this.filterStatus = statusSelect?.value || 'all';
      
      const refreshedHtml = await this.render();
      container.innerHTML = refreshedHtml;
      this.attachEvents(container);
    };

    let debounceTimer;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleFilterChange, 300);
    });

    genreSelect?.addEventListener('change', handleFilterChange);
    statusSelect?.addEventListener('change', handleFilterChange);

    // 2. Modale Ajouter / Éditer
    const modal = container.querySelector('#modal-admin-story-form');
    const modalTitle = container.querySelector('#admin-story-modal-title');
    const form = container.querySelector('#admin-story-form');
    const idInput = container.querySelector('#form-story-id');
    const titleInput = container.querySelector('#form-story-title');
    const authorInput = container.querySelector('#form-story-author');
    const genreInput = container.querySelector('#form-story-genre');
    const statusInput = container.querySelector('#form-story-status');
    const descInput = container.querySelector('#form-story-desc');
    const tagsInput = container.querySelector('#form-story-tags');
    const coverUrlInput = container.querySelector('#form-story-cover-url');
    const coverFile = container.querySelector('#form-story-cover-file');
    const coverPreview = container.querySelector('#form-story-cover-preview');

    const openModal = (story = null) => {
      if (story) {
        modalTitle.textContent = `✏️ Modifier "${story.title}"`;
        idInput.value = story.id;
        titleInput.value = story.title;
        authorInput.value = story.author_name;
        genreInput.value = story.genre;
        statusInput.value = story.status || 'published';
        descInput.value = story.description || '';
        tagsInput.value = (story.tags || []).join(', ');
        coverUrlInput.value = story.cover || '';
        coverPreview.src = story.cover || '';
      } else {
        modalTitle.textContent = '✨ Nouvelle Histoire';
        idInput.value = '';
        form.reset();
        coverPreview.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
      }
      modal?.classList.add('active');
    };

    const closeModal = () => {
      modal?.classList.remove('active');
    };

    container.querySelector('#btn-open-create-story-modal')?.addEventListener('click', () => openModal());
    container.querySelector('#btn-close-story-modal')?.addEventListener('click', closeModal);
    container.querySelector('#btn-cancel-story-modal')?.addEventListener('click', closeModal);

    // Cover picker
    container.querySelector('#btn-browse-story-cover')?.addEventListener('click', () => coverFile?.click());
    coverFile?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          coverPreview.src = evt.target.result;
          coverUrlInput.value = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    coverUrlInput?.addEventListener('input', () => {
      if (coverUrlInput.value.trim()) {
        coverPreview.src = coverUrlInput.value.trim();
      }
    });

    // Form submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
      const rawTags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);

      const storyPayload = {
        id: idInput.value || undefined,
        title: titleInput.value.trim(),
        author_name: authorInput.value.trim(),
        genre: genreInput.value,
        status: statusInput.value,
        description: descInput.value.trim(),
        tags: rawTags,
        cover: coverPreview.src || coverUrlInput.value.trim()
      };

      try {
        await this.adminService.upsertStory(storyPayload, adminUser);
        closeModal();
        Toast.show('Histoire enregistrée avec succès dans Supabase !', 'success', '✨');
        // Synchroniser le store local
        await this.store.initSupabaseSync();
        handleFilterChange();
      } catch (err) {
        Toast.show('Erreur lors de l\'enregistrement : ' + err.message, 'error', '⚠️');
      }
    });

    // 3. Modifier une histoire
    container.querySelectorAll('.btn-edit-story').forEach(btn => {
      btn.addEventListener('click', () => {
        const storyId = btn.getAttribute('data-story-id');
        const st = this.stories.find(s => s.id === storyId);
        if (st) openModal(st);
      });
    });

    // 4. Basculer Publier / Dépublier
    container.querySelectorAll('.btn-toggle-publish').forEach(btn => {
      btn.addEventListener('click', async () => {
        const storyId = btn.getAttribute('data-story-id');
        const currentStatus = btn.getAttribute('data-current-status');
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        const st = this.stories.find(s => s.id === storyId);
        if (!st) return;

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.upsertStory({ ...st, status: newStatus }, adminUser);
          Toast.show(`Histoire ${newStatus === 'published' ? 'publiée en ligne 🚀' : 'mise en brouillon 📦'}`, 'info', '✨');
          await this.store.initSupabaseSync();
          handleFilterChange();
        } catch (err) {
          Toast.show('Erreur : ' + err.message, 'error', '⚠️');
        }
      });
    });

    // 5. Supprimer une histoire
    container.querySelectorAll('.btn-delete-story').forEach(btn => {
      btn.addEventListener('click', async () => {
        const storyId = btn.getAttribute('data-story-id');
        const storyTitle = btn.getAttribute('data-title');
        const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'histoire "${storyTitle}" et tous ses chapitres ? Cette action est irréversible.`);
        if (!confirmed) return;

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.deleteStory(storyId, storyTitle, adminUser);
          Toast.show('Histoire et chapitres supprimés de la base.', 'success', '🗑️');
          await this.store.initSupabaseSync();
          handleFilterChange();
        } catch (err) {
          Toast.show('Erreur suppression : ' + err.message, 'error', '⚠️');
        }
      });
    });

    // Si action=new ou edit passé dans l'URL
    if (this.params.action === 'new') {
      openModal();
    } else if (this.params.edit) {
      const storyToEdit = this.stories.find(s => s.id === this.params.edit);
      if (storyToEdit) {
        openModal(storyToEdit);
      }
    }
  }
}
