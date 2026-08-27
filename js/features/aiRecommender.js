// LIVA - Moteur de Recommandation Conversationnel par IA
import { StoryCard } from '../components/StoryCard.js';

export class AiRecommender {
  constructor(store) {
    this.store = store;
  }

  findStories(query) {
    if (!query || query.trim() === '') return [];

    const lowerQuery = query.toLowerCase();
    const keywords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    const stories = this.store.getAllStories();

    const scored = stories.map(story => {
      let score = 0;
      const reasons = [];

      // Keyword matches
      keywords.forEach(kw => {
        if (story.title.toLowerCase().includes(kw)) {
          score += 15;
          reasons.push(`Titre évocateur`);
        }
        if (story.genre.toLowerCase().includes(kw) || (story.secondaryGenre && story.secondaryGenre.toLowerCase().includes(kw))) {
          score += 25;
          reasons.push(`Genre ${story.genre}`);
        }
        if (story.description.toLowerCase().includes(kw)) {
          score += 10;
        }
        if (story.tags.some(t => t.toLowerCase().includes(kw))) {
          score += 18;
          reasons.push(`Thématique correspondante`);
        }
      });

      // Semantic associations
      if (lowerQuery.includes('afrique') || lowerQuery.includes('africain') || lowerQuery.includes('dakar') || lowerQuery.includes('village')) {
        if (story.genre === 'Histoires africaines' || story.tags.includes('Dakar') || story.tags.includes('Sénégal') || story.tags.includes('Abidjan')) {
          score += 30;
          reasons.push(`Cadre africain authentique`);
        }
      }

      if (lowerQuery.includes('amour') || lowerQuery.includes('romance') || lowerQuery.includes('triste') || lowerQuery.includes('coeur')) {
        if (story.genre === 'Romance' || story.secondaryGenre === 'Drame') {
          score += 25;
          reasons.push(`Émotion amoureuse intense`);
        }
      }

      if (lowerQuery.includes('peur') || lowerQuery.includes('horreur') || lowerQuery.includes('angoisse') || lowerQuery.includes('frisson')) {
        if (story.genre === 'Horreur' || story.genre === 'Thriller') {
          score += 30;
          reasons.push(`Suspense et frissons garantis`);
        }
      }

      if (lowerQuery.includes('court') || lowerQuery.includes('rapide') || lowerQuery.includes('5 min') || lowerQuery.includes('10 min')) {
        if (story.isShort) {
          score += 35;
          reasons.push(`Format court et intense`);
        }
      }

      // Base popularity bonus
      score += Math.min(20, Math.round(story.rating * 3));

      // Calculate confidence percentage
      const confidence = Math.min(99, Math.max(65, 60 + score));

      return {
        story,
        score,
        confidence,
        reason: reasons.length > 0 ? reasons.slice(0, 2).join(' · ') : 'Sélection personnalisée selon vos goûts'
      };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4);
  }

  renderResultsMarkup(matches, store) {
    if (!matches || matches.length === 0) {
      return `
        <div class="empty-state" style="padding: var(--space-6) 0;">
          <div class="empty-state-icon">🤖</div>
          <h4 class="empty-state-title">Aucune histoire correspondante trouvée</h4>
          <p class="empty-state-text">Essayez d'écrire différemment votre envie de lecture (ex: "Une romance à Dakar", "Un thriller très court").</p>
        </div>
      `;
    }

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
        <span style="font-size: 0.88rem; font-weight: 700; color: var(--color-primary-light);">
          ✨ ${matches.length} histoires trouvées par l'IA
        </span>
      </div>
      <div class="search-results-grid">
        ${matches.map(m => `
          <div style="display: flex; flex-direction: column; gap: var(--space-2);">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--color-accent-emerald); font-weight: 700; background: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: var(--radius-sm);">
              <span>🎯 ${m.confidence}% de match</span>
              <span style="color: var(--text-muted);">${m.reason}</span>
            </div>
            ${StoryCard.renderVertical(m.story, store)}
          </div>
        `).join('')}
      </div>
    `;
  }
}
