// LIVA - Page d'Histoire Détaillée (StoryView)
import { Toast } from '../components/Toast.js';

export class StoryView {
  constructor(store, router) {
    this.store = store;
    this.router = router;
  }

  render(params = {}) {
    const storyId = params.id;
    const story = this.store.getStoryById(storyId) || this.store.getAllStories()[0];
    this.currentStory = story;
    this.currentStoryId = story.id;
    const author = this.store.getAuthorById(story.authorId);
    const isSaved = this.store.isSaved(story.id);
    const isLiked = this.store.isLiked(story.id);
    const isFollowingAuthor = author ? this.store.isFollowedAuthor(author.id) : false;
    const readingProgress = this.store.getReadingProgress(story.id);

    return `
      <div class="story-detail-view page-container animate-fade-in" data-story-id="${story.id}">
        
        <!-- 1. En-tête Hero Immersif -->
        <section class="story-detail-hero">
          <img src="${story.cover}" alt="${story.title}" class="story-backdrop-blur" />
          
          <div class="story-detail-cover-box">
            <img src="${story.cover}" alt="${story.title}" class="story-detail-cover-img" />
          </div>

          <div class="story-detail-info">
            <div class="story-detail-genres">
              <span>${story.genre}</span>
              ${story.secondaryGenre ? `<span>·</span><span>${story.secondaryGenre}</span>` : ''}
              ${story.featuredBadge ? `<span class="badge badge-gold" style="margin-left: 8px;">${story.featuredBadge}</span>` : ''}
            </div>

            <h1 class="story-detail-title">${story.title}</h1>
            ${story.subtitle ? `<p style="font-size: 1.1rem; color: rgba(255, 255, 255, 0.9); font-style: italic;">« ${story.subtitle} »</p>` : ''}

            <!-- Statistiques de l'histoire -->
            <div class="story-detail-stats-bar">
              <div class="stat-item" style="color: var(--color-accent-gold);">
                <span>⭐</span>
                <span>${story.rating} (${story.reviewsCount || 0} avis)</span>
              </div>
              <div class="stat-item">
                <span>👁️</span>
                <span>${story.readsCount} lectures</span>
              </div>
              <div class="stat-item">
                <span>📖</span>
                <span>${story.chaptersCount} chapitres</span>
              </div>
              <div class="stat-item">
                <span>⏱️</span>
                <span>${story.estimatedTime}</span>
              </div>
            </div>

            <!-- Bloc Auteur -->
            <div class="story-author-block" id="btn-view-author" data-author-id="${story.authorId}">
              <div class="story-author-meta">
                <img src="${story.authorAvatar}" alt="${story.authorName}" class="avatar avatar-md avatar-ring" />
                <div>
                  <div class="story-author-name">Écrit par ${story.authorName}</div>
                  <div class="story-author-subtitle">${author ? `${author.followers} abonnés · ${author.storiesCount} histoires` : 'Autrice vérifiée'}</div>
                </div>
              </div>
              <button class="btn btn-sm ${isFollowingAuthor ? 'btn-outline following' : 'btn-primary'} btn-follow-author" data-author-id="${story.authorId}">
                ${isFollowingAuthor ? 'Abonné ✓' : 'Suivre +'}
              </button>
            </div>

            <!-- Boutons d'Action Principaux -->
            <div class="story-primary-actions">
              <button class="btn btn-primary btn-lg" id="btn-start-reading">
                📖 ${readingProgress ? `Continuer (Chapitre ${readingProgress.currentChapterIndex + 1})` : 'Commencer la lecture'}
              </button>

              <button class="btn ${isSaved ? 'btn-outline' : 'btn-secondary'} btn-lg" id="btn-toggle-library">
                ${isSaved ? '✓ Dans ma bibliothèque' : '❤️ Ajouter à ma bibliothèque'}
              </button>

              <button class="btn btn-secondary btn-lg" id="btn-listen-audio">
                🎧 Écouter
              </button>

              <button class="btn btn-icon ${isLiked ? 'btn-primary' : ''}" id="btn-like-story" title="Aimer l'histoire">
                ❤️
              </button>
            </div>
          </div>
        </section>

        <!-- 2. Synopsis & Tags -->
        <section class="story-synopsis-section">
          <h2 class="section-title">Synopsis</h2>
          <div class="story-description-text">${story.description}</div>

          <div class="story-tags-list">
            ${story.tags.map(tag => `
              <span class="story-tag-pill" data-tag="${tag}">#${tag}</span>
            `).join('')}
          </div>
        </section>

        <!-- 3. Table des Chapitres -->
        <section class="chapters-section">
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">Chapitres (${story.chapters.length})</h2>
              <span class="section-subtitle">Progression et temps de lecture par chapitre</span>
            </div>
          </div>

          <div class="chapters-list">
            ${story.chapters.map((chap, index) => {
              const isCurrent = readingProgress && readingProgress.currentChapterIndex === index;
              return `
                <div class="chapter-row ${isCurrent ? 'chapter-row-active' : ''}" data-chapter-index="${index}">
                  <div class="chapter-left">
                    <div class="chapter-num-badge">${chap.number || index + 1}</div>
                    <div>
                      <div class="chapter-title-text">${chap.title}</div>
                      ${isCurrent ? `<span style="font-size: 0.72rem; color: var(--color-primary-light); font-weight: 700;">En cours de lecture (${readingProgress.progressPercent}%)</span>` : ''}
                    </div>
                  </div>
                  <div class="chapter-meta-right">
                    <span>⏱️ ${chap.duration || '5 min'}</span>
                    <button class="btn btn-ghost btn-sm btn-read-chapter" data-chapter-index="${index}">Lire →</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- 4. Avis et Commentaires -->
        <section class="reviews-section">
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-title">Ce que les lecteurs en pensent 💬</h2>
              <span class="section-subtitle">Note moyenne ⭐ ${story.rating}/5 basée sur les avis certifiés</span>
            </div>
          </div>

          <!-- Formulaire de Commentaire -->
          <div class="comment-input-box">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 0.9rem;">Partager votre avis de lecture</span>
              <div id="rating-star-selector" style="display: flex; gap: 4px; cursor: pointer; font-size: 1.2rem;">
                <span data-star="1">⭐</span>
                <span data-star="2">⭐</span>
                <span data-star="3">⭐</span>
                <span data-star="4">⭐</span>
                <span data-star="5">⭐</span>
              </div>
            </div>
            
            <textarea 
              id="new-comment-textarea" 
              class="form-textarea" 
              placeholder="Qu'avez-vous ressenti en lisant cette histoire ? (Pas de spoilers...)"
              style="min-height: 80px;"
            ></textarea>
            
            <button id="btn-post-comment" class="btn btn-primary btn-sm" style="align-self: flex-end;">
              Publier mon avis ✨
            </button>
          </div>

          <!-- Fil des Commentaires -->
          <div class="comments-stream" id="comments-stream-list">
            ${(story.reviews || []).map(rev => `
              <div class="comment-card" data-comment-id="${rev.id}">
                <img src="${rev.userAvatar}" alt="${rev.userName}" class="avatar avatar-md" />
                <div class="comment-body">
                  <div class="comment-header-row">
                    <div style="display: flex; align-items: center; gap: var(--space-2);">
                      <span class="comment-author-name">${rev.userName}</span>
                      <span style="color: var(--color-accent-gold); font-size: 0.8rem;">${'⭐'.repeat(rev.rating || 5)}</span>
                    </div>
                    <span class="comment-date">${rev.date}</span>
                  </div>
                  <p class="comment-text">${rev.content}</p>
                  <div class="comment-footer-actions">
                    <button class="comment-action-btn ${rev.isLiked ? 'active' : ''} btn-like-comment" data-comment-id="${rev.id}">
                      ❤️ <span>${rev.likes || 0}</span>
                    </button>
                    <button class="comment-action-btn btn-reply-comment" data-comment-id="${rev.id}">
                      💬 Répondre
                    </button>
                  </div>
                  <div class="replies-sub-list" style="margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-2);"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

      </div>
    `;
  }

  attachEvents(container) {
    const innerDetail = container.querySelector('.story-detail-view');
    const storyId = this.currentStoryId || innerDetail?.getAttribute('data-story-id') || this.store.getAllStories()[0].id;
    const story = this.store.getStoryById(storyId) || this.currentStory || this.store.getAllStories()[0];
    if (!story) return;

    // Start Reading
    const startBtn = container.querySelector('#btn-start-reading');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const progress = this.store.getReadingProgress(story.id);
        const chapIndex = progress ? progress.currentChapterIndex : 0;
        this.router.navigate(`/reader/${story.id}/${chapIndex}`);
      });
    }

    // Toggle Library Save
    const libBtn = container.querySelector('#btn-toggle-library');
    if (libBtn) {
      libBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const added = this.store.toggleSaveStory(story.id);
        libBtn.textContent = added ? '✓ Dans ma bibliothèque' : '❤️ Ajouter à ma bibliothèque';
        libBtn.className = added ? 'btn btn-outline btn-lg' : 'btn btn-secondary btn-lg';
        Toast.show(added ? 'Ajouté à votre bibliothèque !' : 'Retiré de votre bibliothèque', 'info', added ? '📚' : '🗑️');
      });
    }

    // Listen Audio
    const audioBtn = container.querySelector('#btn-listen-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.appAudioPlayer?.playStory(story.id, 0);
      });
    }

    // Like Story
    const likeBtn = container.querySelector('#btn-like-story');
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const liked = this.store.toggleLikeStory(story.id);
        likeBtn.classList.toggle('btn-primary', liked);
        Toast.show(liked ? 'Ajouté à vos coups de cœur ❤️' : 'Retiré de vos favoris', 'info', '❤️');
      });
    }

    // Follow Author button
    container.querySelectorAll('.btn-follow-author').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const authorId = btn.getAttribute('data-author-id') || story.authorId;
        const isFollowing = this.store.toggleFollowAuthor(authorId);
        btn.textContent = isFollowing ? 'Abonné ✓' : 'Suivre +';
        btn.className = `btn btn-sm ${isFollowing ? 'btn-outline following' : 'btn-primary'} btn-follow-author`;
        Toast.show(isFollowing ? 'Vous suivez désormais cet auteur !' : 'Abonnement retiré', 'info', '👤');
      });
    });

    // View Author Profile
    const authorBlock = container.querySelector('#btn-view-author');
    if (authorBlock) {
      authorBlock.addEventListener('click', (e) => {
        if (e.target.closest('.btn-follow-author')) return;
        const authorId = authorBlock.getAttribute('data-author-id') || story.authorId;
        if (authorId) this.router.navigate(`/profile/author/${authorId}`);
      });
    }

    // Tag pills click
    container.querySelectorAll('.story-tag-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = pill.getAttribute('data-tag');
        this.router.navigate(`/explore?genre=${encodeURIComponent(tag)}`);
      });
    });

    // Chapters Row click & buttons
    container.querySelectorAll('.chapter-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const index = row.getAttribute('data-chapter-index') || 0;
        this.router.navigate(`/reader/${story.id}/${index}`);
      });
    });

    container.querySelectorAll('.btn-read-chapter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = btn.getAttribute('data-chapter-index') || 0;
        this.router.navigate(`/reader/${story.id}/${index}`);
      });
    });

    // Star selector interaction
    let selectedRating = 5;
    const starSelector = container.querySelector('#rating-star-selector');
    if (starSelector) {
      const stars = starSelector.querySelectorAll('span');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          selectedRating = parseInt(star.getAttribute('data-star') || '5', 10);
          stars.forEach((s, idx) => {
            s.style.opacity = idx < selectedRating ? '1' : '0.35';
            s.style.transform = idx < selectedRating ? 'scale(1.15)' : 'scale(1)';
          });
          Toast.show(`Note sélectionnée : ${selectedRating}/5 ⭐`, 'info', '⭐', 1200);
        });
      });
    }

    // Post new comment
    const postCommentBtn = container.querySelector('#btn-post-comment');
    const commentTextarea = container.querySelector('#new-comment-textarea');

    if (postCommentBtn && commentTextarea) {
      postCommentBtn.addEventListener('click', () => {
        const text = commentTextarea.value.trim();
        if (!text) {
          Toast.show('Veuillez écrire un commentaire avant de publier.', 'warning', '⚠️');
          return;
        }

        const newComment = this.store.addComment(storyId, text, selectedRating);
        commentTextarea.value = '';
        Toast.show('Votre avis a été publié avec succès !', 'success', '✨');

        // Append comment to DOM
        const stream = container.querySelector('#comments-stream-list');
        if (stream && newComment) {
          const card = document.createElement('div');
          card.className = 'comment-card animate-fade-in';
          card.innerHTML = `
            <img src="${newComment.userAvatar}" alt="${newComment.userName}" class="avatar avatar-md" />
            <div class="comment-body">
              <div class="comment-header-row">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                  <span class="comment-author-name">${newComment.userName}</span>
                  <span style="color: var(--color-accent-gold); font-size: 0.8rem;">${'⭐'.repeat(newComment.rating)}</span>
                </div>
                <span class="comment-date">À l'instant</span>
              </div>
              <p class="comment-text">${newComment.content}</p>
              <div class="comment-footer-actions">
                <button class="comment-action-btn btn-like-comment" data-comment-id="${newComment.id}">
                  ❤️ <span>0</span>
                </button>
                <button class="comment-action-btn btn-reply-comment" data-comment-id="${newComment.id}">
                  💬 Répondre
                </button>
              </div>
              <div class="replies-sub-list" style="margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-2);"></div>
            </div>
          `;
          stream.prepend(card);
          this.bindCommentActions(card, storyId);
        }
      });
    }

    this.bindCommentActions(container, storyId);
  }

  bindCommentActions(container, storyId) {
    // Like on comments
    container.querySelectorAll('.btn-like-comment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const commentId = btn.getAttribute('data-comment-id');
        const isLiked = this.store.toggleCommentLike(storyId, commentId);
        btn.classList.toggle('active', isLiked);
        const span = btn.querySelector('span');
        if (span) {
          let count = parseInt(span.textContent || '0', 10);
          span.textContent = isLiked ? count + 1 : Math.max(0, count - 1);
        }
      });
    });

    // Reply to comment
    container.querySelectorAll('.btn-reply-comment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.comment-card');
        const commentBody = card?.querySelector('.comment-body');
        if (!commentBody) return;

        let existingBox = commentBody.querySelector('.inline-reply-box');
        if (existingBox) {
          existingBox.remove();
          return;
        }

        const replyBox = document.createElement('div');
        replyBox.className = 'inline-reply-box animate-fade-in';
        replyBox.style.marginTop = 'var(--space-3)';
        replyBox.style.display = 'flex';
        replyBox.style.gap = 'var(--space-2)';
        replyBox.innerHTML = `
          <input type="text" class="form-input reply-input" placeholder="Répondre à ce commentaire..." style="padding: 8px 12px; font-size: 0.85rem;" />
          <button class="btn btn-primary btn-sm btn-submit-reply">Envoyer</button>
        `;
        commentBody.appendChild(replyBox);

        const replyInput = replyBox.querySelector('.reply-input');
        replyInput?.focus();

        replyBox.querySelector('.btn-submit-reply')?.addEventListener('click', () => {
          const replyText = replyInput?.value.trim();
          if (!replyText) return;

          let subList = commentBody.querySelector('.replies-sub-list');
          if (!subList) {
            subList = document.createElement('div');
            subList.className = 'replies-sub-list';
            subList.style.marginTop = 'var(--space-2)';
            subList.style.display = 'flex';
            subList.style.flexDirection = 'column';
            subList.style.gap = 'var(--space-2)';
            commentBody.appendChild(subList);
          }

          const replyItem = document.createElement('div');
          replyItem.className = 'reply-item animate-fade-in';
          replyItem.style.padding = '8px 12px';
          replyItem.style.background = 'var(--bg-surface)';
          replyItem.style.borderRadius = 'var(--radius-md)';
          replyItem.style.border = '1px solid var(--border-subtle)';
          replyItem.style.fontSize = '0.85rem';
          replyItem.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-weight: 700;">${this.store.state.user.name}</span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">À l'instant</span>
            </div>
            <p style="color: var(--text-secondary);">${replyText}</p>
          `;
          subList.appendChild(replyItem);
          replyBox.remove();
          Toast.show('Réponse publiée !', 'success', '💬');
        });
      });
    });
  }
}
