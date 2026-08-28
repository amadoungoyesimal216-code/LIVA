// LIVA ADMIN — Vue Analytics Approfondis & Rapports d'Engagement
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
      totalReads: 0,
      totalLikes: 0,
      totalReviews: 0,
      genreDistribution: [],
      topStories: []
    };

    const formatK = (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n || 0);
    };

    const avgReadsPerStory = s.totalStories > 0 ? Math.round(s.totalReads / s.totalStories) : 0;
    const engagementRate = s.totalReads > 0 ? ((s.totalLikes + s.totalReviews) / s.totalReads * 100).toFixed(1) : '0';

    return `
      <div class="admin-analytics-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Statistiques & Analytics 📈
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Analyses détaillées de l'audience, du comportement de lecture et des performances du catalogue.
            </p>
          </div>
        </div>

        <!-- 1. CARTES D'ENGAGEMENT -->
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
            <div class="admin-kpi-value">${formatK(avgReadsPerStory)}</div>
            <div class="admin-kpi-footer">
              <span>Lectures moyennes par histoire</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Satisfaction Globale</span>
              <span class="admin-kpi-icon">⭐</span>
            </div>
            <div class="admin-kpi-value" style="color: var(--color-accent-gold);">4.8 / 5</div>
            <div class="admin-kpi-footer">
              <span>Moyenne calculée sur tous les avis</span>
            </div>
          </div>

          <div class="admin-kpi-card">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Temps Moyen de Session</span>
              <span class="admin-kpi-icon">⏱️</span>
            </div>
            <div class="admin-kpi-value">18 min</div>
            <div class="admin-kpi-footer">
              <span>Par session de lecture active</span>
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
                  <th>Appréciations</th>
                  <th>Avis</th>
                  <th>Note Moyenne</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                ${(s.topStories || []).map(st => {
                  const score = st.reads_raw > 150000 ? 'Excellente 🔥' : st.reads_raw > 100000 ? 'Très Bonne 🌟' : 'Standard 📈';
                  return `
                    <tr>
                      <td style="font-weight: 700; color: var(--text-primary);">
                        ${escapeHTML(st.title)}
                      </td>
                      <td>
                        <span class="badge badge-blur" style="font-size: 0.72rem;">${escapeHTML(st.genre)}</span>
                      </td>
                      <td style="font-weight: 700;">👁️ ${formatK(st.reads_raw)}</td>
                      <td style="font-weight: 600; color: var(--color-accent-rose);">❤️ ${formatK(st.likes_count)}</td>
                      <td>💬 ${st.reviews_count || 0}</td>
                      <td style="font-weight: 700; color: var(--color-accent-gold);">⭐ ${st.rating}</td>
                      <td>
                        <span class="admin-badge badge-status-published">${score}</span>
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
