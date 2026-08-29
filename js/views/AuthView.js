// LIVA - Vue d'Authentification (Connexion, Inscription & Récupération de mot de passe)
import { Toast } from '../components/Toast.js';
import { Modal } from '../components/Modal.js';
import { GENRES_DATA } from '../data/genres.js';
import { SupabaseService } from '../services/supabaseClient.js';
import { escapeHTML } from '../utils/sanitize.js';

export class AuthView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.activeTab = 'login'; // 'login' | 'register'
    this.selectedRegisterGenres = ['romance', 'african', 'thriller'];
    this.failedAttempts = 0;
    this.lockoutUntil = 0;
  }

  render(params = {}) {
    const isResetMode = params.mode === 'reset';
    const resetEmail = params.email ? decodeURIComponent(params.email) : '';

    if (params.mode === 'register') {
      this.activeTab = 'register';
    } else if (params.mode === 'login') {
      this.activeTab = 'login';
    }

    return `
      <div class="auth-view animate-fade-in">
        <!-- Effets d'Ambiance Flottants Lumineux -->
        <div class="auth-ambient-orb-1"></div>
        <div class="auth-ambient-orb-2"></div>

        <!-- Bouton Retour Accueil -->
        <div class="auth-top-nav">
          <button class="auth-back-btn" data-navigate="/">
            <span>←</span>
            <span>Retour à l'accueil</span>
          </button>
        </div>

        <div class="auth-card-container">

          <!-- 1. En-tête -->
          <div class="auth-header">
            <div class="auth-brand" data-navigate="/">
              <span class="brand-logo-text" style="font-size: 1.8rem;">LIVA</span>
              <span class="brand-badge-dot"></span>
            </div>
            <h1 class="auth-title" id="auth-main-title">
              ${isResetMode 
                ? 'Nouveau mot de passe 🔒' 
                : this.activeTab === 'login' 
                  ? 'Bon retour parmi nous 👋' 
                  : 'Rejoignez l\'aventure LIVA ✨'}
            </h1>
            <p class="auth-subtitle" id="auth-main-subtitle">
              ${isResetMode 
                ? 'Définissez votre nouveau mot de passe sécurisé pour accéder à votre compte.' 
                : this.activeTab === 'login' 
                  ? 'Connectez-vous pour retrouver vos lectures et vos auteurs favoris.' 
                  : 'Créez votre compte gratuit et explorez des milliers de récits.'}
            </p>
          </div>

          ${!isResetMode ? `
            <!-- 2. Commutateur d'onglets (Connexion / Inscription) -->
            <div class="auth-tabs-switcher">
              <button class="auth-tab-btn ${this.activeTab === 'login' ? 'active' : ''}" id="tab-btn-login" data-tab="login">
                <span>🔐</span>
                <span>Connexion</span>
              </button>
              <button class="auth-tab-btn ${this.activeTab === 'register' ? 'active' : ''}" id="tab-btn-register" data-tab="register">
                <span>✍️</span>
                <span>Inscription</span>
              </button>
            </div>
          ` : ''}

          <!-- 3. Formulaire de Connexion -->
          <form class="auth-form ${this.activeTab === 'login' ? '' : 'hidden'}" id="form-login" onsubmit="return false;">
            <div class="form-group">
              <label class="form-label" for="login-identifier">Email ou Identifiant</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">👤</span>
                <input 
                  type="text" 
                  id="login-identifier" 
                  class="auth-input" 
                  placeholder="Ex: nom@exemple.com ou @pseudo" 
                  required 
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Mot de passe</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">🔒</span>
                <input 
                  type="password" 
                  id="login-password" 
                  class="auth-input" 
                  placeholder="Entrez votre mot de passe..." 
                  required 
                  autocomplete="current-password"
                />
                <button type="button" class="auth-toggle-pwd-btn" data-target="login-password" title="Afficher/Masquer">
                  👁️
                </button>
              </div>
            </div>

            <div class="auth-options-row">
              <label class="auth-checkbox-label">
                <input type="checkbox" id="login-remember" checked />
                <span>Se souvenir de moi</span>
              </label>
              <a href="javascript:void(0)" class="auth-forgot-link" id="btn-forgot-password">Mot de passe oublié ?</a>
            </div>

            <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-login" style="width: 100%; margin-top: var(--space-1);">
              Se connecter 🚀
            </button>
          </form>

          <!-- 4. Formulaire d'Inscription (Souscription) -->
          <form class="auth-form ${this.activeTab === 'register' ? '' : 'hidden'}" id="form-register" onsubmit="return false;">
            <div class="form-group">
              <label class="form-label" for="reg-fullname">Nom complet ou Nom de plume *</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">👤</span>
                <input 
                  type="text" 
                  id="reg-fullname" 
                  class="auth-input" 
                  placeholder="Ex: Aminata Diallo" 
                  required 
                  autocomplete="name"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-email">Adresse Email *</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">✉️</span>
                <input 
                  type="email" 
                  id="reg-email" 
                  class="auth-input" 
                  placeholder="aminata@exemple.com" 
                  required 
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-password">Mot de passe *</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">🔒</span>
                <input 
                  type="password" 
                  id="reg-password" 
                  class="auth-input" 
                  placeholder="Au moins 6 caractères" 
                  required 
                  autocomplete="new-password"
                />
                <button type="button" class="auth-toggle-pwd-btn" data-target="reg-password" title="Afficher/Masquer">
                  👁️
                </button>
              </div>

              <!-- Indicateur de force de mot de passe -->
              <div class="pwd-strength-wrap" id="pwd-strength-container" style="display: none;">
                <div class="pwd-strength-bar">
                  <div class="pwd-strength-segment" id="pwd-seg-1"></div>
                  <div class="pwd-strength-segment" id="pwd-seg-2"></div>
                  <div class="pwd-strength-segment" id="pwd-seg-3"></div>
                </div>
                <span class="pwd-strength-text" id="pwd-strength-text">Sécurité : Faible</span>
              </div>
            </div>

            <!-- Sélection des Genres Favoris -->
            <div class="auth-genre-selector">
              <label class="form-label">Vos genres préférés (choisissez-en au moins 1) :</label>
              <div class="auth-genre-chips" id="reg-genre-chips">
                ${GENRES_DATA.map(g => {
                  const isSelected = this.selectedRegisterGenres.includes(g.id);
                  return `
                    <button type="button" class="auth-genre-chip ${isSelected ? 'selected' : ''}" data-genre-id="${g.id}">
                      <span>${g.icon}</span>
                      <span>${g.name}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Case à cocher CGU -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
              <label class="auth-checkbox-label">
                <input type="checkbox" id="reg-terms" checked required />
                <span style="font-size: 0.8rem;">J'accepte les <a href="javascript:void(0)" class="auth-forgot-link">Conditions d'Utilisation</a> et la <a href="javascript:void(0)" class="auth-forgot-link">Confidentialité</a> de LIVA</span>
              </label>
              <label class="auth-checkbox-label">
                <input type="checkbox" id="reg-newsletter" checked />
                <span style="font-size: 0.8rem;">Recevoir la sélection des meilleures histoires de la semaine 📖</span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-register" style="width: 100%; margin-top: var(--space-1);">
              Créer mon compte LIVA ✨
            </button>
          </form>

          <!-- 6. Formulaire Définition Nouveau Mot de Passe (Mode Reset) -->
          ${isResetMode ? `
            <form class="auth-form" id="form-reset-password" onsubmit="return false;">
              <div class="form-group">
                <label class="form-label" for="reset-email">Adresse Email associée</label>
                <div class="auth-input-wrap">
                  <span class="auth-input-icon">✉️</span>
                  <input 
                    type="email" 
                    id="reset-email" 
                    class="auth-input" 
                    value="${escapeHTML(resetEmail)}" 
                    placeholder="votre.email@domaine.com" 
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="reset-new-password">Nouveau mot de passe</label>
                <div class="auth-input-wrap">
                  <span class="auth-input-icon">🔒</span>
                  <input 
                    type="password" 
                    id="reset-new-password" 
                    class="auth-input" 
                    placeholder="Au moins 6 caractères" 
                    required 
                    autocomplete="new-password"
                  />
                  <button type="button" class="auth-toggle-pwd-btn" data-target="reset-new-password" title="Afficher/Masquer">
                    👁️
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="reset-confirm-password">Confirmer le mot de passe</label>
                <div class="auth-input-wrap">
                  <span class="auth-input-icon">🔒</span>
                  <input 
                    type="password" 
                    id="reset-confirm-password" 
                    class="auth-input" 
                    placeholder="Retapez le mot de passe" 
                    required 
                    autocomplete="new-password"
                  />
                  <button type="button" class="auth-toggle-pwd-btn" data-target="reset-confirm-password" title="Afficher/Masquer">
                    👁️
                  </button>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-reset-password" style="width: 100%; margin-top: var(--space-2);">
                Enregistrer mon nouveau mot de passe 🚀
              </button>

              <div style="text-align: center; margin-top: var(--space-4);">
                <a href="#/auth?mode=login" class="auth-forgot-link" style="font-size: 0.9rem;">
                  ← Retour à la connexion
                </a>
              </div>
            </form>
          ` : ''}

          ${!isResetMode ? `
            <!-- 5. Séparateur & Connexion Sociale (Google OAuth Réel) -->
            <div class="auth-divider">Ou continuer avec</div>

            <div class="auth-social-row">
              <button type="button" class="auth-social-btn auth-google-btn" id="btn-social-google">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continuer avec Google</span>
              </button>
            </div>
          ` : ''}

        </div>

        <!-- Modal Réinitialisation de Mot de Passe -->
        <div class="modal-overlay" id="modal-forgot-password">
          <div class="modal-card" style="max-width: 440px; padding: var(--space-6); background: rgba(18, 14, 28, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-2xl); backdrop-filter: blur(20px);">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
              <h2 style="font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                <span>🔑</span> Mot de passe oublié
              </h2>
              <button class="btn btn-ghost btn-sm" id="btn-close-forgot-modal" style="font-size: 1.1rem; padding: 4px 8px;">✕</button>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.9rem; margin-bottom: var(--space-4); line-height: 1.5;">
              Entrez l'adresse email associée à votre compte LIVA. Supabase vous transmettra un lien sécurisé pour définir un nouveau mot de passe.
            </p>
            <div class="form-group" style="margin-bottom: var(--space-4);">
              <label class="form-label" for="forgot-email-input">Votre adresse email</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">✉️</span>
                <input 
                  type="email" 
                  id="forgot-email-input" 
                  class="auth-input" 
                  placeholder="Ex: nom@exemple.com" 
                  required 
                />
              </div>
            </div>
            <button class="btn btn-primary btn-lg" id="btn-submit-forgot-email" style="width: 100%; justify-content: center; gap: 8px;">
              <span>Envoyer le lien de réinitialisation</span> <span>✉️</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  attachEvents(container) {
    this.container = container;

    // Tabs switching
    const tabLogin = container.querySelector('#tab-btn-login');
    const tabRegister = container.querySelector('#tab-btn-register');
    const formLogin = container.querySelector('#form-login');
    const formRegister = container.querySelector('#form-register');
    const titleEl = container.querySelector('#auth-main-title');
    const subtitleEl = container.querySelector('#auth-main-subtitle');

    const switchTab = (tab) => {
      this.activeTab = tab;
      if (tab === 'login') {
        tabLogin?.classList.add('active');
        tabRegister?.classList.remove('active');
        formLogin?.classList.remove('hidden');
        formRegister?.classList.add('hidden');
        if (titleEl) titleEl.textContent = 'Bon retour parmi nous 👋';
        if (subtitleEl) subtitleEl.textContent = 'Connectez-vous pour retrouver vos lectures et vos auteurs favoris.';
      } else {
        tabRegister?.classList.add('active');
        tabLogin?.classList.remove('active');
        formRegister?.classList.remove('hidden');
        formLogin?.classList.add('hidden');
        if (titleEl) titleEl.textContent = 'Rejoignez l\'aventure LIVA ✨';
        if (subtitleEl) subtitleEl.textContent = 'Créez votre compte gratuit et explorez des milliers de récits.';
      }
    };

    tabLogin?.addEventListener('click', () => switchTab('login'));
    tabRegister?.addEventListener('click', () => switchTab('register'));

    // Toggle Password Visibility buttons
    container.querySelectorAll('.auth-toggle-pwd-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = container.querySelector(`#${targetId}`);
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.textContent = isPassword ? '🙈' : '👁️';
        }
      });
    });

    // Password strength calculation on register password input
    const pwdInput = container.querySelector('#reg-password');
    const strengthContainer = container.querySelector('#pwd-strength-container');
    const seg1 = container.querySelector('#pwd-seg-1');
    const seg2 = container.querySelector('#pwd-seg-2');
    const seg3 = container.querySelector('#pwd-seg-3');
    const strengthText = container.querySelector('#pwd-strength-text');

    pwdInput?.addEventListener('input', (e) => {
      const val = e.target.value;
      if (!val) {
        if (strengthContainer) strengthContainer.style.display = 'none';
        return;
      }

      if (strengthContainer) strengthContainer.style.display = 'flex';

      let score = 0;
      if (val.length >= 6) score += 1;
      if (val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val)) score += 1;
      if (val.length >= 10 && /[^A-Za-z0-9]/.test(val)) score += 1;

      if (score === 1) {
        if (seg1) seg1.style.backgroundColor = 'var(--color-accent-rose)';
        if (seg2) seg2.style.backgroundColor = 'var(--border-subtle)';
        if (seg3) seg3.style.backgroundColor = 'var(--border-subtle)';
        if (strengthText) {
          strengthText.textContent = 'Sécurité : Faible 🔴';
          strengthText.style.color = 'var(--color-accent-rose)';
        }
      } else if (score === 2) {
        if (seg1) seg1.style.backgroundColor = 'var(--color-accent-gold)';
        if (seg2) seg2.style.backgroundColor = 'var(--color-accent-gold)';
        if (seg3) seg3.style.backgroundColor = 'var(--border-subtle)';
        if (strengthText) {
          strengthText.textContent = 'Sécurité : Moyen 🟡';
          strengthText.style.color = 'var(--color-accent-gold)';
        }
      } else {
        if (seg1) seg1.style.backgroundColor = 'var(--color-accent-emerald)';
        if (seg2) seg2.style.backgroundColor = 'var(--color-accent-emerald)';
        if (seg3) seg3.style.backgroundColor = 'var(--color-accent-emerald)';
        if (strengthText) {
          strengthText.textContent = 'Sécurité : Fort 🟢';
          strengthText.style.color = 'var(--color-accent-emerald)';
        }
      }
    });

    // Register genre chips toggle
    container.querySelectorAll('.auth-genre-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.getAttribute('data-genre-id');
        if (this.selectedRegisterGenres.includes(id)) {
          this.selectedRegisterGenres = this.selectedRegisterGenres.filter(g => g !== id);
          chip.classList.remove('selected');
        } else {
          this.selectedRegisterGenres.push(id);
          chip.classList.add('selected');
        }
      });
    });

    // Submit Login
    const submitLoginBtn = container.querySelector('#btn-submit-login');
    submitLoginBtn?.addEventListener('click', () => this.handleLogin());

    // Submit Register
    const submitRegisterBtn = container.querySelector('#btn-submit-register');
    submitRegisterBtn?.addEventListener('click', () => this.handleRegister());

    // Forgot Password Trigger & Modal
    const forgotBtn = container.querySelector('#btn-forgot-password');
    const forgotModalCloseBtn = container.querySelector('#btn-close-forgot-modal');
    const submitForgotEmailBtn = container.querySelector('#btn-submit-forgot-email');

    forgotBtn?.addEventListener('click', () => {
      const loginIdentifier = container.querySelector('#login-identifier')?.value.trim() || '';
      const forgotEmailInput = container.querySelector('#forgot-email-input');
      if (forgotEmailInput && loginIdentifier.includes('@')) {
        forgotEmailInput.value = loginIdentifier;
      }
      Modal.open('modal-forgot-password');
    });

    forgotModalCloseBtn?.addEventListener('click', () => {
      Modal.close('modal-forgot-password');
    });

    submitForgotEmailBtn?.addEventListener('click', () => this.handleForgotPassword());

    // Submit Reset Password (mode === 'reset')
    const submitResetBtn = container.querySelector('#btn-submit-reset-password');
    submitResetBtn?.addEventListener('click', () => this.handleResetPassword());

    // Social login (Google OAuth Supabase)
    container.querySelector('#btn-social-google')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const btn = container.querySelector('#btn-social-google');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span style="font-size: 0.9rem;">⏳ Connexion à Google...</span>`;
      }
      try {
        await SupabaseService.signInWithGoogle();
      } catch (err) {
        console.error('Erreur Google OAuth:', err);
        Toast.show(err.message || 'Erreur lors de la connexion Google.', 'error', '❌');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continuer avec Google</span>
          `;
        }
      }
    });

    // Brand logo & Back navigation
    container.querySelector('.auth-brand')?.addEventListener('click', () => {
      this.router.navigate('/');
    });
    container.querySelector('.auth-back-btn')?.addEventListener('click', () => {
      this.router.navigate('/');
    });
  }

  async handleLogin() {
    // Brute-force lockout check
    if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
      const remainingSec = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
      Toast.show(`Compte temporairement verrouillé. Veuillez patienter ${remainingSec}s.`, 'error', '⏳', 4000);
      return;
    }

    const identInput = this.container.querySelector('#login-identifier');
    const pwdInput = this.container.querySelector('#login-password');

    const identifier = identInput?.value.trim();
    const password = pwdInput?.value.trim();

    if (!identifier || !password) {
      Toast.show('Veuillez renseigner votre identifiant et votre mot de passe.', 'warning', '⚠️');
      return;
    }

    const submitBtn = this.container.querySelector('#btn-submit-login');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connexion en cours...';
    }

    const result = await this.store.login(identifier, password);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter ✨';
    }

    if (result && result.success) {
      this.failedAttempts = 0;
      this.lockoutUntil = 0;
      const user = this.store.state.user;
      Toast.show(`Heureux de vous revoir, ${user.name} ! ✨`, 'success', '🎉');
      this.router.syncUserUI();
      this.router.navigate('/profile');
    } else {
      this.failedAttempts += 1;
      if (this.failedAttempts >= 5) {
        this.lockoutUntil = Date.now() + 30000; // 30s lockout
        this.failedAttempts = 0;
        Toast.show('5 tentatives infructueuses. Accès temporairement bloqué pendant 30 secondes.', 'error', '🔒', 4500);
      } else {
        const triesLeft = 5 - this.failedAttempts;
        Toast.show(result?.error || `Identifiant ou mot de passe incorrect (${triesLeft} tentative(s) restante(s)).`, 'error', '❌');
      }
    }
  }

  async handleRegister() {
    const nameInput = this.container.querySelector('#reg-fullname');
    const emailInput = this.container.querySelector('#reg-email');
    const pwdInput = this.container.querySelector('#reg-password');
    const termsCheck = this.container.querySelector('#reg-terms');

    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = pwdInput?.value.trim();

    if (!name) {
      Toast.show('Veuillez entrer votre nom complet ou nom de plume.', 'warning', '⚠️');
      nameInput?.focus();
      return;
    }

    if (!email || !email.includes('@')) {
      Toast.show('Veuillez renseigner une adresse email valide.', 'warning', '⚠️');
      emailInput?.focus();
      return;
    }

    if (!password || password.length < 6) {
      Toast.show('Le mot de passe doit contenir au moins 6 caractères.', 'warning', '⚠️');
      pwdInput?.focus();
      return;
    }

    if (!termsCheck?.checked) {
      Toast.show('Veuillez accepter les conditions d\'utilisation pour continuer.', 'warning', '⚠️');
      return;
    }

    const submitBtn = this.container.querySelector('#btn-submit-register');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Création du compte...';
    }

    const username = '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);

    const result = await this.store.register({
      name,
      username,
      email,
      password,
      favoriteGenres: this.selectedRegisterGenres.length > 0 ? this.selectedRegisterGenres : ['romance', 'african']
    });

    if (result && result.success) {
      Toast.show(`Bienvenue dans la communauté Liva, ${name} ! 🌟`, 'success', '🚀', 3500);
      this.router.syncUserUI();
      this.router.navigate('/profile');
    } else {
      const errMsg = result?.error || 'Erreur lors de la création du compte.';
      Toast.show(errMsg, 'error', '⚠️', 4500);
      if (errMsg.includes('existe déjà')) {
        setTimeout(() => {
          this.switchTab('login');
          const loginIdent = this.container.querySelector('#login-identifier');
          if (loginIdent) {
            loginIdent.value = email;
            this.container.querySelector('#login-password')?.focus();
          }
        }, 1200);
      }
    }
  }

  async handleForgotPassword() {
    const emailInput = this.container.querySelector('#forgot-email-input');
    const submitBtn = this.container.querySelector('#btn-submit-forgot-email');
    const email = emailInput?.value.trim();

    if (!email || !email.includes('@')) {
      Toast.show('Veuillez renseigner une adresse email valide.', 'warning', '⚠️');
      emailInput?.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Envoi en cours...</span> <span style="animation: spin 1s linear infinite;">⏳</span>';
    }

    try {
      await SupabaseService.resetPassword(email);
      Modal.close('modal-forgot-password');
      Toast.show(`Un email de réinitialisation sécurisé a été envoyé à ${email} ! Vérifiez votre boîte de réception et vos spams. ✉️`, 'success', '🔑', 7000);
    } catch (err) {
      Toast.show(err.message || 'Impossible d\'envoyer le mail de réinitialisation.', 'error', '⚠️', 5000);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Envoyer le lien de réinitialisation</span> <span>✉️</span>';
      }
    }
  }

  async handleResetPassword() {
    const emailInput = this.container.querySelector('#reset-email');
    const newPwdInput = this.container.querySelector('#reset-new-password');
    const confirmPwdInput = this.container.querySelector('#reset-confirm-password');
    const submitBtn = this.container.querySelector('#btn-submit-reset-password');

    const email = emailInput?.value.trim();
    const newPassword = newPwdInput?.value.trim();
    const confirmPassword = confirmPwdInput?.value.trim();

    if (!email || !email.includes('@')) {
      Toast.show('Adresse email invalide.', 'warning', '⚠️');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Toast.show('Le nouveau mot de passe doit contenir au moins 6 caractères.', 'warning', '⚠️');
      newPwdInput?.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show('Les deux mots de passe ne correspondent pas.', 'error', '❌');
      confirmPwdInput?.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mise à jour en cours...';
    }

    try {
      await SupabaseService.updateUserPassword(email, newPassword);
      Toast.show('Votre mot de passe a été mis à jour avec succès ! Vous pouvez maintenant vous connecter. 🎉', 'success', '✨', 6000);
      this.router.navigate('/auth?mode=login');
    } catch (err) {
      Toast.show(err.message || 'Erreur lors de la mise à jour du mot de passe.', 'error', '⚠️', 5000);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer mon nouveau mot de passe 🚀';
      }
    }
  }
}
