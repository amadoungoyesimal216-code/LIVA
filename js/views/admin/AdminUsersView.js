// LIVA ADMIN — Vue Gestion des Utilisateurs & Attribution des Rôles
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';

export class AdminUsersView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.users = [];
    this.filterSearch = '';
    this.filterRole = 'all';
    this.filterStatus = 'all';
  }

  async render() {
    this.users = await this.adminService.getUsers(
      this.filterSearch,
      this.filterRole,
      this.filterStatus
    );

    return `
      <div class="admin-users-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Gestion des Utilisateurs 👥
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Contrôlez les comptes membres, attribuez les rôles sécurisés et gérez les accès.
            </p>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);">
            <strong style="color: var(--text-primary);">${this.users.length}</strong> compte(s) enregistré(s)
          </div>
        </div>

        <!-- FILTRES -->
        <div class="admin-toolbar">
          <div class="admin-toolbar-filters">
            <input 
              type="text" 
              class="admin-search-input" 
              id="admin-user-search" 
              placeholder="🔍 Nom, pseudo ou email..." 
              value="${escapeHTML(this.filterSearch)}" 
            />

            <select class="admin-select" id="admin-user-role-filter">
              <option value="all" ${this.filterRole === 'all' ? 'selected' : ''}>Tous les rôles</option>
              <option value="ADMIN" ${this.filterRole === 'ADMIN' ? 'selected' : ''}>👑 ADMIN</option>
              <option value="MODERATOR" ${this.filterRole === 'MODERATOR' ? 'selected' : ''}>🛡️ MODERATOR</option>
              <option value="AUTHOR" ${this.filterRole === 'AUTHOR' ? 'selected' : ''}>✍️ AUTHOR</option>
              <option value="USER" ${this.filterRole === 'USER' ? 'selected' : ''}>👤 USER</option>
            </select>

            <select class="admin-select" id="admin-user-status-filter">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Tous les statuts</option>
              <option value="active" ${this.filterStatus === 'active' ? 'selected' : ''}>🟢 Actif</option>
              <option value="suspended" ${this.filterStatus === 'suspended' ? 'selected' : ''}>⏸️ Suspendu</option>
              <option value="blocked" ${this.filterStatus === 'blocked' ? 'selected' : ''}>🔴 Bloqué</option>
            </select>
          </div>
        </div>

        <!-- TABLEAU DES UTILISATEURS -->
        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Identifiant / Pseudo</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Date d'Inscription</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.users.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucun utilisateur ne correspond à votre recherche.
                    </td>
                  </tr>
                ` : this.users.map(u => `
                  <tr data-user-id="${u.id}">
                    <td>
                      <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <img src="${u.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzc5MjhDQSIvPjwvc3ZnPg=='}" alt="${escapeHTML(u.name)}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1.5px solid rgba(255,255,255,0.1);" />
                        <div style="font-weight: 700; color: var(--text-primary);">${escapeHTML(u.name || 'Membre')}</div>
                      </div>
                    </td>
                    <td>
                      <span style="font-family: monospace; color: var(--color-primary-light); font-size: 0.85rem;">${escapeHTML(u.username || '@')}</span>
                    </td>
                    <td style="color: var(--text-secondary); font-size: 0.85rem;">${escapeHTML(u.email)}</td>
                    <td>
                      <span class="admin-badge badge-role-${(u.role || 'USER').toLowerCase()}">${escapeHTML(u.role || 'USER')}</span>
                    </td>
                    <td>
                      <span class="admin-badge badge-status-${u.status || 'active'}">
                        ${u.status === 'suspended' ? 'Suspendu' : u.status === 'blocked' ? 'Bloqué' : 'Actif'}
                      </span>
                    </td>
                    <td style="color: var(--text-muted); font-size: 0.8rem;">
                      ${u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : 'Récent'}
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; align-items: center; gap: 4px;">
                        <button class="btn btn-secondary btn-sm btn-open-role-modal" data-user-id="${u.id}" data-current-role="${u.role || 'USER'}" data-name="${escapeHTML(u.name)}" style="padding: 5px 8px; font-size: 0.78rem;">
                          👑 Rôle
                        </button>
                        <button class="btn btn-ghost btn-sm btn-toggle-status" data-user-id="${u.id}" data-current-status="${u.status || 'active'}" data-name="${escapeHTML(u.name)}" style="padding: 5px 8px; font-size: 0.78rem; color: ${u.status === 'suspended' ? 'var(--color-success)' : '#F87171'};">
                          ${u.status === 'suspended' ? '🟢 Activer' : '⏸️ Suspendre'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- MODALE CHANGEMENT DE RÔLE -->
        <div class="admin-modal-backdrop" id="modal-admin-role">
          <div class="admin-modal-box" style="max-width: 460px;">
            <div class="admin-modal-header">
              <h3 class="admin-card-title">👑 Modifier le Rôle</h3>
              <button class="btn btn-ghost btn-sm" id="btn-close-role-modal">✕</button>
            </div>

            <form id="admin-role-form">
              <input type="hidden" id="form-role-user-id" value="" />
              <div class="admin-modal-body">
                <p style="font-size: 0.85rem; color: var(--text-secondary);">
                  Modification des permissions pour <strong id="role-modal-user-name" style="color: var(--text-primary);">...</strong> :
                </p>

                <div class="form-group">
                  <label class="form-label">Nouveau Rôle *</label>
                  <select id="form-role-select" class="form-input">
                    <option value="USER">👤 USER — Lecteur standard</option>
                    <option value="AUTHOR">✍️ AUTHOR — Auteur & Créateur</option>
                    <option value="MODERATOR">🛡️ MODERATOR — Modérateur</option>
                    <option value="ADMIN">👑 ADMIN — Accès complet Liva Admin</option>
                  </select>
                </div>
              </div>

              <div class="admin-modal-footer">
                <button type="button" class="btn btn-ghost" id="btn-cancel-role-modal">Annuler</button>
                <button type="submit" class="btn btn-primary" id="btn-save-role">Enregistrer le rôle ✨</button>
              </div>
            </form>
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
    // 1. Filtres
    const searchInput = container.querySelector('#admin-user-search');
    const roleSelect = container.querySelector('#admin-user-role-filter');
    const statusSelect = container.querySelector('#admin-user-status-filter');

    const handleFilter = async () => {
      this.filterSearch = searchInput?.value || '';
      this.filterRole = roleSelect?.value || 'all';
      this.filterStatus = statusSelect?.value || 'all';
      await this.refreshSelf(container);
    };

    let timer;
    searchInput?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(handleFilter, 300);
    });
    roleSelect?.addEventListener('change', handleFilter);
    statusSelect?.addEventListener('change', handleFilter);

    // 2. Modale Rôle
    const modal = container.querySelector('#modal-admin-role');
    const form = container.querySelector('#admin-role-form');
    const userIdInput = container.querySelector('#form-role-user-id');
    const roleInput = container.querySelector('#form-role-select');
    const nameSpan = container.querySelector('#role-modal-user-name');

    const openRoleModal = (userId, currentRole, userName) => {
      userIdInput.value = userId;
      roleInput.value = currentRole;
      if (nameSpan) nameSpan.textContent = userName;
      modal?.classList.add('active');
    };

    const closeRoleModal = () => modal?.classList.remove('active');

    container.querySelector('#btn-close-role-modal')?.addEventListener('click', closeRoleModal);
    container.querySelector('#btn-cancel-role-modal')?.addEventListener('click', closeRoleModal);

    // Écouteur délégué universel sur les boutons de la table
    container.addEventListener('click', async (e) => {
      const roleBtn = e.target.closest('.btn-open-role-modal');
      if (roleBtn) {
        e.preventDefault();
        e.stopPropagation();
        const uId = roleBtn.getAttribute('data-user-id');
        const role = roleBtn.getAttribute('data-current-role');
        const name = roleBtn.getAttribute('data-name');
        openRoleModal(uId, role, name);
        return;
      }

      const statusBtn = e.target.closest('.btn-toggle-status');
      if (statusBtn) {
        e.preventDefault();
        e.stopPropagation();
        const uId = statusBtn.getAttribute('data-user-id');
        const currentStatus = statusBtn.getAttribute('data-current-status');
        const userName = statusBtn.getAttribute('data-name');
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        
        const confirmed = confirm(`Voulez-vous vraiment passer l'utilisateur "${userName}" au statut "${newStatus}" ?`);
        if (!confirmed) return;

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.setUserStatus(uId, newStatus, adminUser);
          Toast.show(`Statut utilisateur mis à jour (${newStatus}).`, 'info', '✨');
          handleFilter();
        } catch (err) {
          Toast.show('Erreur : ' + err.message, 'error', '⚠️');
        }
        return;
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
      const targetUserId = userIdInput.value;
      const newRole = roleInput.value;

      try {
        await this.adminService.setUserRole(targetUserId, newRole, adminUser);
        closeRoleModal();
        Toast.show(`Rôle mis à jour (${newRole}) avec succès !`, 'success', '👑');
        handleFilter();
      } catch (err) {
        Toast.show('Erreur : ' + err.message, 'error', '⚠️');
      }
    });
  }
}
