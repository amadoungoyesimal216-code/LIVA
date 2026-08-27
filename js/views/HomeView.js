// LIVA - Page d'Accueil (HomeView)
import { StoryCard } from '../components/StoryCard.js';
import { GENRES_DATA } from '../data/genres.js';
import { Toast } from '../components/Toast.js';

export class HomeView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
  }

  render() {
    const heroStory = this.store.getHeroStory();
    const recommendedStories = this.store.getRecommendedStories(6);
    const trendingStories = this.store.getTrendingStories();
    const shortsStories = this.store.getShorts();
    const userFavGenres = this.store.state.user.favoriteGenres || [];
    const targetGenre = userFavGenres.length > 0 ? userFavGenres[0] : null;
    const curatedStories = targetGenre 
      ? this.store.getStoriesByGenre(targetGenre)
      : this.store.getAllStories().slice(0, 6);
    const isHeroSaved = this.store.isSaved(heroStory.id);

    return `
      <div class="home-view page-container animate-fade-in">
        
        <!-- 1. Salutation & Catégories -->
        <section class="home-greeting-section">
          <div class="home-greeting-sub">
            <span>Bonjour 👋</span>
            <span>· Bienvenue sur Liva</span>
          </div>
          <h1 class="home-greeting-title">Qu'avez-vous envie de lire aujourd'hui ?</h1>
          
          <div class="genre-chips-carousel hide-scrollbar" id="home-genre-chips">
            <button class="genre-chip active" data-genre-id="all">✨ Tout explorer</button>
            ${GENRES_DATA.map(g => `
              <button class="genre-chip" data-genre-id="${g.id}">
                <span>${g.icon}</span>
                <span>${g.name}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <!-- 2. Hero : Tendances sur Liva -->
        <section>
          <div class="hero-trending-banner" data-story-id="${heroStory.id}">
            <img src="${heroStory.banner || heroStory.cover}" alt="${heroStory.title}" class="hero-backdrop-img" />
            <div class="hero-gradient-overlay"></div>
            
            <div class="hero-content">
              <div class="hero-badge-row">
                <span class="badge badge-rose">🔥 TENDANCE SUR LIVA</span>
                <span class="badge badge-blur">${heroStory.genre} · ${heroStory.secondaryGenre}</span>
              </div>
              
              <h2 class="hero-title">${heroStory.title}</h2>
              
              <div class="hero-meta-row">
                <span style="font-weight: 700; color: var(--color-accent-gold);">⭐ ${heroStory.rating}</span>
                <span>·</span>
                <span>👁️ ${heroStory.readsCount} lectures</span>
                <span>·</span>
                <span>✍️ ${heroStory.authorName}</span>
              </div>
              
              <p class="hero-desc">${heroStory.description.split('\n')[0]}</p>
              
              <div class="hero-actions">
                <button class="btn btn-primary btn-lg btn-read-story" data-story-id="${heroStory.id}">
                  📖 Lire maintenant
                </button>
                <button class="btn btn-secondary btn-lg btn-toggle-save" data-story-id="${heroStory.id}">
                  ${isHeroSaved ? '✓ Dans ma bibliothèque' : '❤️ Ajouter à ma bibliothèque'}
                </button>
                <button class="btn btn-icon btn-play-audio" data-story-id="${heroStory.id}" title="Écouter l'histoire">
                  🎧
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Raccourcis Rapides (Swipe & IA) -->
        <section class="features-promo-grid">
          <div class="promo-card promo-swipe" id="btn-open-swipe">
            <div>
              <span class="promo-badge" style="color: var(--color-accent-rose);">Découverte Rapide ⚡</span>
              <h3 class="promo-title">Swipe Story</h3>
              <p class="promo-desc">Glissez les histoires pour trouver votre prochain coup de cœur en quelques secondes.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--color-accent-rose);">
              <span>Lancer l'expérience</span>
              <span>→</span>
            </div>
          </div>

          <div class="promo-card promo-ai" id="btn-open-ai-finder">
            <div>
              <span class="promo-badge" style="color: var(--color-primary-light);">Intelligence Artificielle ✨</span>
              <h3 class="promo-title">Trouve-moi une histoire</h3>
              <p class="promo-desc">Décrivez en quelques mots ce que vous ressentez, notre IA trouve le récit parfait.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--color-primary-light);">
              <span>Demander à l'IA</span>
              <span>→</span>
            </div>
          </div>
        </section>

        <!-- 4. Section "Pour vous" -->
        <section>
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">Pour vous 🌟</h2>
              <span class="section-subtitle">Recommandations basées sur vos lectures et genres favoris</span>
            </div>
            <a href="#/explore" class="section-link">Voir tout →</a>
          </div>

          <div class="stories-horizontal-scroll hide-scrollbar">
            ${recommendedStories.map(story => StoryCard.renderVertical(story, this.store)).join('')}
          </div>
        </section>

        <!-- 5. Section "Liva Shorts ⚡" -->
        <section>
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">Liva Shorts ⚡</h2>
              <span class="section-subtitle">Des histoires courtes et percutantes à dévorer en quelques minutes</span>
            </div>
          </div>

          <div class="shorts-filter-bar">
            <button class="shorts-filter-btn active" data-short-cat="all">Tous</button>
            <button class="shorts-filter-btn" data-short-cat="5 min">⚡ 5 min</button>
            <button class="shorts-filter-btn" data-short-cat="10 min">⚡ 10 min</button>
            <button class="shorts-filter-btn" data-short-cat="15 min">⚡ 15 min</button>
          </div>

          <div class="shorts-grid" id="home-shorts-container">
            ${shortsStories.map(story => StoryCard.renderShort(story, this.store)).join('')}
          </div>
        </section>

        <!-- 6. Section Découverte ou Genre Favori -->
        <section>
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">${targetGenre ? `Parce que vous aimez ${targetGenre} ✨` : 'Découvrez vos prochaines histoires ✨'}</h2>
              <span class="section-subtitle">${targetGenre ? 'Sélection spéciale adaptée à vos préférences' : 'Récits sélectionnés par la rédaction de Liva'}</span>
            </div>
            <a href="#/explore${targetGenre ? `?genre=${targetGenre.toLowerCase()}` : ''}" class="section-link">Explorer →</a>
          </div>

          <div class="stories-horizontal-scroll hide-scrollbar">
            ${curatedStories.map(story => StoryCard.renderVertical(story, this.store)).join('')}
          </div>
        </section>

      </div>
    `;
  }

  attachEvents(container) {
    // Genre chips filter
    container.querySelectorAll('#home-genre-chips .genre-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const genreId = e.currentTarget.getAttribute('data-genre-id');
        container.querySelectorAll('#home-genre-chips .genre-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');

        if (genreId !== 'all') {
          this.router.navigate(`/explore?genre=${genreId}`);
        }
      });
    });

    // Shorts filter buttons
    container.querySelectorAll('.shorts-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-short-cat');
        container.querySelectorAll('.shorts-filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const filtered = this.store.getShorts(cat);
        const shortsContainer = container.querySelector('#home-shorts-container');
        if (shortsContainer) {
          shortsContainer.innerHTML = filtered.map(s => StoryCard.renderShort(s, this.store)).join('');
          this.bindCardClicks(shortsContainer);
        }
      });
    });

    // Quick banners
    const swipeBtn = container.querySelector('#btn-open-swipe');
    if (swipeBtn) {
      swipeBtn.addEventListener('click', () => this.router.navigate('/swipe'));
    }

    const aiBtn = container.querySelector('#btn-open-ai-finder');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        this.router.navigate('/explore');
        setTimeout(() => {
          const input = document.getElementById('ai-prompt-input');
          if (input) {
            input.scrollIntoView({ behavior: 'smooth' });
            input.focus();
          }
        }, 150);
      });
    }

    this.bindCardClicks(container);
  }

  bindCardClicks(container) {
    // Click on vertical story cards
    container.querySelectorAll('.story-card-vertical, .story-card-short').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const storyId = card.getAttribute('data-story-id');
        if (storyId) this.router.navigate(`/story/${storyId}`);
      });
    });

    // Click on "Lire maintenant"
    container.querySelectorAll('.btn-read-story').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.getAttribute('data-story-id');
        if (storyId) this.router.navigate(`/reader/${storyId}/0`);
      });
    });

    // Click on toggle save
    container.querySelectorAll('.btn-toggle-save').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.getAttribute('data-story-id');
        const added = this.store.toggleSaveStory(storyId);
        btn.textContent = added ? '✓ Dans ma bibliothèque' : '❤️ Ajouter à ma bibliothèque';
        Toast.show(added ? 'Ajouté à votre bibliothèque !' : 'Retiré de votre bibliothèque', 'info', added ? '📚' : '🗑️');
      });
    });

    // Click on audio
    container.querySelectorAll('.btn-play-audio').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.getAttribute('data-story-id');
        window.appAudioPlayer?.playStory(storyId, 0);
      });
    });
  }
}
