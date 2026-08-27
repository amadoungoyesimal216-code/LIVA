// LIVA - Page Explorer (ExploreView)
import { GENRES_DATA, POPULAR_SEARCH_TAGS } from '../data/genres.js';
import { StoryCard } from '../components/StoryCard.js';
import { AiRecommender } from '../features/aiRecommender.js';

export class ExploreView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.aiRecommender = new AiRecommender(store);
    this.currentQuery = '';
    this.selectedGenre = null;
  }

  render(params = {}) {
    const allStories = this.store.getAllStories();
    const genreParam = params.genre;
    this.selectedGenre = genreParam || null;

    let filteredStories = allStories;
    if (this.selectedGenre) {
      filteredStories = allStories.filter(s => 
        s.genre.toLowerCase().includes(this.selectedGenre.toLowerCase()) || 
        (s.secondaryGenre && s.secondaryGenre.toLowerCase().includes(this.selectedGenre.toLowerCase()))
      );
    }

    return `
      <div class="explore-view page-container animate-fade-in">
        
        <!-- 1. Header & Barre de Recherche -->
        <section class="explore-header">
          <h1 class="explore-title">Que voulez-vous lire ? 🔍</h1>
          
          <div class="explore-search-container">
            <div class="explore-search-box">
              <span style="font-size: 1.2rem; color: var(--text-muted);">🔍</span>
              <input 
                type="text" 
                id="explore-search-input" 
                class="explore-search-input" 
                placeholder="Rechercher une histoire, un auteur, un genre ou un tag..." 
                value="${this.currentQuery}"
                autocomplete="off"
              />
              <button id="explore-clear-search" class="btn btn-ghost btn-sm" style="display: ${this.currentQuery ? 'block' : 'none'};">✕</button>
            </div>
          </div>

          <!-- Recherches populaires -->
          <div class="popular-searches">
            <span class="popular-label">Recherches populaires :</span>
            ${POPULAR_SEARCH_TAGS.map(tag => `
              <span class="popular-tag-chip" data-search-term="${tag}">${tag}</span>
            `).join('')}
          </div>
        </section>

        <!-- 2. AI Story Finder Widget ✨ -->
        <section class="ai-finder-card" id="ai-finder-section">
          <div class="ai-finder-header">
            <div class="ai-finder-badge">
              <span>✨</span>
              <span>LIVA AI · RECOMMANDATION CONVERSATIONNELLE</span>
            </div>
          </div>
          
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 4px;">Trouve-moi une histoire sur-mesure</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">
              Exprimez vos envies de lecture dans vos propres mots, notre algorithme IA s'occupe du reste.
            </p>
          </div>

          <div class="ai-prompt-box">
            <textarea 
              id="ai-prompt-input" 
              class="ai-prompt-input" 
              placeholder="Ex: Je veux une histoire d'amour impossible qui se passe à Dakar avec des secrets de famille..."
            ></textarea>
            
            <div class="ai-preset-chips">
              <span style="font-size: 0.75rem; color: var(--text-muted); align-self: center;">Exemples :</span>
              <button class="ai-preset-btn" data-preset="Je veux une histoire d'amour triste avec une fin inattendue.">
                💔 Amour triste & fin inattendue
              </button>
              <button class="ai-preset-btn" data-preset="Je veux une histoire d'horreur qui se passe dans un village africain.">
                👻 Horreur dans un village africain
              </button>
              <button class="ai-preset-btn" data-preset="Un thriller haletant en moins de 10 minutes.">
                ⚡ Thriller court 10 min
              </button>
              <button class="ai-preset-btn" data-preset="High fantasy avec des dragons et de la magie interdite.">
                🧙 Fantasy & Magie interdite
              </button>
            </div>

            <button id="btn-submit-ai-prompt" class="btn btn-primary" style="align-self: flex-start; margin-top: var(--space-2);">
              ✨ Analyser et Trouver
            </button>
          </div>

          <!-- Zone des résultats IA -->
          <div class="ai-results-wrapper" id="ai-results-container"></div>
        </section>

        <!-- 3. Résultats de Recherche / Grille d'Histoires -->
        <section id="search-results-section">
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title" id="explore-results-heading">
                ${this.selectedGenre ? `Genre : ${this.selectedGenre.toUpperCase()}` : 'Toutes les histoires 📚'}
              </h2>
              <span class="section-subtitle" id="explore-results-count">${filteredStories.length} histoires disponibles</span>
            </div>
            ${this.selectedGenre ? `<button id="btn-reset-genre-filter" class="btn btn-outline btn-sm">Réinitialiser le filtre ✕</button>` : ''}
          </div>

          <div class="search-results-grid" id="explore-grid-container">
            ${filteredStories.map(story => StoryCard.renderVertical(story, this.store)).join('')}
          </div>
        </section>

        <!-- 4. Grille Visuelle des Genres -->
        <section>
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">Explorer par genre 🎨</h2>
              <span class="section-subtitle">Découvrez des univers riches selon vos sensibilités</span>
            </div>
          </div>

          <div class="genres-visual-grid">
            ${GENRES_DATA.map(genre => `
              <div class="genre-card" style="background: ${genre.gradient};" data-genre-id="${genre.id}" data-genre-name="${genre.name}">
                <div class="genre-card-icon">${genre.icon}</div>
                <div>
                  <h3 class="genre-card-name">${genre.name}</h3>
                  <span class="genre-card-count">${genre.count} histoires</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

      </div>
    `;
  }

  attachEvents(container) {
    const searchInput = container.querySelector('#explore-search-input');
    const clearBtn = container.querySelector('#explore-clear-search');
    const gridContainer = container.querySelector('#explore-grid-container');
    const headingEl = container.querySelector('#explore-results-heading');
    const countEl = container.querySelector('#explore-results-count');

    // Live search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        this.currentQuery = query;
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';
        this.filterAndRenderStories(query, gridContainer, headingEl, countEl);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.currentQuery = '';
        clearBtn.style.display = 'none';
        this.filterAndRenderStories('', gridContainer, headingEl, countEl);
      });
    }

    // Popular tags
    container.querySelectorAll('.popular-tag-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const term = e.currentTarget.getAttribute('data-search-term');
        if (searchInput) {
          searchInput.value = term;
          this.currentQuery = term;
          if (clearBtn) clearBtn.style.display = 'block';
          this.filterAndRenderStories(term, gridContainer, headingEl, countEl);
          searchInput.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Reset genre filter
    const resetGenreBtn = container.querySelector('#btn-reset-genre-filter');
    if (resetGenreBtn) {
      resetGenreBtn.addEventListener('click', () => {
        this.selectedGenre = null;
        this.router.navigate('/explore');
      });
    }

    // Genre cards click
    container.querySelectorAll('.genre-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const genreId = card.getAttribute('data-genre-id');
        this.router.navigate(`/explore?genre=${genreId}`);
      });
    });

    // AI Prompt Presets
    container.querySelectorAll('.ai-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.getAttribute('data-preset');
        const promptInput = container.querySelector('#ai-prompt-input');
        if (promptInput) {
          promptInput.value = preset;
          this.triggerAiSearch(preset, container);
        }
      });
    });

    // AI Submit button
    const submitAiBtn = container.querySelector('#btn-submit-ai-prompt');
    if (submitAiBtn) {
      submitAiBtn.addEventListener('click', () => {
        const promptInput = container.querySelector('#ai-prompt-input');
        if (promptInput && promptInput.value.trim()) {
          this.triggerAiSearch(promptInput.value.trim(), container);
        }
      });
    }

    this.bindStoryCards(container);
  }

  filterAndRenderStories(query, gridContainer, headingEl, countEl) {
    if (!gridContainer) return;
    const allStories = this.store.getAllStories();
    const lower = query.toLowerCase().trim();

    let filtered = allStories;
    if (lower) {
      filtered = allStories.filter(s => 
        s.title.toLowerCase().includes(lower) ||
        s.authorName.toLowerCase().includes(lower) ||
        s.genre.toLowerCase().includes(lower) ||
        (s.secondaryGenre && s.secondaryGenre.toLowerCase().includes(lower)) ||
        s.description.toLowerCase().includes(lower) ||
        s.tags.some(t => t.toLowerCase().includes(lower))
      );
    } else if (this.selectedGenre) {
      filtered = allStories.filter(s => 
        s.genre.toLowerCase().includes(this.selectedGenre.toLowerCase()) || 
        (s.secondaryGenre && s.secondaryGenre.toLowerCase().includes(this.selectedGenre.toLowerCase()))
      );
    }

    if (headingEl) {
      headingEl.textContent = lower ? `Résultats pour "${query}"` : (this.selectedGenre ? `Genre : ${this.selectedGenre.toUpperCase()}` : 'Toutes les histoires 📚');
    }

    if (countEl) {
      countEl.textContent = `${filtered.length} histoires trouvées`;
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">Aucune histoire trouvée</h3>
          <p class="empty-state-text">Nous n'avons trouvé aucun résultat pour "${query}". Essayez un autre mot-clé ou découvrez nos genres.</p>
        </div>
      `;
    } else {
      gridContainer.innerHTML = filtered.map(s => StoryCard.renderVertical(s, this.store)).join('');
      this.bindStoryCards(gridContainer);
    }
  }

  triggerAiSearch(query, container) {
    const resultsContainer = container.querySelector('#ai-results-container');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; padding: var(--space-6); gap: var(--space-3); color: var(--color-primary-light);">
        <div class="wave-bar" style="width: 6px; height: 24px;"></div>
        <div class="wave-bar" style="width: 6px; height: 32px; animation-delay: 0.2s;"></div>
        <div class="wave-bar" style="width: 6px; height: 20px; animation-delay: 0.4s;"></div>
        <span style="font-weight: 700; font-size: 0.95rem;">Liva AI analyse votre requête...</span>
      </div>
    `;
    resultsContainer.classList.add('active');

    setTimeout(() => {
      const matches = this.aiRecommender.findStories(query);
      resultsContainer.innerHTML = this.aiRecommender.renderResultsMarkup(matches, this.store);
      this.bindStoryCards(resultsContainer);
    }, 450);
  }

  bindStoryCards(container) {
    container.querySelectorAll('.story-card-vertical').forEach(card => {
      card.addEventListener('click', () => {
        const storyId = card.getAttribute('data-story-id');
        if (storyId) this.router.navigate(`/story/${storyId}`);
      });
    });
  }
}
