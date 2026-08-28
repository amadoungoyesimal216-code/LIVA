// LIVA ADMIN — Vue Journal d'Audit Administratif (Audit Logs)
import { escapeHTML } from '../../utils/sanitize.js';

export class AdminLogsView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.logs = [];
  }

  async render() {
    this.logs = await this.adminService.getAdminLogs(100);

    return `
      <div class="admin-logs-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Journal d'Audit & Activités 📜
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Historique complet et traçabilité de toutes les actions effectuées par les administrateurs et modérateurs.
            </p>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);">
            <strong style="color: var(--text-primary);">${this.logs.length}</strong> événement(s) enregistré(s)
          </div>
        </div>

        <!-- TABLEAU DU JOURNAL -->
        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 160px;">Date & Heure</th>
                  <th>Administrateur</th>
                  <th>Action</th>
                  <th>Cible</th>
                  <th>Détails de l'opération</th>
                </tr>
              </thead>
              <tbody>
                ${this.logs.length === 0 ? `
                  <tr>
                    <td colspan="5" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucun journal d'activité enregistré pour le moment.
                    </td>
                  </tr>
                ` : this.logs.map(log => `
                  <tr>
                    <td style="color: var(--text-muted); font-size: 0.78rem; font-family: monospace;">
                      ${new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td>
                      <span style="font-weight: 700; color: var(--color-primary-light); font-size: 0.85rem;">
                        ${escapeHTML(log.admin_name || 'Admin')}
                      </span>
                    </td>
                    <td>
                      <span class="admin-badge badge-role-admin" style="font-size: 0.68rem;">
                        ${escapeHTML(log.action)}
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-blur" style="font-size: 0.72rem;">
                        ${escapeHTML(log.target_type || 'system')}: ${escapeHTML(log.target_id || '')}
                      </span>
                    </td>
                    <td style="color: var(--text-secondary); font-size: 0.82rem; line-height: 1.4;">
                      ${escapeHTML(log.details || '')}
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

  attachEvents(container) {}
}
