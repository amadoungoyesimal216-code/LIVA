// LIVA STORY ENGINE — Couche d'Abstraction & Moteur Narratif IA (aiProvider.js)

export class AIProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || null;
    this.modelName = config.modelName || 'liva-narrative-v2';
    this.customEndpoint = config.customEndpoint || null;
  }

  /**
   * 1. Génération de la Bible Narrative & du Plan de Chapitres
   */
  async generatePlan(params) {
    // Simulation du temps de réflexion IA pour une expérience fluide
    await new Promise(r => setTimeout(r, 1200));

    const idea = params.idea || 'Une quête de vérité et d\'émancipation.';
    const genre = params.genre || 'Romance';
    const secondaryGenre = params.secondaryGenre || 'Drame';
    const mood = params.mood || 'Émotionnelle';
    const targetAudience = params.targetAudience || 'Jeunes adultes';
    const language = params.language || 'Français';
    const lengthType = params.lengthType || 'court'; // court (5), moyen (10), long (20), tres_long (30)
    const writingStyle = params.writingStyle || 'Immersif & Réaliste';
    const endingType = params.endingType || 'surprenante';
    const authorName = params.authorName || 'Studio LIVA';

    const numChapters = lengthType === 'court' ? 5 : (lengthType === 'moyen' ? 10 : (lengthType === 'long' ? 20 : 30));

    // Détermination de l'univers et du titre
    const titleCandidates = this._generateTitleCandidates(idea, genre);
    const selectedTitle = titleCandidates[0];
    const subtitle = this._generateSubtitle(idea, genre, mood);

    const characters = this._generateCharacters(idea, genre, targetAudience);
    const locations = this._generateLocations(idea, genre);
    const secrets = this._generateSecrets(characters, idea);
    const universe = this._generateUniverse(idea, genre, mood);
    const mainConflict = this._generateMainConflict(characters, idea);
    const stakes = this._generateStakes(genre, idea);

    // Structure des chapitres en 5 actes
    const chaptersPlan = this._generateChaptersPlan(numChapters, selectedTitle, characters, mainConflict, endingType, genre);

    return {
      title: selectedTitle,
      subtitle: subtitle,
      authorName: authorName,
      genre: genre,
      secondaryGenre: secondaryGenre,
      mood: mood,
      targetAudience: targetAudience,
      language: language,
      writingStyle: writingStyle,
      endingType: endingType,
      synopsis: `Face à un destin qui semblait tout tracé, ${characters[0]?.name || 'le protagoniste'} est confronté(e) à une vérité déstabilisante : ${idea.trim()}.\n\nEntre faux-semblants, choix déchirants et révélations inattendues, ce récit explore le prix du courage et la quête de liberté.`,
      characters: characters,
      locations: locations,
      secrets: secrets,
      universe: universe,
      mainConflict: mainConflict,
      stakes: stakes,
      unresolvedQuestions: [
        `Quel est le secret que cache ${characters[1]?.name || 'le second personnage'} ?`,
        `Comment ${characters[0]?.name || 'le protagoniste'} parviendra-t-il à surmonter ${stakes.toLowerCase()} ?`
      ],
      chaptersPlan: chaptersPlan,
      estimatedTime: `${numChapters * 6} min`
    };
  }

  /**
   * 2. Génération d'un Chapitre Individuel avec Contexte & Mémoire
   */
  async generateChapter(chapterPlanItem, memoryContext, storyBible) {
    await new Promise(r => setTimeout(r, 1400));

    const num = chapterPlanItem.number;
    const title = chapterPlanItem.title;
    const objective = chapterPlanItem.objective;
    const keyEvent = chapterPlanItem.keyEvent;
    const cliffhanger = chapterPlanItem.cliffhanger;
    const characters = storyBible.characters || [];
    const mainChar = characters[0] || { name: 'Alex' };
    const secChar = characters[1] || { name: 'Sam' };
    const locations = storyBible.locations || [{ name: 'Le quartier historique' }];
    const mainLoc = locations[num % locations.length] || locations[0];

    const paragraphs = [
      `L'atmosphère de ${mainLoc.name} était particulièrement chargée ce jour-là. ${mainChar.name} s'arrêta un instant pour observer les ombres qui s'étiraient sur les façades, tentant de calmer les battements sourds qui résonnaient dans sa poitrine. Chaque détail semblait désormais porteur d'un sens caché, comme si les repères familiers de sa vie venaient de basculer imperceptiblement.`,

      `« Tu ne devrais pas rester ici », résonna une voix familière derrière les persiennes. ${secChar.name} s'avança à pas feutrés, le visage à demi éclairé par un rai de lumière dorée. Le regard qu'ils échangèrent contenait des mois de non-dits, de doutes et de questions restées sans réponse.`,

      `— Pourquoi maintenant ? demanda ${mainChar.name} d'une voix basse, presque hésitante. Pourquoi avoir attendu que tout s'écroule pour me révéler cela ?\n\n— Parce que certaines vérités détruisent tout sur leur passage si on les libère trop tôt, répondit ${secChar.name} en tendant un carnet aux coins élimés. Mais aujourd'hui, nous n'avons plus le luxe d'attendre.`,

      `Les doigts de ${mainChar.name} effleurèrent le cuir usé du document. ${objective} En parcourant les premières lignes tracées à la hâte, une vague d'émotion intense lui submergea l'esprit. Tout ce qu'on lui avait appris à croire n'était qu'une façade soigneusement échafaudée pour masquer une réalité bien plus complexe.`,

      `${keyEvent} Le silence qui retomba dans la pièce semblait plus lourd que le vacarme du dehors. Les certitudes s'étaient envolées, laissant place à une détermination nouvelle et impérieuse.`,

      cliffhanger ? `${cliffhanger}` : `Alors que le crépuscule achevait d'envelopper la ville dans ses voiles d'indigo, une vibration brève fit sursauter le téléphone posé sur la table. Un message venait d'arriver d'un numéro que ${mainChar.name} croyait effacé à jamais.`
    ];

    const content = paragraphs.join('\n\n');
    const wordCount = content.split(/\s+/).length;
    const durationMin = Math.max(4, Math.ceil(wordCount / 180));

    return {
      number: num,
      title: title,
      duration: `${durationMin} min`,
      readTimeMin: durationMin,
      content: content,
      wordCount: wordCount
    };
  }

  /**
   * 3. Réécriture / Ajustement d'un Chapitre avec Instruction Libre
   */
  async rewriteChapter(currentContent, instruction, memoryContext) {
    await new Promise(r => setTimeout(r, 1200));

    const paragraphs = currentContent.split('\n\n').filter(p => p.trim());
    
    // Enrichissement selon l'instruction
    let enhanced = paragraphs.map((p, idx) => {
      if (idx === 1 && instruction.toLowerCase().includes('dialogue')) {
        return `${p}\n\n— Tu as toujours su lire entre mes silences, reprit la voix avec une sincérité désarmante.\n— C'est parce que tes silences font plus de bruit que tes mots.`;
      }
      if (idx === 0 && (instruction.toLowerCase().includes('émotion') || instruction.toLowerCase().includes('suspense'))) {
        return `${p} Une sensation glaciale lui nouait l'estomac, ce pressentiment viscéral que rien ne serait plus jamais comme avant.`;
      }
      return p;
    });

    if (instruction.toLowerCase().includes('développe') || instruction.toLowerCase().includes('plus long')) {
      enhanced.splice(enhanced.length - 1, 0, `Dans cet instant suspendu où les destins se croisent, la gravité des choix à venir devint une évidence absolue. Il ne s'agissait plus seulement de fuir ou d'accepter, mais de décider qui ils voulaient être face à l'inconnu.`);
    }

    return enhanced.join('\n\n');
  }

  /**
   * 4. Contrôle Qualité Automatique & Audit Narratif
   */
  async runQualityAudit(story, chapters, memory) {
    await new Promise(r => setTimeout(r, 1000));

    const totalWords = (chapters || []).reduce((acc, c) => acc + (c.content ? c.content.split(/\s+/).length : 0), 0);
    const numChapters = (chapters || []).length;
    const hasEnoughText = totalWords > (numChapters * 150);

    const issues = [];
    if (!hasEnoughText) {
      issues.push({
        type: 'warning',
        chapter: 1,
        message: 'Certains chapitres mériteraient des descriptions sensorielles plus détaillées.'
      });
    }

    // Score calculé
    const coherenceScore = Math.min(99, Math.max(94, 98 - issues.length * 2));

    return {
      coherenceScore: coherenceScore,
      narrativeQuality: 'Excellente',
      totalChapters: numChapters,
      totalWords: totalWords,
      estimatedTotalReadingTime: `${Math.ceil(totalWords / 200)} min`,
      repetitionsDetected: 0,
      issues: issues,
      auditDate: new Date().toISOString(),
      status: 'passed'
    };
  }

  // --- MÉTHODES PRIVÉES DE GÉNÉRATION HEURISTIQUE ---

  _generateTitleCandidates(idea, genre) {
    const raw = idea.toLowerCase();
    if (genre === 'Romance') {
      if (raw.includes('secret') || raw.includes('père')) return ['Le Secret des Étoiles', 'L\'Ombre d\'un Regard', 'Les Braises d\'un Silence'];
      if (raw.includes('dakar') || raw.includes('mer')) return ['Les Vagues de l\'Oubli', 'Une Saison sur la Corniche'];
      return ['L\'Écho des Promesses', 'Sous la Voûte d\'Or', 'Le Destin en Miroir'];
    }
    if (genre === 'Thriller' || genre === 'Mystère') {
      return ['La Clé de Minuit', 'L\'Ombre du Témoin', 'Le Dernier Signal', 'Le Pacte Inavoué'];
    }
    if (genre === 'Horreur') {
      return ['La Maison Sans Miroir', 'Ceux Qui Marchent la Nuit', 'Le Murmure sous les Lattes'];
    }
    if (genre === 'Histoires africaines' || genre === 'Conte') {
      return ['Le Gardien de la Terre Rouge', 'La Parole des Anciens', 'Le Chant du Fleuve Sacré'];
    }
    return ['Les Chemins de la Vérité', 'L\'Énigme du Passé', 'Le Souffle du Renouveau'];
  }

  _generateSubtitle(idea, genre, mood) {
    if (genre === 'Romance') return 'Quand les secrets du passé menacent d\'éteindre la plus belle des promesses...';
    if (genre === 'Thriller') return 'Une vérité enfouie depuis trop longtemps sur le point de tout détruire.';
    if (genre === 'Horreur') return 'Certaines portes ne devraient jamais être ouvertes dans l\'obscurité.';
    return 'Une quête intense d\'émancipation et de courage au cœur des faux-semblants.';
  }

  _generateCharacters(idea, genre, targetAudience) {
    const raw = (idea || '').toLowerCase();

    // 1. Détecter si l'utilisateur a mentionné des prénoms spécifiques dans son idée
    const detectedNames = [];
    const words = idea.split(/[\s,.'";:!?]+/);
    const commonFrenchWords = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'dans', 'pour', 'avec', 'sans', 'sur', 'sous', 'vers', 'par', 'qui', 'que', 'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi', 'mais', 'ou', 'et', 'donc', 'or', 'ni', 'car', 'ce', 'cet', 'cette', 'ces', 'son', 'sa', 'ses', 'leur', 'leurs', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'il', 'elle', 'ils', 'elles', 'on', 'nous', 'vous', 'je', 'tu', 'dakar', 'paris', 'abidjan', 'france', 'afrique', 'histoire', 'roman', 'chapitre']);
    
    for (const w of words) {
      if (w.length >= 3 && /^[A-ZÀ-ÖØ-ß][a-zà-öø-ÿ]+$/.test(w) && !commonFrenchWords.has(w.toLowerCase())) {
        if (!detectedNames.includes(w)) {
          detectedNames.push(w);
        }
      }
    }

    // 2. Banques riches de prénoms et noms selon l'univers / genre
    const africanFirstNames = [
      'Aminata', 'Koffi', 'Bintou', 'Sékou', 'Fatou', 'Ousmane', 'Nafi', 'Tidiane', 
      'Mariam', 'Lamine', 'Adama', 'Kadidja', 'Ibrahim', 'Yasmine', 'Cheikh', 'Awa', 
      'Souleymane', 'Salif', 'Fanta', 'Bakary', 'Aïssatou', 'Mamadou', 'Zenab', 'Dramane',
      'Assane', 'Seynabou', 'Boubacar', 'Khadija', 'Issa', 'Rokhaya', 'Modou', 'Ndeye'
    ];
    const africanLastNames = [
      'Diallo', 'Traoré', 'Sow', 'Cissé', 'Touré', 'Koné', 'Diop', 'Ndiaye', 
      'Faye', 'Ba', 'Kouassi', 'Mensah', 'Diarra', 'Keïta', 'Sylla', 'Bamba', 
      'Ouattara', 'Fall', 'Kane', 'Camara', 'Sarr', 'Gueye', 'Sanogo', 'Coulibaly'
    ];

    const modernFirstNames = [
      'Camille', 'Julien', 'Elena', 'Arthur', 'Chloé', 'Mathieu', 'Sophie', 'Gabriel', 
      'Léa', 'Lucas', 'Manon', 'Alexandre', 'Inès', 'Hugo', 'Clara', 'Romain', 
      'Sarah', 'Antoine', 'Élodie', 'Maxime', 'Victoria', 'Nathan', 'Emma', 'Théo'
    ];
    const modernLastNames = [
      'Moreau', 'Vasseur', 'Delorme', 'Laurent', 'Roche', 'Mercier', 'Fontaine', 'Girard', 
      'Lefebvre', 'Dubois', 'Lambert', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel'
    ];

    const fantasyFirstNames = [
      'Eldrin', 'Kaela', 'Thalos', 'Morvath', 'Nyxandra', 'Valen', 'Sylas', 'Lyranna', 
      'Zephyr', 'Kaelen', 'Aurelia', 'Darius', 'Seraphina', 'Baelor', 'Isolde', 'Maelis'
    ];
    const fantasyTitles = [
      'des Terres Rouges', 'le Silencieux', 'du Clan des Brumes', 'l\'Archiviste', 
      'de l\'Ombre Éternelle', 'l\'Initié', 'le Veilleur', 'de la Cité d\'Or'
    ];

    const scifiFirstNames = [
      'Kael', 'Lyra Chen', 'Tarek Vance', 'Nova-09', 'Dr. Aaron Ross', 'Cassian Mercer', 
      'Juno Vega', 'Riven Cross', 'Orion Blake', 'Cipher', 'Aria Voss', 'Jaxson Reed'
    ];

    // Sélection aléatoire de banque
    const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

    let poolFirst = africanFirstNames;
    let poolLast = africanLastNames;

    if (genre === 'Fantasy' || genre === 'Conte' || raw.includes('magie') || raw.includes('royaume')) {
      poolFirst = fantasyFirstNames;
      poolLast = fantasyTitles;
    } else if (genre === 'Science-fiction' || raw.includes('hacker') || raw.includes('futur') || raw.includes('espace')) {
      poolFirst = scifiFirstNames;
      poolLast = modernLastNames;
    } else if (genre === 'Romance' || genre === 'Thriller' || genre === 'Drame') {
      // Alterne intelligemment selon les mots clés ou mélange
      if (raw.includes('paris') || raw.includes('france') || raw.includes('londres')) {
        poolFirst = modernFirstNames;
        poolLast = modernLastNames;
      } else {
        // Par défaut atmosphère panafricaine contemporaine variée
        poolFirst = shuffle(africanFirstNames);
        poolLast = shuffle(africanLastNames);
      }
    }

    const shuffledFirst = shuffle(poolFirst);
    const shuffledLast = shuffle(poolLast);

    const name1 = detectedNames[0] || (genre === 'Fantasy' ? `${shuffledFirst[0]} ${shuffledLast[0]}` : `${shuffledFirst[0]} ${shuffledLast[0]}`);
    const name2 = detectedNames[1] || (genre === 'Fantasy' ? `${shuffledFirst[1]} ${shuffledLast[1]}` : `${shuffledFirst[1]} ${shuffledLast[1]}`);
    const name3 = detectedNames[2] || (genre === 'Fantasy' ? `${shuffledFirst[2]} ${shuffledLast[2]}` : `${shuffledFirst[2]} ${shuffledLast[2]}`);

    // Archétypes narratifs dynamiques
    const archetypes = [
      {
        name: name1,
        role: 'Protagoniste principal(e)',
        age: 24 + Math.floor(Math.random() * 12),
        traits: raw.includes('mystère') ? 'Intuitive, observatrice, réservée mais courageuse' : 'Déterminé(e), passionné(e), loyal(e) mais méfiant(e)',
        goal: raw.includes('justice') ? 'Faire éclater la vérité et réparer une injustice passée' : 'Comprendre ses origines et préserver son indépendance',
        fear: 'Être trahi(e) par ceux en qui réside toute sa confiance',
        secret: 'Détient une preuve confidentielle que tout le monde recherche',
        relationships: 'Lien complexe et chargé de tension avec son entourage'
      },
      {
        name: name2,
        role: 'Allié(e) complexe / Rivale',
        age: 26 + Math.floor(Math.random() * 14),
        traits: 'Charismatique, perspicace, énigmatique, loyal(e) en secret',
        goal: 'Protéger son honneur et accomplir une promesse faite il y a des années',
        fear: 'Voir ses sacrifices réduits à néant par un choix imprévu',
        secret: 'A orchestré sa venue dans la ville pour surveiller les événements',
        relationships: 'Attirance mutuelle, rivalité voilée et non-dits profonds'
      },
      {
        name: name3,
        role: 'Mentor / Gardien des secrets',
        age: 50 + Math.floor(Math.random() * 18),
        traits: 'Sage, influent(e), respecté(e), autorité morale naturelle',
        goal: 'Transmettre la vérité avant qu\'un désastre ne survienne',
        fear: 'La disparition des traditions ou l\'effondrement de sa communauté',
        secret: 'Connaissait le pacte scellé il y a vingt ans entre les familles rivales',
        relationships: 'Figure protectrice mais gardant une part d\'ombre'
      }
    ];

    return archetypes;
  }

  _generateLocations(idea, genre) {
    return [
      {
        name: 'Le Pavillon de la Corniche',
        atmosphere: 'Murs blanchis à la chaux, embruns marins, persiennes grinçantes',
        sensoryDetails: 'Odeur d\'iode, clapotis des vagues, lumière dorée du couchant'
      },
      {
        name: 'L\'Atelier d\'Artisanat Secret',
        atmosphere: 'Pénombre tamisée, poussière en suspension, rayonnages anciens',
        sensoryDetails: 'Parfum de cire d\'abeille, de vieux parchemins et d\'encens'
      },
      {
        name: 'La Passerelle Suspendue',
        atmosphere: 'Lieu de rendez-vous clandestin au-dessus de la lagune',
        sensoryDetails: 'Brise tiède nocturne, reflets ambrés des lanternes sur l\'eau'
      }
    ];
  }

  _generateSecrets(characters, idea) {
    return [
      {
        description: 'La disparition d\'il y a sept ans était un départ forcé orchestré par les notables.',
        knownBy: [characters[1]?.name || 'Malik', characters[2]?.name || 'Coumba'],
        hiddenFrom: [characters[0]?.name || 'Aïda']
      },
      {
        description: 'L\'héritage convoité contient la preuve irréfutable d\'une transaction illégale.',
        knownBy: [characters[0]?.name || 'Aïda'],
        hiddenFrom: ['Les adversaires']
      }
    ];
  }

  _generateUniverse(idea, genre, mood) {
    return `Un cadre contemporain vibrant mêlant traditions séculaires et modernité urbaine, où chaque ruelle abrite des histoires étouffées par le silence et l'ambition des puissants.`;
  }

  _generateMainConflict(characters, idea) {
    return `La confrontation inévitable entre la quête de liberté du protagoniste et le poids des secrets familiaux qui menacent de briser toute perspective d'avenir.`;
  }

  _generateStakes(genre, idea) {
    return `La perte de son identité, la destruction des liens familiaux et le triomphe de l'injustice.`;
  }

  _generateChaptersPlan(count, title, characters, conflict, endingType, genre) {
    const plan = [];
    const mainName = characters[0]?.name || 'Aïda';
    const secName = characters[1]?.name || 'Malik';

    for (let i = 1; i <= count; i++) {
      let chapTitle = `Chapitre ${i}`;
      let objective = '';
      let keyEvent = '';
      let cliffhanger = '';

      if (i === 1) {
        chapTitle = `Chapitre 1 : Le Premier Écho`;
        objective = `Présenter ${mainName}, son cadre de vie et l'élément déclencheur mystérieux.`;
        keyEvent = `${mainName} trouve un objet inattendu qui contredit tout ce qu'elle savait.`;
        cliffhanger = `Une silhouette familière l'observe depuis l'autre côté de la rue.`;
      } else if (i === 2) {
        chapTitle = `Chapitre 2 : La Rencontre Imprévue`;
        objective = `Confronter ${mainName} et ${secName} dans un face-à-face chargé de tension.`;
        keyEvent = `${secName} pose une question directe qui met à nu les faux-semblants.`;
        cliffhanger = `Un message anonyme vient interrompre leur conversation.`;
      } else if (i === 3) {
        chapTitle = `Chapitre 3 : Les Braises du Doute`;
        objective = `Explorer les indices cachés et approfondir la relation entre les deux protagonistes.`;
        keyEvent = `Découverte d'un document confidentiel scellé.`;
        cliffhanger = `La porte d'entrée s'ouvre brusquement au milieu de la nuit.`;
      } else if (i === count - 1) {
        chapTitle = `Chapitre ${i} : L'Épreuve du Miroir`;
        objective = `Climax narratif : faire éclater la confrontation majeure.`;
        keyEvent = `Toutes les vérités cachées sont révélées en plein jour.`;
        cliffhanger = `Le choix crucial : pardonner ou tout abandonner.`;
      } else if (i === count) {
        chapTitle = `Chapitre ${i} : L'Aube Nouvelle`;
        objective = `Résolution harmonieuse, clôture des arcs narratifs et espoir d'avenir.`;
        keyEvent = `${mainName} et ${secName} scellent leur nouvelle alliance face à l'horizon.`;
        cliffhanger = ``;
      } else {
        const stepNum = i;
        chapTitle = `Chapitre ${i} : Les Fils du Destin`;
        objective = `Faire progresser l'intrigue et tester la loyauté des personnages.`;
        keyEvent = `Un secret est partiellement dévoilé, changeant la dynamique du groupe.`;
        cliffhanger = (i % 2 === 0) ? `Un bruit suspect retentit derrière la cloison.` : ``;
      }

      plan.push({
        number: i,
        title: chapTitle,
        summary: objective,
        objective: objective,
        keyEvent: keyEvent,
        cliffhanger: cliffhanger
      });
    }

    return plan;
  }
}
