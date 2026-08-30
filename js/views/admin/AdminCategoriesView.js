// LIVA ADMIN — Vue Gestion des Catégories & Tags
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';

export class AdminCategoriesView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.categories = [];
    this.tags = [];
  }

  async render() {
    this.categories = await this.adminService.getCategories();
    this.tags = await this.adminService.getTags();

    return `
      <div class="admin-categories-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Catégories & Tags 🏷️
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Configurez les genres littéraires, icônes, dégradés et mots-clés de recherche de la plateforme.
            </p>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-open-add-tag-modal">
              + Ajouter un Tag
            </button>
            <button class="btn btn-primary btn-sm" id="btn-open-add-category-modal">
              + Nouvelle Catégorie
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6);">
          
          <!-- 1. GESTION DES CATÉGORIES -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>📚</span>
                <span>Genres Littéraires (${this.categories.length})</span>
              </div>
            </div>

            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th>Identifiant</th>
                    <th>Description</th>
                    <th>Histoires</th>
                    <th>Statut</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.categories.map(c => `
                    <tr>
                      <td>
                        <div style="display: flex; align-items: center; gap: var(--space-2);">
                          <span style="font-size: 1.2rem;">${c.icon || '📖'}</span>
                          <span style="font-weight: 700; color: var(--text-primary);">${escapeHTML(c.name)}</span>
                        </div>
                      </td>
                      <td>
                        <code style="color: var(--color-primary-light); font-size: 0.78rem;">${escapeHTML(c.id)}</code>
                      </td>
                      <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 250px;">
                        ${escapeHTML(c.description || '—')}
                      </td>
                      <td style="font-weight: 700;">${c.count || 0}</td>
                      <td>
                        <span class="admin-badge ${c.is_active !== false ? 'badge-status-published' : 'badge-status-draft'}">
                          ${c.is_active !== false ? 'Active' : 'Désactivée'}
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <button class="btn btn-ghost btn-sm btn-edit-category" data-cat-id="${c.id}" style="padding: 4px 8px; font-size: 0.75rem;">
                          ✏️ Éditer
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- 2. GESTION DES TAGS -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>🏷️</span>
                <span>Tags Populaires (${this.tags.length})</span>
              </div>
            </div>

            <div style="padding: var(--space-4); display: flex; flex-wrap: wrap; gap: 8px;">
              ${this.tags.length === 0 ? `
                <div style="color: var(--text-muted); font-size: 0.85rem;">Aucun tag créé. Cliquez sur « + Ajouter un Tag ».</div>
              ` : this.tags.map(t => `
                <span class="badge badge-blur" style="padding: 6px 12px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px;">
                  <span>#${escapeHTML(t.name)}</span>
                  <span style="font-size: 0.7rem; color: var(--color-primary-light);">(${t.usage_count || 0})</span>
                </span>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- MODALE CRÉATION CATÉGORIE -->
        <div class="admin-modal-backdrop" id="modal-admin-category">
          <div class="admin-modal-box">
            <div class="admin-modal-header">
              <h3 class="admin-card-title" id="admin-category-modal-title">✨ Catégorie</h3>
              <button class="btn btn-ghost btn-sm" id="btn-close-cat-modal">✕</button>
            </div>
            
            <form id="admin-category-form">
              <input type="hidden" id="form-cat-id" value="" />
              <div class="admin-modal-body">
                <div style="display: grid; grid-template-columns: 80px 1fr; gap: var(--space-3);">
                  <div class="form-group">
                    <label class="form-label">Icône *</label>
                    <input type="text" id="form-cat-icon" class="form-input" placeholder="❤️" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Nom du Genre *</label>
                    <input type="text" id="form-cat-name" class="form-input" placeholder="Ex: Thriller" required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Description d'accroche</label>
                  <textarea id="form-cat-desc" class="form-textarea" rows="3" placeholder="Description de la catégorie..."></textarea>
                </div>
              </div>

              <div class="admin-modal-footer">
                <button type="button" class="btn btn-ghost" id="btn-cancel-cat-modal">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer la catégorie ✨</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODALE CRÉATION TAG -->
        <div class="admin-modal-backdrop" id="modal-admin-tag">
          <div class="admin-modal-box" style="max-width: 440px;">
            <div class="admin-modal-header">
              <h3 class="admin-card-title">🏷️ Nouveau Tag</h3>
              <button class="btn btn-ghost btn-sm" id="btn-close-tag-modal">✕</button>
            </div>
            
            <form id="admin-tag-form">
              <div class="admin-modal-body">
                <div class="form-group">
                  <label class="form-label">Nom du mot-clé / Tag *</label>
                  <input type="text" id="form-tag-name" class="form-input" placeholder="Ex: Slow Burn" required />
                </div>
              </div>

              <div class="admin-modal-footer">
                <button type="button" class="btn btn-ghost" id="btn-cancel-tag-modal">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer le tag ✨</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  }

  async refreshSelf(container) {
    const target = container.querySelector?.('.admin-content-area') || 
                   container.closest?.('.admin-content-area') || 
                   (document.querySelector('.admin-content-area') || container);
    const html = await this.render();
    if (target) {
      target.innerHTML = html;
      this.attachEvents(target);
    }
  }

  attachEvents(container) {
    const catModal = container.querySelector('#modal-admin-category');
    const catForm = container.querySelector('#admin-category-form');
    const catIdInput = container.querySelector('#form-cat-id');
    const catIconInput = container.querySelector('#form-cat-icon');
    const catNameInput = container.querySelector('#form-cat-name');
    const catDescInput = container.querySelector('#form-cat-desc');

    const openCatModal = (cat = null) => {
      if (cat) {
        catIdInput.value = cat.id;
        catIconInput.value = cat.icon || '📖';
        catNameInput.value = cat.name;
        catDescInput.value = cat.description || '';
      } else {
        catIdInput.value = '';
        catForm?.reset();
      }
      catModal?.classList.add('active');
    };

    container.querySelector('#btn-open-add-category-modal')?.addEventListener('click', () => openCatModal());
    container.querySelector('#btn-close-cat-modal')?.addEventListener('click', () => catModal?.classList.remove('active'));
    container.querySelector('#btn-cancel-cat-modal')?.addEventListener('click', () => catModal?.classList.remove('active'));

    container.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-category');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const cId = editBtn.getAttribute('data-cat-id');
        const cat = this.categories.find(c => c.id === cId);
        if (cat) openCatModal(cat);
      }
    });

    catForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
      const catId = catIdInput.value || catNameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const payload = {
        id: catId,
        name: catNameInput.value.trim(),
        icon: catIconInput.value.trim(),
        description: catDescInput.value.trim(),
        is_active: true
      };

      try {
        await this.adminService.upsertCategory(payload, adminUser);
        catModal?.classList.remove('active');
        Toast.show('Catégorie enregistrée dans Supabase !', 'success', '✨');
        await this.refreshSelf(container);
      } catch (err) {
        Toast.show('Erreur : ' + err.message, 'error', '⚠️');
      }
    });

    // Modale Tag
    const tagModal = container.querySelector('#modal-admin-tag');
    const tagForm = container.querySelector('#admin-tag-form');
    const tagNameInput = container.querySelector('#form-tag-name');

    container.querySelector('#btn-open-add-tag-modal')?.addEventListener('click', () => tagModal?.classList.add('active'));
    container.querySelector('#btn-close-tag-modal')?.addEventListener('click', () => tagModal?.classList.remove('active'));
    container.querySelector('#btn-cancel-tag-modal')?.addEventListener('click', () => tagModal?.classList.remove('active'));

    tagForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
      const tagName = tagNameInput.value.trim();

      try {
        await this.adminService.upsertTag(tagName, adminUser);
        tagModal?.classList.remove('active');
        tagNameInput.value = '';
        Toast.show('Tag créé avec succès !', 'success', '✨');
        await this.refreshSelf(container);
      } catch (err) {
        Toast.show('Erreur : ' + err.message, 'error', '⚠️');
      }
    });
  }
}
