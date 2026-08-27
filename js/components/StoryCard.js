// LIVA - Générateurs de cartes d'histoires et d'auteurs
export class StoryCard {
  static renderVertical(story, store) {
    const isSaved = store.isSaved(story.id);
    const isLiked = store.isLiked(story.id);

    return `
      <div class="story-card-vertical" data-story-id="${story.id}">
        <div class="story-cover-wrapper">
          <img src="${story.cover}" alt="${story.title}" class="story-cover-img" loading="lazy" />
          <div class="story-cover-gradient"></div>
          <div class="story-card-badges">
            ${story.featuredBadge ? `<span class="badge badge-blur">${story.featuredBadge}</span>` : ''}
          </div>
        </div>
        <div class="story-card-body">
          <div class="story-card-genre">${story.genre} ${story.secondaryGenre ? `· ${story.secondaryGenre}` : ''}</div>
          <h4 class="story-card-title">${story.title}</h4>
          <div class="story-card-author">
            <img src="${story.authorAvatar}" alt="${story.authorName}" class="avatar avatar-sm" />
            <span>${story.authorName}</span>
          </div>
          <div class="story-card-meta">
            <span class="story-card-rating">⭐ ${story.rating}</span>
            <span>📖 ${story.chaptersCount} chap.</span>
            <span>⏱️ ${story.estimatedTime}</span>
          </div>
        </div>
      </div>
    `;
  }

  static renderShort(story, store) {
    return `
      <div class="story-card-short" data-story-id="${story.id}">
        <div class="story-card-short-cover">
          <img src="${story.cover}" alt="${story.title}" loading="lazy" />
        </div>
        <div class="story-card-short-content">
          <div>
            <span class="badge badge-gold" style="font-size: 0.72rem; margin-bottom: 4px;">⚡ ${story.estimatedTime}</span>
            <h4 class="story-card-title" style="font-size: 0.95rem; margin-top: 2px;">${story.title}</h4>
            <span class="story-card-genre" style="font-size: 0.7rem;">${story.genre}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
            <span>${story.authorName}</span>
            <span>⭐ ${story.rating}</span>
          </div>
        </div>
      </div>
    `;
  }

  static renderReadingNow(progressItem, story, store) {
    return `
      <div class="reading-now-card" data-story-id="${story.id}">
        <div class="reading-now-cover">
          <img src="${story.cover}" alt="${story.title}" />
        </div>
        <div class="reading-now-info">
          <span class="story-card-genre">${story.genre}</span>
          <h3 class="reading-now-title">${story.title}</h3>
          <span class="reading-now-author">${story.authorName}</span>
          
          <div class="reading-progress-wrap">
            <div class="reading-progress-labels">
              <span>Chapitre ${progressItem.currentChapterIndex + 1}/${story.chaptersCount}</span>
              <span class="reading-progress-percent">${progressItem.progressPercent}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${progressItem.progressPercent}%;"></div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm btn-continue-reading" data-story-id="${story.id}" data-chapter-index="${progressItem.currentChapterIndex}">
          Continuer 📖
        </button>
      </div>
    `;
  }

  static renderAuthorCard(author, store) {
    const isFollowing = store.isFollowedAuthor(author.id);
    return `
      <div class="author-card-item" data-author-id="${author.id}" style="padding: var(--space-4); background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); cursor: pointer;">
        <div style="display: flex; align-items: center; gap: var(--space-3); min-width: 0;">
          <img src="${author.avatar}" alt="${author.name}" class="avatar avatar-md avatar-ring" />
          <div style="display: flex; flex-direction: column; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-weight: 700; font-size: 0.95rem;">${author.name}</span>
              ${author.verified ? `<span style="color: var(--color-primary-light); font-size: 0.8rem;">✓</span>` : ''}
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${author.username} · ${author.followers} abonnés</span>
          </div>
        </div>
        <button class="btn btn-sm ${isFollowing ? 'btn-outline following' : 'btn-secondary'} btn-follow-toggle" data-author-id="${author.id}">
          ${isFollowing ? 'Abonné' : 'Suivre'}
        </button>
      </div>
    `;
  }
}
