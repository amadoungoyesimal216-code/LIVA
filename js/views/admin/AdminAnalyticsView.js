// LIVA ADMIN — Vue Analytics Approfondis & Rapports d'Engagement (Données 100% Réelles)
import { escapeHTML } from '../../utils/sanitize.js';

export class AdminAnalyticsView {
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
      totalStories: 0,
      totalReads: 0,
      totalLikes: 0,
      totalReviews: 0,
      averageRating: 0.0,
      genreDistribution: [],
      topStories: []
    };

    const formatK = (n) => {
      const num = Number(n) || 0;
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return String(num);
    };

    const avgReadsPerStory = s.totalStories > 0 ? (s.totalReads / s.totalStories).toFixed(1) : '0';
    const engagementRate = s.totalReads > 0 ? (((s.totalLikes + s.totalReviews) / s.totalReads) * 100).toFixed(1) : '0';
    const topStoriesList = s.topStories || [];

    return `
      <div class="admin-analytics-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Statistiques & Analytics 📈
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Analyses détaillées de l'audience, des interactions et des performances réelles calculées depuis Supabase.
            </p>
          </div>
        </div>

        <!-- 1. CARTES D'ENGAGEMENT RÉELLES -->
        <div class="admin-kpi-grid">
          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Taux d'Engagement</span>
              <span class="admin-kpi-icon">⚡</span>
            </div>
            <div class="admin-kpi-value" style="color: var(--color-accent-rose);">${engagementRate}%</div>
            <div class="admin-kpi-footer">
              <span>(Likes + Commentaires) / Lectures</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Moyenne par Récit</span>
              <span class="admin-kpi-icon">📊</span>
            </div>
            <div class="admin-kpi-value">${avgReadsPerStory}</div>
            <div class="admin-kpi-footer">
              <span>Lectures moyennes par histoire</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Satisfaction Globale</span>
              <span class="admin-kpi-icon">⭐</span>
            </div>
            <div class="admin-kpi-value" style="color: var(--color-accent-gold);">
              ${s.averageRating > 0 ? `${s.averageRating} / 5` : '—'}
            </div>
            <div class="admin-kpi-footer">
              <span>${s.totalReviews} avis déposé(s) au total</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Lectures Cumulées</span>
              <span class="admin-kpi-icon">👁️</span>
            </div>
            <div class="admin-kpi-value">${formatK(s.totalReads)}</div>
            <div class="admin-kpi-footer">
              <span>Sessions de lecture enregistrées</span>
            </div>
          </div>
        </div>

        <!-- 2. ANALYSE DU CATALOGUE -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="admin-card-title">
              <span>🏆</span>
              <span>Analyse Détaillée des Performances par Histoire</span>
            </div>
          </div>

          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Histoire</th>
                  <th>Genre</th>
                  <th>Lectures Réelles</th>
                  <th>Likes</th>
                  <th>Avis</th>
                  <th>Note Moyenne</th>
                  <th>Statut d'Activité</th>
                </tr>
              </thead>
              <tbody>
                ${topStoriesList.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucune histoire enregistrée.
                    </td>
                  </tr>
                ` : topStoriesList.map(st => {
                  const reads = st.reads_raw || 0;
                  const scoreBadge = reads > 10 ? '🔥 Populaire' : reads > 0 ? '📈 En cours' : '🌱 Nouvelle';
                  return `
                    <tr>
                      <td style="font-weight: 700; color: var(--text-primary);">
                        ${escapeHTML(st.title)}
                      </td>
                      <td>
                        <span class="badge badge-blur" style="font-size: 0.72rem;">${escapeHTML(st.genre || 'Général')}</span>
                      </td>
                      <td style="font-weight: 700;">👁️ ${formatK(reads)}</td>
                      <td style="font-weight: 600; color: var(--color-accent-rose);">❤️ ${formatK(st.likes_count || 0)}</td>
                      <td>💬 ${st.reviews_count || 0}</td>
                      <td style="font-weight: 700; color: var(--color-accent-gold);">${st.rating > 0 ? `⭐ ${st.rating}` : '—'}</td>
                      <td>
                        <span class="admin-badge badge-status-published">${scoreBadge}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  attachEvents(container) {}
}
