// LIVA ADMIN — Vue Gestion des Auteurs (Certification, Statut, Performances)
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';

export class AdminAuthorsView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.authors = [];
  }

  async render() {
    this.authors = await this.adminService.getAuthors();

    return `
      <div class="admin-authors-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Gestion des Auteurs ✍️
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Supervisez les créateurs, certifiez leurs profils et suivez leurs statistiques de publication.
            </p>
          </div>
          
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            <strong style="color: var(--text-primary);">${this.authors.length}</strong> auteur(s) certifié(s)
          </div>
        </div>

        <!-- TABLEAU DES AUTEURS -->
        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Auteur</th>
                  <th>Username</th>
                  <th>Histoires</th>
                  <th>Lectures Totales</th>
                  <th>Abonnés</th>
                  <th>Certification</th>
                  <th>Statut</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.authors.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucun auteur trouvé dans la base.
                    </td>
                  </tr>
                ` : this.authors.map(a => `
                  <tr data-author-id="${a.id}">
                    <td>
                      <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <img src="${a.avatar}" alt="${escapeHTML(a.name)}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--color-primary-light);" />
                        <div>
                          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">
                            ${escapeHTML(a.name)}
                          </div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(a.bio ? a.bio.substring(0, 35) + '...' : '')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style="font-family: monospace; color: var(--color-primary-light);">${escapeHTML(a.username)}</span>
                    </td>
                    <td style="font-weight: 700;">📚 ${a.stories_count || 0}</td>
                    <td style="font-weight: 700; color: var(--text-primary);">👁️ ${a.total_reads || '0'}</td>
                    <td style="font-weight: 600;">👥 ${a.followers || '0'}</td>
                    <td>
                      <span class="admin-badge badge-status-published">✓ Vérifié</span>
                    </td>
                    <td>
                      <span class="admin-badge badge-status-${a.status || 'active'}">
                        ${a.status === 'suspended' ? 'Suspendu' : 'Actif'}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; align-items: center; gap: 6px;">
                        <a href="#/author/${encodeURIComponent(a.id)}" class="btn btn-ghost btn-sm" title="Voir le profil public" style="padding: 5px 8px; font-size: 0.8rem;">
                          👁️ Voir
                        </a>
                        <button class="btn btn-ghost btn-sm btn-toggle-author-status" data-author-id="${a.id}" data-current-status="${a.status || 'active'}" style="padding: 5px 8px; font-size: 0.8rem; color: ${a.status === 'suspended' ? 'var(--color-success)' : '#F87171'};">
                          ${a.status === 'suspended' ? '🟢 Réactiver' : '⏸️ Suspendre'}
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
    container.querySelectorAll('.btn-toggle-author-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const authorId = btn.getAttribute('data-author-id');
        const currentStatus = btn.getAttribute('data-current-status');
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        
        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.updateAuthorStatus(authorId, newStatus, adminUser);
          Toast.show(`Statut auteur passé à "${newStatus}".`, 'success', '✨');
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
