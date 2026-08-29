// LIVA ADMIN — Vue Centre de Modération & Traitement des Signalements
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';

export class AdminModerationView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.reports = [];
    this.filterStatus = 'all';
  }

  async render() {
    this.reports = await this.adminService.getReports(this.filterStatus);

    return `
      <div class="admin-moderation-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Centre de Modération 🚨
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Traitez les signalements de contenus (histoires, commentaires, utilisateurs) et appliquez les sanctions.
            </p>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);">
            <strong style="color: var(--text-primary);">${this.reports.length}</strong> signalement(s)
          </div>
        </div>

        <!-- FILTRES -->
        <div class="admin-toolbar">
          <div class="admin-toolbar-filters">
            <select class="admin-select" id="admin-reports-status-filter">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Tous les signalements</option>
              <option value="nouveau" ${this.filterStatus === 'nouveau' ? 'selected' : ''}>🔴 Nouveaux</option>
              <option value="en_cours" ${this.filterStatus === 'en_cours' ? 'selected' : ''}>🟡 En cours</option>
              <option value="traite" ${this.filterStatus === 'traite' ? 'selected' : ''}>🟢 Traités</option>
              <option value="rejete" ${this.filterStatus === 'rejete' ? 'selected' : ''}>⚪ Rejetés</option>
            </select>
          </div>
        </div>

        <!-- TABLEAU DES SIGNALEMENTS -->
        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Élément Signalé</th>
                  <th>Motif du Signalement</th>
                  <th>Détails</th>
                  <th>Déposé par</th>
                  <th>Statut</th>
                  <th style="text-align: right;">Actions de Modération</th>
                </tr>
              </thead>
              <tbody>
                ${this.reports.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucun signalement en attente de modération. Tout est calme ! ✨
                    </td>
                  </tr>
                ` : this.reports.map(rep => `
                  <tr data-report-id="${rep.id}">
                    <td>
                      <span class="badge ${rep.type === 'story' ? 'badge-rose' : rep.type === 'comment' ? 'badge-blur' : 'badge-gold'}" style="font-size: 0.72rem; text-transform: uppercase;">
                        ${rep.type === 'story' ? '📚 Histoire' : rep.type === 'comment' ? '💬 Commentaire' : '👤 Utilisateur'}
                      </span>
                    </td>
                    <td>
                      <strong style="color: var(--text-primary); font-size: 0.85rem;">${escapeHTML(rep.target_title || rep.target_id)}</strong>
                      <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(rep.target_id)}</div>
                    </td>
                    <td>
                      <span style="font-weight: 600; color: #F87171; font-size: 0.82rem;">${escapeHTML(rep.reason || 'Non précisé')}</span>
                    </td>
                    <td>
                      <span style="font-size: 0.82rem; color: var(--text-secondary);">${escapeHTML(rep.details || '—')}</span>
                    </td>
                    <td>
                      <span style="font-size: 0.82rem;">${escapeHTML(rep.reporter_name || 'Anonyme')}</span>
                    </td>
                    <td>
                      <span class="admin-badge badge-status-${rep.status || 'nouveau'}">
                        ${rep.status === 'nouveau' ? 'Nouveau' : rep.status === 'en_cours' ? 'En cours' : rep.status === 'traite' ? 'Traité' : 'Rejeté'}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; align-items: center; gap: 4px;">
                        <button class="btn btn-secondary btn-sm btn-update-report" data-report-id="${rep.id}" data-status="traite" title="Valider comme traité" style="padding: 4px 8px; font-size: 0.75rem;">
                          ✓ Traiter
                        </button>
                        <button class="btn btn-ghost btn-sm btn-update-report" data-report-id="${rep.id}" data-status="rejete" title="Rejeter le signalement" style="padding: 4px 8px; font-size: 0.75rem;">
                          ✕ Rejeter
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
    const statusSelect = container.querySelector('#admin-reports-status-filter');
    statusSelect?.addEventListener('change', async (e) => {
      this.filterStatus = e.target.value;
      await this.refreshSelf(container);
    });

    container.querySelectorAll('.btn-update-report').forEach(btn => {
      btn.addEventListener('click', async () => {
        const repId = btn.getAttribute('data-report-id');
        const targetStatus = btn.getAttribute('data-status');

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.updateReportStatus(repId, targetStatus, adminUser);
          Toast.show(`Signalement marqué comme "${targetStatus}".`, 'success', '🛡️');
          await this.refreshSelf(container);
        } catch (err) {
          Toast.show('Erreur : ' + err.message, 'error', '⚠️');
        }
      });
    });
  }
}
