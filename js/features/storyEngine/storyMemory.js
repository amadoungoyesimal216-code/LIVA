// LIVA STORY ENGINE — Gestionnaire de Mémoire Narrative Réactive
export class StoryMemory {
  constructor(initialData = {}) {
    this.storyId = initialData.storyId || '';
    this.characters = initialData.characters || [];
    this.events = initialData.events || [];
    this.locations = initialData.locations || [];
    this.timeline = initialData.timeline || [];
    this.secrets = initialData.secrets || [];
    this.unresolvedQuestions = initialData.unresolvedQuestions || [];
    this.completedChapters = initialData.completedChapters || [];
    this.currentState = initialData.currentState || 'initial';
  }

  /**
   * Initialise la mémoire à partir de la bible narrative validée
   */
  initFromBible(storyId, bible) {
    this.storyId = storyId;
    this.characters = (bible.characters || []).map(c => ({
      name: c.name,
      role: c.role || 'Principal',
      age: c.age || '',
      traits: c.traits || '',
      goal: c.goal || '',
      fear: c.fear || '',
      secret: c.secret || '',
      evolutionState: 'Initial',
      relationships: c.relationships || ''
    }));

    this.locations = (bible.locations || []).map(l => ({
      name: l.name,
      atmosphere: l.atmosphere || '',
      sensoryDetails: l.sensoryDetails || ''
    }));

    this.secrets = (bible.secrets || []).map(s => ({
      description: s.description || s,
      knownBy: s.knownBy || [],
      hiddenFrom: s.hiddenFrom || [],
      isRevealed: false,
      revealedInChapter: null
    }));

    this.unresolvedQuestions = [...(bible.unresolvedQuestions || [
      "Comment le protagoniste surmontera-t-il son conflit initial ?",
      "Qui détient la clé du mystère principal ?"
    ])];

    this.events = [
      {
        chapter: 0,
        summary: `Situation initiale : ${bible.synopsis || 'Début de l\'histoire.'}`,
        impact: 'Mise en place de l\'univers'
      }
    ];

    this.timeline = [
      { step: 0, title: 'Origine', description: bible.universe || '' }
    ];

    this.completedChapters = [];
    this.currentState = 'bible_initialized';
  }

  /**
   * Analyse et intègre un chapitre tout juste généré dans la mémoire vivante
   */
  updateWithChapter(chapterNum, chapterTitle, chapterContent, planItem = {}) {
    const summary = planItem.summary || `Chapitre ${chapterNum} complété.`;
    const keyEvent = planItem.keyEvent || `Événement clé du chapitre ${chapterNum}.`;
    const cliffhanger = planItem.cliffhanger || '';

    // 1. Ajouter l'événement dans l'historique
    this.events.push({
      chapter: chapterNum,
      title: chapterTitle,
      summary: summary,
      keyEvent: keyEvent,
      cliffhanger: cliffhanger,
      timestamp: new Date().toISOString()
    });

    // 2. Mettre à jour la timeline
    this.timeline.push({
      step: chapterNum,
      title: `Ch. ${chapterNum} : ${chapterTitle}`,
      description: keyEvent
    });

    // 3. Suivre la liste des chapitres complétés
    if (!this.completedChapters.includes(chapterNum)) {
      this.completedChapters.push(chapterNum);
    }

    // 4. Mettre à jour l'évolution des personnages
    this.characters.forEach(char => {
      if (chapterContent.toLowerCase().includes(char.name.toLowerCase())) {
        char.evolutionState = `Actif au Chapitre ${chapterNum} (${planItem.objective || 'Progression narrative'})`;
      }
    });

    // 5. Vérifier si un secret a été révélé
    this.secrets.forEach(sec => {
      if (!sec.isRevealed && sec.description && chapterContent.toLowerCase().includes(sec.description.toLowerCase().slice(0, 20))) {
        sec.isRevealed = true;
        sec.revealedInChapter = chapterNum;
      }
    });

    this.currentState = `chapter_${chapterNum}_completed`;
  }

  /**
   * Génère le résumé contextuel de mémoire à injecter dans le prompt du prochain chapitre
   */
  getContextForNextChapter(nextChapterPlanItem) {
    const last3Events = this.events.slice(-3);
    const activeSecrets = this.secrets.filter(s => !s.isRevealed);
    const revealedSecrets = this.secrets.filter(s => s.isRevealed);

    return {
      charactersList: this.characters.map(c => 
        `- **${c.name}** (${c.role}, ${c.age ? c.age + ' ans, ' : ''}${c.traits}) : Objectif = ${c.goal}. Peur/Secret = ${c.secret || c.fear}. État actuel = ${c.evolutionState}`
      ).join('\n'),

      locationsList: this.locations.map(l => 
        `- **${l.name}** : ${l.atmosphere} (${l.sensoryDetails})`
      ).join('\n'),

      recentChronology: last3Events.map(e => 
        `- Ch. ${e.chapter} [${e.title || 'Passé'}] : ${e.keyEvent || e.summary}`
      ).join('\n'),

      activeSecrets: activeSecrets.map(s => `- 🔒 Secret non révélé : ${s.description}`).join('\n'),
      revealedSecrets: revealedSecrets.map(s => `- 🔓 Secret révélé au Ch. ${s.revealedInChapter} : ${s.description}`).join('\n'),

      unresolvedQuestions: this.unresolvedQuestions.map(q => `- ❓ ${q}`).join('\n'),

      targetObjective: nextChapterPlanItem ? `Objectif du chapitre actuel : ${nextChapterPlanItem.objective}. Événement à faire survenir : ${nextChapterPlanItem.keyEvent}. ${nextChapterPlanItem.cliffhanger ? 'Finir sur ce cliffhanger : ' + nextChapterPlanItem.cliffhanger : ''}` : ''
    };
  }

  /**
   * Exporte l'état pour persistance JSON dans Supabase
   */
  toJSON() {
    return {
      story_id: this.storyId,
      characters: this.characters,
      events: this.events,
      locations: this.locations,
      timeline: this.timeline,
      secrets: this.secrets,
      unresolved_questions: this.unresolvedQuestions,
      completed_chapters: this.completedChapters,
      current_state: this.currentState,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Restaure la mémoire depuis la base Supabase
   */
  fromJSON(data = {}) {
    this.storyId = data.story_id || this.storyId;
    this.characters = data.characters || [];
    this.events = data.events || [];
    this.locations = data.locations || [];
    this.timeline = data.timeline || [];
    this.secrets = data.secrets || [];
    this.unresolvedQuestions = data.unresolved_questions || [];
    this.completedChapters = data.completed_chapters || [];
    this.currentState = data.current_state || 'ready';
    return this;
  }
}
