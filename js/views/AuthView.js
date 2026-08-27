// LIVA - Vue d'Authentification (Connexion & Inscription)
import { Toast } from '../components/Toast.js';
import { GENRES_DATA } from '../data/genres.js';

export class AuthView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.activeTab = 'login'; // 'login' | 'register'
    this.selectedRegisterGenres = ['romance', 'african', 'thriller'];
  }

  render(params = {}) {
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
              ${this.activeTab === 'login' ? 'Bon retour parmi nous 👋' : 'Rejoignez l\'aventure LIVA ✨'}
            </h1>
            <p class="auth-subtitle" id="auth-main-subtitle">
              ${this.activeTab === 'login' 
                ? 'Connectez-vous pour retrouver vos lectures et vos auteurs favoris.' 
                : 'Créez votre compte gratuit et explorez des milliers de récits.'}
            </p>
          </div>

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
                  placeholder="nom@exemple.com ou @pseudo" 
                  value="alex@liva.com"
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
                  placeholder="••••••••••••" 
                  value="liva2026"
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

            <!-- Bouton Démo Rapide -->
            <button type="button" class="auth-demo-btn" id="btn-quick-demo-login">
              <span>⚡</span>
              <span>Connexion en 1 clic (Compte Démo Alexandre Sow)</span>
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

          <!-- 5. Séparateur & Connexion Sociale -->
          <div class="auth-divider">Ou continuer avec</div>

          <div class="auth-social-row">
            <button type="button" class="auth-social-btn" id="btn-social-google">
              <span style="font-size: 1.1rem;">🌐</span>
              <span>Google</span>
            </button>
            <button type="button" class="auth-social-btn" id="btn-social-apple">
              <span style="font-size: 1.1rem;">🍏</span>
              <span>Apple</span>
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

    // 1-Click Demo Login
    const demoLoginBtn = container.querySelector('#btn-quick-demo-login');
    demoLoginBtn?.addEventListener('click', () => {
      this.store.login('alex@liva.com', 'liva2026');
      Toast.show('Bienvenue Alexandre ! Connexion réussie.', 'success', '👋');
      this.router.navigate('/profile');
    });

    // Submit Register
    const submitRegisterBtn = container.querySelector('#btn-submit-register');
    submitRegisterBtn?.addEventListener('click', () => this.handleRegister());

    // Forgot Password
    const forgotBtn = container.querySelector('#btn-forgot-password');
    forgotBtn?.addEventListener('click', () => {
      const email = container.querySelector('#login-identifier')?.value.trim() || 'votre adresse email';
      Toast.show(`Un lien de réinitialisation a été envoyé à ${email} ✉️`, 'info', '🔑', 3500);
    });

    // Social buttons
    container.querySelector('#btn-social-google')?.addEventListener('click', () => {
      this.store.login('google.user@liva.com', 'oauth');
      Toast.show('Connexion réussie avec Google !', 'success', '🌐');
      this.router.navigate('/profile');
    });

    container.querySelector('#btn-social-apple')?.addEventListener('click', () => {
      this.store.login('apple.user@liva.com', 'oauth');
      Toast.show('Connexion réussie avec Apple !', 'success', '🍏');
      this.router.navigate('/profile');
    });

    // Brand logo & Back navigation
    container.querySelector('.auth-brand')?.addEventListener('click', () => {
      this.router.navigate('/');
    });
    container.querySelector('.auth-back-btn')?.addEventListener('click', () => {
      this.router.navigate('/');
    });
  }

  handleLogin() {
    const identInput = this.container.querySelector('#login-identifier');
    const pwdInput = this.container.querySelector('#login-password');

    const identifier = identInput?.value.trim();
    const password = pwdInput?.value.trim();

    if (!identifier || !password) {
      Toast.show('Veuillez renseigner votre identifiant et votre mot de passe.', 'warning', '⚠️');
      return;
    }

    const success = this.store.login(identifier, password);
    if (success) {
      const user = this.store.state.user;
      Toast.show(`Heureux de vous revoir, ${user.name} ! ✨`, 'success', '🎉');
      this.router.navigate('/profile');
    } else {
      Toast.show('Identifiant ou mot de passe incorrect.', 'error', '❌');
    }
  }

  handleRegister() {
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

    const username = '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);

    this.store.register({
      name,
      username,
      email,
      password,
      favoriteGenres: this.selectedRegisterGenres.length > 0 ? this.selectedRegisterGenres : ['romance', 'african']
    });

    Toast.show(`Bienvenue dans la communauté Liva, ${name} ! 🌟`, 'success', '🚀', 3500);
    this.router.navigate('/profile');
  }
}
