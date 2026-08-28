// LIVA ADMIN — Vue Gestion des Chapitres & Éditeur Confortable
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';

export class AdminChaptersView {
  constructor(store, router, adminService, params = {}) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.params = params;
    this.stories = [];
    this.selectedStoryId = params.storyId || null;
    this.chapters = [];
    this.editingChapter = null;
  }

  async render() {
    this.stories = await this.adminService.getStories();
    if (!this.selectedStoryId && this.stories.length > 0) {
      this.selectedStoryId = this.stories[0].id;
    }

    if (this.selectedStoryId) {
      this.chapters = await this.adminService.getChapters(this.selectedStoryId);
    }

    const currentStory = this.stories.find(s => s.id === this.selectedStoryId);

    return `
      <div class="admin-chapters-view">
        
        <!-- EN-TÊTE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 4px;">
              Gestion des Chapitres 📑
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Rédigez, ordonnez, modifiez et publiez les chapitres de chaque histoire.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <select class="admin-select" id="admin-select-story" style="font-weight: 600; min-width: 250px;">
              ${this.stories.map(st => `
                <option value="${st.id}" ${st.id === this.selectedStoryId ? 'selected' : ''}>
                  ${escapeHTML(st.title)} (${st.author_name})
                </option>
              `).join('')}
            </select>

            <button class="btn btn-primary" id="btn-open-create-chapter">
              + Nouveau chapitre
            </button>
          </div>
        </div>

        <!-- RÉSUMÉ HISTOIRE SÉLECTIONNÉE -->
        ${currentStory ? `
          <div class="admin-card" style="margin-bottom: var(--space-5); padding: var(--space-4) var(--space-5); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); background: rgba(121, 40, 202, 0.08); border-color: rgba(121, 40, 202, 0.25);">
            <div style="display: flex; align-items: center; gap: var(--space-4);">
              <img src="${currentStory.cover}" style="width: 40px; height: 55px; border-radius: 4px; object-fit: cover;" />
              <div>
                <div style="font-weight: 700; font-size: 1.05rem;">${escapeHTML(currentStory.title)}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                  Auteur : <strong>${escapeHTML(currentStory.author_name)}</strong> · Genre : ${escapeHTML(currentStory.genre)} · Statut : ${currentStory.status}
                </div>
              </div>
            </div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary-light);">
              ${this.chapters.length} chapitre(s) au total
            </div>
          </div>
        ` : ''}

        <!-- TABLEAU DES CHAPITRES -->
        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 70px;">Numéro</th>
                  <th>Titre du Chapitre</th>
                  <th>Temps Estimé</th>
                  <th>Longueur du Texte</th>
                  <th>Date d'Ajout</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.chapters.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                      Aucun chapitre pour cette histoire. Cliquez sur « + Nouveau chapitre » pour rédiger le premier !
                    </td>
                  </tr>
                ` : this.chapters.map(ch => {
                  const wordCount = (ch.content || '').split(/\s+/).filter(Boolean).length;
                  return `
                    <tr data-chapter-id="${ch.id}">
                      <td style="font-weight: 800; color: var(--color-primary-light);">
                        Ch. ${ch.number}
                      </td>
                      <td>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${escapeHTML(ch.title)}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(ch.id)}</div>
                      </td>
                      <td>
                        <span class="badge badge-blur" style="font-size: 0.75rem;">⏱️ ${escapeHTML(ch.duration || '5 min')}</span>
                      </td>
                      <td style="color: var(--text-secondary); font-size: 0.82rem;">
                        ${wordCount} mots (~${Math.round(wordCount / 200)} min)
                      </td>
                      <td style="color: var(--text-muted); font-size: 0.8rem;">
                        ${ch.created_at ? new Date(ch.created_at).toLocaleDateString('fr-FR') : 'Récent'}
                      </td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; align-items: center; gap: 6px;">
                          <button class="btn btn-secondary btn-sm btn-edit-chapter" data-chapter-id="${ch.id}" style="padding: 5px 10px; font-size: 0.8rem;">
                            ✏️ Éditer
                          </button>
                          <button class="btn btn-ghost btn-sm btn-delete-chapter" data-chapter-id="${ch.id}" data-title="${escapeHTML(ch.title)}" style="padding: 5px 10px; font-size: 0.8rem; color: #F87171;">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- MODALE ÉDITEUR DE CHAPITRE -->
        <div class="admin-modal-backdrop" id="modal-admin-chapter-editor">
          <div class="admin-modal-box" style="max-width: 800px;">
            <div class="admin-modal-header">
              <h3 class="admin-card-title" id="admin-chapter-modal-title">✍️ Rédacteur de Chapitre</h3>
              <button class="btn btn-ghost btn-sm" id="btn-close-chapter-modal">✕</button>
            </div>

            <form id="admin-chapter-form">
              <input type="hidden" id="form-chapter-id" value="" />
              <div class="admin-modal-body">
                
                <div style="display: grid; grid-template-columns: 120px 1fr 140px; gap: var(--space-3);">
                  <div class="form-group">
                    <label class="form-label">Numéro *</label>
                    <input type="number" id="form-chapter-number" class="form-input" min="1" value="1" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Titre du chapitre *</label>
                    <input type="text" id="form-chapter-title" class="form-input" placeholder="Ex: Le commencement" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Durée estimée</label>
                    <input type="text" id="form-chapter-duration" class="form-input" placeholder="Ex: 8 min" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" style="display: flex; justify-content: space-between;">
                    <span>Texte & Contenu du Chapitre *</span>
                    <span id="form-chapter-wordcount" style="color: var(--text-muted); font-size: 0.75rem;">0 mots</span>
                  </label>
                  <textarea 
                    id="form-chapter-content" 
                    class="form-textarea" 
                    rows="14" 
                    placeholder="Écrivez ou collez ici le texte complet du chapitre..." 
                    style="font-family: 'Literata', serif; font-size: 0.95rem; line-height: 1.7;" 
                    required
                  ></textarea>
                </div>

              </div>

              <div class="admin-modal-footer">
                <button type="button" class="btn btn-ghost" id="btn-cancel-chapter-modal">Annuler</button>
                <button type="submit" class="btn btn-primary" id="btn-save-chapter">Enregistrer le chapitre ✨</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  }

  attachEvents(container) {
    // 1. Changement d'histoire sélectionnée
    const storySelect = container.querySelector('#admin-select-story');
    storySelect?.addEventListener('change', async (e) => {
      this.selectedStoryId = e.target.value;
      const html = await this.render();
      container.innerHTML = html;
      this.attachEvents(container);
    });

    // 2. Modale Chapitre
    const modal = container.querySelector('#modal-admin-chapter-editor');
    const modalTitle = container.querySelector('#admin-chapter-modal-title');
    const form = container.querySelector('#admin-chapter-form');
    const idInput = container.querySelector('#form-chapter-id');
    const numInput = container.querySelector('#form-chapter-number');
    const titleInput = container.querySelector('#form-chapter-title');
    const durationInput = container.querySelector('#form-chapter-duration');
    const contentInput = container.querySelector('#form-chapter-content');
    const wordcountSpan = container.querySelector('#form-chapter-wordcount');

    const updateWordCount = () => {
      const words = (contentInput.value || '').split(/\s+/).filter(Boolean).length;
      if (wordcountSpan) wordcountSpan.textContent = `${words} mots (~${Math.max(1, Math.round(words / 200))} min)`;
    };

    contentInput?.addEventListener('input', updateWordCount);

    const openModal = (chapter = null) => {
      if (chapter) {
        modalTitle.textContent = `✏️ Modifier Chapitre ${chapter.number} — ${chapter.title}`;
        idInput.value = chapter.id;
        numInput.value = chapter.number;
        titleInput.value = chapter.title;
        durationInput.value = chapter.duration || '5 min';
        contentInput.value = chapter.content || '';
      } else {
        const nextNum = (this.chapters.length > 0 ? Math.max(...this.chapters.map(c => c.number || 0)) : 0) + 1;
        modalTitle.textContent = `✨ Nouveau Chapitre ${nextNum}`;
        idInput.value = '';
        numInput.value = nextNum;
        titleInput.value = `Chapitre ${nextNum}`;
        durationInput.value = '5 min';
        contentInput.value = '';
      }
      updateWordCount();
      modal?.classList.add('active');
    };

    const closeModal = () => modal?.classList.remove('active');

    container.querySelector('#btn-open-create-chapter')?.addEventListener('click', () => openModal());
    container.querySelector('#btn-close-chapter-modal')?.addEventListener('click', closeModal);
    container.querySelector('#btn-cancel-chapter-modal')?.addEventListener('click', closeModal);

    // Form submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.selectedStoryId) {
        Toast.show('Veuillez sélectionner une histoire.', 'warning', '⚠️');
        return;
      }

      const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
      const words = (contentInput.value || '').split(/\s+/).filter(Boolean).length;
      const readMins = Math.max(1, Math.round(words / 200));

      const payload = {
        id: idInput.value || undefined,
        story_id: this.selectedStoryId,
        number: parseInt(numInput.value) || 1,
        title: titleInput.value.trim(),
        duration: durationInput.value.trim() || `${readMins} min`,
        read_time_min: readMins,
        content: contentInput.value.trim()
      };

      try {
        await this.adminService.upsertChapter(payload, adminUser);
        closeModal();
        Toast.show('Chapitre enregistré avec succès dans Supabase !', 'success', '✨');
        await this.store.initSupabaseSync();
        const html = await this.render();
        container.innerHTML = html;
        this.attachEvents(container);
      } catch (err) {
        Toast.show('Erreur : ' + err.message, 'error', '⚠️');
      }
    });

    // 3. Modifier chapitre
    container.querySelectorAll('.btn-edit-chapter').forEach(btn => {
      btn.addEventListener('click', () => {
        const chId = btn.getAttribute('data-chapter-id');
        const ch = this.chapters.find(c => c.id === chId);
        if (ch) openModal(ch);
      });
    });

    // 4. Supprimer chapitre
    container.querySelectorAll('.btn-delete-chapter').forEach(btn => {
      btn.addEventListener('click', async () => {
        const chId = btn.getAttribute('data-chapter-id');
        const chTitle = btn.getAttribute('data-title');
        const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer le chapitre "${chTitle}" ?`);
        if (!confirmed) return;

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.deleteChapter(chId, this.selectedStoryId, chTitle, adminUser);
          Toast.show('Chapitre supprimé de la base.', 'success', '🗑️');
          await this.store.initSupabaseSync();
          const html = await this.render();
          container.innerHTML = html;
          this.attachEvents(container);
        } catch (err) {
          Toast.show('Erreur suppression : ' + err.message, 'error', '⚠️');
        }
      });
    });
  }
}
