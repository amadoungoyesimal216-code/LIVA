// LIVA STORY ENGINE — Gestionnaire de Mémoire Narrative Réactive & Continuité Littéraire
export class StoryMemory {
  constructor(initialData = {}) {
    this.storyId = initialData.storyId || '';
    this.characters = initialData.characters || [];
    this.events = initialData.events || [];
    this.locations = initialData.locations || [];
    this.timeline = initialData.timeline || [];
    this.secrets = initialData.secrets || [];
    this.establishedFacts = initialData.establishedFacts || [];
    this.unresolvedQuestions = initialData.unresolvedQuestions || [];
    this.completedChapters = initialData.completedChapters || [];
    this.keyItems = initialData.keyItems || [];
    this.relationshipStates = initialData.relationshipStates || {};
    this.currentState = initialData.currentState || 'initial';
  }

  /**
   * Initialise la mémoire à partir de la bible narrative validée
   */
  initFromBible(storyId, bible) {
    this.storyId = storyId;
    
    this.characters = (bible.characters || []).map(c => ({
      name: c.name,
      role: c.role || 'Protagoniste',
      age: c.age || '',
      profession: c.profession || '',
      traits: c.traits || '',
      goal: c.goal || '',
      fear: c.fear || '',
      secret: c.secret || '',
      evolutionState: 'Situation initiale',
      relationships: c.relationships || ''
    }));

    this.locations = (bible.locations || []).map(l => ({
      name: l.name,
      atmosphere: l.atmosphere || '',
      sensoryDetails: l.sensoryDetails || ''
    }));

    this.secrets = (bible.secrets || []).map(s => ({
      description: typeof s === 'string' ? s : (s.description || ''),
      knownBy: s.knownBy || [],
      hiddenFrom: s.hiddenFrom || [],
      isRevealed: false,
      revealedInChapter: null
    }));

    this.establishedFacts = [
      `Cadre de l'histoire : ${bible.universe || bible.locations?.[0]?.name || 'Univers défini'}`,
      `Conflit central : ${bible.mainConflict || 'Confrontation des désirs et secrets'}`
    ];

    this.keyItems = (bible.keyItems || []).map(item => ({
      name: typeof item === 'string' ? item : item.name,
      significance: typeof item === 'string' ? 'Objet clé du récit' : (item.significance || '')
    }));

    this.unresolvedQuestions = [...(bible.unresolvedQuestions || [
      "Comment le protagoniste surmontera-t-il l'opposition principale ?",
      "Quelle est la véritable nature du secret caché ?"
    ])];

    this.events = [
      {
        chapter: 0,
        title: 'Prélude',
        summary: bible.synopsis || 'Mise en place de l\'intrigue et des protagonistes.',
        keyEvent: 'Découverte du contexte et des enjeux initiaux.',
        cliffhanger: ''
      }
    ];

    this.timeline = [
      { step: 0, title: 'Origine', description: bible.universe || bible.synopsis || '' }
    ];

    this.completedChapters = [];
    this.currentState = 'bible_initialized';
  }

  /**
   * Intègre un chapitre généré dans la mémoire vivante en extrayant les faits et évolutions
   */
  updateWithChapter(chapterNum, chapterTitle, chapterContent, planItem = {}) {
    const summary = planItem.summary || planItem.objective || `Chapitre ${chapterNum} complété.`;
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

    // 3. Suivre les chapitres complétés
    if (!this.completedChapters.includes(chapterNum)) {
      this.completedChapters.push(chapterNum);
    }

    // 4. Mettre à jour les faits établis
    this.establishedFacts.push(`Au Ch. ${chapterNum} (${chapterTitle}) : ${keyEvent}`);

    // 5. Mettre à jour l'évolution des personnages
    const lowerContent = (chapterContent || '').toLowerCase();
    this.characters.forEach(char => {
      if (lowerContent.includes(char.name.toLowerCase())) {
        char.evolutionState = `Après Ch. ${chapterNum} : ${planItem.objective || 'A vécu des bouleversements'}`;
      }
    });

    // 6. Vérifier si un secret a été révélé
    this.secrets.forEach(sec => {
      if (!sec.isRevealed && sec.description) {
        const keywords = sec.description.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const matchCount = keywords.filter(kw => lowerContent.includes(kw)).length;
        if (matchCount >= 2 || (planItem.keyEvent && planItem.keyEvent.toLowerCase().includes('révél'))) {
          sec.isRevealed = true;
          sec.revealedInChapter = chapterNum;
          this.establishedFacts.push(`Secret révélé au Ch. ${chapterNum} : ${sec.description}`);
        }
      }
    });

    this.currentState = `chapter_${chapterNum}_completed`;
  }

  /**
   * Génère le briefing contextuel exhaustif pour le prochain chapitre
   */
  getContextForNextChapter(nextChapterPlanItem) {
    const last3Events = this.events.slice(-3);
    const activeSecrets = this.secrets.filter(s => !s.isRevealed);
    const revealedSecrets = this.secrets.filter(s => s.isRevealed);
    const recentFacts = this.establishedFacts.slice(-5);

    return {
      charactersList: this.characters.map(c => 
        `- **${c.name}** (${c.role}, ${c.age ? c.age + ' ans, ' : ''}${c.profession ? c.profession + ', ' : ''}${c.traits}) : Objectif = ${c.goal}. Peur/Secret = ${c.secret || c.fear}. État actuel = ${c.evolutionState}`
      ).join('\n'),

      locationsList: this.locations.map(l => 
        `- **${l.name}** : ${l.atmosphere} (${l.sensoryDetails})`
      ).join('\n'),

      recentChronology: last3Events.map(e => 
        `- Ch. ${e.chapter} [${e.title || 'Scène'}] : ${e.keyEvent || e.summary}`
      ).join('\n'),

      recentEstablishedFacts: recentFacts.map(f => `- 📌 ${f}`).join('\n'),

      activeSecrets: activeSecrets.map(s => `- 🔒 Secret encore caché : ${s.description}`).join('\n'),
      revealedSecrets: revealedSecrets.map(s => `- 🔓 Secret révélé au Ch. ${s.revealedInChapter} : ${s.description}`).join('\n'),

      unresolvedQuestions: this.unresolvedQuestions.map(q => `- ❓ ${q}`).join('\n'),

      targetObjective: nextChapterPlanItem 
        ? `Objectif du chapitre : ${nextChapterPlanItem.objective || 'Faire progresser l\'intrigue'}. Événement à faire survenir : ${nextChapterPlanItem.keyEvent || 'Scène clé'}. ${nextChapterPlanItem.cliffhanger ? 'Finir sur ce cliffhanger : ' + nextChapterPlanItem.cliffhanger : ''}`
        : ''
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
      established_facts: this.establishedFacts,
      unresolved_questions: this.unresolvedQuestions,
      completed_chapters: this.completedChapters,
      key_items: this.keyItems,
      relationship_states: this.relationshipStates,
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
    this.establishedFacts = data.established_facts || [];
    this.unresolvedQuestions = data.unresolved_questions || [];
    this.completedChapters = data.completed_chapters || [];
    this.keyItems = data.key_items || [];
    this.relationshipStates = data.relationship_states || {};
    this.currentState = data.current_state || 'ready';
    return this;
  }
}
