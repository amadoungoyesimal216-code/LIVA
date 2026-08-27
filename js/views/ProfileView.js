// LIVA - Page Profil Utilisateur & Profil Auteur Public (ProfileView)
import { StoryCard } from '../components/StoryCard.js';
import { Toast } from '../components/Toast.js';
import { escapeHTML } from '../utils/sanitize.js';

export class ProfileView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
  }

  render(params = {}) {
    const authorId = params.authorId;

    if (authorId) {
      return this.renderAuthorProfile(authorId);
    }

    return this.renderUserProfile();
  }

  renderUserProfile() {
    const isAuth = this.store.state.isAuthenticated;
    const user = this.store.state.user;
    const allStories = this.store.getAllStories();
    const likedStories = (user.likedStoryIds || []).map(id => allStories.find(s => s.id === id)).filter(Boolean);

    const badges = [
      { icon: '🏆', title: 'Lecteur Passionné', sub: 'Plus de 40 histoires dévorées' },
      { icon: '🌙', title: 'Nuit Blanche', sub: 'Lecture nocturne au-delà de 3h' },
      { icon: '🌍', title: 'Explorateur Culturel', sub: 'A lu des récits de 5 genres différents' },
      { icon: '✍️', title: 'Plume Émergente', sub: 'Auteur d\'histoires sur Liva' }
    ];

    if (!isAuth) {
      return `
        <div class="profile-view page-container animate-fade-in">
          <section class="profile-hero-card" style="text-align: center; display: flex; flex-direction: column; align-items: center; padding: var(--space-8) var(--space-4);">
            <div style="font-size: 3.5rem; animation: floatBadge 3s ease-in-out infinite;">🔐</div>
            <h1 class="profile-name" style="font-size: 1.8rem; margin-top: var(--space-2);">Votre Espace Personnel Liva</h1>
            <p class="profile-bio" style="max-width: 480px; margin: var(--space-2) auto var(--space-4);">
              Connectez-vous ou créez un compte pour suivre vos auteurs favoris, sauvegarder vos lectures et débloquer vos badges.
            </p>
            <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center;">
              <button class="btn btn-primary btn-lg" id="btn-goto-login">
                Se connecter 🚀
              </button>
              <button class="btn btn-secondary btn-lg" id="btn-goto-register">
                Créer un compte ✨
              </button>
            </div>
          </section>
        </div>
      `;
    }

    return `
      <div class="profile-view page-container animate-fade-in">
        
        <!-- 1. Hero du Profil Lecteur -->
        <section class="profile-hero-card">
          <div class="profile-avatar-wrap">
            <img src="${user.avatar}" alt="${escapeHTML(user.name)}" class="profile-avatar-img" />
          </div>

          <div class="profile-info">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2);">
              <div>
                <h1 class="profile-name">${escapeHTML(user.name)}</h1>
                <span class="profile-handle">${escapeHTML(user.username)}</span>
              </div>
              <div class="profile-header-actions">
                <button class="btn btn-secondary btn-sm" id="btn-edit-bio">
                  ✏️ Modifier profil
                </button>
                <button class="btn btn-danger btn-sm" id="btn-profile-logout" data-action="logout" style="width: 100%; justify-content: center; padding: 7px 14px;">
                  🚪 Déconnexion
                </button>
              </div>
            </div>

            <p class="profile-bio">${escapeHTML(user.bio)}</p>

            <!-- Statistiques de lecture -->
            <div class="profile-stats-row">
              <div class="profile-stat-box">
                <span class="profile-stat-num">${user.stats?.storiesRead || 42}</span>
                <span class="profile-stat-label">Histoires lues</span>
              </div>
              <div class="profile-stat-box">
                <span class="profile-stat-num">${user.stats?.hoursRead || 68}h</span>
                <span class="profile-stat-label">Heures de lecture</span>
              </div>
              <div class="profile-stat-box">
                <span class="profile-stat-num">${user.followedAuthorIds?.length || 18}</span>
                <span class="profile-stat-label">Abonnements</span>
              </div>
              <div class="profile-stat-box">
                <span class="profile-stat-num">${user.stats?.followersCount || 124}</span>
                <span class="profile-stat-label">Abonnés</span>
              </div>
              <div class="profile-stat-box">
                <span class="profile-stat-num">${user.stats?.likesCount || 312}</span>
                <span class="profile-stat-label">Likes</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Badges & Accomplissements -->
        <section>
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">Mes Badges & Succès 🏅</h2>
              <span class="section-subtitle">Récompenses débloquées au fil de vos lectures</span>
            </div>
          </div>

          <div class="badges-showcase-grid">
            ${badges.map(b => `
              <div class="badge-card">
                <span class="badge-card-icon">${b.icon}</span>
                <div>
                  <div class="badge-card-title">${b.title}</div>
                  <div class="badge-card-sub">${b.sub}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 3. Histoires Préférées -->
        <section>
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">Mes Coups de Cœur ❤️</h2>
              <span class="section-subtitle">Histoires que vous avez aimées sur Liva</span>
            </div>
          </div>

          <div class="search-results-grid">
            ${likedStories.map(story => StoryCard.renderVertical(story, this.store)).join('')}
          </div>
        </section>

      </div>
    `;
  }

  renderAuthorProfile(authorId) {
    const author = this.store.getAuthorById(authorId) || this.store.authors[0];
    const authorStories = this.store.getAuthorStories(author.id);
    const isFollowing = this.store.isFollowedAuthor(author.id);

    return `
      <div class="profile-view page-container animate-fade-in">
        
        <!-- Hero Auteur Public -->
        <section class="author-public-hero">
          <img src="${author.cover}" alt="${author.name}" class="author-hero-cover" />
          
          <div class="author-hero-main">
            <div class="author-meta-wrap">
              <img src="${author.avatar}" alt="${author.name}" class="author-avatar-big" />
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <h1 style="font-size: 1.8rem; font-weight: 900; color: var(--text-primary);">${author.name}</h1>
                  ${author.verified ? `<span class="badge badge-primary" style="font-size: 0.75rem;">✓ Auteur Vérifié</span>` : ''}
                </div>
                <span style="font-size: 0.9rem; color: var(--color-primary-light); font-weight: 600;">${escapeHTML(author.username)}</span>
              </div>
            </div>

            <button class="btn ${isFollowing ? 'btn-outline following' : 'btn-primary'} btn-lg btn-toggle-author-follow" data-author-id="${author.id}">
              ${isFollowing ? 'Abonné ✓' : 'Suivre +'}
            </button>
          </div>

          <p style="font-size: 1rem; color: var(--text-secondary); line-height: 1.6; max-width: 800px; margin-top: var(--space-3);">
            ${escapeHTML(author.bio)}
          </p>

          <div style="display: flex; flex-wrap: wrap; gap: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--border-subtle);">
            <div class="profile-stat-box">
              <span class="profile-stat-num">${author.followers}</span>
              <span class="profile-stat-label">Abonnés</span>
            </div>
            <div class="profile-stat-box">
              <span class="profile-stat-num">${author.storiesCount}</span>
              <span class="profile-stat-label">Histoires publiées</span>
            </div>
            <div class="profile-stat-box">
              <span class="profile-stat-num">${author.totalReads}</span>
              <span class="profile-stat-label">Lectures totales</span>
            </div>
            <div class="profile-stat-box">
              <span class="profile-stat-num">${author.likesCount}</span>
              <span class="profile-stat-label">Likes</span>
            </div>
          </div>
        </section>

        <!-- Histoires Publiées par l'Auteur -->
        <section>
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">Ses Histoires 📖</h2>
              <span class="section-subtitle">Découvrez tous les récits de ${escapeHTML(author.name)}</span>
            </div>
          </div>

          <div class="search-results-grid">
            ${authorStories.map(story => StoryCard.renderVertical(story, this.store)).join('')}
          </div>
        </section>

      </div>
    `;
  }

  attachEvents(container) {
    // Follow Author toggle
    container.querySelectorAll('.btn-toggle-author-follow').forEach(btn => {
      btn.addEventListener('click', () => {
        const authorId = btn.getAttribute('data-author-id');
        const isFollowing = this.store.toggleFollowAuthor(authorId);
        btn.textContent = isFollowing ? 'Abonné ✓' : 'Suivre +';
        btn.className = `btn ${isFollowing ? 'btn-outline following' : 'btn-primary'} btn-lg btn-toggle-author-follow`;
        Toast.show(isFollowing ? 'Vous suivez désormais cet auteur !' : 'Abonnement retiré', 'info', '👤');
      });
    });

    // Edit bio modal
    const editBioBtn = container.querySelector('#btn-edit-bio');
    if (editBioBtn) {
      editBioBtn.addEventListener('click', () => {
        const modal = document.getElementById('modal-edit-profile');
        if (modal) {
          const nameInput = modal.querySelector('#edit-user-name-input');
          const bioInput = modal.querySelector('#edit-user-bio-input');
          if (nameInput) nameInput.value = this.store.state.user.name || '';
          if (bioInput) bioInput.value = this.store.state.user.bio || '';
          modal.classList.add('active');
        }
      });
    }

    // Relaunch Onboarding
    const onboardBtn = container.querySelector('#btn-relaunch-onboarding');
    if (onboardBtn) {
      onboardBtn.addEventListener('click', async () => {
        const onbContainer = document.getElementById('onboarding-modal-container');
        if (onbContainer) {
          const { OnboardingView } = await import('./OnboardingView.js');
          const onbView = new OnboardingView(this.store, () => this.router.refresh());
          onbContainer.innerHTML = onbView.render();
          onbView.attachEvents(onbContainer.querySelector('#modal-onboarding'));
        }
      });
    }

    // Navigation to Auth (from unauthenticated state)
    container.querySelector('#btn-goto-login')?.addEventListener('click', () => {
      this.router.navigate('/auth?mode=login');
    });

    container.querySelector('#btn-goto-register')?.addEventListener('click', () => {
      this.router.navigate('/auth?mode=register');
    });

    // Logout handling
    const handleLogout = () => {
      this.store.logout();
      Toast.show('Vous avez été déconnecté avec succès. À bientôt !', 'info', '👋', 3000);
      this.router.syncUserUI();
      this.router.navigate('/auth?mode=login');
    };

    container.querySelector('#btn-profile-logout')?.addEventListener('click', handleLogout);
    container.querySelector('#btn-profile-logout-footer')?.addEventListener('click', handleLogout);

    // Switch Account
    container.querySelector('#btn-switch-account')?.addEventListener('click', () => {
      this.router.navigate('/auth?mode=login');
    });

    // Story cards click
    container.querySelectorAll('.story-card-vertical').forEach(card => {
      card.addEventListener('click', () => {
        const storyId = card.getAttribute('data-story-id');
        if (storyId) this.router.navigate(`/story/${storyId}`);
      });
    });
  }
}
