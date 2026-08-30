// LIVA ADMIN — Cadre Global & Navigation Back-Office
import { escapeHTML } from '../../utils/sanitize.js';

export const ADMIN_SECTION_TITLES = {
  dashboard: 'Tableau de Bord & Vue Globale',
  stories: 'Gestion du Catalogue des Histoires',
  'story-engine': 'Story Engine IA — Génération Littéraire',
  chapters: 'Gestionnaire des Chapitres & Édition',
  authors: 'Gestion des Auteurs Vérifiés',
  users: 'Gestion des Utilisateurs & Rôles',
  comments: 'Modération des Avis & Commentaires',
  moderation: 'Centre de Traitement des Signalements',
  categories: 'Gestion des Catégories & Tags',
  notifications: 'Diffusion des Notifications',
  analytics: 'Statistiques Détaillées & Engagement',
  settings: 'Configuration Générale de la Plateforme',
  logs: 'Journal des Actions Administratives'
};

export class AdminLayout {
  constructor(store, router, currentSection = 'dashboard', sectionParams = {}) {
    this.store = store;
    this.router = router;
    this.currentSection = currentSection;
    this.sectionParams = sectionParams;
  }

  render(childHtml, pendingReportsCount = 0) {
    const user = this.store.state.user || {};
    const role = user.role || 'ADMIN';

    const menuItems = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'stories', icon: '📚', label: 'Histoires' },
      { id: 'chapters', icon: '📑', label: 'Chapitres' },
      { id: 'authors', icon: '✍️', label: 'Auteurs' },
      { id: 'users', icon: '👥', label: 'Utilisateurs' },
      { id: 'comments', icon: '💬', label: 'Commentaires' },
      { id: 'moderation', icon: '🚨', label: 'Modération', badge: pendingReportsCount > 0 ? pendingReportsCount : null },
      { id: 'categories', icon: '🏷️', label: 'Catégories & Tags' },
      { id: 'notifications', icon: '🔔', label: 'Notifications' },
      { id: 'analytics', icon: '📈', label: 'Analytics' },
      { id: 'settings', icon: '⚙️', label: 'Paramètres' },
      { id: 'logs', icon: '📜', label: 'Journal d\'Audit' }
    ];

    const sectionTitles = ADMIN_SECTION_TITLES;
    const isModOnly = role === 'MODERATOR';

    return `
      <div class="admin-view-root">
        
        <!-- SIDEBAR ADMIN -->
        <aside class="admin-sidebar" id="admin-sidebar">
          <div class="admin-sidebar-header">
            <a href="#/admin" class="admin-brand">
              <span style="font-size: 1.4rem;">📖</span>
              <span class="admin-brand-logo">LIVA <span style="font-size: 0.85rem; color: var(--color-primary-light); font-weight: 500;">Admin</span></span>
            </a>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="admin-badge-role">${escapeHTML(role)}</span>
              <button class="btn btn-icon admin-sidebar-close-btn" id="btn-admin-sidebar-close" title="Fermer le menu">✕</button>
            </div>
          </div>

          <div class="admin-nav-menu">
            ${!isModOnly ? `
              <div class="admin-nav-section-title">Général</div>
              <a href="#/admin" class="admin-nav-item ${this.currentSection === 'dashboard' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>📊</span>
                  <span>Dashboard</span>
                </div>
              </a>
              <a href="#/admin/stories" class="admin-nav-item ${this.currentSection === 'stories' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>📚</span>
                  <span>Histoires</span>
                </div>
              </a>
              <a href="#/admin/story-engine" class="admin-nav-item ${this.currentSection === 'story-engine' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>✨</span>
                  <span>Story Engine IA</span>
                </div>
                <span class="admin-nav-badge" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff;">IA</span>
              </a>
              <a href="#/admin/chapters" class="admin-nav-item ${this.currentSection === 'chapters' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>📑</span>
                  <span>Chapitres</span>
                </div>
              </a>
              <a href="#/admin/authors" class="admin-nav-item ${this.currentSection === 'authors' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>✍️</span>
                  <span>Auteurs</span>
                </div>
              </a>
              <a href="#/admin/users" class="admin-nav-item ${this.currentSection === 'users' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>👥</span>
                  <span>Utilisateurs</span>
                </div>
              </a>
            ` : ''}

            <div class="admin-nav-section-title">Modération & Sécurité</div>
            <a href="#/admin/comments" class="admin-nav-item ${this.currentSection === 'comments' ? 'active' : ''}">
              <div class="admin-nav-item-left">
                <span>💬</span>
                <span>Commentaires</span>
              </div>
            </a>
            <a href="#/admin/moderation" class="admin-nav-item ${this.currentSection === 'moderation' ? 'active' : ''}">
              <div class="admin-nav-item-left">
                <span>🚨</span>
                <span>Signalements</span>
              </div>
              ${pendingReportsCount > 0 ? `<span class="admin-nav-badge">${pendingReportsCount}</span>` : ''}
            </a>

            ${!isModOnly ? `
              <div class="admin-nav-section-title">Configuration & Données</div>
              <a href="#/admin/categories" class="admin-nav-item ${this.currentSection === 'categories' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>🏷️</span>
                  <span>Catégories & Tags</span>
                </div>
              </a>
              <a href="#/admin/notifications" class="admin-nav-item ${this.currentSection === 'notifications' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>🔔</span>
                  <span>Notifications</span>
                </div>
              </a>
              <a href="#/admin/analytics" class="admin-nav-item ${this.currentSection === 'analytics' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>📈</span>
                  <span>Analytics</span>
                </div>
              </a>
              <a href="#/admin/settings" class="admin-nav-item ${this.currentSection === 'settings' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>⚙️</span>
                  <span>Paramètres</span>
                </div>
              </a>
              <a href="#/admin/logs" class="admin-nav-item ${this.currentSection === 'logs' ? 'active' : ''}">
                <div class="admin-nav-item-left">
                  <span>📜</span>
                  <span>Journal d'Audit</span>
                </div>
              </a>
            ` : ''}
          </div>

          <div class="admin-sidebar-footer">
            <div class="admin-user-info">
              <img src="${user.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzc5MjhDQSIvPjwvc3ZnPg=='}" class="admin-user-avatar" alt="${escapeHTML(user.name)}" />
              <div>
                <div class="admin-user-name">${escapeHTML(user.name || 'Admin')}</div>
                <div class="admin-user-email">${escapeHTML(user.email || '@simal')}</div>
              </div>
            </div>
            <a href="#/" class="btn btn-ghost btn-sm" title="Retourner à l'application Liva User" style="padding: 6px 8px; font-size: 0.8rem;">
              🏠 Sortir
            </a>
          </div>
        </aside>

        <!-- BACKDROP MOBILE -->
        <div class="admin-sidebar-backdrop" id="admin-sidebar-backdrop"></div>

        <!-- MAIN WRAPPER -->
        <div class="admin-main-wrapper">
          
          <!-- TOPBAR -->
          <header class="admin-topbar">
            <div class="admin-top-progress" id="admin-top-progress"></div>
            <div class="admin-topbar-left">
              <button class="btn btn-icon admin-mobile-toggle" id="btn-admin-mobile-toggle" aria-label="Menu Admin" title="Ouvrir le menu">
                ☰
              </button>
              <div class="admin-breadcrumbs">
                <span class="admin-bread-root">Liva Admin</span>
                <span>/</span>
                <span class="active">${sectionTitles[this.currentSection] || 'Administration'}</span>
              </div>
            </div>

            <div class="admin-topbar-right">
              <a href="#/" class="btn btn-secondary btn-sm admin-topbar-btn" style="font-size: 0.82rem;">
                👁️ <span class="hide-mobile-sm">Voir</span> Liva
              </a>
              ${!isModOnly ? `
                <button class="btn btn-primary btn-sm admin-topbar-btn" id="btn-admin-quick-story">
                  + <span class="hide-mobile-sm">Nouvelle histoire</span><span class="show-mobile-sm">Histoire</span>
                </button>
              ` : ''}
            </div>
          </header>

          <!-- CONTENT AREA -->
          <main class="admin-content-area animate-fade-in">
            ${childHtml}
          </main>

        </div>

      </div>
    `;
  }

  attachEvents(container) {
    const toggleBtn = container.querySelector('#btn-admin-mobile-toggle');
    const closeBtn = container.querySelector('#btn-admin-sidebar-close');
    const sidebar = container.querySelector('#admin-sidebar');
    const backdrop = container.querySelector('#admin-sidebar-backdrop');

    const openSidebar = () => {
      sidebar?.classList.add('open');
      backdrop?.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
      sidebar?.classList.remove('open');
      backdrop?.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    container.querySelectorAll('.admin-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          closeSidebar();
        }
      });
    });

    container.querySelector('#btn-admin-quick-story')?.addEventListener('click', () => {
      this.router.navigate('/admin/stories?action=new');
    });
  }
}
