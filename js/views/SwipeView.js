// LIVA - Mode Découverte Swipe Story (SwipeView)
import { Toast } from '../components/Toast.js';

export class SwipeView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.currentIndex = 0;
    this.deck = [];
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
  }

  render() {
    this.deck = [...this.store.getAllStories()];
    this.currentIndex = 0;

    return `
      <div class="swipe-story-view page-container animate-fade-in">
        
        <!-- 1. En-tête -->
        <div class="swipe-header">
          <h1 class="swipe-title">
            <span>Swipe Story</span>
            <span style="font-size: 1.4rem;">⚡</span>
          </h1>
          <p class="swipe-subtitle">Glissez à droite pour aimer ❤️, à gauche pour passer 👎, ou appuyez pour lire 📖</p>
        </div>

        <!-- 2. Pile de Cartes -->
        <div class="swipe-card-stack" id="swipe-card-stack">
          ${this.renderCardStackMarkup()}
        </div>

        <!-- 3. Boutons d'Action Inférieurs -->
        <div class="swipe-actions-bar">
          <button class="swipe-btn swipe-btn-nope" id="btn-swipe-nope" title="Pas pour moi (Swipe gauche)">
            👎
          </button>
          
          <button class="swipe-btn swipe-btn-read" id="btn-swipe-read" title="Lire maintenant (Haut)">
            📖
          </button>

          <button class="swipe-btn swipe-btn-like" id="btn-swipe-like" title="J'aime (Swipe droite)">
            ❤️
          </button>
        </div>

      </div>
    `;
  }

  renderCardStackMarkup() {
    if (this.currentIndex >= this.deck.length) {
      return `
        <div class="empty-state" style="height: 100%; justify-content: center;">
          <div class="empty-state-icon">🎉</div>
          <h3 class="empty-state-title">Vous avez tout exploré !</h3>
          <p class="empty-state-text">Retrouvez toutes les histoires que vous avez aimées dans votre bibliothèque.</p>
          <button class="btn btn-primary" id="btn-reset-swipe-deck">
            Recommencer la découverte 🔄
          </button>
        </div>
      `;
    }

    const cardsToShow = this.deck.slice(this.currentIndex, this.currentIndex + 3);

    return cardsToShow.map((story, i) => {
      const isTop = i === 0;
      const zIndex = 10 - i;
      const scale = 1 - i * 0.05;
      const translateY = i * 14;

      return `
        <div 
          class="swipe-card ${isTop ? 'swipe-card-top' : ''}" 
          data-story-id="${story.id}" 
          data-index="${this.currentIndex + i}"
          style="z-index: ${zIndex}; transform: translateY(${translateY}px) scale(${scale}); opacity: ${1 - i * 0.15};"
        >
          <img src="${story.cover}" alt="${story.title}" class="swipe-card-bg" />
          <div class="swipe-card-gradient"></div>

          <!-- Tampons visuels de Swipe -->
          <div class="swipe-stamp swipe-stamp-like" id="stamp-like-${story.id}">J'AIME ❤️</div>
          <div class="swipe-stamp swipe-stamp-nope" id="stamp-nope-${story.id}">PASSE 👎</div>

          <!-- Contenu de la Carte -->
          <div class="swipe-card-content">
            <span class="swipe-card-genre">${story.genre} ${story.secondaryGenre ? `· ${story.secondaryGenre}` : ''}</span>
            <h2 class="swipe-card-title">${story.title}</h2>
            <span class="swipe-card-author">✍️ ${story.authorName}</span>
            
            <p class="swipe-card-desc">${story.description.split('\n')[0]}</p>

            <div class="swipe-card-stats">
              <span style="color: var(--color-accent-gold); font-weight: 700;">⭐ ${story.rating}</span>
              <span>📖 ${story.chaptersCount} chapitres</span>
              <span>⏱️ ${story.estimatedTime}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  attachEvents(container) {
    this.container = container;
    this.bindGestures();

    // Action buttons
    container.querySelector('#btn-swipe-nope')?.addEventListener('click', () => this.swipe('left'));
    container.querySelector('#btn-swipe-like')?.addEventListener('click', () => this.swipe('right'));
    container.querySelector('#btn-swipe-read')?.addEventListener('click', () => this.swipe('up'));
  }

  bindGestures() {
    const stack = this.container.querySelector('#swipe-card-stack');
    const topCard = stack?.querySelector('.swipe-card-top');
    if (!topCard) {
      const resetBtn = stack?.querySelector('#btn-reset-swipe-deck');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.currentIndex = 0;
          stack.innerHTML = this.renderCardStackMarkup();
          this.bindGestures();
        });
      }
      return;
    }

    const stampLike = topCard.querySelector('.swipe-stamp-like');
    const stampNope = topCard.querySelector('.swipe-stamp-nope');

    // Pointer events for touch & mouse drag
    const onPointerDown = (e) => {
      this.isDragging = true;
      this.startX = e.clientX || e.touches?.[0]?.clientX || 0;
      this.startY = e.clientY || e.touches?.[0]?.clientY || 0;
      topCard.style.transition = 'none';
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      const deltaX = clientX - this.startX;
      const deltaY = clientY - this.startY;
      const rotate = deltaX * 0.08;

      topCard.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;

      // Update stamp opacities
      if (stampLike && stampNope) {
        if (deltaX > 20) {
          stampLike.style.opacity = Math.min(1, deltaX / 120);
          stampNope.style.opacity = 0;
        } else if (deltaX < -20) {
          stampNope.style.opacity = Math.min(1, -deltaX / 120);
          stampLike.style.opacity = 0;
        } else {
          stampLike.style.opacity = 0;
          stampNope.style.opacity = 0;
        }
      }
    };

    const onPointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const clientX = e.clientX || e.changedTouches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.changedTouches?.[0]?.clientY || 0;
      const deltaX = clientX - this.startX;
      const deltaY = clientY - this.startY;

      if (deltaX > 100) {
        this.swipe('right');
      } else if (deltaX < -100) {
        this.swipe('left');
      } else if (deltaY < -120) {
        this.swipe('up');
      } else {
        // Reset position
        topCard.style.transition = 'transform 0.3s ease';
        topCard.style.transform = 'translate(0px, 0px) rotate(0deg)';
        if (stampLike) stampLike.style.opacity = 0;
        if (stampNope) stampNope.style.opacity = 0;
      }
    };

    topCard.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    topCard.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });
  }

  swipe(direction) {
    const stack = this.container.querySelector('#swipe-card-stack');
    const topCard = stack?.querySelector('.swipe-card-top');
    if (!topCard) return;

    const storyId = topCard.getAttribute('data-story-id');
    const story = this.store.getStoryById(storyId);

    topCard.style.transition = 'transform 0.4s ease, opacity 0.4s ease';

    if (direction === 'right') {
      topCard.style.transform = 'translate(450px, -50px) rotate(35deg)';
      topCard.style.opacity = '0';
      this.store.toggleLikeStory(storyId);
      this.store.toggleSaveStory(storyId);
      Toast.show(`Coup de cœur pour "${story.title}" ! Ajouté à la bibliothèque ❤️`, 'success', '❤️');
    } else if (direction === 'left') {
      topCard.style.transform = 'translate(-450px, -50px) rotate(-35deg)';
      topCard.style.opacity = '0';
    } else if (direction === 'up') {
      topCard.style.transform = 'translate(0px, -500px)';
      topCard.style.opacity = '0';
      setTimeout(() => {
        this.router.navigate(`/reader/${storyId}/0`);
      }, 250);
      return;
    }

    setTimeout(() => {
      this.currentIndex += 1;
      stack.innerHTML = this.renderCardStackMarkup();
      this.bindGestures();
    }, 300);
  }
}
