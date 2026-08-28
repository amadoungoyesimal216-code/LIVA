// LIVA ADMIN — Vue Émetteur de Notifications & Diffusion
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';

export class AdminNotificationsView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.users = [];
  }

  async render() {
    this.users = await this.adminService.getUsers('', 'all', 'active');

    return `
      <div class="admin-notifications-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Diffusion de Notifications 🔔
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Envoyez des alertes et annonces à l'ensemble des lecteurs, aux auteurs ou à un membre spécifique.
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-6);">
          
          <!-- FORMULAIRE D'ÉMISSION -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>📢</span>
                <span>Nouvelle Annonce Globale ou Ciblée</span>
              </div>
            </div>

            <form id="admin-broadcast-form" style="padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4);">
              
              <div class="form-group">
                <label class="form-label">Destinataires *</label>
                <select id="broadcast-target-group" class="form-input">
                  <option value="ALL">📢 Tous les utilisateurs enregistrés (Diffusion Globale)</option>
                  <option value="AUTHORS">✍️ Tous les auteurs & créateurs</option>
                  <option value="SPECIFIC">👤 Un utilisateur spécifique</option>
                </select>
              </div>

              <div class="form-group" id="broadcast-user-select-group" style="display: none;">
                <label class="form-label">Sélectionner le membre</label>
                <select id="broadcast-target-user" class="form-input">
                  ${this.users.map(u => `<option value="${u.id}">${escapeHTML(u.name)} (${escapeHTML(u.email)})</option>`).join('')}
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 80px 1fr; gap: var(--space-3);">
                <div class="form-group">
                  <label class="form-label">Icône</label>
                  <input type="text" id="broadcast-icon" class="form-input" value="📢" />
                </div>
                <div class="form-group">
                  <label class="form-label">Titre de l'alerte *</label>
                  <input type="text" id="broadcast-title" class="form-input" placeholder="Ex: Nouveau concours d'écriture 🌟" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Message / Description *</label>
                <textarea id="broadcast-message" class="form-textarea" rows="4" placeholder="Contenu du message envoyé aux utilisateurs..." required></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; margin-top: var(--space-2);">
                <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-broadcast">
                  🚀 Diffuser la notification
                </button>
              </div>

            </form>
          </div>

          <!-- CONSEILS & APERÇU -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>📱</span>
                <span>Aperçu de la Notification</span>
              </div>
            </div>

            <div style="padding: var(--space-5);">
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: var(--space-4);">
                Voici comment l'alerte apparaîtra dans le tiroir de notifications des utilisateurs connectés :
              </p>

              <!-- Carte simulation notification -->
              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-4); display: flex; gap: var(--space-3); align-items: flex-start;">
                <div id="preview-notif-icon" style="font-size: 1.5rem; width: 40px; height: 40px; border-radius: var(--radius-md); background: rgba(121, 40, 202, 0.2); display: flex; align-items: center; justify-content: center;">
                  📢
                </div>
                <div style="flex: 1;">
                  <div id="preview-notif-title" style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 2px;">
                    Nouveau concours d'écriture 🌟
                  </div>
                  <div id="preview-notif-desc" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                    Découvrez dès maintenant les règles et participez pour remporter des récompenses exclusives sur LIVA.
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">
                    À l'instant · Diffusion Administrateur
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  attachEvents(container) {
    const form = container.querySelector('#admin-broadcast-form');
    const groupSelect = container.querySelector('#broadcast-target-group');
    const userSelectGroup = container.querySelector('#broadcast-user-select-group');
    const targetUserSelect = container.querySelector('#broadcast-target-user');
    const titleInput = container.querySelector('#broadcast-title');
    const msgInput = container.querySelector('#broadcast-message');
    const iconInput = container.querySelector('#broadcast-icon');

    const previewIcon = container.querySelector('#preview-notif-icon');
    const previewTitle = container.querySelector('#preview-notif-title');
    const previewDesc = container.querySelector('#preview-notif-desc');

    groupSelect?.addEventListener('change', () => {
      if (userSelectGroup) {
        userSelectGroup.style.display = groupSelect.value === 'SPECIFIC' ? 'block' : 'none';
      }
    });

    const updatePreview = () => {
      if (previewTitle) previewTitle.textContent = titleInput.value || 'Titre de l\'alerte';
      if (previewDesc) previewDesc.textContent = msgInput.value || 'Contenu du message...';
      if (previewIcon) previewIcon.textContent = iconInput.value || '📢';
    };

    titleInput?.addEventListener('input', updatePreview);
    msgInput?.addEventListener('input', updatePreview);
    iconInput?.addEventListener('input', updatePreview);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
      const group = groupSelect.value;
      const targetUserId = group === 'SPECIFIC' ? targetUserSelect.value : null;

      try {
        const res = await this.adminService.broadcastNotification({
          targetGroup: group,
          targetUserId,
          title: titleInput.value.trim(),
          message: msgInput.value.trim(),
          icon: iconInput.value.trim()
        }, adminUser);

        Toast.show(`Notification diffusée avec succès à ${res?.sent_count || 1} membre(s) !`, 'success', '🚀');
        form.reset();
        updatePreview();
      } catch (err) {
        Toast.show('Erreur de diffusion : ' + err.message, 'error', '⚠️');
      }
    });
  }
}
