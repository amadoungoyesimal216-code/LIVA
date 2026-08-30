// LIVA ADMIN — Vue Gestion des Histoires (Studio Complet, Manuscrit, Détection Chapitres, CRUD)
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
    
    // État local du studio de rédaction
    this.activeModalTab = 'meta'; // 'meta' | 'manuscript' | 'preview'
    this.currentChapters = [];
    this.editingStoryId = null;
    this.autoSaveTimer = null;
  }

  async render() {
    this.stories = await this.adminService.getStories({
      search: this.filterSearch,
      genre: this.filterGenre,
      status: this.filterStatus
    });

    const formatK = (n) => {
      const num = Number(n) || 0;
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return String(num);
    };

    return `
      <div class="admin-stories-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Gestion & Studio des Histoires 📚
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Créez des récits complets, collez vos manuscrits intégraux ou modifiez les histoires publiées.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <a href="#/admin/story-engine" class="btn btn-secondary" style="gap: 8px; border-color: var(--color-primary); background: rgba(121, 40, 202, 0.1);">
              <span>✨</span>
              <span style="font-weight: 700; color: var(--color-primary-light);">Générer avec l'IA (Story Engine)</span>
            </a>
            <button class="btn btn-primary" id="btn-open-create-story-modal" style="gap: 8px;">
              <span>✍️</span>
              <span>Création manuelle / Manuscrit</span>
            </button>
          </div>
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
              <option value="published" ${this.filterStatus === 'published' ? 'selected' : ''}>Publiée (En ligne)</option>
              <option value="draft" ${this.filterStatus === 'draft' ? 'selected' : ''}>Brouillon</option>
              <option value="hidden" ${this.filterStatus === 'hidden' ? 'selected' : ''}>Masquée</option>
            </select>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);">
            <strong style="color: var(--text-primary);">${this.stories.length}</strong> histoire(s) réelle(s)
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
                  <th>Lectures Réelles</th>
                  <th>Likes</th>
                  <th>Chapitres</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.stories.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucune histoire trouvée dans Supabase.
                    </td>
                  </tr>
                ` : this.stories.map(st => `
                  <tr data-story-id="${st.id}">
                    <td>
                      <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <img src="${st.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'}" alt="${escapeHTML(st.title)}" style="width: 38px; height: 52px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);" />
                        <div>
                          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${escapeHTML(st.title)}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(st.id)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style="font-weight: 500;">${escapeHTML(st.author_name || 'Auteur')}</span>
                    </td>
                    <td>
                      <span class="badge badge-blur" style="font-size: 0.72rem;">${escapeHTML(st.genre || 'Général')}</span>
                    </td>
                    <td>
                      <span class="admin-badge badge-status-${st.status || 'published'}">
                        ${st.status === 'published' ? 'Publiée' : st.status === 'draft' ? 'Brouillon' : 'Masquée'}
                      </span>
                    </td>
                    <td style="font-weight: 600;">👁️ ${formatK(st.reads_raw || 0)}</td>
                    <td style="font-weight: 600; color: var(--color-accent-rose);">❤️ ${formatK(st.likes_count || 0)}</td>
                    <td style="font-weight: 600;">📑 ${st.chapters_count || 1}</td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; align-items: center; gap: 4px;">
                        <a href="#/admin/chapters?storyId=${encodeURIComponent(st.id)}" class="btn btn-ghost btn-sm btn-manage-chapters" data-story-id="${st.id}" title="Gérer les chapitres" style="padding: 6px 10px; font-size: 0.8rem;">
                          📑 Chapitres
                        </a>
                        <button type="button" class="btn btn-secondary btn-sm btn-edit-story" data-story-id="${st.id}" title="Modifier l'histoire & le manuscrit" style="padding: 6px 10px; font-size: 0.8rem;">
                          ✏️
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm btn-toggle-publish" data-story-id="${st.id}" data-current-status="${st.status}" title="${st.status === 'published' ? 'Passer en brouillon' : 'Publier'}" style="padding: 6px 10px; font-size: 0.8rem;">
                          ${st.status === 'published' ? '🚫' : '🚀'}
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm btn-delete-story" data-story-id="${st.id}" data-title="${escapeHTML(st.title)}" title="Supprimer définitivement" style="padding: 6px 10px; font-size: 0.8rem; color: #F87171;">
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

        <!-- MODALE STUDIO CRÉATION & ÉDITION HISTOIRE / MANUSCRIT -->
        <div class="admin-modal-backdrop" id="modal-admin-story-form">
          <div class="admin-modal-box" style="max-width: 860px;">
            
            <!-- En-tête Modale -->
            <div class="admin-modal-header">
              <div style="display: flex; align-items: center; gap: var(--space-3);">
                <h3 class="admin-card-title" id="admin-story-modal-title">✨ Studio de Rédaction d'Histoire</h3>
                <span class="admin-autosave-badge" id="admin-story-autosave-status">✓ Sauvegarde auto</span>
              </div>
              <button class="btn btn-ghost btn-sm" id="btn-close-story-modal">✕</button>
            </div>

            <!-- Onglets Modale -->
            <div class="admin-tabs-nav">
              <button type="button" class="admin-tab-btn active" data-tab-target="meta">
                <span>📝</span>
                <span>1. Informations & Couverture</span>
              </button>
              <button type="button" class="admin-tab-btn" data-tab-target="manuscript">
                <span>📖</span>
                <span>2. Manuscrit & Chapitres (<span id="tab-chapters-count">0</span>)</span>
              </button>
              <button type="button" class="admin-tab-btn" data-tab-target="preview">
                <span>👁️</span>
                <span>3. Aperçu Lecteur</span>
              </button>
            </div>
            
            <form id="admin-story-form">
              <input type="hidden" id="form-story-id" value="" />
              
              <div class="admin-modal-body" style="max-height: 65vh; overflow-y: auto;">
                
                <!-- TAB 1 : INFORMATIONS GÉNÉRALES -->
                <div class="admin-tab-content active" id="tab-content-meta">
                  <div class="form-group">
                    <label class="form-label">Titre de l'histoire *</label>
                    <input type="text" id="form-story-title" class="form-input" placeholder="Ex: La Promesse du Silence" required />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Sous-titre / Accroche (Optionnel)</label>
                    <input type="text" id="form-story-subtitle" class="form-input" placeholder="Ex: Une quête à travers les étoiles oubliées..." />
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                    <div class="form-group">
                      <label class="form-label">Nom de l'auteur *</label>
                      <input type="text" id="form-story-author" class="form-input" placeholder="Ex: Sarah Diop" required />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Langue de l'histoire</label>
                      <select id="form-story-lang" class="form-input">
                        <option value="Français" selected>Français</option>
                        <option value="Anglais">Anglais</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-4);">
                    <div class="form-group">
                      <label class="form-label">Genre Principal *</label>
                      <select id="form-story-genre" class="form-input">
                        ${GENRES_DATA.map(g => `<option value="${g.name}">${g.name}</option>`).join('')}
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Genre Secondaire</label>
                      <select id="form-story-sec-genre" class="form-input">
                        <option value="">Aucun</option>
                        ${GENRES_DATA.map(g => `<option value="${g.name}">${g.name}</option>`).join('')}
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Statut de Publication *</label>
                      <select id="form-story-status" class="form-input">
                        <option value="published">Publiée (Visible sur Liva)</option>
                        <option value="draft">Brouillon (Non visible)</option>
                        <option value="hidden">Masquée</option>
                      </select>
                    </div>
                  </div>

                  <!-- Image de couverture -->
                  <div class="form-group">
                    <label class="form-label">Image de Couverture</label>
                    <div style="display: flex; gap: var(--space-4); align-items: center;">
                      <img id="form-story-cover-preview" src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" style="width: 64px; height: 90px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);" />
                      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                        <input type="file" id="form-story-cover-file" accept="image/*" style="display: none;" />
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-browse-story-cover" style="align-self: flex-start;">
                          📷 Importer une image depuis l'appareil
                        </button>
                        <input type="text" id="form-story-cover-url" class="form-input" placeholder="Ou coller une URL d'image (Unsplash, etc.)..." style="font-size: 0.85rem;" />
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Description / Synopsis captivant *</label>
                    <textarea id="form-story-desc" class="form-textarea" rows="3" placeholder="Présentation de l'histoire pour susciter l'intérêt des lecteurs..." required></textarea>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Tags (séparés par des virgules)</label>
                    <input type="text" id="form-story-tags" class="form-input" placeholder="Ex: Amour interdit, Destin, Secrets, Suspense" />
                  </div>
                </div>

                <!-- TAB 2 : MANUSCRIT & DÉTECTION DES CHAPITRES -->
                <div class="admin-tab-content" id="tab-content-manuscript" style="display: none;">
                  
                  <!-- Bandeau d'options A et B -->
                  <div style="background: rgba(121, 40, 202, 0.08); border: 1px solid rgba(121, 40, 202, 0.2); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4);">
                    <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                      <span>⚡</span>
                      <span>Option A — Détection Automatique du Manuscrit</span>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: var(--space-3); line-height: 1.4;">
                      Collez l'ensemble de votre histoire ci-dessous. Le système découpe automatiquement les chapitres dès qu'il rencontre des titres comme <em>Chapitre 1</em>, <em>Chapitre 2</em>, <em>Chapter 3</em>, <em>PARTIE 1</em>, etc.
                    </p>
                    
                    <textarea id="form-story-raw-manuscript" class="admin-manuscript-editor" placeholder="Collez l'intégralité du manuscrit ici...&#10;&#10;Chapitre 1 : Le Début du Voyage&#10;Il était une fois dans une contrée lointaine...&#10;&#10;Chapitre 2 : La Révélation&#10;Le lendemain matin, une lettre mystérieuse arriva..."></textarea>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-3); flex-wrap: wrap; gap: var(--space-2);">
                      <button type="button" class="btn btn-primary btn-sm" id="btn-parse-manuscript" style="gap: 6px;">
                        <span>⚡</span>
                        <span>Découper et Importer les Chapitres</span>
                      </button>
                      <span id="manuscript-stats" style="font-size: 0.8rem; color: var(--text-muted);">0 mot</span>
                    </div>
                  </div>

                  <!-- Option B : Liste et Édition Manuelle des Chapitres -->
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                      <h4 style="font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <span>📑</span>
                        <span>Chapitres de l'Histoire (<span id="chapters-list-count">0</span>)</span>
                      </h4>
                      <button type="button" class="btn btn-secondary btn-sm" id="btn-add-manual-chapter">
                        + Ajouter un chapitre manuel
                      </button>
                    </div>

                    <div id="chapters-accordion-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
                      <div id="chapters-empty-state" style="padding: var(--space-6); text-align: center; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                        Aucun chapitre pour le moment. Collez un manuscrit ci-dessus ou ajoutez des chapitres manuellement.
                      </div>
                    </div>
                  </div>

                </div>

                <!-- TAB 3 : APERÇU LECTEUR -->
                <div class="admin-tab-content" id="tab-content-preview" style="display: none;">
                  <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-5);">
                    <div style="display: flex; gap: var(--space-4); margin-bottom: var(--space-5); align-items: flex-start; flex-wrap: wrap;">
                      <img id="preview-cover" src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" style="width: 90px; height: 130px; border-radius: 6px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" />
                      <div style="flex: 1; min-width: 200px;">
                        <span class="badge badge-blur" id="preview-genre" style="margin-bottom: 6px; font-size: 0.75rem;">Romance</span>
                        <h2 id="preview-title" style="font-size: 1.3rem; font-weight: 800; font-family: var(--font-display); margin-bottom: 4px;">Titre de l'histoire</h2>
                        <div id="preview-subtitle" style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">Sous-titre...</div>
                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary-light); margin-bottom: 8px;">Par <span id="preview-author">Auteur</span></div>
                        <p id="preview-desc" style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">Synopsis...</p>
                      </div>
                    </div>

                    <hr style="border: 0; border-top: 1px solid var(--border-color); margin: var(--space-4) 0;" />

                    <div>
                      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: var(--space-3); display: flex; align-items: center; gap: 6px;">
                        <span>📖</span>
                        <span>Aperçu du Chapitre 1</span>
                      </h4>
                      <div id="preview-chapter-title" style="font-weight: 700; color: var(--color-primary-light); margin-bottom: 8px;">Chapitre 1</div>
                      <div id="preview-chapter-content" style="font-family: 'Literata', serif; font-size: 0.95rem; line-height: 1.8; color: #E2E8F0; max-height: 220px; overflow-y: auto; padding: var(--space-4); background: rgba(0,0,0,0.25); border-radius: var(--radius-md); white-space: pre-line;">
                        Le texte du premier chapitre apparaîtra ici fidèlement formaté.
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Pied de modale -->
              <div class="admin-modal-footer">
                <button type="button" class="btn btn-ghost" id="btn-cancel-story-modal">Fermer</button>
                <button type="button" class="btn btn-secondary" id="btn-save-draft">Enregistrer comme Brouillon 📦</button>
                <button type="submit" class="btn btn-primary" id="btn-save-publish">🚀 Enregistrer & Publier</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODALE CONFIRMATION SUPPRESSION -->
        <div class="admin-modal-backdrop" id="modal-confirm-delete-story">
          <div class="admin-modal-box" style="max-width: 440px; padding: var(--space-6);">
            <div style="text-align: center; margin-bottom: var(--space-4);">
              <div style="font-size: 2.5rem; margin-bottom: var(--space-2);">🗑️</div>
              <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: var(--space-2);">Confirmer la suppression</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
                Êtes-vous sûr de vouloir supprimer définitivement l'histoire <strong id="delete-story-title-display" style="color: var(--text-primary);"></strong> et tous ses chapitres de la base de données Supabase ?
              </p>
            </div>
            <div style="display: flex; gap: var(--space-3); justify-content: center;">
              <button class="btn btn-ghost" id="btn-cancel-delete">Annuler</button>
              <button class="btn btn-primary" id="btn-confirm-delete" style="background: #EF4444; border-color: #EF4444;">
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  async refreshSelf(container) {
    const target = container.querySelector?.('.admin-content-area') || 
                   (container.classList?.contains('admin-content-area') ? container : (document.querySelector('.admin-content-area') || container));
    const html = await this.render();
    if (target) {
      target.innerHTML = html;
      this.attachEvents(target);
    }
  }

  attachEvents(container) {
    this.container = container;

    // 1. Filtres
    const searchInput = container.querySelector('#admin-story-search');
    const genreSelect = container.querySelector('#admin-story-genre-filter');
    const statusSelect = container.querySelector('#admin-story-status-filter');

    const handleFilterChange = async () => {
      this.filterSearch = searchInput?.value || '';
      this.filterGenre = genreSelect?.value || 'all';
      this.filterStatus = statusSelect?.value || 'all';
      await this.refreshSelf(container);
    };

    let debounceTimer;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleFilterChange, 300);
    });

    genreSelect?.addEventListener('change', handleFilterChange);
    statusSelect?.addEventListener('change', handleFilterChange);

    // 2. Modale Studio
    const modal = container.querySelector('#modal-admin-story-form');
    const modalTitle = container.querySelector('#admin-story-modal-title');
    const form = container.querySelector('#admin-story-form');
    const idInput = container.querySelector('#form-story-id');
    const titleInput = container.querySelector('#form-story-title');
    const subtitleInput = container.querySelector('#form-story-subtitle');
    const authorInput = container.querySelector('#form-story-author');
    const genreInput = container.querySelector('#form-story-genre');
    const secGenreInput = container.querySelector('#form-story-sec-genre');
    const statusInput = container.querySelector('#form-story-status');
    const descInput = container.querySelector('#form-story-desc');
    const tagsInput = container.querySelector('#form-story-tags');
    const coverUrlInput = container.querySelector('#form-story-cover-url');
    const coverFile = container.querySelector('#form-story-cover-file');
    const coverPreview = container.querySelector('#form-story-cover-preview');
    const rawManuscript = container.querySelector('#form-story-raw-manuscript');
    const manuscriptStats = container.querySelector('#manuscript-stats');
    const autosaveStatus = container.querySelector('#admin-story-autosave-status');

    // Onglets Modale
    const tabBtns = container.querySelectorAll('.admin-tab-btn');
    const tabContents = {
      meta: container.querySelector('#tab-content-meta'),
      manuscript: container.querySelector('#tab-content-manuscript'),
      preview: container.querySelector('#tab-content-preview')
    };

    const switchTab = (tabId) => {
      this.activeModalTab = tabId;
      tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab-target') === tabId);
      });
      Object.keys(tabContents).forEach(key => {
        if (tabContents[key]) {
          tabContents[key].style.display = key === tabId ? 'block' : 'none';
        }
      });

      if (tabId === 'preview') {
        this.updatePreview(container);
      }
    };

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab-target');
        switchTab(target);
      });
    });

    // Auto-save local draft
    const triggerAutoSave = () => {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = setTimeout(() => {
        const draftData = {
          title: titleInput?.value,
          subtitle: subtitleInput?.value,
          author: authorInput?.value,
          genre: genreInput?.value,
          secGenre: secGenreInput?.value,
          status: statusInput?.value,
          description: descInput?.value,
          tags: tagsInput?.value,
          cover: coverPreview?.src,
          rawManuscript: rawManuscript?.value,
          chapters: this.currentChapters,
          timestamp: Date.now()
        };
        try {
          localStorage.setItem('liva_admin_story_draft', JSON.stringify(draftData));
          if (autosaveStatus) {
            const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            autosaveStatus.textContent = `✓ Enregistré automatiquement (${timeStr})`;
          }
        } catch (e) {}
      }, 800);
    };

    [titleInput, subtitleInput, authorInput, descInput, tagsInput, rawManuscript].forEach(el => {
      el?.addEventListener('input', triggerAutoSave);
    });

    // Compteur de mots en direct sur le manuscrit brut
    rawManuscript?.addEventListener('input', () => {
      const words = (rawManuscript.value || '').trim().split(/\s+/).filter(Boolean).length;
      if (manuscriptStats) {
        manuscriptStats.textContent = `${words} mots (~${Math.max(1, Math.ceil(words / 200))} min de lecture)`;
      }
    });

    // Découpage automatique des chapitres
    container.querySelector('#btn-parse-manuscript')?.addEventListener('click', () => {
      const text = rawManuscript?.value || '';
      if (!text.trim()) {
        Toast.show('Veuillez coller le texte de votre manuscrit avant de découper.', 'warning', '⚠️');
        return;
      }

      const parsed = this.parseManuscriptChapters(text);
      if (parsed.length === 0) {
        Toast.show('Aucun en-tête de chapitre détecté. Utilisez des titres comme "Chapitre 1", "Chapitre 2"...', 'info', '💡', 4500);
        // Créer un chapitre unique avec tout le texte
        this.currentChapters = [{
          number: 1,
          title: 'Chapitre 1 : Intégral',
          content: text.trim(),
          read_time_min: Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
        }];
      } else {
        this.currentChapters = parsed;
        Toast.show(`${parsed.length} chapitres détectés et découpés avec succès ! 🚀`, 'success', '⚡', 4000);
      }

      this.renderChaptersList(container);
      triggerAutoSave();
    });

    // Ajout manuel d'un chapitre
    container.querySelector('#btn-add-manual-chapter')?.addEventListener('click', () => {
      const nextNum = this.currentChapters.length + 1;
      this.currentChapters.push({
        number: nextNum,
        title: `Chapitre ${nextNum}`,
        content: '',
        read_time_min: 5
      });
      this.renderChaptersList(container);
      triggerAutoSave();
    });

    // Cover picker
    container.querySelector('#btn-browse-story-cover')?.addEventListener('click', () => coverFile?.click());
    coverFile?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const uploadedUrl = await this.adminService.uploadImage(file, 'covers');
          if (coverPreview) coverPreview.src = uploadedUrl;
          if (coverUrlInput) coverUrlInput.value = uploadedUrl;
          triggerAutoSave();
        } catch (err) {
          Toast.show('Erreur chargement image : ' + err.message, 'error', '⚠️');
        }
      }
    });

    coverUrlInput?.addEventListener('input', () => {
      if (coverUrlInput.value.trim() && coverPreview) {
        coverPreview.src = coverUrlInput.value.trim();
        triggerAutoSave();
      }
    });

    // Ouvrir Modale Immédiatement (0ms)
    const openModal = async (story = null) => {
      switchTab('meta');
      modal?.classList.add('active');

      if (story) {
        this.editingStoryId = story.id;
        modalTitle.textContent = `✏️ Modifier "${story.title}"`;
        idInput.value = story.id;
        titleInput.value = story.title || '';
        subtitleInput.value = story.subtitle || '';
        authorInput.value = story.author_name || '';
        genreInput.value = story.genre || 'Romance';
        secGenreInput.value = story.secondary_genre || '';
        statusInput.value = story.status || 'published';
        if (descInput) descInput.value = story.description || '';
        // Gestion sécurisée des tags (string, array ou null)
        let tagsValue = '';
        if (Array.isArray(story.tags)) {
          tagsValue = story.tags.join(', ');
        } else if (typeof story.tags === 'string') {
          tagsValue = story.tags;
        }
        if (tagsInput) tagsInput.value = tagsValue;
        if (coverUrlInput) coverUrlInput.value = story.cover || '';
        if (coverPreview) coverPreview.src = story.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';

        // Afficher immédiatement l'état de chargement des chapitres
        const listEl = container.querySelector('#chapters-accordion-list');
        if (listEl) {
          listEl.innerHTML = `
            <div style="padding: var(--space-6); text-align: center; color: var(--color-primary-light); font-size: 0.9rem;">
              <span style="display: inline-block; animation: spin 1s infinite linear; margin-right: 8px;">⏳</span> Chargement des chapitres depuis Supabase...
            </div>
          `;
        }

        try {
          // Charger les vrais chapitres depuis Supabase
          const chapters = await this.adminService.getChapters(story.id);
          this.currentChapters = (chapters || []).map(c => ({
            id: c.id,
            number: c.number,
            title: c.title,
            content: c.content,
            read_time_min: c.read_time_min || 5
          }));
        } catch (err) {
          console.warn('[AdminStoriesView] Erreur chargement chapitres:', err);
          this.currentChapters = [];
        } finally {
          this.renderChaptersList(container);
        }
      } else {
        this.editingStoryId = null;
        modalTitle.textContent = '✨ Nouvelle Histoire Complète';
        idInput.value = '';
        form.reset();
        coverPreview.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
        
        // Vérifier si un brouillon non sauvegardé existe
        const savedDraft = localStorage.getItem('liva_admin_story_draft');
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            if (draft.title) titleInput.value = draft.title;
            if (draft.subtitle) subtitleInput.value = draft.subtitle;
            if (draft.author) authorInput.value = draft.author;
            if (draft.genre) genreInput.value = draft.genre;
            if (draft.description) descInput.value = draft.description;
            if (draft.tags) tagsInput.value = draft.tags;
            if (draft.cover) {
              coverPreview.src = draft.cover;
              coverUrlInput.value = draft.cover;
            }
            if (draft.rawManuscript) rawManuscript.value = draft.rawManuscript;
            if (draft.chapters) this.currentChapters = draft.chapters;
          } catch (e) {}
        } else {
          this.currentChapters = [];
        }
        this.renderChaptersList(container);
      }
    };

    const closeModal = () => {
      modal?.classList.remove('active');
    };

    container.querySelector('#btn-open-create-story-modal')?.addEventListener('click', () => openModal());
    container.querySelector('#btn-close-story-modal')?.addEventListener('click', closeModal);
    container.querySelector('#btn-cancel-story-modal')?.addEventListener('click', closeModal);

    // Sauvegarde Brouillon
    container.querySelector('#btn-save-draft')?.addEventListener('click', () => {
      if (statusInput) statusInput.value = 'draft';
      form?.requestSubmit();
    });

    // Form submit (Sauvegarde dans Supabase)
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const adminUser = this.store.state.user || { id: 'admin', name: 'Administrateur' };
      const saveBtn = container.querySelector('#btn-save-publish');

      if (!titleInput.value.trim() || !authorInput.value.trim()) {
        Toast.show('Veuillez renseigner le titre et l\'auteur de l\'histoire.', 'warning', '⚠️');
        switchTab('meta');
        return;
      }

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Enregistrement dans Supabase... ⏳';
      }

      const storyPayload = {
        id: idInput.value || undefined,
        title: titleInput.value.trim(),
        subtitle: subtitleInput.value.trim(),
        author_name: authorInput.value.trim(),
        genre: genreInput.value,
        secondary_genre: secGenreInput.value,
        status: statusInput.value,
        description: descInput.value.trim(),
        tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
        cover: coverPreview.src || coverUrlInput.value.trim()
      };

      try {
        await this.adminService.upsertStoryWithChapters(storyPayload, this.currentChapters, adminUser);
        localStorage.removeItem('liva_admin_story_draft');
        closeModal();
        Toast.show(`Histoire "${storyPayload.title}" enregistrée et synchronisée ! 🎉`, 'success', '🚀', 5000);
        
        await this.store.initSupabaseSync();
        handleFilterChange();
      } catch (err) {
        Toast.show('Erreur lors de l\'enregistrement : ' + err.message, 'error', '⚠️', 5000);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = '🚀 Enregistrer & Publier';
        }
      }
    });

    // 3. Gestionnaire d'événements délégué universel sur la table
    const deleteModal = container.querySelector('#modal-confirm-delete-story');
    const deleteTitleDisplay = container.querySelector('#delete-story-title-display');
    const confirmDeleteBtn = container.querySelector('#btn-confirm-delete');
    const cancelDeleteBtn = container.querySelector('#btn-cancel-delete');
    let storyIdToDelete = null;
    let storyTitleToDelete = null;

    container.addEventListener('click', async (e) => {
      // A. Bouton Modifier l'Histoire (✏️)
      const editBtn = e.target.closest('.btn-edit-story');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const storyId = editBtn.getAttribute('data-story-id');
        let st = this.stories.find(s => String(s.id) === String(storyId));
        if (!st) {
          const row = editBtn.closest('tr');
          const title = row?.querySelector('div[style*="font-weight: 700"]')?.textContent || 'Histoire';
          st = { id: storyId, title };
        }
        openModal(st);
        return;
      }

      // B. Bouton Chapitres (📑)
      const chapterBtn = e.target.closest('.btn-manage-chapters');
      if (chapterBtn) {
        e.preventDefault();
        e.stopPropagation();
        const storyId = chapterBtn.getAttribute('data-story-id');
        if (storyId) {
          this.router.navigate(`/admin/chapters?storyId=${encodeURIComponent(storyId)}`);
        }
        return;
      }

      // C. Basculer Publier / Brouillon
      const toggleBtn = e.target.closest('.btn-toggle-publish');
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        const storyId = toggleBtn.getAttribute('data-story-id');
        const currentStatus = toggleBtn.getAttribute('data-current-status');
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        const st = this.stories.find(s => String(s.id) === String(storyId));
        if (!st) return;

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Administrateur' };
          await this.adminService.upsertStory({ ...st, status: newStatus }, adminUser);
          Toast.show(`Histoire ${newStatus === 'published' ? 'publiée en ligne 🚀' : 'mise en brouillon 📦'}`, 'info', '✨');
          await this.store.initSupabaseSync();
          handleFilterChange();
        } catch (err) {
          Toast.show('Erreur : ' + err.message, 'error', '⚠️');
        }
        return;
      }

      // D. Bouton Supprimer
      const deleteBtn = e.target.closest('.btn-delete-story');
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        storyIdToDelete = deleteBtn.getAttribute('data-story-id');
        storyTitleToDelete = deleteBtn.getAttribute('data-title');
        if (deleteTitleDisplay) deleteTitleDisplay.textContent = `"${storyTitleToDelete || storyIdToDelete}"`;
        deleteModal?.classList.add('active');
        return;
      }
    });

    cancelDeleteBtn?.addEventListener('click', () => {
      deleteModal?.classList.remove('active');
    });

    confirmDeleteBtn?.addEventListener('click', async () => {
      if (!storyIdToDelete) return;
      deleteModal?.classList.remove('active');

      try {
        const adminUser = this.store.state.user || { id: 'admin', name: 'Administrateur' };
        await this.adminService.deleteStory(storyIdToDelete, storyTitleToDelete, adminUser);
        Toast.show(`L'histoire "${storyTitleToDelete}" a été supprimée avec succès.`, 'success', '🗑️');
        await this.store.initSupabaseSync();
        handleFilterChange();
      } catch (err) {
        Toast.show('Erreur lors de la suppression : ' + err.message, 'error', '⚠️');
      }
    });

    // Navigation par paramètres URL
    if (this.params.action === 'new') {
      openModal();
    } else if (this.params.edit) {
      const storyToEdit = this.stories.find(s => s.id === this.params.edit);
      if (storyToEdit) openModal(storyToEdit);
    }
  }

  /**
   * Algorithme de Découpage Automatique du Manuscrit
   */
  parseManuscriptChapters(rawText) {
    const lines = rawText.split('\n');
    const chapters = [];
    let currentChapter = null;
    let currentContentLines = [];

    // Regex détection des en-têtes de chapitres
    const chapterHeaderRegex = /^\s*(?:CHAPITRE|Chapitre|Chapter|CHAPTER|PARTIE|Partie|EPISODE|Episode)\s*([0-9IVXLCDM]+)?(?:\s*[:\-–—]\s*(.*)|\s*(.*))?$/i;

    lines.forEach((line) => {
      const match = line.trim().match(chapterHeaderRegex);
      if (match) {
        // Enregistrer le chapitre précédent
        if (currentChapter) {
          currentChapter.content = currentContentLines.join('\n').trim();
          const words = currentChapter.content.split(/\s+/).filter(Boolean).length;
          currentChapter.read_time_min = Math.max(1, Math.ceil(words / 200));
          chapters.push(currentChapter);
        }

        const num = match[1] ? match[1] : (chapters.length + 1);
        const subTitle = (match[2] || match[3] || '').trim();
        const fullTitle = subTitle ? `Chapitre ${num} : ${subTitle}` : `Chapitre ${num}`;

        currentChapter = {
          number: chapters.length + 1,
          title: fullTitle,
          content: '',
          read_time_min: 5
        };
        currentContentLines = [];
      } else {
        if (currentChapter) {
          currentContentLines.push(line);
        } else {
          // Texte introductif avant le premier chapitre
          if (line.trim()) {
            if (!currentChapter) {
              currentChapter = {
                number: 1,
                title: 'Chapitre 1 : Prologue',
                content: '',
                read_time_min: 5
              };
            }
            currentContentLines.push(line);
          }
        }
      }
    });

    if (currentChapter) {
      currentChapter.content = currentContentLines.join('\n').trim();
      const words = currentChapter.content.split(/\s+/).filter(Boolean).length;
      currentChapter.read_time_min = Math.max(1, Math.ceil(words / 200));
      chapters.push(currentChapter);
    }

    return chapters;
  }

  /**
   * Rendu visuel de la liste des chapitres avec accordéon
   */
  renderChaptersList(container) {
    const listEl = container.querySelector('#chapters-accordion-list');
    const badgeEl = container.querySelector('#tab-chapters-count');
    const countEl = container.querySelector('#chapters-list-count');

    if (badgeEl) badgeEl.textContent = this.currentChapters.length;
    if (countEl) countEl.textContent = this.currentChapters.length;

    if (!listEl) return;

    if (this.currentChapters.length === 0) {
      listEl.innerHTML = `
        <div id="chapters-empty-state" style="padding: var(--space-6); text-align: center; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          Aucun chapitre pour le moment. Collez un manuscrit ci-dessus ou ajoutez des chapitres manuellement.
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.currentChapters.map((ch, idx) => {
      const words = (ch.content || '').trim().split(/\s+/).filter(Boolean).length;
      const mins = Math.max(1, Math.ceil(words / 200));
      return `
        <div class="admin-chapter-card" data-chapter-index="${idx}">
          <div class="admin-chapter-header">
            <div style="display: flex; align-items: center; gap: var(--space-3);">
              <span style="font-weight: 800; color: var(--color-primary-light); font-size: 0.9rem;">#${idx + 1}</span>
              <strong style="font-size: 0.9rem;">${escapeHTML(ch.title || `Chapitre ${idx + 1}`)}</strong>
              <span class="badge badge-blur" style="font-size: 0.72rem;">${words} mots (~${mins} min)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="btn btn-ghost btn-sm btn-delete-chapter" data-chapter-index="${idx}" title="Supprimer ce chapitre" style="color: #F87171; padding: 4px 8px;">
                🗑️
              </button>
              <span class="accordion-arrow" style="font-size: 0.8rem; color: var(--text-muted);">▼</span>
            </div>
          </div>
          <div class="admin-chapter-body">
            <div class="form-group" style="margin-bottom: var(--space-3);">
              <label class="form-label">Titre du chapitre</label>
              <input type="text" class="form-input chapter-title-input" data-chapter-index="${idx}" value="${escapeHTML(ch.title || '')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Contenu du chapitre</label>
              <textarea class="form-textarea chapter-content-input" data-chapter-index="${idx}" rows="8" placeholder="Texte du chapitre...">${escapeHTML(ch.content || '')}</textarea>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Toggle accordéon
    listEl.querySelectorAll('.admin-chapter-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-chapter')) return;
        const card = header.closest('.admin-chapter-card');
        card.classList.toggle('expanded');
      });
    });

    // Supprimer un chapitre
    listEl.querySelectorAll('.btn-delete-chapter').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-chapter-index'));
        this.currentChapters.splice(idx, 1);
        this.renderChaptersList(container);
      });
    });

    // Édition en direct des titres et contenus de chapitres
    listEl.querySelectorAll('.chapter-title-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.getAttribute('data-chapter-index'));
        if (this.currentChapters[idx]) {
          this.currentChapters[idx].title = inp.value;
        }
      });
    });

    listEl.querySelectorAll('.chapter-content-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.getAttribute('data-chapter-index'));
        if (this.currentChapters[idx]) {
          this.currentChapters[idx].content = inp.value;
          const words = inp.value.trim().split(/\s+/).filter(Boolean).length;
          this.currentChapters[idx].read_time_min = Math.max(1, Math.ceil(words / 200));
        }
      });
    });
  }

  /**
   * Mise à jour de l'aperçu lecteur live
   */
  updatePreview(container) {
    const title = container.querySelector('#form-story-title')?.value || 'Titre de l\'histoire';
    const subtitle = container.querySelector('#form-story-subtitle')?.value || '';
    const author = container.querySelector('#form-story-author')?.value || 'Auteur';
    const genre = container.querySelector('#form-story-genre')?.value || 'Général';
    const desc = container.querySelector('#form-story-desc')?.value || 'Synopsis de l\'histoire...';
    const cover = container.querySelector('#form-story-cover-preview')?.src;

    const pTitle = container.querySelector('#preview-title');
    const pSub = container.querySelector('#preview-subtitle');
    const pAuthor = container.querySelector('#preview-author');
    const pGenre = container.querySelector('#preview-genre');
    const pDesc = container.querySelector('#preview-desc');
    const pCover = container.querySelector('#preview-cover');
    const pChTitle = container.querySelector('#preview-chapter-title');
    const pChContent = container.querySelector('#preview-chapter-content');

    if (pTitle) pTitle.textContent = title;
    if (pSub) pSub.textContent = subtitle;
    if (pAuthor) pAuthor.textContent = author;
    if (pGenre) pGenre.textContent = genre;
    if (pDesc) pDesc.textContent = desc;
    if (pCover && cover) pCover.src = cover;

    if (this.currentChapters.length > 0) {
      const ch1 = this.currentChapters[0];
      if (pChTitle) pChTitle.textContent = ch1.title || 'Chapitre 1';
      if (pChContent) pChContent.textContent = ch1.content || 'Contenu du chapitre 1...';
    } else {
      if (pChTitle) pChTitle.textContent = 'Aucun chapitre';
      if (pChContent) pChContent.textContent = 'Ajoutez un manuscrit ou des chapitres pour voir l\'aperçu de lecture.';
    }
  }
}
