// LIVA - Parcours Onboarding Interactif en 4 étapes
import { GENRES_DATA } from '../data/genres.js';
import { AUTHORS_DATA } from '../data/authors.js';
import { Toast } from '../components/Toast.js';

export class OnboardingView {
  constructor(store, onCompleteCallback) {
    this.store = store;
    this.onComplete = onCompleteCallback;
    this.currentStep = 1;
    this.selectedGenres = ['romance', 'african', 'thriller'];
    this.selectedAuthors = ['sarah-diop', 'amadou-kante'];
  }

  render() {
    return `
      <div class="modal-overlay active" id="modal-onboarding">
        <div class="modal-dialog" style="max-width: 540px;">
          
          <div class="modal-header" style="justify-content: space-between;">
            <span class="brand-logo-text" style="font-size: 1.4rem;">LIVA</span>
            <div style="display: flex; gap: 6px;">
              <span class="step-dot ${this.currentStep === 1 ? 'active' : ''}"></span>
              <span class="step-dot ${this.currentStep === 2 ? 'active' : ''}"></span>
              <span class="step-dot ${this.currentStep === 3 ? 'active' : ''}"></span>
              <span class="step-dot ${this.currentStep === 4 ? 'active' : ''}"></span>
            </div>
          </div>

          <div class="modal-body" id="onboarding-step-body">
            ${this.renderStepContent(this.currentStep)}
          </div>

          <div class="modal-footer" style="justify-content: space-between;">
            <button class="btn btn-ghost btn-sm" id="btn-skip-onboarding">Passer</button>
            <button class="btn btn-primary" id="btn-next-onboarding-step">
              ${this.currentStep === 4 ? 'Commencer ✨' : 'Continuer →'}
            </button>
          </div>

        </div>
      </div>
    `;
  }

  renderStepContent(step) {
    if (step === 1) {
      return `
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-4) 0;">
          <div style="font-size: 3.5rem; animation: floatBadge 3s ease-in-out infinite;">✨</div>
          <h2 style="font-size: 1.8rem; font-weight: 900; line-height: 1.2;">Bienvenue sur Liva</h2>
          <p style="font-size: 1.05rem; color: var(--color-primary-light); font-weight: 600; font-style: italic;">
            « Des histoires. Des émotions. Des mondes à découvrir. »
          </p>
          <p style="font-size: 0.92rem; color: var(--text-secondary); max-width: 420px; line-height: 1.6;">
            Plongez dans des récits gratuits, vibrants et captivants. Personnalisons ensemble votre univers de lecture en quelques secondes.
          </p>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <h2 style="font-size: 1.4rem; font-weight: 800;">Qu'aimez-vous lire ? 📖</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Sélectionnez au moins 2 genres pour personnaliser votre flux d'accueil.</p>
          
          <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); max-height: 280px; overflow-y: auto;">
            ${GENRES_DATA.map(g => {
              const isSel = this.selectedGenres.includes(g.id);
              return `
                <button class="genre-chip ${isSel ? 'active' : ''} onb-genre-chip" data-genre-id="${g.id}">
                  <span>${g.icon}</span>
                  <span>${g.name}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (step === 3) {
      return `
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <h2 style="font-size: 1.4rem; font-weight: 800;">Suivez vos premiers auteurs ✍️</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Soyez notifié dès la sortie de nouveaux chapitres.</p>

          <div style="display: flex; flex-direction: column; gap: var(--space-2); max-height: 280px; overflow-y: auto;">
            ${AUTHORS_DATA.slice(0, 5).map(a => {
              const isSel = this.selectedAuthors.includes(a.id);
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                  <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <img src="${a.avatar}" alt="${a.name}" class="avatar avatar-sm" />
                    <div>
                      <div style="font-size: 0.9rem; font-weight: 700;">${a.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${a.genres.join(', ')}</div>
                    </div>
                  </div>
                  <button class="btn btn-sm ${isSel ? 'btn-primary' : 'btn-outline'} onb-author-btn" data-author-id="${a.id}">
                    ${isSel ? '✓ Suivi' : '+ Suivre'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (step === 4) {
      return `
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-4) 0;">
          <div style="font-size: 3.5rem;">🚀</div>
          <h2 style="font-size: 1.6rem; font-weight: 900;">Votre univers est prêt !</h2>
          <p style="font-size: 0.92rem; color: var(--text-secondary); max-width: 400px; line-height: 1.6;">
            Vos recommandations personnalisées ont été générées. Vous pouvez commencer à lire dès maintenant.
          </p>
        </div>
      `;
    }

    return '';
  }

  attachEvents(modalEl) {
    const nextBtn = modalEl.querySelector('#btn-next-onboarding-step');
    const skipBtn = modalEl.querySelector('#btn-skip-onboarding');
    const bodyEl = modalEl.querySelector('#onboarding-step-body');

    nextBtn?.addEventListener('click', () => {
      if (this.currentStep < 4) {
        this.currentStep += 1;
        bodyEl.innerHTML = this.renderStepContent(this.currentStep);
        nextBtn.textContent = this.currentStep === 4 ? 'Commencer ✨' : 'Continuer →';
        this.bindStepItems(modalEl);
      } else {
        this.finish(modalEl);
      }
    });

    skipBtn?.addEventListener('click', () => {
      this.finish(modalEl);
    });

    this.bindStepItems(modalEl);
  }

  bindStepItems(modalEl) {
    // Genres selection
    modalEl.querySelectorAll('.onb-genre-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const id = chip.getAttribute('data-genre-id');
        if (this.selectedGenres.includes(id)) {
          this.selectedGenres = this.selectedGenres.filter(g => g !== id);
          chip.classList.remove('active');
        } else {
          this.selectedGenres.push(id);
          chip.classList.add('active');
        }
      });
    });

    // Authors selection
    modalEl.querySelectorAll('.onb-author-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-author-id');
        if (this.selectedAuthors.includes(id)) {
          this.selectedAuthors = this.selectedAuthors.filter(a => a !== id);
          btn.className = 'btn btn-sm btn-outline onb-author-btn';
          btn.textContent = '+ Suivre';
        } else {
          this.selectedAuthors.push(id);
          btn.className = 'btn btn-sm btn-primary onb-author-btn';
          btn.textContent = '✓ Suivi';
        }
      });
    });
  }

  finish(modalEl) {
    this.store.completeOnboarding({
      genres: this.selectedGenres,
      authors: this.selectedAuthors
    });
    modalEl.classList.remove('active');
    Toast.show('Bienvenue dans votre nouvel univers LIVA !', 'success', '✨');
    if (this.onComplete) this.onComplete();
  }
}
