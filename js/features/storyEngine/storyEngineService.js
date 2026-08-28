// LIVA STORY ENGINE — Orchestrateur Central & Persistance Supabase (storyEngineService.js)
import { StoryMemory } from './storyMemory.js';
import { AIProvider } from './aiProvider.js';
import { supabase } from '../../services/supabaseClient.js';
import { SupabaseAdminService } from '../../services/supabaseAdmin.js';

export class StoryEngineService {
  constructor(aiConfig = {}) {
    this.ai = new AIProvider(aiConfig);
    this.memories = new Map(); // storyId -> StoryMemory
    this.activeGenerations = new Map(); // storyId -> isRunning boolean
  }

  /**
   * 1. Étape Planification : Génère la bible narrative complète et le plan
   */
  async generateNarrativePlan(params) {
    const bible = await this.ai.generatePlan(params);
    return bible;
  }

  /**
   * 2. Étape Initialisation : Crée la fiche histoire brouillon et la mémoire dans Supabase
   */
  async initializeStoryWithBible(bible, adminUser) {
    const storyId = 'story-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    
    const storyRecord = {
      id: storyId,
      title: bible.title,
      subtitle: bible.subtitle || '',
      author_id: adminUser?.id || 'admin-liva',
      author_name: bible.authorName || adminUser?.name || 'Auteur LIVA',
      author_avatar: adminUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
      banner: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80',
      genre: bible.genre || 'Roman',
      secondary_genre: bible.secondaryGenre || '',
      description: bible.synopsis || '',
      tags: [bible.genre, bible.mood, 'IA Story Engine', bible.targetAudience].filter(Boolean),
      status: 'draft',
      chapters_count: (bible.chaptersPlan || []).length,
      estimated_time: bible.estimatedTime || '30 min',
      rating: 5.0,
      reviews_count: 0,
      likes_count: 0,
      reads_raw: 0,
      is_hero: false,
      is_trending: false,
      is_short: (bible.chaptersPlan || []).length <= 2
    };

    // 1. Sauvegarder dans public.stories
    const { error: storyErr } = await supabase.from('stories').upsert(storyRecord);
    if (storyErr) throw storyErr;

    // 2. Initialiser la mémoire
    const memory = new StoryMemory();
    memory.initFromBible(storyId, bible);
    this.memories.set(storyId, memory);

    // 3. Sauvegarder la mémoire narrative dans public.story_ai_memory
    const memoryData = memory.toJSON();
    memoryData.generation_plan = bible;
    const { error: memErr } = await supabase.from('story_ai_memory').upsert(memoryData);
    if (memErr) console.warn('[StoryEngine] Erreur sauvegarde mémoire Supabase:', memErr);

    return { storyId, storyRecord, bible };
  }

  /**
   * 3. Étape Génération Chapitre par Chapitre avec Mémoire Réactive
   */
  async generateFullStory(storyId, bible, onProgress = () => {}) {
    this.activeGenerations.set(storyId, true);

    let memory = this.memories.get(storyId);
    if (!memory) {
      memory = new StoryMemory();
      // Charger depuis Supabase si existant
      const { data: memData } = await supabase.from('story_ai_memory').select('*').eq('story_id', storyId).single();
      if (memData) {
        memory.fromJSON(memData);
      } else {
        memory.initFromBible(storyId, bible);
      }
      this.memories.set(storyId, memory);
    }

    const plan = bible.chaptersPlan || [];
    const totalChapters = plan.length;
    const generatedChapters = [];

    // Récupérer les chapitres déjà existants pour reprise
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', storyId)
      .order('number', { ascending: true });

    const existingMap = new Map((existingChapters || []).map(c => [c.number, c]));

    for (let i = 0; i < totalChapters; i++) {
      if (!this.activeGenerations.get(storyId)) {
        onProgress({
          status: 'paused',
          currentChapter: i,
          totalChapters: totalChapters,
          percent: Math.round((i / totalChapters) * 100),
          message: `Génération mise en pause au Chapitre ${i}/${totalChapters}.`
        });
        break;
      }

      const planItem = plan[i];
      const chapNumber = planItem.number;

      // Si le chapitre existe déjà, on le réutilise (reprise après crash)
      if (existingMap.has(chapNumber)) {
        const existing = existingMap.get(chapNumber);
        generatedChapters.push(existing);
        memory.updateWithChapter(chapNumber, existing.title, existing.content, planItem);
        onProgress({
          status: 'resuming',
          currentChapter: chapNumber,
          totalChapters: totalChapters,
          percent: Math.round((chapNumber / totalChapters) * 100),
          chapter: existing,
          message: `Chapitre ${chapNumber}/${totalChapters} déjà généré (chargé depuis la mémoire).`
        });
        continue;
      }

      // Notification de début d'écriture
      onProgress({
        status: 'writing',
        currentChapter: chapNumber,
        totalChapters: totalChapters,
        percent: Math.round(((chapNumber - 1) / totalChapters) * 100),
        message: `Écriture du Chapitre ${chapNumber}/${totalChapters} : « ${planItem.title} »...`
      });

      // Contexte mémoire
      const memoryContext = memory.getContextForNextChapter(planItem);

      // Génération IA du chapitre
      const chapterData = await this.ai.generateChapter(planItem, memoryContext, bible);

      // Formatage du record
      const chapterRecord = {
        id: `${storyId}-chap-${chapNumber}`,
        story_id: storyId,
        number: chapNumber,
        title: chapterData.title,
        duration: chapterData.duration,
        read_time_min: chapterData.readTimeMin,
        content: chapterData.content
      };

      // Persistance immédiate du chapitre dans public.chapters
      const { error: chapErr } = await supabase.from('chapters').upsert(chapterRecord);
      if (chapErr) console.error('[StoryEngine] Erreur persistance chapitre:', chapErr);

      generatedChapters.push(chapterRecord);

      // Mise à jour vivante de la mémoire narrative
      memory.updateWithChapter(chapNumber, chapterData.title, chapterData.content, planItem);

      // Sauvegarde de l'état mémoire dans public.story_ai_memory
      const memoryData = memory.toJSON();
      memoryData.generation_plan = bible;
      await supabase.from('story_ai_memory').upsert(memoryData);

      // Notification de complétion du chapitre
      onProgress({
        status: 'chapter_completed',
        currentChapter: chapNumber,
        totalChapters: totalChapters,
        percent: Math.round((chapNumber / totalChapters) * 100),
        chapter: chapterRecord,
        message: `✓ Chapitre ${chapNumber}/${totalChapters} sauvegardé avec succès.`
      });
    }

    // Mise à jour de la durée totale estimée de l'histoire
    const totalMinutes = generatedChapters.reduce((acc, c) => acc + (c.read_time_min || 6), 0);
    await supabase.from('stories').update({
      chapters_count: generatedChapters.length,
      estimated_time: `${totalMinutes} min`
    }).eq('id', storyId);

    this.activeGenerations.delete(storyId);

    // Audit qualité automatique post-génération
    const qualityReport = await this.ai.runQualityAudit({ id: storyId }, generatedChapters, memory);
    await supabase.from('story_ai_memory').update({
      quality_report: qualityReport,
      current_step: 'completed'
    }).eq('story_id', storyId);

    onProgress({
      status: 'completed',
      currentChapter: totalChapters,
      totalChapters: totalChapters,
      percent: 100,
      chapters: generatedChapters,
      qualityReport: qualityReport,
      message: `🎉 Histoire complète générée et vérifiée avec succès (${generatedChapters.length} chapitres) !`
    });

    return {
      storyId: storyId,
      chapters: generatedChapters,
      qualityReport: qualityReport
    };
  }

  /**
   * Met en pause une génération en cours
   */
  pauseGeneration(storyId) {
    this.activeGenerations.set(storyId, false);
  }

  /**
   * 4. Réécriture contextuelle d'un chapitre via un prompt utilisateur
   */
  async rewriteChapter(storyId, chapterNumber, instruction) {
    const { data: chapter } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', storyId)
      .eq('number', chapterNumber)
      .single();

    if (!chapter) throw new Error('Chapitre introuvable.');

    const memory = this.memories.get(storyId) || new StoryMemory();
    const newContent = await this.ai.rewriteChapter(chapter.content, instruction, memory);

    const words = newContent.split(/\s+/).length;
    const durationMin = Math.max(3, Math.ceil(words / 180));

    await supabase.from('chapters').update({
      content: newContent,
      duration: `${durationMin} min`,
      read_time_min: durationMin
    }).eq('id', chapter.id);

    return {
      ...chapter,
      content: newContent,
      duration: `${durationMin} min`,
      read_time_min: durationMin
    };
  }

  /**
   * 5. Génération du Chapitre Suivant (Extension d'histoire)
   */
  async generateNextChapter(storyId, bible) {
    const { data: currentChapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', storyId)
      .order('number', { ascending: true });

    const nextNum = (currentChapters || []).length + 1;
    const memory = this.memories.get(storyId) || new StoryMemory();

    const planItem = {
      number: nextNum,
      title: `Chapitre ${nextNum} : Nouvel Horizon`,
      objective: `Poursuivre les conséquences des révélations précédentes.`,
      keyEvent: `Un nouveau défi imprévu surgit.`,
      cliffhanger: `Une ombre se profile à l'horizon.`
    };

    const memoryContext = memory.getContextForNextChapter(planItem);
    const chapterData = await this.ai.generateChapter(planItem, memoryContext, bible || {});

    const newChapterRecord = {
      id: `${storyId}-chap-${nextNum}`,
      story_id: storyId,
      number: nextNum,
      title: chapterData.title,
      duration: chapterData.duration,
      read_time_min: chapterData.readTimeMin,
      content: chapterData.content
    };

    await supabase.from('chapters').upsert(newChapterRecord);
    memory.updateWithChapter(nextNum, chapterData.title, chapterData.content, planItem);
    await supabase.from('story_ai_memory').upsert(memory.toJSON());

    // Mettre à jour le compteur dans stories
    await supabase.from('stories').update({
      chapters_count: nextNum
    }).eq('id', storyId);

    return newChapterRecord;
  }

  /**
   * 6. Publication de l'histoire terminée dans LIVA
   */
  async publishStory(storyId) {
    const { error } = await supabase.from('stories').update({
      status: 'published'
    }).eq('id', storyId);

    if (error) throw error;
    return true;
  }
}
