// LIVA ADMIN — Vue Dashboard Principal (Métriques Réelles, Graphiques, Classements)
import { escapeHTML } from '../../utils/sanitize.js';

export class AdminDashboardView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.stats = null;
    this.activeTimeframe = '30d'; // '7d' | '30d' | '90d'
  }

  async render() {
    this.stats = await this.adminService.getDashboardStats();
    const s = this.stats || {
      totalUsers: 0,
      newUsers: 0,
      totalStories: 0,
      publishedStories: 0,
      totalReads: 0,
      totalLikes: 0,
      totalAuthors: 0,
      totalReviews: 0,
      pendingReports: 0,
      genreDistribution: [],
      topStories: [],
      recentUsers: [],
      recentLogs: []
    };

    const formatK = (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n);
    };

    // Calculate max for SVG bar charts
    const topStoriesList = s.topStories || [];
    const maxReads = topStoriesList.length > 0 ? Math.max(...topStoriesList.map(st => st.reads_raw || 1000)) : 10000;

    return `
      <div class="admin-dashboard-view">
        
        <!-- EN-TÊTE DE SECTION -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Tableau de Bord 📊
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Aperçu en temps réel de la plateforme Liva connecté à la base de données Supabase.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-secondary btn-sm admin-refresh-btn" id="btn-refresh-dashboard">
              🔄 Actualiser
            </button>
            <button class="btn btn-primary btn-sm" id="btn-quick-broadcast">
              📢 Diffuser une alerte
            </button>
          </div>
        </div>

        <!-- 1. GRILLE KPI -->
        <div class="admin-kpi-grid">
          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Utilisateurs Totaux</span>
              <span class="admin-kpi-icon">👥</span>
            </div>
            <div class="admin-kpi-value">${s.totalUsers}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-success); font-weight: 700;">+${s.newUsers}</span>
              <span>nouveaux ce mois-ci</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Lectures Totales</span>
              <span class="admin-kpi-icon">👁️</span>
            </div>
            <div class="admin-kpi-value">${formatK(s.totalReads)}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-accent-gold); font-weight: 700;">${formatK(s.totalLikes)}</span>
              <span>appréciations cumulées</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Catalogue Histoires</span>
              <span class="admin-kpi-icon">📚</span>
            </div>
            <div class="admin-kpi-value">${s.totalStories}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-primary-light); font-weight: 700;">${s.publishedStories}</span>
              <span>publiées en ligne</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Auteurs Vérifiés</span>
              <span class="admin-kpi-icon">✍️</span>
            </div>
            <div class="admin-kpi-value">${s.totalAuthors}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-accent-cyan); font-weight: 700;">100%</span>
              <span>profils certifiés</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Commentaires & Avis</span>
              <span class="admin-kpi-icon">💬</span>
            </div>
            <div class="admin-kpi-value">${s.totalReviews}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-accent-rose); font-weight: 700;">Avis réels</span>
              <span>déposés par la communauté</span>
            </div>
          </div>

          <div class="admin-kpi-card" style="${s.pendingReports > 0 ? 'border-color: rgba(239, 68, 68, 0.4);' : ''}">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Signalements</span>
              <span class="admin-kpi-icon">${s.pendingReports > 0 ? '🚨' : '🛡️'}</span>
            </div>
            <div class="admin-kpi-value" style="${s.pendingReports > 0 ? 'color: #F87171;' : ''}">${s.pendingReports}</div>
            <div class="admin-kpi-footer">
              <span>${s.pendingReports > 0 ? 'Action requise en modération' : 'Aucun contenu en attente'}</span>
            </div>
          </div>
        </div>

        <!-- 2. GRAPHIQUE & RÉPARTITION PAR GENRE -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6); margin-bottom: var(--space-6);">
          
          <!-- Graphique Évolution des Lectures -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>📈</span>
                <span>Performances des Récits Populaires</span>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-ghost btn-sm" style="font-size: 0.75rem; background: rgba(255,255,255,0.06);">Lectures</button>
              </div>
            </div>
            <div style="padding: var(--space-5);">
              <div class="admin-chart-box">
                ${topStoriesList.map((st, i) => {
                  const heightPercent = Math.max(12, Math.round(((st.reads_raw || 5000) / maxReads) * 100));
                  return `
                    <div class="admin-chart-bar-wrap" title="${escapeHTML(st.title)} : ${formatK(st.reads_raw)} lectures">
                      <div class="admin-chart-bar" style="height: ${heightPercent}%;"></div>
                      <div class="admin-chart-label">${st.title.substring(0, 10)}...</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Répartition par Genre -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>🏷️</span>
                <span>Genres les Plus Riches</span>
              </div>
            </div>
            <div style="padding: var(--space-4) var(--space-5); display: flex; flex-direction: column; gap: var(--space-3);">
              ${(s.genreDistribution || []).slice(0, 5).map(g => {
                const pct = s.totalStories > 0 ? Math.round((g.count / s.totalStories) * 100) : 0;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
                      <span style="font-weight: 600;">${escapeHTML(g.genre)}</span>
                      <span style="color: var(--text-muted);">${g.count} histoires (${pct}%)</span>
                    </div>
                    <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
                      <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, var(--color-primary-light), var(--color-accent-rose)); border-radius: 3px;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

        <!-- 3. CLASSEMENT DES HISTOIRES LES PLUS LUES -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="admin-card-title">
              <span>🏆</span>
              <span>Classement des Histoires les Plus Lues</span>
            </div>
            <a href="#/admin/stories" class="btn btn-ghost btn-sm" style="font-size: 0.8rem;">Gérer toutes les histoires →</a>
          </div>

          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>Histoire</th>
                  <th>Auteur</th>
                  <th>Genre</th>
                  <th>Lectures</th>
                  <th>Note</th>
                  <th>Statut</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${topStoriesList.map((st, index) => `
                  <tr>
                    <td style="font-weight: 800; color: ${index === 0 ? 'var(--color-accent-gold)' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-muted)'};">
                      ${index + 1}
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <img src="${st.cover}" alt="${escapeHTML(st.title)}" style="width: 32px; height: 44px; border-radius: 4px; object-fit: cover;" />
                        <div>
                          <div style="font-weight: 600; color: var(--text-primary);">${escapeHTML(st.title)}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(st.id)}</div>
                        </div>
                      </div>
                    </td>
                    <td>${escapeHTML(st.author_name)}</td>
                    <td><span class="badge badge-blur" style="font-size: 0.72rem;">${escapeHTML(st.genre)}</span></td>
                    <td style="font-weight: 700; color: var(--text-primary);">👁️ ${formatK(st.reads_raw)}</td>
                    <td style="font-weight: 700; color: var(--color-accent-gold);">⭐ ${st.rating}</td>
                    <td>
                      <span class="admin-badge badge-status-${st.status || 'published'}">${st.status === 'published' ? 'Publiée' : 'Brouillon'}</span>
                    </td>
                    <td style="text-align: right;">
                      <a href="#/admin/stories?edit=${encodeURIComponent(st.id)}" class="btn btn-ghost btn-sm" style="padding: 4px 8px; font-size: 0.75rem;">
                        ✏️ Éditer
                      </a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. ACTIVITÉ RÉCENTE & DERNIERS INSCRITS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
          
          <!-- Derniers Inscrits -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>👥</span>
                <span>Derniers Utilisateurs Inscrits</span>
              </div>
              <a href="#/admin/users" class="btn btn-ghost btn-sm" style="font-size: 0.8rem;">Voir tout →</a>
            </div>
            <div style="padding: var(--space-3) var(--space-5);">
              ${(s.recentUsers || []).map(u => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                  <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <img src="${u.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzc5MjhDQSIvPjwvc3ZnPg=='}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                    <div>
                      <div style="font-size: 0.85rem; font-weight: 600;">${escapeHTML(u.name)}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(u.email)}</div>
                    </div>
                  </div>
                  <span class="admin-badge badge-role-${(u.role || 'USER').toLowerCase()}">${escapeHTML(u.role || 'USER')}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Journal d'Audit Récent -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>📜</span>
                <span>Activités Administratives Récentes</span>
              </div>
              <a href="#/admin/logs" class="btn btn-ghost btn-sm" style="font-size: 0.8rem;">Journal complet →</a>
            </div>
            <div style="padding: var(--space-3) var(--space-5);">
              ${(s.recentLogs || []).map(l => `
                <div style="padding: var(--space-2) 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.82rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span style="font-weight: 700; color: var(--color-primary-light);">${escapeHTML(l.admin_name)}</span>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">${new Date(l.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style="color: var(--text-secondary);">${escapeHTML(l.details)}</div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

      </div>
    `;
  }

  attachEvents(container) {
    container.querySelector('#btn-refresh-dashboard')?.addEventListener('click', () => {
      this.router.refresh();
    });

    container.querySelector('#btn-quick-broadcast')?.addEventListener('click', () => {
      this.router.navigate('/admin/notifications');
    });
  }
}
