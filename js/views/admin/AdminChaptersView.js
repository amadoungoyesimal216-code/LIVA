// LIVA ADMIN — Vue Gestion des Chapitres & Éditeur Confortable (Responsive & Auto-Save)
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
    this.draftKey = 'liva_admin_chapter_draft_';
  }

  getDraft(storyId) {
    try {
      const raw = localStorage.getItem(this.draftKey + storyId);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  saveDraft(storyId, draftData) {
    try {
      localStorage.setItem(this.draftKey + storyId, JSON.stringify({
        ...draftData,
        updatedAt: Date.now()
      }));
    } catch (e) {
      console.warn('[AdminChaptersView] Erreur sauvegarde brouillon local:', e);
    }
  }

  clearDraft(storyId) {
    try {
      localStorage.removeItem(this.draftKey + storyId);
    } catch (e) {}
  }

  async render() {
    this.stories = await this.adminService.getStories();
    
    // Si une storyId a été passée en paramètre, trouver la correspondance exacte
    if (this.selectedStoryId) {
      const match = this.stories.find(s => String(s.id).trim() === String(this.selectedStoryId).trim());
      if (match) {
        this.selectedStoryId = match.id;
      }
    }
    
    if (!this.selectedStoryId && this.stories.length > 0) {
      this.selectedStoryId = this.stories[0].id;
    }

    if (this.selectedStoryId) {
      this.chapters = await this.adminService.getChapters(this.selectedStoryId);
    }

    const currentStory = this.stories.find(s => String(s.id) === String(this.selectedStoryId));

    return `
      <div class="admin-chapters-view animate-fade-in">
        
        <!-- 1. EN-TÊTE RESPONSIVE DU MODULE CHAPITRES -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: clamp(1.3rem, 2.5vw, 1.65rem); font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; margin-bottom: 2px;">
              Gestion des Chapitres 📑
            </h1>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              Rédigez, ordonnez, modifiez et publiez les chapitres de chaque histoire.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%; max-width: 600px; justify-content: flex-end;">
            <select class="admin-select" id="admin-select-story" style="font-weight: 600; flex: 1; min-width: 220px;">
              ${this.stories.map(st => `
                <option value="${st.id}" ${String(st.id) === String(this.selectedStoryId) ? 'selected' : ''}>
                  ${escapeHTML(st.title)} (${escapeHTML(st.author_name || 'Auteur')})
                </option>
              `).join('')}
            </select>

            <button class="btn btn-primary" id="btn-open-create-chapter" style="white-space: nowrap; padding: 10px 16px;">
              + Nouveau chapitre
            </button>
          </div>
        </div>

        <!-- 2. RÉSUMÉ DE L'HISTOIRE SÉLECTIONNÉE -->
        ${currentStory ? `
          <div class="admin-card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); background: rgba(121, 40, 202, 0.08); border-color: rgba(121, 40, 202, 0.25);">
            <div style="display: flex; align-items: center; gap: var(--space-3); min-width: 0;">
              <img src="${currentStory.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}" style="width: 42px; height: 58px; border-radius: 4px; object-fit: cover; flex-shrink: 0;" alt="Couverture" />
              <div style="min-width: 0;">
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${escapeHTML(currentStory.title)}
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">
                  Auteur : <strong style="color: var(--text-primary);">${escapeHTML(currentStory.author_name || 'Auteur')}</strong> · Genre : ${escapeHTML(currentStory.genre)} · <span class="badge ${currentStory.status === 'published' ? 'badge-primary' : 'badge-gold'}" style="font-size: 0.7rem; padding: 1px 6px;">${currentStory.status === 'published' ? 'Publiée' : 'Brouillon'}</span>
                </div>
              </div>
            </div>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-primary-light); white-space: nowrap;">
              📖 ${this.chapters.length} chapitre(s) enregistrés
            </div>
          </div>
        ` : ''}

        <!-- 3. LISTE DES CHAPITRES (TABLE DESKTOP + CARTES MOBILES) -->
        <div class="admin-card">
          <!-- Vue Tableau pour Écrans Moyens et Grands -->
          <div class="admin-table-container hide-on-mobile">
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
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.92rem;">${escapeHTML(ch.title)}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(ch.id)}</div>
                      </td>
                      <td>
                        <span class="badge badge-blur" style="font-size: 0.75rem;">⏱️ ${escapeHTML(ch.duration || '5 min')}</span>
                      </td>
                      <td style="color: var(--text-secondary); font-size: 0.82rem;">
                        ${wordCount} mots (~${Math.max(1, Math.round(wordCount / 200))} min)
                      </td>
                      <td style="color: var(--text-muted); font-size: 0.8rem;">
                        ${ch.created_at ? new Date(ch.created_at).toLocaleDateString('fr-FR') : 'Récent'}
                      </td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; align-items: center; gap: 6px;">
                          <button class="btn btn-secondary btn-sm btn-edit-chapter" data-chapter-id="${ch.id}" style="padding: 6px 12px; font-size: 0.8rem;">
                            ✏️ Éditer
                          </button>
                          <button class="btn btn-ghost btn-sm btn-delete-chapter" data-chapter-id="${ch.id}" data-title="${escapeHTML(ch.title)}" style="padding: 6px 10px; font-size: 0.8rem; color: #F87171;">
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

          <!-- Vue Cartes Responsive pour Smartphones & Petits Écrans -->
          <div class="admin-chapters-mobile-list">
            ${this.chapters.length === 0 ? `
              <div style="text-align: center; padding: var(--space-6); color: var(--text-muted); font-size: 0.88rem;">
                Aucun chapitre pour cette histoire. Cliquez sur « + Nouveau chapitre » ci-dessus pour rédiger le premier !
              </div>
            ` : this.chapters.map(ch => {
              const wordCount = (ch.content || '').split(/\s+/).filter(Boolean).length;
              return `
                <div class="admin-chapter-mobile-card" data-chapter-id="${ch.id}">
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                    <div>
                      <span style="font-weight: 800; font-size: 0.8rem; color: var(--color-primary-light); text-transform: uppercase;">
                        Chapitre ${ch.number}
                      </span>
                      <h4 style="font-size: 0.95rem; font-weight: 700; margin: 2px 0 4px; color: var(--text-primary);">
                        ${escapeHTML(ch.title)}
                      </h4>
                    </div>
                    <span class="badge badge-blur" style="font-size: 0.72rem; flex-shrink: 0;">
                      ⏱️ ${escapeHTML(ch.duration || '5 min')}
                    </span>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06);">
                    <span>📊 ${wordCount} mots</span>
                    <span>📅 ${ch.created_at ? new Date(ch.created_at).toLocaleDateString('fr-FR') : 'Récent'}</span>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    <button class="btn btn-secondary btn-sm btn-edit-chapter" data-chapter-id="${ch.id}" style="flex: 1; justify-content: center; font-size: 0.82rem; padding: 7px 12px;">
                      ✏️ Éditer le chapitre
                    </button>
                    <button class="btn btn-ghost btn-sm btn-delete-chapter" data-chapter-id="${ch.id}" data-title="${escapeHTML(ch.title)}" style="color: #F87171; padding: 7px 10px;">
                      🗑️
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. MODALE ÉDITEUR DE CHAPITRE (RESPONSIVE & AUTO-SAVE SÉCURISÉ) -->
        <div class="admin-modal-backdrop" id="modal-admin-chapter-editor">
          <div class="admin-modal-box" style="max-width: 840px;">
            <div class="admin-modal-header">
              <h3 class="admin-card-title" id="admin-chapter-modal-title">✍️ Rédacteur de Chapitre</h3>
              <button class="btn btn-ghost btn-sm" id="btn-close-chapter-modal" style="font-size: 1.1rem; padding: 4px 8px;">✕</button>
            </div>

            <form id="admin-chapter-form" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
              <input type="hidden" id="form-chapter-id" value="" />
              
              <div class="admin-modal-body">
                
                <!-- Alerte Brouillon Détecté -->
                <div class="admin-chapter-draft-alert" id="admin-chapter-draft-alert" style="display: none;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>💾</span>
                    <span id="draft-alert-text">Brouillon automatique retrouvé</span>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-primary btn-sm" id="btn-restore-draft" style="padding: 3px 10px; font-size: 0.75rem;">
                      Restaurer ↺
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" id="btn-dismiss-draft" style="padding: 3px 8px; font-size: 0.75rem;">
                      Effacer ✕
                    </button>
                  </div>
                </div>

                <!-- Grille Responsive : Numéro / Titre / Durée -->
                <div class="admin-chapter-form-grid">
                  <div class="form-group">
                    <label class="form-label">Numéro *</label>
                    <input type="number" id="form-chapter-number" class="form-input" min="1" value="1" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Titre du chapitre *</label>
                    <input type="text" id="form-chapter-title" class="form-input" placeholder="Ex: Chapitre 1 — La Révélation" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Durée estimée</label>
                    <input type="text" id="form-chapter-duration" class="form-input" placeholder="Ex: 5 min" />
                  </div>
                </div>

                <!-- Zone d'Écriture Manuelle & Bouton Coller -->
                <div class="form-group" style="flex: 1; display: flex; flex-direction: column;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <label class="form-label" style="margin-bottom: 0;">Texte & Contenu du Chapitre *</label>
                      <button type="button" class="admin-paste-btn" id="btn-paste-chapter-content" title="Coller le texte copié depuis votre presse-papier">
                        <span>📋</span> Coller le texte
                      </button>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 8px;">
                      <span id="form-chapter-wordcount">0 mots</span>
                      <span>·</span>
                      <span id="form-chapter-readtime">⏱️ ~1 min</span>
                    </div>
                  </div>

                  <textarea 
                    id="form-chapter-content" 
                    class="form-textarea" 
                    rows="14" 
                    placeholder="Écrivez ou collez ici le texte complet de votre chapitre..." 
                    style="font-family: 'Literata', Georgia, serif; font-size: 1.02rem; line-height: 1.8; min-height: 280px; flex: 1;" 
                    required
                  ></textarea>
                </div>

              </div>

              <div class="admin-modal-footer">
                <button type="button" class="btn btn-ghost" id="btn-cancel-chapter-modal">Annuler</button>
                <button type="submit" class="btn btn-primary" id="btn-save-chapter" style="padding: 10px 20px;">
                  Enregistrer le chapitre ✨
                </button>
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
    // 1. Changement d'histoire sélectionnée (mise à jour ciblée sans écraser le menu)
    const storySelect = container.querySelector('#admin-select-story');
    storySelect?.addEventListener('change', async (e) => {
      this.selectedStoryId = e.target.value;
      await this.refreshSelf(container);
    });

    // 2. Modale & Éléments du Formulaire
    const modal = container.querySelector('#modal-admin-chapter-editor');
    const modalTitle = container.querySelector('#admin-chapter-modal-title');
    const form = container.querySelector('#admin-chapter-form');
    const idInput = container.querySelector('#form-chapter-id');
    const numInput = container.querySelector('#form-chapter-number');
    const titleInput = container.querySelector('#form-chapter-title');
    const durationInput = container.querySelector('#form-chapter-duration');
    const contentInput = container.querySelector('#form-chapter-content');
    const wordcountSpan = container.querySelector('#form-chapter-wordcount');
    const readtimeSpan = container.querySelector('#form-chapter-readtime');
    const draftAlert = container.querySelector('#admin-chapter-draft-alert');
    const draftTextSpan = container.querySelector('#draft-alert-text');
    const btnRestoreDraft = container.querySelector('#btn-restore-draft');
    const btnDismissDraft = container.querySelector('#btn-dismiss-draft');
    const btnPasteContent = container.querySelector('#btn-paste-chapter-content');

    let isEditingExisting = false;

    const updateWordCount = () => {
      const words = (contentInput?.value || '').trim().split(/\s+/).filter(Boolean).length;
      const readMins = Math.max(1, Math.ceil(words / 200));
      if (wordcountSpan) wordcountSpan.textContent = `${words} mots (${contentInput?.value.length || 0} car.)`;
      if (readtimeSpan) readtimeSpan.textContent = `⏱️ ~${readMins} min de lecture`;
      if (durationInput && (!durationInput.value || durationInput.value.endsWith('min'))) {
        durationInput.value = `${readMins} min`;
      }
    };

    const triggerAutoSave = () => {
      if (!this.selectedStoryId) return;
      this.saveDraft(this.selectedStoryId, {
        isEditing: isEditingExisting,
        chapterId: idInput?.value || '',
        number: numInput?.value || '1',
        title: titleInput?.value || '',
        duration: durationInput?.value || '5 min',
        content: contentInput?.value || ''
      });
    };

    contentInput?.addEventListener('input', () => {
      updateWordCount();
      triggerAutoSave();
    });

    titleInput?.addEventListener('input', triggerAutoSave);
    numInput?.addEventListener('input', triggerAutoSave);
    durationInput?.addEventListener('input', triggerAutoSave);

    // Bouton Coller Rapide depuis le Presse-Papier
    btnPasteContent?.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            if (contentInput.value && contentInput.value.trim().length > 0) {
              const confirmReplace = confirm('Voulez-vous remplacer le texte actuel par le contenu du presse-papier ?');
              if (!confirmReplace) return;
            }
            contentInput.value = text;
            updateWordCount();
            triggerAutoSave();
            Toast.show('Texte collé avec succès depuis le presse-papier !', 'success', '📋');
            return;
          }
        }
      } catch (err) {
        console.warn('Clipboard read failed:', err);
      }
      contentInput?.focus();
      Toast.show('Faites un appui long ou Ctrl+V / Cmd+V pour coller votre texte.', 'info', '✍️');
    });

    const openModal = (chapter = null) => {
      if (chapter) {
        isEditingExisting = true;
        modalTitle.textContent = `✏️ Modifier Chapitre ${chapter.number} — ${chapter.title}`;
        idInput.value = chapter.id;
        numInput.value = chapter.number;
        titleInput.value = chapter.title;
        durationInput.value = chapter.duration || '5 min';
        contentInput.value = chapter.content || '';
        if (draftAlert) draftAlert.style.display = 'none';
      } else {
        isEditingExisting = false;
        const nextNum = (this.chapters.length > 0 ? Math.max(...this.chapters.map(c => c.number || 0)) : 0) + 1;
        modalTitle.textContent = `✨ Nouveau Chapitre ${nextNum}`;
        idInput.value = '';
        numInput.value = nextNum;
        titleInput.value = `Chapitre ${nextNum}`;
        durationInput.value = '5 min';
        contentInput.value = '';

        // Vérifier si un brouillon sauvegardé existe pour cette histoire
        const savedDraft = this.getDraft(this.selectedStoryId);
        if (savedDraft && savedDraft.content && savedDraft.content.trim().length > 0) {
          if (draftAlert) {
            const timeStr = savedDraft.updatedAt ? new Date(savedDraft.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
            if (draftTextSpan) draftTextSpan.textContent = `Brouillon non sauvegardé retrouvé (${savedDraft.content.split(/\s+/).filter(Boolean).length} mots - ${timeStr})`;
            draftAlert.style.display = 'flex';
          }
        } else if (draftAlert) {
          draftAlert.style.display = 'none';
        }
      }

      updateWordCount();
      modal?.classList.add('active');
    };

    btnRestoreDraft?.addEventListener('click', () => {
      const savedDraft = this.getDraft(this.selectedStoryId);
      if (savedDraft) {
        if (savedDraft.number) numInput.value = savedDraft.number;
        if (savedDraft.title) titleInput.value = savedDraft.title;
        if (savedDraft.duration) durationInput.value = savedDraft.duration;
        if (savedDraft.content) contentInput.value = savedDraft.content;
        updateWordCount();
        if (draftAlert) draftAlert.style.display = 'none';
        Toast.show('Brouillon restauré avec succès !', 'success', '✨');
      }
    });

    btnDismissDraft?.addEventListener('click', () => {
      this.clearDraft(this.selectedStoryId);
      if (draftAlert) draftAlert.style.display = 'none';
      Toast.show('Brouillon effacé.', 'info', '🗑️');
    });

    const closeModal = () => {
      modal?.classList.remove('active');
    };

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

      const words = (contentInput.value || '').trim().split(/\s+/).filter(Boolean).length;
      if (words === 0) {
        Toast.show('Veuillez écrire ou coller le texte de votre chapitre.', 'warning', '✍️');
        contentInput?.focus();
        return;
      }

      const saveBtn = form.querySelector('#btn-save-chapter');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Enregistrement en cours... ⏳';
      }

      const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
      const readMins = Math.max(1, Math.ceil(words / 200));

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
        this.clearDraft(this.selectedStoryId);
        closeModal();
        Toast.show(`Chapitre "${payload.title}" enregistré avec succès dans Supabase !`, 'success', '✨');
        await this.store.initSupabaseSync();
        await this.refreshSelf(container);
      } catch (err) {
        Toast.show('Erreur : ' + err.message, 'error', '⚠️');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Enregistrer le chapitre ✨';
        }
      }
    });

    // 3. Gestionnaire délégué universel pour Modifier & Supprimer chapitre (Desktop et Mobile)
    container.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.btn-edit-chapter');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const chId = editBtn.getAttribute('data-chapter-id');
        const ch = this.chapters.find(c => String(c.id) === String(chId));
        if (ch) openModal(ch);
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-chapter');
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const chId = deleteBtn.getAttribute('data-chapter-id');
        const chTitle = deleteBtn.getAttribute('data-title') || 'Chapitre';
        const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer le chapitre "${chTitle}" ?`);
        if (!confirmed) return;

        try {
          const adminUser = this.store.state.user || { id: 'admin', name: 'Admin' };
          await this.adminService.deleteChapter(chId, this.selectedStoryId, chTitle, adminUser);
          Toast.show('Chapitre supprimé de la base.', 'success', '🗑️');
          await this.store.initSupabaseSync();
          await this.refreshSelf(container);
        } catch (err) {
          Toast.show('Erreur suppression : ' + err.message, 'error', '⚠️');
        }
        return;
      }
    });
  }
}
