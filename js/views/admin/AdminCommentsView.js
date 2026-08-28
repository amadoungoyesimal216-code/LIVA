// LIVA ADMIN — Vue Modération des Commentaires & Avis
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';

export class AdminCommentsView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.reviews = [];
    this.filterStatus = 'all';
  }

  async render() {
    this.reviews = await this.adminService.getReviews({ status: this.filterStatus });

    return `
      <div class="admin-comments-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Modération des Commentaires 💬
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Supervisez les retours de lecture, masquez ou supprimez les commentaires inappropriés.
            </p>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);">
            <strong style="color: var(--text-primary);">${this.reviews.length}</strong> avis trouvé(s)
          </div>
        </div>

        <!-- FILTRES -->
        <div class="admin-toolbar">
          <div class="admin-toolbar-filters">
            <select class="admin-select" id="admin-reviews-status-filter">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Tous les avis</option>
              <option value="visible" ${this.filterStatus === 'visible' ? 'selected' : ''}>🟢 Visibles</option>
              <option value="hidden" ${this.filterStatus === 'hidden' ? 'selected' : ''}>⏸️ Masqués</option>
              <option value="flagged" ${this.filterStatus === 'flagged' ? 'selected' : ''}>🚩 Signalés</option>
            </select>
          </div>
        </div>

        <!-- TABLEAU DES COMMENTAIRES -->
        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Lecteur</th>
                  <th>Histoire</th>
                  <th>Note</th>
                  <th style="width: 40%;">Commentaire</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.reviews.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucun commentaire trouvé.
                    </td>
                  </tr>
                ` : this.reviews.map(r => `
                  <tr data-review-id="${r.id}">
                    <td>
                      <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <img src="${r.user_avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzc5MjhDQSIvPjwvc3ZnPg=='}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />
                        <span style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${escapeHTML(r.user_name || 'Lecteur')}</span>
                      </div>
                    </td>
                    <td>
                      <span style="font-size: 0.82rem; color: var(--color-primary-light); font-weight: 500;">${escapeHTML(r.story_id)}</span>
                    </td>
                    <td>
                      <span style="font-weight: 700; color: var(--color-accent-gold); font-size: 0.85rem;">⭐ ${r.rating || 5}</span>
                    </td>
                    <td>
                      <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">${escapeHTML(r.content || '')}</div>
                    </td>
                    <td style="color: var(--text-muted); font-size: 0.78rem;">
                      ${escapeHTML(r.date || 'Récemment')}
                    </td>
                    <td>
                      <span class="admin-badge badge-status-${r.status || 'visible'}">
                        ${r.status === 'hidden' ? 'Masqué' : r.status === 'flagged' ? 'Signalé' : 'Visible'}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; align-items: center; gap: 4px;">
                        <button class="btn btn-ghost btn-sm btn-toggle-review-visibility" data-review-id="${r.id}" data-current-status="${r.status || 'visible'}" style="padding: 4px 8px; font-size: 0.78rem;">
                          ${r.status === 'hidden' ? '🟢 Restaurer' : '👁️‍🗨️ Masquer'}
                        </button>
                        <button class="btn btn-ghost btn-sm btn-delete-review" data-review-id="${r.id}" style="padding: 4px 8px; font-size: 0.78rem; color: #F87171;">
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

      </div>
    `;
  }

  attachEvents(container) {
    const statusSelect = container.querySelector('#admin-reviews-status-filter');
    statusSelect?.addEventListener('change', async (e) => {
      this.filterStatus = e.target.value;
      const html = await this.render();
      container.innerHTML = html;
      this.attachEvents(container);
    });

    container.querySelectorAll('.btn-toggle-review-visibility').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rId = btn.getAttribute('data-review-id');
        const current = btn.getAttribute('data-current-status');
        const newStatus = current === 'hidden' ? 'visible' : 'hidden';

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.updateReviewStatus(rId, newStatus, adminUser);
          Toast.show(`Commentaire ${newStatus === 'hidden' ? 'masqué' : 'restauré'} avec succès.`, 'info', '💬');
          const html = await this.render();
          container.innerHTML = html;
          this.attachEvents(container);
        } catch (err) {
          Toast.show('Erreur : ' + err.message, 'error', '⚠️');
        }
      });
    });

    container.querySelectorAll('.btn-delete-review').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rId = btn.getAttribute('data-review-id');
        const confirmed = confirm('Supprimer définitivement ce commentaire ?');
        if (!confirmed) return;

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.updateReviewStatus(rId, 'deleted', adminUser);
          Toast.show('Commentaire supprimé.', 'success', '🗑️');
          const html = await this.render();
          container.innerHTML = html;
          this.attachEvents(container);
        } catch (err) {
          Toast.show('Erreur : ' + err.message, 'error', '⚠️');
        }
      });
    });
  }
}
