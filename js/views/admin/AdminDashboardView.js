// LIVA ADMIN — Vue Dashboard Principal (Métriques 100% Réelles, Graphiques, Classements)
import { escapeHTML } from '../../utils/sanitize.js';

export class AdminDashboardView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.stats = null;
  }

  async render() {
    this.stats = await this.adminService.getDashboardStats();
    const s = this.stats || {
      totalUsers: 0,
      newUsers: 0,
      totalStories: 0,
      publishedStories: 0,
      draftStories: 0,
      totalReads: 0,
      totalLikes: 0,
      totalAuthors: 0,
      totalReviews: 0,
      pendingReports: 0,
      averageRating: 0.0,
      genreDistribution: [],
      topStories: [],
      recentUsers: [],
      recentLogs: []
    };

    const formatK = (n) => {
      const num = Number(n) || 0;
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return String(num);
    };

    const topStoriesList = s.topStories || [];
    const hasAnyReads = s.totalReads > 0 && topStoriesList.some(st => (st.reads_raw || 0) > 0);
    const maxReads = hasAnyReads ? Math.max(...topStoriesList.map(st => st.reads_raw || 0), 1) : 1;

    return `
      <div class="admin-dashboard-view">
        
        <!-- EN-TÊTE DE SECTION -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Tableau de Bord 📊
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Métriques 100% réelles calculées en temps réel depuis la base de données Supabase.
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

        <!-- 1. GRILLE KPI RÉELS -->
        <div class="admin-kpi-grid">
          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Utilisateurs Réels</span>
              <span class="admin-kpi-icon">👥</span>
            </div>
            <div class="admin-kpi-value">${s.totalUsers}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-success); font-weight: 700;">+${s.newUsers}</span>
              <span>inscrits ce mois-ci</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Lectures Réelles</span>
              <span class="admin-kpi-icon">👁️</span>
            </div>
            <div class="admin-kpi-value">${formatK(s.totalReads)}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-accent-gold); font-weight: 700;">${formatK(s.totalLikes)}</span>
              <span>likes enregistrés</span>
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
              <span class="admin-kpi-label">Auteurs Actifs</span>
              <span class="admin-kpi-icon">✍️</span>
            </div>
            <div class="admin-kpi-value">${s.totalAuthors}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-accent-cyan); font-weight: 700;">${s.draftStories}</span>
              <span>brouillons en cours</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Commentaires & Avis</span>
              <span class="admin-kpi-icon">💬</span>
            </div>
            <div class="admin-kpi-value">${s.totalReviews}</div>
            <div class="admin-kpi-footer">
              <span style="color: var(--color-accent-rose); font-weight: 700;">${s.averageRating > 0 ? `⭐ ${s.averageRating}/5` : 'Aucun avis'}</span>
              <span>note moyenne réelle</span>
            </div>
          </div>

          <div class="admin-kpi-card" style="${s.pendingReports > 0 ? 'border-color: rgba(239, 68, 68, 0.4);' : ''}">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Signalements</span>
              <span class="admin-kpi-icon">${s.pendingReports > 0 ? '🚨' : '🛡️'}</span>
            </div>
            <div class="admin-kpi-value" style="${s.pendingReports > 0 ? 'color: #F87171;' : ''}">${s.pendingReports}</div>
            <div class="admin-kpi-footer">
              <span>${s.pendingReports > 0 ? 'Action requise en modération' : 'Aucun contenu signalé'}</span>
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
                <span>Activité & Lectures Réelles</span>
              </div>
              <div style="display: flex; gap: 4px;">
                <span class="admin-badge" style="background: rgba(255,255,255,0.06); font-size: 0.75rem;">Temps Réel</span>
              </div>
            </div>
            <div style="padding: var(--space-5);">
              ${!hasAnyReads ? `
                <div style="padding: var(--space-8) var(--space-4); text-align: center; color: var(--text-muted);">
                  <div style="font-size: 2.2rem; margin-bottom: var(--space-2);">📊</div>
                  <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">Pas encore de lectures enregistrées</div>
                  <div style="font-size: 0.82rem; margin-top: 4px; max-width: 420px; margin-left: auto; margin-right: auto; line-height: 1.4;">
                    Le graphique et les statistiques d'audience se mettront à jour automatiquement dès que les premiers utilisateurs commenceront à lire des histoires.
                  </div>
                </div>
              ` : `
                <div class="admin-chart-box">
                  ${topStoriesList.map(st => {
                    const reads = st.reads_raw || 0;
                    const heightPercent = reads > 0 ? Math.max(10, Math.round((reads / maxReads) * 100)) : 0;
                    return `
                      <div class="admin-chart-bar-wrap" title="${escapeHTML(st.title)} : ${reads} lecture(s) réelle(s)">
                        <div class="admin-chart-bar" style="height: ${heightPercent}%;"></div>
                        <div class="admin-chart-label">${escapeHTML(st.title.substring(0, 10))}...</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- Répartition par Genre -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>🏷️</span>
                <span>Répartition par Genre Littéraire</span>
              </div>
            </div>
            <div style="padding: var(--space-4) var(--space-5); display: flex; flex-direction: column; gap: var(--space-3);">
              ${(s.genreDistribution || []).length === 0 ? `
                <div style="padding: var(--space-6) 0; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                  Aucune histoire dans le catalogue.
                </div>
              ` : (s.genreDistribution || []).slice(0, 5).map(g => {
                const pct = s.totalStories > 0 ? Math.round((g.count / s.totalStories) * 100) : 0;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
                      <span style="font-weight: 600;">${escapeHTML(g.genre)}</span>
                      <span style="color: var(--text-muted);">${g.count} histoire(s) (${pct}%)</span>
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
              <span>Classement Réel des Histoires</span>
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
                  <th>Lectures Réelles</th>
                  <th>Likes</th>
                  <th>Note Moyenne</th>
                  <th>Statut</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${topStoriesList.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucune histoire enregistrée dans Supabase.
                    </td>
                  </tr>
                ` : topStoriesList.map((st, index) => `
                  <tr>
                    <td style="font-weight: 800; color: ${index === 0 ? 'var(--color-accent-gold)' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-muted)'};">
                      ${index + 1}
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <img src="${st.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'}" alt="${escapeHTML(st.title)}" style="width: 32px; height: 44px; border-radius: 4px; object-fit: cover;" />
                        <div>
                          <div style="font-weight: 600; color: var(--text-primary);">${escapeHTML(st.title)}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(st.id)}</div>
                        </div>
                      </div>
                    </td>
                    <td>${escapeHTML(st.author_name || 'Auteur')}</td>
                    <td><span class="badge badge-blur" style="font-size: 0.72rem;">${escapeHTML(st.genre || 'Général')}</span></td>
                    <td style="font-weight: 700; color: var(--text-primary);">👁️ ${formatK(st.reads_raw || 0)}</td>
                    <td style="font-weight: 600; color: var(--color-accent-rose);">❤️ ${formatK(st.likes_count || 0)}</td>
                    <td style="font-weight: 700; color: var(--color-accent-gold);">${st.rating > 0 ? `⭐ ${st.rating}` : '—'}</td>
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
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-top: var(--space-6);">
          
          <!-- Derniers Inscrits Réels -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>👥</span>
                <span>Derniers Utilisateurs Inscrits</span>
              </div>
              <a href="#/admin/users" class="btn btn-ghost btn-sm" style="font-size: 0.8rem;">Voir tout →</a>
            </div>
            <div style="padding: var(--space-3) var(--space-5);">
              ${(s.recentUsers || []).length === 0 ? `
                <div style="padding: var(--space-6) 0; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                  Aucun utilisateur inscrit pour le moment.
                </div>
              ` : (s.recentUsers || []).map(u => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                  <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <img src="${u.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNzkyOENBIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkYwMDgwIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSI2NCIgZmlsbD0idXJsKCNncmFkKSIvPjxjaXJjbGUgY3g9IjY0IiBjeT0iNTAiIHI9IjIyIiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjkiLz48cGF0aCBkPSJNMjggMTA2IEMyOCA4NCA0NCA3NiA2NCA3NiBDODQgNzYgMTAwIDg0IDEwMCAxMDYgWiIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC45Ii8+PC9zdmc+'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                    <div>
                      <div style="font-size: 0.85rem; font-weight: 600;">${escapeHTML(u.name || u.email)}</div>
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
              ${(s.recentLogs || []).length === 0 ? `
                <div style="padding: var(--space-6) 0; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                  Aucune activité administrative enregistrée.
                </div>
              ` : (s.recentLogs || []).map(l => `
                <div style="padding: var(--space-2) 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.82rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span style="font-weight: 700; color: var(--color-primary-light);">${escapeHTML(l.admin_name || 'Admin')}</span>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">${l.created_at ? new Date(l.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Récemment'}</span>
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
