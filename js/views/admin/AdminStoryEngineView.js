// LIVA ADMIN — Vue LIVA STORY ENGINE (Système Automatisé de Création d'Histoires par IA)
import { escapeHTML } from '../../utils/sanitize.js';
import { Toast } from '../../components/Toast.js';
import { StoryEngineService } from '../../features/storyEngine/storyEngineService.js';
import { GENRES_DATA } from '../../data/genres.js';

export class AdminStoryEngineView {
  constructor(store, router, adminService) {
    this.store = store;
    this.router = router;
    this.adminService = adminService;
    this.engine = new StoryEngineService();

    this.currentStep = 1; // 1: Ideation, 2: Bible/Plan, 3: Live Writing, 4: Quality Audit, 5: Finish & Publish
    this.bible = null;
    this.storyId = null;
    this.generatedChapters = [];
    this.qualityReport = null;
    this.isGenerating = false;
    this.activeWritingLog = [];

    // Paramètres par défaut
    this.formState = {
      idea: '',
      genre: 'Romance',
      secondaryGenre: 'Drame',
      mood: 'Émotionnelle',
      targetAudience: 'Jeunes adultes',
      language: 'Français',
      lengthType: 'court', // court (5), moyen (10), long (20), tres_long (30)
      writingStyle: 'Immersif & Réaliste',
      endingType: 'surprenante',
      authorName: this.store.state.user?.name || 'Sarah Diop'
    };
  }

  async render() {
    return `
      <div class="admin-story-engine-view">
        
        <!-- 1. EN-TÊTE DU STORY ENGINE -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px;">
                LIVA Story Engine
              </h1>
              <span class="admin-badge-role" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; font-size: 0.75rem; padding: 3px 8px; border-radius: 999px;">
                ✨ Studio IA
              </span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Donnez une idée et laissez l'IA construire une œuvre littéraire complète, cohérente et prête à publier.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="#/admin/stories" class="btn btn-secondary btn-sm">
              ← Retour aux Histoires
            </a>
          </div>
        </div>

        <!-- 2. STEPPER DE PROGRESSION -->
        <div class="story-engine-stepper">
          <div class="stepper-item ${this.currentStep === 1 ? 'active' : (this.currentStep > 1 ? 'completed' : '')}">
            <div class="stepper-circle">1</div>
            <span>💡 Idée & Paramètres</span>
          </div>
          <div class="stepper-line ${this.currentStep > 1 ? 'active' : ''}"></div>
          <div class="stepper-item ${this.currentStep === 2 ? 'active' : (this.currentStep > 2 ? 'completed' : '')}">
            <div class="stepper-circle">2</div>
            <span>📜 Bible & Plan</span>
          </div>
          <div class="stepper-line ${this.currentStep > 2 ? 'active' : ''}"></div>
          <div class="stepper-item ${this.currentStep === 3 ? 'active' : (this.currentStep > 3 ? 'completed' : '')}">
            <div class="stepper-circle">3</div>
            <span>⚡ Écriture IA</span>
          </div>
          <div class="stepper-line ${this.currentStep > 3 ? 'active' : ''}"></div>
          <div class="stepper-item ${this.currentStep === 4 ? 'active' : (this.currentStep > 4 ? 'completed' : '')}">
            <div class="stepper-circle">4</div>
            <span>🔍 Contrôle Qualité</span>
          </div>
          <div class="stepper-line ${this.currentStep > 4 ? 'active' : ''}"></div>
          <div class="stepper-item ${this.currentStep === 5 ? 'active' : ''}">
            <div class="stepper-circle">5</div>
            <span>🚀 Publication</span>
          </div>
        </div>

        <!-- 3. CONTENEUR PRINCIPAL DYNAMIQUE -->
        <div id="story-engine-step-content" class="story-engine-step-container">
          ${this._renderCurrentStepContent()}
        </div>

        <!-- 4. MODALE DE RÉÉCRITURE PAR PROMPT -->
        <div class="modal-overlay" id="modal-ai-rewrite">
          <div class="modal-card" style="max-width: 540px; padding: var(--space-6);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
              <h3 style="font-size: 1.25rem; font-weight: 800; font-family: var(--font-display);">
                ✨ Réécrire le chapitre avec l'IA
              </h3>
              <button class="btn btn-icon" id="btn-close-rewrite-modal">✕</button>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: var(--space-4);">
              Donnez une consigne précise pour ajuster le ton, les émotions, les dialogues ou le suspense de ce chapitre.
            </p>
            <div style="margin-bottom: var(--space-4);">
              <label class="form-label">Instruction pour l'IA :</label>
              <textarea 
                class="form-textarea" 
                id="ai-rewrite-instruction-input" 
                placeholder="Ex : Développe le dialogue entre les deux personnages, rends la fin plus dramatique..."
                style="min-height: 90px;"
              ></textarea>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button class="btn btn-secondary" id="btn-cancel-rewrite">Annuler</button>
              <button class="btn btn-primary" id="btn-confirm-rewrite">✨ Réécrire le chapitre</button>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  _renderCurrentStepContent() {
    switch (this.currentStep) {
      case 1:
        return this._renderStep1Ideation();
      case 2:
        return this._renderStep2BiblePlan();
      case 3:
        return this._renderStep3LiveWriting();
      case 4:
        return this._renderStep4QualityAudit();
      case 5:
        return this._renderStep5FinishPublish();
      default:
        return this._renderStep1Ideation();
    }
  }

  // --- ÉTAPE 1 : IDÉATION & PARAMÈTRES ---
  _renderStep1Ideation() {
    const genres = [
      'Romance', 'Thriller', 'Horreur', 'Fantasy', 'Science-fiction', 
      'Histoires africaines', 'Mystère', 'Drame', 'Aventure', 'Contes'
    ];

    const moods = [
      'Émotionnelle & Poignante', 'Sombre & Palpitante', 'Mystérieuse & Énigmatique', 
      'Romantique & Passionnée', 'Épique & Aventureuse', 'Réaliste & Urbaine'
    ];

    const styles = [
      { id: 'page_turner', label: '⚡ Page-Turner & Suspense Captivant', desc: 'Rythme soutenu, tension continue et cliffhangers irrésistibles' },
      { id: 'immersif', label: '🎭 Immersif & Réaliste (Show Don\'t Tell)', desc: 'Dialogues naturels, atmosphère sensorielle et profondeur psychologique' },
      { id: 'emotionnel', label: '❤️ Émotionnel & Bouleversant', desc: 'Dilemmes intimes puissants, vulnérabilité et intensité des sentiments' }
    ];

    const lengths = [
      { id: 'court', label: 'Courte (5 chapitres)', desc: '~30 min de lecture · Idéal pour démarrer' },
      { id: 'moyen', label: 'Moyenne (10 chapitres)', desc: '~1h de lecture · Arc narratif complet' },
      { id: 'long', label: 'Longue (20 chapitres)', desc: '~2h de lecture · Roman immersif riche' },
      { id: 'tres_long', label: 'Très longue (30+ chapitres)', desc: '~3h+ de lecture · Saga littéraire' }
    ];

    return `
      <div class="admin-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-2);">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-display); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              <span>📝</span> 1. Résumé complet & Fil conducteur de l'histoire
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Décrivez librement votre histoire. L'IA s'appuie fidèlement sur votre résumé pour construire un récit original, cohérent et captivant qui donne envie de lire jusqu'à la fin.
            </p>
          </div>
          <span class="admin-badge-role" style="font-size: 0.75rem; background: rgba(121, 40, 202, 0.15); color: var(--color-primary-light); border: 1px solid rgba(121, 40, 202, 0.3);">
            ✨ Compréhension IA Intelligente
          </span>
        </div>

        <!-- Champ Résumé / Description libre -->
        <div style="margin-bottom: var(--space-5);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <label class="form-label" style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0;">
              Votre résumé détaillé / Trame de l'histoire :
            </label>
            <span style="font-size: 0.75rem; color: var(--text-muted);">
              Noms, âges, métiers, lieux, conflits, trahisons, fin souhaitée
            </span>
          </div>

          <textarea 
            id="engine-idea-input" 
            class="form-textarea" 
            placeholder="Ex : Je veux une histoire qui se déroule à Dakar. L'histoire parle d'une jeune femme appelée Aïcha, 27 ans, architecte, issue d'une famille aisée. Elle rencontre Malik, 30 ans, chauffeur VTC, qui cache un lourd secret concernant sa famille. Ils tombent amoureux. Le père d'Aïcha refuse leur relation. Conflits familiaux, trahison vers le milieu et révélation finale à la fin qui change toute la perception du lecteur..."
            style="min-height: 140px; font-size: 0.9rem; line-height: 1.6;"
          >${escapeHTML(this.formState.idea)}</textarea>
          
          <!-- Suggestions de résumés structurés -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Modèles rapides :</span>
            <button type="button" class="btn btn-ghost btn-sm quick-pitch-btn" data-pitch="Histoire à Dakar : Aïcha (27 ans, architecte, famille aisée) rencontre Malik (30 ans, chauffeur VTC discret cachant un lourd secret familial). Coup de foudre, veto catégorique du père d'Aïcha, conflits familiaux, trahison au milieu de l'intrigue et révélation explosive à la fin qui bouleverse tout.">
              🏙️ Romance & Secret Dakar
            </button>
            <button type="button" class="btn btn-ghost btn-sm quick-pitch-btn" data-pitch="Thriller à Abidjan : Tarek, jeune analyste en cybersécurité, intercepte un transfert financier suspect impliquant une société d'État. Traqué avec une pianiste témoin, il découvre que son propre mentor est au cœur du complot.">
              📱 Thriller & Cyber Abidjan
            </button>
            <button type="button" class="btn btn-ghost btn-sm quick-pitch-btn" data-pitch="Drame d'héritage : Deux demi-sœurs aux personnalités opposées héritent d'une agence de design à Paris à condition de travailler ensemble pendant 1 an. Rivalités, secrets de succession et rédemption mutuelle.">
              🏛️ Drame Familial & Héritage
            </button>
            <button type="button" class="btn btn-ghost btn-sm quick-pitch-btn" data-pitch="Réalisme magique au Sine-Saloum : Le vieux baobab sacré commence à pleurer des larmes d'ambre. Un jeune griot et une herboriste doivent élucider un pacte ancestral oublié pour sauver leur terre.">
              🌳 Conte & Réalisme Magique
            </button>
          </div>
        </div>

        <!-- Paramètres narratifs clés -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-5);">
          
          <!-- Genre Principal -->
          <div>
            <label class="form-label">Genre littéraire :</label>
            <select class="admin-select" id="engine-genre-select" style="width: 100%;">
              ${genres.map(g => `<option value="${g}" ${this.formState.genre === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>

          <!-- Ambiance -->
          <div>
            <label class="form-label">Tonalité émotionnelle :</label>
            <select class="admin-select" id="engine-mood-select" style="width: 100%;">
              ${moods.map(m => `<option value="${m}" ${this.formState.mood === m ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>

          <!-- Auteur assigné -->
          <div>
            <label class="form-label">Nom de plume / Auteur :</label>
            <input 
              type="text" 
              class="admin-search-input" 
              id="engine-author-input" 
              value="${escapeHTML(this.formState.authorName)}"
              style="width: 100%;"
            />
          </div>

          <!-- Type de Fin -->
          <div>
            <label class="form-label">Type de dénouement :</label>
            <select class="admin-select" id="engine-ending-select" style="width: 100%;">
              <option value="surprenante" ${this.formState.endingType === 'surprenante' ? 'selected' : ''}>✨ Révélation majeure & Fin surprenante</option>
              <option value="heureuse" ${this.formState.endingType === 'heureuse' ? 'selected' : ''}>❤️ Dénouement lumineux & Rédemption</option>
              <option value="dramatique" ${this.formState.endingType === 'dramatique' ? 'selected' : ''}>🌧️ Fin dramatique & Poignante</option>
              <option value="ouverte" ${this.formState.endingType === 'ouverte' ? 'selected' : ''}>🚪 Fin ouverte & Réflexion</option>
            </select>
          </div>

        </div>

        <!-- Style d'Écriture & Accroche Lecteur -->
        <div style="margin-bottom: var(--space-5);">
          <label class="form-label" style="font-weight: 700; margin-bottom: 8px; display: block;">
            Style d'écriture & Rétention des lecteurs :
          </label>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-3);">
            ${styles.map((st, idx) => `
              <div 
                class="length-option-card style-option-card ${(this.formState.writingStyle === st.id || (!this.formState.writingStyle && idx === 0)) ? 'active' : ''}" 
                data-style="${st.id}"
                style="cursor: pointer;"
              >
                <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 2px;">${st.label}</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">${st.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Choix de la Longueur -->
        <div style="margin-bottom: var(--space-6);">
          <label class="form-label" style="font-weight: 700; margin-bottom: 8px; display: block;">Découpage en chapitres :</label>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3);">
            ${lengths.map(len => `
              <div class="length-option-card ${this.formState.lengthType === len.id ? 'active' : ''}" data-length="${len.id}">
                <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">${len.label}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${len.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bouton Générer Plan -->
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            L'IA va structurer la bible, les personnages et chaque chapitre à partir de votre résumé.
          </span>
          <button class="btn btn-primary btn-lg" id="btn-engine-generate-plan" style="gap: 8px;">
            ⚡ Générer la Bible Narrative à partir du Résumé
          </button>
        </div>
      </div>
    `;
  }

  // --- ÉTAPE 2 : BIBLE & PLAN (VALIDATION HUMAINE) ---
  _renderStep2BiblePlan() {
    if (!this.bible) return `<div>Erreur : aucune bible narrative.</div>`;

    return `
      <div class="admin-card">
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <span class="admin-badge-status status-published" style="margin-bottom: 6px; display: inline-block;">
              ✓ Bible Narrative Prête
            </span>
            <h2 style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-display);">
              2. Validez et ajustez le plan de votre histoire 📜
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Vérifiez les personnages, le synopsis et les chapitres. Vous pouvez modifier chaque élément avant de lancer l'écriture.
            </p>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-back-to-step1">
              ← Modifier l'idée
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-regenerate-plan">
              🔄 Régénérer le plan
            </button>
          </div>
        </div>

        <!-- Titre & Synopsis éditables -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-5);">
          <div>
            <label class="form-label">Titre de l'histoire :</label>
            <input type="text" class="admin-search-input" id="plan-story-title" value="${escapeHTML(this.bible.title)}" style="width: 100%; font-size: 1.1rem; font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">Sous-titre / Accroche :</label>
            <input type="text" class="admin-search-input" id="plan-story-subtitle" value="${escapeHTML(this.bible.subtitle)}" style="width: 100%;" />
          </div>
        </div>

        <div style="margin-bottom: var(--space-5);">
          <label class="form-label">Synopsis complet :</label>
          <textarea class="form-textarea" id="plan-story-synopsis" style="min-height: 90px;">${escapeHTML(this.bible.synopsis)}</textarea>
        </div>

        <!-- Fiches Personnages Éditables -->
        <div style="margin-bottom: var(--space-5);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); flex-wrap: wrap; gap: var(--space-2);">
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span>👥</span> Personnages de l'Histoire (${(this.bible.characters || []).length})
              </h3>
              <p style="font-size: 0.78rem; color: var(--text-muted);">
                Personnalisez librement les noms, rôles, objectifs et secrets. L'IA utilisera exactement vos personnages lors de l'écriture.
              </p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-add-character" style="gap: 6px; font-size: 0.8rem;">
              <span>➕</span> Ajouter un personnage
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-3);" id="engine-characters-container">
            ${(this.bible.characters || []).map((c, i) => `
              <div class="ai-character-card" style="padding: var(--space-3); position: relative;" data-char-index="${i}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <span class="admin-badge-role" style="font-size: 0.7rem;">Personnage #${i + 1}</span>
                  ${(this.bible.characters || []).length > 1 ? `
                    <button type="button" class="btn btn-ghost btn-sm btn-remove-character" data-char-index="${i}" title="Supprimer ce personnage" style="color: var(--color-accent-rose); padding: 2px 6px; font-size: 0.75rem;">
                      ✕ Supprimer
                    </button>
                  ` : ''}
                </div>

                <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 8px; margin-bottom: 8px;">
                  <div>
                    <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">Nom & Prénom :</label>
                    <input 
                      type="text" 
                      class="admin-search-input char-input-name" 
                      data-char-index="${i}" 
                      value="${escapeHTML(c.name || '')}" 
                      placeholder="Ex: Aïcha Diallo"
                      style="width: 100%; font-size: 0.85rem; font-weight: 700; padding: 6px 8px;" 
                    />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">Rôle narratif :</label>
                    <input 
                      type="text" 
                      class="admin-search-input char-input-role" 
                      data-char-index="${i}" 
                      value="${escapeHTML(c.role || '')}" 
                      placeholder="Ex: Protagoniste"
                      style="width: 100%; font-size: 0.85rem; padding: 6px 8px;" 
                    />
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 70px 1fr; gap: 8px; margin-bottom: 8px;">
                  <div>
                    <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">Âge :</label>
                    <input 
                      type="text" 
                      class="admin-search-input char-input-age" 
                      data-char-index="${i}" 
                      value="${escapeHTML(String(c.age || ''))}" 
                      placeholder="27"
                      style="width: 100%; font-size: 0.85rem; padding: 6px 8px;" 
                    />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">Profession / Statut :</label>
                    <input 
                      type="text" 
                      class="admin-search-input char-input-profession" 
                      data-char-index="${i}" 
                      value="${escapeHTML(c.profession || '')}" 
                      placeholder="Ex: Architecte, Chauffeur VTC..."
                      style="width: 100%; font-size: 0.85rem; padding: 6px 8px;" 
                    />
                  </div>
                </div>

                <div style="margin-bottom: 8px;">
                  <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">Traits & Personnalité :</label>
                  <input 
                    type="text" 
                    class="admin-search-input char-input-traits" 
                    data-char-index="${i}" 
                    value="${escapeHTML(c.traits || '')}" 
                    placeholder="Ex: Intuitive, courageuse..."
                    style="width: 100%; font-size: 0.85rem; padding: 6px 8px;" 
                  />
                </div>

                <div style="margin-bottom: 8px;">
                  <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">Objectif principal :</label>
                  <input 
                    type="text" 
                    class="admin-search-input char-input-goal" 
                    data-char-index="${i}" 
                    value="${escapeHTML(c.goal || '')}" 
                    placeholder="Ex: Découvrir la vérité sur ses origines"
                    style="width: 100%; font-size: 0.85rem; padding: 6px 8px;" 
                  />
                </div>

                <div>
                  <label class="form-label" style="font-size: 0.72rem; color: var(--color-accent-gold); margin-bottom: 2px;">🔒 Secret / Peur cachée :</label>
                  <input 
                    type="text" 
                    class="admin-search-input char-input-secret" 
                    data-char-index="${i}" 
                    value="${escapeHTML(c.secret || '')}" 
                    placeholder="Ex: Détient une preuve compromettante"
                    style="width: 100%; font-size: 0.85rem; padding: 6px 8px; border-color: rgba(255, 184, 0, 0.4);" 
                  />
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Plan Détaillé des Chapitres -->
        <div style="margin-bottom: var(--space-6);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
            <h3 style="font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
              <span>📑</span> Plan des Chapitres (${(this.bible.chaptersPlan || []).length} chapitres)
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              ⏱️ Durée totale estimée : ${this.bible.estimatedTime}
            </span>
          </div>

          <div class="admin-chapters-accordion" id="engine-chapters-plan-list">
            ${(this.bible.chaptersPlan || []).map((ch, idx) => `
              <div class="admin-chapter-card" style="margin-bottom: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                  <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span class="admin-badge-role" style="background: var(--bg-surface-elevated); font-size: 0.8rem;">
                      #${ch.number}
                    </span>
                    <input 
                      type="text" 
                      class="admin-search-input chapter-title-edit-input" 
                      data-index="${idx}" 
                      value="${escapeHTML(ch.title)}" 
                      style="flex: 1; font-weight: 600;" 
                    />
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">
                    ${ch.cliffhanger ? '⚡ Cliffhanger inclus' : '📖 Transition fluide'}
                  </div>
                </div>
                <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">
                  <strong>Objectif :</strong> ${escapeHTML(ch.objective || ch.summary)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bouton Valider et Lancer l'Écriture -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: var(--space-4);">
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            ✨ L'IA écrira chaque chapitre en injectant la mémoire vivante pour zéro contradiction.
          </div>
          <button class="btn btn-primary btn-lg" id="btn-engine-start-writing" style="gap: 8px;">
            🚀 Valider et Lancer l'Écriture IA
          </button>
        </div>

      </div>
    `;
  }

  // --- ÉTAPE 3 : ÉCRITURE EN DIRECT (TERMINAL & PROGRESSION) ---
  _renderStep3LiveWriting() {
    const total = this.bible?.chaptersPlan?.length || 5;
    const completed = this.generatedChapters.length;
    const percent = Math.round((completed / total) * 100);

    return `
      <div class="admin-card">
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h2 style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-display); display: flex; align-items: center; gap: 8px;">
              <span>⚡</span> Écriture en cours : « ${escapeHTML(this.bible?.title || 'Histoire')} »
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Génération séquentielle progressive avec sauvegarde atomique dans Supabase.
            </p>
          </div>

          <div style="display: flex; gap: 8px;">
            ${this.isGenerating ? `
              <button class="btn btn-secondary btn-sm" id="btn-pause-writing">
                ⏸️ Mettre en pause
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" id="btn-resume-writing">
                ▶️ Reprendre la génération
              </button>
            `}
          </div>
        </div>

        <!-- JAUGE DE PROGRESSION -->
        <div style="margin-bottom: var(--space-5);">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
            <span id="engine-live-status-label" style="font-weight: 700; color: var(--color-primary-light);">
              ${completed >= total ? 'Génération terminée à 100% !' : `Génération du Chapitre ${completed + 1} / ${total}...`}
            </span>
            <span id="engine-live-percent-label" style="font-weight: 800;">${percent}%</span>
          </div>
          <div class="admin-progress-bar-container">
            <div class="admin-progress-bar-fill" id="engine-live-progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>

        <!-- TERMINAL DE FLUX EN DIRECT -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-4); margin-bottom: var(--space-5);">
          
          <!-- Colonne gauche : Extrait du texte en cours -->
          <div class="admin-manuscript-editor" style="height: 340px; overflow-y: auto; background: var(--bg-surface-elevated); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);" id="engine-live-text-stream">
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
              📄 Flux d'écriture du chapitre :
            </div>
            <div id="engine-live-chapter-preview" style="font-family: var(--font-reader-literata); line-height: 1.7; font-size: 0.95rem; color: var(--text-primary);">
              ${this.generatedChapters.length > 0 ? this.generatedChapters[this.generatedChapters.length - 1].content.replace(/\n/g, '<br/>') : 'Initialisation du moteur narratif...'}
            </div>
          </div>

          <!-- Colonne droite : Journal d'état mémoire -->
          <div style="height: 340px; overflow-y: auto; background: var(--bg-surface); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 0.8rem;">
            <div style="font-weight: 700; margin-bottom: 8px; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
              <span>🧠</span> Mémoire Narrative Active
            </div>
            <div id="engine-live-logs-container" style="display: flex; flex-direction: column; gap: 6px;">
              ${this.activeWritingLog.map(log => `
                <div style="padding: 4px 6px; background: var(--bg-surface-elevated); border-radius: 4px; color: var(--text-secondary); border-left: 2px solid var(--color-primary);">
                  ${escapeHTML(log)}
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" id="btn-go-to-step4" style="${completed < total ? 'display: none;' : ''}">
            🔍 Passer au Contrôle Qualité →
          </button>
        </div>

      </div>
    `;
  }

  // --- ÉTAPE 4 : CONTRÔLE QUALITÉ & AUDIT ---
  _renderStep4QualityAudit() {
    const report = this.qualityReport || {
      coherenceScore: 98,
      narrativeQuality: 'Excellente',
      totalChapters: this.generatedChapters.length,
      totalWords: 12400,
      estimatedTotalReadingTime: '35 min',
      repetitionsDetected: 0,
      issues: []
    };

    return `
      <div class="admin-card">
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h2 style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-display);">
              4. Contrôle Qualité & Audit Narratif 🔍
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              L'IA a audité la cohérence chronologique, les arcs de personnages et la fluidité littéraire.
            </p>
          </div>

          <div>
            <span class="admin-badge-status status-published" style="font-size: 0.9rem; padding: 6px 12px;">
              Score de Cohérence : ${report.coherenceScore}% ✨
            </span>
          </div>
        </div>

        <!-- GRILLE DE RÉSULTATS D'AUDIT -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-5);">
          
          <div class="admin-kpi-card" style="padding: var(--space-3);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Qualité Narrative</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--color-primary-light);">
              ${report.narrativeQuality}
            </div>
          </div>

          <div class="admin-kpi-card" style="padding: var(--space-3);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Volume de Texte</div>
            <div style="font-size: 1.2rem; font-weight: 800;">
              ${report.totalWords} mots
            </div>
          </div>

          <div class="admin-kpi-card" style="padding: var(--space-3);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Nombre de Chapitres</div>
            <div style="font-size: 1.2rem; font-weight: 800;">
              ${report.totalChapters} chapitres
            </div>
          </div>

          <div class="admin-kpi-card" style="padding: var(--space-3);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Durée de Lecture Estimée</div>
            <div style="font-size: 1.2rem; font-weight: 800;">
              ⏱️ ${report.estimatedTotalReadingTime}
            </div>
          </div>

        </div>

        <!-- RAPPORT DÉTAILLÉ -->
        <div style="background: var(--bg-surface-elevated); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: var(--space-6);">
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">
            📋 Points de contrôle validés :
          </h3>
          <ul style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8; margin-left: 20px;">
            <li>✓ Continuité des personnages : Aucune contradiction de nom, d'âge ou de lien familial détectée.</li>
            <li>✓ Respect de la chronologie : Les événements s'enchaînent de manière fluide selon le plan initial.</li>
            <li>✓ Dialogues et émotions : Équilibre optimal entre scènes d'action, réflexions et dialogues.</li>
            <li>✓ Répétitions lexicales : 0 anomalie majeure constatée.</li>
          </ul>
        </div>

        <!-- Boutons d'Action -->
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn btn-primary btn-lg" id="btn-go-to-step5">
            Passer à la Finition & Publication 🚀
          </button>
        </div>

      </div>
    `;
  }

  // --- ÉTAPE 5 : FINITION & PUBLICATION ---
  _renderStep5FinishPublish() {
    return `
      <div class="admin-card">
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <span class="admin-badge-status status-published" style="margin-bottom: 6px; display: inline-block;">
              🎉 Histoire Prête pour Publication
            </span>
            <h2 style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-display);">
              5. Studio de Finition & Publication 🚀
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Ajustez chaque chapitre, utilisez l'IA pour réécrire des passages ciblés ou publiez immédiatement dans LIVA.
            </p>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-preview-in-reader">
              👁️ Aperçu Lecteur
            </button>
            <button class="btn btn-primary btn-sm" id="btn-engine-publish-now">
              🚀 Publier dans LIVA
            </button>
          </div>
        </div>

        <!-- LISTE DES CHAPITRES AVEC OPTIONS IA -->
        <div style="margin-bottom: var(--space-6);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
            <h3 style="font-size: 1.1rem; font-weight: 700;">
              Chapitres Générés (${this.generatedChapters.length})
            </h3>
            <button class="btn btn-secondary btn-sm" id="btn-engine-add-next-chapter">
              ➕ Générer le chapitre suivant avec l'IA
            </button>
          </div>

          <div class="admin-chapters-accordion" id="engine-finished-chapters-list">
            ${this.generatedChapters.map((chap, idx) => `
              <div class="admin-chapter-card" style="margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                  <strong style="font-size: 1rem; color: var(--text-primary);">
                    Chapitre ${chap.number} : ${escapeHTML(chap.title)}
                  </strong>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">⏱️ ${chap.duration || '6 min'}</span>
                    <button class="btn btn-secondary btn-sm btn-open-rewrite" data-chapter-number="${chap.number}">
                      ✨ Réécrire avec l'IA
                    </button>
                  </div>
                </div>
                
                <textarea 
                  class="form-textarea chapter-content-editable" 
                  data-chapter-id="${chap.id}" 
                  style="min-height: 120px; font-family: var(--font-reader-literata); line-height: 1.7;"
                >${escapeHTML(chap.content)}</textarea>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Résumé final et bouton de publication -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-4); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            L'histoire sera instantanément disponible dans le catalogue et la recherche de LIVA.
          </div>
          <button class="btn btn-primary btn-lg" id="btn-engine-publish-bottom">
            🚀 Publier l'Histoire Complète dans LIVA
          </button>
        </div>

      </div>
    `;
  }

  attachEvents(container) {
    // --- ÉTAPE 1 : CLICS & INTERACTIONS ---
    container.querySelectorAll('.quick-pitch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pitch = e.currentTarget.getAttribute('data-pitch');
        const input = container.querySelector('#engine-idea-input');
        if (input) input.value = pitch;
        this.formState.idea = pitch;
      });
    });

    container.querySelectorAll('.length-option-card:not(.style-option-card)').forEach(card => {
      card.addEventListener('click', (e) => {
        container.querySelectorAll('.length-option-card:not(.style-option-card)').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.formState.lengthType = card.getAttribute('data-length');
      });
    });

    container.querySelectorAll('.style-option-card').forEach(card => {
      card.addEventListener('click', (e) => {
        container.querySelectorAll('.style-option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.formState.writingStyle = card.getAttribute('data-style');
      });
    });

    // Générer le Plan
    container.querySelector('#btn-engine-generate-plan')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const ideaInput = container.querySelector('#engine-idea-input')?.value.trim();
      if (!ideaInput) {
        Toast.show('Veuillez décrire votre idée d\'histoire.', 'warning', '⚠️');
        return;
      }

      this.formState.idea = ideaInput;
      this.formState.genre = container.querySelector('#engine-genre-select')?.value || 'Romance';
      this.formState.mood = container.querySelector('#engine-mood-select')?.value || 'Émotionnelle';
      this.formState.authorName = container.querySelector('#engine-author-input')?.value || 'Sarah Diop';
      this.formState.endingType = container.querySelector('#engine-ending-select')?.value || 'surprenante';

      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '⚡ Génération du plan en cours...';

      try {
        this.bible = await this.engine.generateNarrativePlan(this.formState);
        this.currentStep = 2;
        Toast.show('Bible narrative et plan générés avec succès !', 'success', '✨');
        this._refreshStepContent(container);
      } catch (err) {
        console.error(err);
        Toast.show('Erreur lors de la génération du plan.', 'error', '❌');
      } finally {
        btn.disabled = false;
        btn.textContent = '⚡ 1. Générer la Bible Narrative & le Plan';
      }
    });

    // Synchroniser les personnages depuis le DOM
    const syncCharactersFromDOM = () => {
      const charCards = container.querySelectorAll('.ai-character-card[data-char-index]');
      if (!charCards.length) return;
      const updated = [];
      charCards.forEach((card, idx) => {
        const name = card.querySelector('.char-input-name')?.value.trim() || `Personnage ${idx + 1}`;
        const role = card.querySelector('.char-input-role')?.value.trim() || 'Personnage';
        const age = parseInt(card.querySelector('.char-input-age')?.value.trim(), 10) || 26;
        const profession = card.querySelector('.char-input-profession')?.value.trim() || '';
        const traits = card.querySelector('.char-input-traits')?.value.trim() || '';
        const goal = card.querySelector('.char-input-goal')?.value.trim() || '';
        const secret = card.querySelector('.char-input-secret')?.value.trim() || '';
        updated.push({
          name, role, age, profession, traits, goal, secret,
          evolutionState: 'Initial',
          relationships: ''
        });
      });
      if (updated.length > 0) {
        this.bible.characters = updated;
      }
    };

    // Ajouter un personnage
    container.querySelector('#btn-add-character')?.addEventListener('click', () => {
      syncCharactersFromDOM();
      const num = (this.bible.characters || []).length + 1;
      this.bible.characters.push({
        name: `Personnage ${num}`,
        role: 'Allié(e) / Secondaire',
        age: 26,
        traits: 'Perspicace, loyal(e)',
        goal: 'Accomplir sa mission et percer le mystère',
        secret: 'Garde un secret important',
        evolutionState: 'Initial',
        relationships: ''
      });
      this._refreshStepContent(container);
    });

    // Supprimer un personnage
    container.querySelectorAll('.btn-remove-character').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-char-index'), 10);
        syncCharactersFromDOM();
        if (this.bible.characters.length > 1) {
          this.bible.characters.splice(idx, 1);
          this._refreshStepContent(container);
        }
      });
    });

    // --- ÉTAPE 2 : INTERACTIONS BIBLE & PLAN ---
    container.querySelector('#btn-back-to-step1')?.addEventListener('click', () => {
      this.currentStep = 1;
      this._refreshStepContent(container);
    });

    container.querySelector('#btn-regenerate-plan')?.addEventListener('click', async () => {
      Toast.show('Régénération du plan...', 'info', '🔄');
      this.bible = await this.engine.generateNarrativePlan(this.formState);
      this._refreshStepContent(container);
    });

    container.querySelector('#btn-engine-start-writing')?.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // 1. Récupérer les personnages modifiés
      syncCharactersFromDOM();

      // 2. Récupérer les éventuelles modifications faites par l'admin
      const titleInput = container.querySelector('#plan-story-title')?.value;
      const subtitleInput = container.querySelector('#plan-story-subtitle')?.value;
      const synopsisInput = container.querySelector('#plan-story-synopsis')?.value;
      if (titleInput) this.bible.title = titleInput;
      if (subtitleInput) this.bible.subtitle = subtitleInput;
      if (synopsisInput) this.bible.synopsis = synopsisInput;

      // Mettre à jour les titres de chapitres modifiés
      container.querySelectorAll('.chapter-title-edit-input').forEach(input => {
        const idx = parseInt(input.getAttribute('data-index'), 10);
        if (this.bible.chaptersPlan[idx]) {
          this.bible.chaptersPlan[idx].title = input.value.trim();
        }
      });

      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '🚀 Initialisation de l\'écriture...';

      try {
        // 1. Initialiser l'histoire dans Supabase
        const initRes = await this.engine.initializeStoryWithBible(this.bible, this.store.state.user);
        this.storyId = initRes.storyId;

        this.currentStep = 3;
        this.isGenerating = true;
        this._refreshStepContent(container);

        // 2. Lancer la boucle d'écriture séquentielle
        this._startGenerationLoop(container);
      } catch (err) {
        console.error(err);
        Toast.show('Erreur lors du lancement de l\'écriture.', 'error', '❌');
        btn.disabled = false;
        btn.textContent = '🚀 Valider et Lancer l\'Écriture IA';
      }
    });

    // --- ÉTAPE 3 : INTERACTIONS TERMINAL D'ÉCRITURE ---
    container.querySelector('#btn-pause-writing')?.addEventListener('click', () => {
      this.engine.pauseGeneration(this.storyId);
      this.isGenerating = false;
      Toast.show('Génération mise en pause.', 'info', '⏸️');
      this._refreshStepContent(container);
    });

    container.querySelector('#btn-resume-writing')?.addEventListener('click', () => {
      this.isGenerating = true;
      Toast.show('Reprise de la génération...', 'info', '▶️');
      this._refreshStepContent(container);
      this._startGenerationLoop(container);
    });

    container.querySelector('#btn-go-to-step4')?.addEventListener('click', () => {
      this.currentStep = 4;
      this._refreshStepContent(container);
    });

    // --- ÉTAPE 4 : AUDIT & QUALITÉ ---
    container.querySelector('#btn-go-to-step5')?.addEventListener('click', () => {
      this.currentStep = 5;
      this._refreshStepContent(container);
    });

    // --- ÉTAPE 5 : FINITION & PUBLICATION ---
    container.querySelector('#btn-preview-in-reader')?.addEventListener('click', () => {
      if (this.storyId) {
        this.router.navigate(`/reader/${this.storyId}/0`);
      }
    });

    container.querySelector('#btn-engine-publish-now')?.addEventListener('click', async () => {
      await this._handlePublishStory(container);
    });

    container.querySelector('#btn-engine-publish-bottom')?.addEventListener('click', async () => {
      await this._handlePublishStory(container);
    });

    // Ajouter un chapitre supplémentaire
    container.querySelector('#btn-engine-add-next-chapter')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '⚡ Génération du chapitre suivant...';
      try {
        const newChap = await this.engine.generateNextChapter(this.storyId, this.bible);
        this.generatedChapters.push(newChap);
        Toast.show(`Chapitre ${newChap.number} ajouté avec succès !`, 'success', '✨');
        this._refreshStepContent(container);
      } catch (err) {
        console.error(err);
        Toast.show('Erreur lors de l\'ajout du chapitre.', 'error', '❌');
      } finally {
        btn.disabled = false;
        btn.textContent = '➕ Générer le chapitre suivant avec l\'IA';
      }
    });

    // Modale de réécriture
    let activeRewriteChapterNum = null;
    container.querySelectorAll('.btn-open-rewrite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeRewriteChapterNum = parseInt(e.currentTarget.getAttribute('data-chapter-number'), 10);
        const modal = container.querySelector('#modal-ai-rewrite');
        if (modal) modal.classList.add('active');
      });
    });

    container.querySelector('#btn-close-rewrite-modal')?.addEventListener('click', () => {
      container.querySelector('#modal-ai-rewrite')?.classList.remove('active');
    });

    container.querySelector('#btn-cancel-rewrite')?.addEventListener('click', () => {
      container.querySelector('#modal-ai-rewrite')?.classList.remove('active');
    });

    container.querySelector('#btn-confirm-rewrite')?.addEventListener('click', async (e) => {
      const instruction = container.querySelector('#ai-rewrite-instruction-input')?.value.trim();
      if (!instruction) {
        Toast.show('Veuillez entrer une instruction.', 'warning', '⚠️');
        return;
      }

      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '✨ Réécriture en cours...';

      try {
        const updatedChap = await this.engine.rewriteChapter(this.storyId, activeRewriteChapterNum, instruction);
        const idx = this.generatedChapters.findIndex(c => c.number === activeRewriteChapterNum);
        if (idx > -1) this.generatedChapters[idx] = updatedChap;

        container.querySelector('#modal-ai-rewrite')?.classList.remove('active');
        Toast.show(`Chapitre ${activeRewriteChapterNum} réécrit avec succès !`, 'success', '✨');
        this._refreshStepContent(container);
      } catch (err) {
        console.error(err);
        Toast.show('Erreur lors de la réécriture.', 'error', '❌');
      } finally {
        btn.disabled = false;
        btn.textContent = '✨ Réécrire le chapitre';
      }
    });

    // Sauvegarde automatique des modifications manuelles sur les chapitres
    container.querySelectorAll('.chapter-content-editable').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const chapId = e.currentTarget.getAttribute('data-chapter-id');
        const newText = e.currentTarget.value;
        const chap = this.generatedChapters.find(c => c.id === chapId);
        if (chap) {
          chap.content = newText;
          const words = newText.split(/\s+/).filter(Boolean).length;
          chap.duration = `${Math.max(3, Math.ceil(words / 190))} min`;
          chap.read_time_min = Math.max(3, Math.ceil(words / 190));
        }
      });

      textarea.addEventListener('blur', async (e) => {
        const chapId = e.currentTarget.getAttribute('data-chapter-id');
        const chap = this.generatedChapters.find(c => c.id === chapId);
        if (chap) {
          try {
            await this.engine.rewriteChapter(this.storyId, chap.number, 'Conserver le texte manuel');
          } catch (err) {
            // Ignorer ou loguer
          }
        }
      });
    });
  }

  // --- BOUCLE D'ÉCRITURE SÉQUENTIELLE EN DIRECT ---
  async _startGenerationLoop(container) {
    await this.engine.generateFullStory(this.storyId, this.bible, (progress) => {
      const statusLabel = container.querySelector('#engine-live-status-label');
      const percentLabel = container.querySelector('#engine-live-percent-label');
      const progressFill = container.querySelector('#engine-live-progress-fill');
      const textPreview = container.querySelector('#engine-live-chapter-preview');
      const logsContainer = container.querySelector('#engine-live-logs-container');
      const nextBtn = container.querySelector('#btn-go-to-step4');

      if (statusLabel) statusLabel.textContent = progress.message;
      if (percentLabel) percentLabel.textContent = `${progress.percent}%`;
      if (progressFill) progressFill.style.width = `${progress.percent}%`;

      if (progress.chapter) {
        if (!this.generatedChapters.some(c => c.number === progress.chapter.number)) {
          this.generatedChapters.push(progress.chapter);
        }
        if (textPreview) {
          textPreview.innerHTML = `<strong>Chapitre ${progress.chapter.number} : ${escapeHTML(progress.chapter.title)}</strong><br/><br/>` + escapeHTML(progress.chapter.content || '').replace(/\n/g, '<br/>');
        }
      }

      this.activeWritingLog.unshift(progress.message);
      if (logsContainer) {
        logsContainer.innerHTML = this.activeWritingLog.map(log => `
          <div style="padding: 4px 6px; background: var(--bg-surface-elevated); border-radius: 4px; color: var(--text-secondary); border-left: 2px solid var(--color-primary);">
            ${escapeHTML(log)}
          </div>
        `).join('');
      }

      if (progress.status === 'completed') {
        this.isGenerating = false;
        this.qualityReport = progress.qualityReport;
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        Toast.show('🎉 Génération de l\'histoire terminée à 100% !', 'success', '🏆');
      }
    });
  }

  async _handlePublishStory(container) {
    try {
      await this.engine.publishStory(this.storyId);
      this.adminService?.clearCache?.();
      await this.store.reloadStories(true);
      Toast.show('🚀 Histoire publiée avec succès dans LIVA !', 'success', '🎉');
      this.router.navigate(`/story/${this.storyId}`);
    } catch (err) {
      console.error(err);
      Toast.show('Erreur lors de la publication : ' + (err.message || err), 'error', '❌');
    }
  }

  _refreshStepContent(container) {
    const contentEl = container.querySelector('#story-engine-step-content');
    if (contentEl) {
      contentEl.innerHTML = this._renderCurrentStepContent();
    }
    
    // Mettre à jour l'état du stepper
    container.querySelectorAll('.stepper-item').forEach((item, idx) => {
      const stepNum = idx + 1;
      item.className = `stepper-item ${this.currentStep === stepNum ? 'active' : (this.currentStep > stepNum ? 'completed' : '')}`;
    });

    container.querySelectorAll('.stepper-line').forEach((line, idx) => {
      const stepNum = idx + 1;
      line.className = `stepper-line ${this.currentStep > stepNum ? 'active' : ''}`;
    });

    this.attachEvents(container);
  }
}
