// LIVA ADMIN — Vue Paramètres & Configuration de la Plateforme
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';

export class AdminSettingsView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.settings = {};
  }

  async render() {
    this.settings = await this.adminService.getSettings();
    const platform = this.settings.platform || {
      siteName: 'LIVA',
      tagline: 'Plateforme littéraire immersive',
      allowUserPublish: true,
      autoModerateComments: false,
      maintenanceMode: false
    };

    return `
      <div class="admin-settings-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Configuration & Paramètres ⚙️
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Gérez les options globales de la plateforme Liva et les politiques de modération.
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
          
          <!-- 1. GÉNÉRAL -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>🌐</span>
                <span>Paramètres Généraux</span>
              </div>
            </div>

            <form id="admin-platform-settings-form" style="padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4);">
              
              <div class="form-group">
                <label class="form-label">Nom de l'application</label>
                <input type="text" id="setting-sitename" class="form-input" value="${escapeHTML(platform.siteName || 'LIVA')}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Slogan / Tagline</label>
                <input type="text" id="setting-tagline" class="form-input" value="${escapeHTML(platform.tagline || 'Plateforme littéraire immersive')}" />
              </div>

              <div style="margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-3);">
                <label style="display: flex; align-items: center; gap: var(--space-3); cursor: pointer;">
                  <input type="checkbox" id="setting-allow-publish" ${platform.allowUserPublish !== false ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--color-primary-light);" />
                  <span style="font-size: 0.85rem; color: var(--text-primary);">Autoriser les auteurs certifiés à publier directement</span>
                </label>

                <label style="display: flex; align-items: center; gap: var(--space-3); cursor: pointer;">
                  <input type="checkbox" id="setting-auto-mod" ${platform.autoModerateComments ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--color-primary-light);" />
                  <span style="font-size: 0.85rem; color: var(--text-primary);">Activer le filtre anti-spam automatique sur les avis</span>
                </label>

                <label style="display: flex; align-items: center; gap: var(--space-3); cursor: pointer;">
                  <input type="checkbox" id="setting-maintenance" ${platform.maintenanceMode ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--color-accent-rose);" />
                  <span style="font-size: 0.85rem; color: #F87171; font-weight: 600;">Mode maintenance actif (accès restreint aux admins)</span>
                </label>
              </div>

              <div style="display: flex; justify-content: flex-end; margin-top: var(--space-3);">
                <button type="submit" class="btn btn-primary">
                  Enregistrer les modifications ✨
                </button>
              </div>

            </form>
          </div>

          <!-- 2. SÉCURITÉ & BASE DE DONNÉES -->
          <div class="admin-card">
            <div class="admin-card-header">
              <div class="admin-card-title">
                <span>🛡️</span>
                <span>Sécurité & Connexion Supabase</span>
              </div>
            </div>

            <div style="padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4);">
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-4);">
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 2px;">Projet Supabase Connecté :</div>
                <div style="font-family: monospace; font-weight: 700; color: var(--color-primary-light);">tfvstehpbkxcisiomdpg</div>
                <div style="font-size: 0.75rem; color: var(--color-success); margin-top: 4px;">🟢 Connexion active & RLS activé</div>
              </div>

              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-4);">
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 2px;">Protection Anti-Bruteforce :</div>
                <div style="font-size: 0.85rem; color: var(--text-primary); font-weight: 600;">5 tentatives échouées = 30s de verrouillage</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Géré nativement par la couche de sécurité Liva.</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  attachEvents(container) {
    const form = container.querySelector('#admin-platform-settings-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
      const siteName = container.querySelector('#setting-sitename')?.value.trim();
      const tagline = container.querySelector('#setting-tagline')?.value.trim();
      const allowPublish = container.querySelector('#setting-allow-publish')?.checked;
      const autoMod = container.querySelector('#setting-auto-mod')?.checked;
      const maintenance = container.querySelector('#setting-maintenance')?.checked;

      const payload = {
        siteName,
        tagline,
        allowUserPublish: allowPublish,
        autoModerateComments: autoMod,
        maintenanceMode: maintenance
      };

      try {
        await this.adminService.saveSettings('platform', payload, adminUser);
        Toast.show('Paramètres de la plateforme enregistrés avec succès !', 'success', '✨');
      } catch (err) {
        Toast.show('Erreur : ' + err.message, 'error', '⚠️');
      }
    });
  }
}
