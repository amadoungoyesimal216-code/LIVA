// LIVA ADMIN — Service Supabase dédié à l'Administration & Back-Office
import { supabase } from './supabaseClient.js';

// Cache mémoire haute performance pour le panneau d'administration (TTL: 60s)
const adminCache = new Map();
const CACHE_TTL_MS = 60000;

function getFromCache(key) {
  const item = adminCache.get(key);
  if (item && (Date.now() - item.time < CACHE_TTL_MS)) {
    return item.data;
  }
  return null;
}

function saveToCache(key, data) {
  adminCache.set(key, { data, time: Date.now() });
}

export function clearAdminCache(prefix = null) {
  if (!prefix) {
    adminCache.clear();
  } else {
    for (const k of adminCache.keys()) {
      if (k.startsWith(prefix)) adminCache.delete(k);
    }
  }
}

/**
 * Helper de protection contre les timeouts réseaux Supabase
 */
async function withTimeout(promise, ms = 7000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Délai d\'attente dépassé (timeout Supabase)')), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

export class SupabaseAdminService {
  /**
   * Nettoyer le cache d'administration
   */
  static clearCache(prefix = null) {
    clearAdminCache(prefix);
  }

  /**
   * 1. Métriques Clés & KPI du Dashboard
   */
  static async getDashboardStats(forceRefresh = false) {
    const cacheKey = 'admin_stats';
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      // 1. Tenter l'appel RPC sécurisé avec timeout
      try {
        const { data, error } = await withTimeout(supabase.rpc('admin_get_stats'), 4500);
        if (!error && data) {
          saveToCache(cacheKey, data);
          return data;
        }
      } catch (rpcErr) {
        console.warn('[SupabaseAdmin] RPC admin_get_stats indisponible/lent, calcul direct...');
      }

      // 2. Fallback direct par requêtes légères en parallèle
      const [
        resUsers,
        resStories,
        resPublished,
        resAuthors,
        resReviews,
        resReports,
        resTopStories
      ] = await Promise.allSettled([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('stories').select('id', { count: 'exact', head: true }),
        supabase.from('stories').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('authors').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('stories').select('id, title, author_name, genre, cover, reads_raw, likes_count, rating').order('reads_raw', { ascending: false }).limit(6)
      ]);

      const totalUsers = resUsers.status === 'fulfilled' ? resUsers.value?.count || 0 : 0;
      const totalStories = resStories.status === 'fulfilled' ? resStories.value?.count || 0 : 0;
      const publishedStories = resPublished.status === 'fulfilled' ? resPublished.value?.count || 0 : 0;
      const totalAuthors = resAuthors.status === 'fulfilled' ? resAuthors.value?.count || 0 : 0;
      const totalReviews = resReviews.status === 'fulfilled' ? resReviews.value?.count || 0 : 0;
      const pendingReports = resReports.status === 'fulfilled' ? resReports.value?.count || 0 : 0;
      const topStories = resTopStories.status === 'fulfilled' ? resTopStories.value?.data || [] : [];

      let totalReads = 0;
      let totalLikes = 0;
      let sumRating = 0;
      topStories.forEach(st => {
        totalReads += Number(st.reads_raw) || 0;
        totalLikes += Number(st.likes_count) || 0;
        sumRating += Number(st.rating) || 5;
      });

      const calculatedStats = {
        totalUsers,
        newUsers: Math.min(totalUsers, 5),
        totalStories,
        publishedStories,
        draftStories: Math.max(0, totalStories - publishedStories),
        totalReads,
        totalLikes,
        totalAuthors,
        totalReviews,
        pendingReports,
        averageRating: topStories.length > 0 ? Number((sumRating / topStories.length).toFixed(1)) : 5.0,
        genreDistribution: [],
        topStories,
        recentUsers: [],
        recentLogs: []
      };

      saveToCache(cacheKey, calculatedStats);
      return calculatedStats;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getDashboardStats:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || null;
    }
  }

  /**
   * 2. Gestion des Histoires
   */
  static async getStories(filters = {}, forceRefresh = false) {
    const cacheKey = `stories_${JSON.stringify(filters)}`;
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      let query = supabase.from('stories').select('*').order('created_at', { ascending: false });

      if (filters.genre && filters.genre !== 'all') {
        query = query.ilike('genre', `%${filters.genre}%`);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search.trim()}%`);
      }

      const { data, error } = await withTimeout(query, 6000);
      if (error) throw error;
      const result = data || [];
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getStories:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || [];
    }
  }

  static async upsertStory(story, adminUser) {
    try {
      const storyId = story.id || story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        id: storyId,
        title: story.title.trim(),
        subtitle: story.subtitle || '',
        author_id: story.author_id || adminUser.id,
        author_name: story.author_name || adminUser.name,
        author_avatar: story.author_avatar || adminUser.avatar,
        cover: story.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        banner: story.banner || story.cover,
        genre: story.genre || 'Romance',
        secondary_genre: story.secondary_genre || '',
        description: story.description || '',
        tags: story.tags || [],
        status: story.status || 'published',
        rating: story.rating || 5.0,
        reviews_count: story.reviews_count || 0,
        reads_raw: story.reads_raw || 0,
        reads_count: story.reads_count || '0',
        likes_count: story.likes_count || 0,
        chapters_count: story.chapters_count || 1,
        estimated_time: story.estimated_time || '10 min',
        is_trending: Boolean(story.is_trending),
        is_hero: Boolean(story.is_hero),
        is_short: Boolean(story.is_short),
        created_at: story.created_at || new Date().toISOString()
      };

      const { data, error } = await supabase.from('stories').upsert(payload).select();
      if (error) throw error;

      await this.logAction(
        adminUser.id,
        adminUser.name,
        story.id ? 'MODIFICATION_HISTOIRE' : 'CREATION_HISTOIRE',
        'story',
        storyId,
        `Histoire "${story.title}" (${payload.status}) enregistrée.`
      );

      return data?.[0] || payload;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur upsertStory:', err);
      throw err;
    }
  }

  static async upsertStoryWithChapters(story, chapters = [], adminUser) {
    try {
      const storyId = story.id || story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Calcul durée totale
      let totalMinutes = 0;
      chapters.forEach(ch => {
        const words = (ch.content || '').trim().split(/\s+/).filter(Boolean).length;
        const mins = ch.read_time_min || Math.max(1, Math.ceil(words / 200));
        totalMinutes += mins;
      });
      const estimatedTime = totalMinutes > 60 
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60} min` 
        : `${Math.max(1, totalMinutes)} min`;

      const tagsArray = Array.isArray(story.tags) 
        ? story.tags 
        : (story.tags || '').split(',').map(t => t.trim()).filter(Boolean);

      const storyPayload = {
        id: storyId,
        title: story.title.trim(),
        subtitle: story.subtitle || '',
        author_id: story.author_id || adminUser.id,
        author_name: story.author_name || adminUser.name,
        author_avatar: story.author_avatar || adminUser.avatar,
        cover: story.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        banner: story.banner || story.cover,
        genre: story.genre || 'Romance',
        secondary_genre: story.secondary_genre || '',
        description: story.description || '',
        tags: tagsArray,
        status: story.status || 'published',
        rating: story.rating || 5.0,
        reviews_count: story.reviews_count || 0,
        reads_raw: story.reads_raw || 0,
        reads_count: String(story.reads_raw || 0),
        likes_count: story.likes_count || 0,
        chapters_count: Math.max(1, chapters.length),
        estimated_time: estimatedTime,
        is_trending: Boolean(story.is_trending),
        is_hero: Boolean(story.is_hero),
        is_short: Boolean(story.is_short || totalMinutes <= 15),
        created_at: story.created_at || new Date().toISOString()
      };

      const { data: savedStory, error: storyError } = await supabase.from('stories').upsert(storyPayload).select();
      if (storyError) throw storyError;

      // Enregistrement des chapitres
      if (chapters.length > 0) {
        const chapterPayloads = chapters.map((ch, idx) => {
          const words = (ch.content || '').trim().split(/\s+/).filter(Boolean).length;
          const mins = ch.read_time_min || Math.max(1, Math.ceil(words / 200));
          return {
            id: ch.id || `${storyId}-ch-${idx + 1}`,
            story_id: storyId,
            number: idx + 1,
            title: ch.title ? ch.title.trim() : `Chapitre ${idx + 1}`,
            duration: `${mins} min`,
            read_time_min: mins,
            content: ch.content || '',
            created_at: ch.created_at || new Date().toISOString()
          };
        });

        // Supprimer les chapitres supprimés en cas de modification
        if (story.id) {
          const keepIds = chapterPayloads.map(c => c.id);
          const filterStr = `(${keepIds.map(id => `"${id}"`).join(',')})`;
          await supabase.from('chapters').delete().eq('story_id', storyId).not('id', 'in', filterStr);
        }

        // Upsert batch
        const { error: chError } = await supabase.from('chapters').upsert(chapterPayloads);
        if (chError) console.warn('[SupabaseAdmin] Erreur upsert chapters batch:', chError);
      }

      // Invalider le cache pour actualisation instantanée
      clearAdminCache();

      await this.logAction(
        adminUser.id,
        adminUser.name,
        story.id ? 'MODIFICATION_HISTOIRE' : 'CREATION_HISTOIRE',
        'story',
        storyId,
        `Histoire "${story.title}" (${storyPayload.status}) et ses ${chapters.length} chapitres enregistrés.`
      );

      return savedStory?.[0] || storyPayload;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur upsertStoryWithChapters:', err);
      throw err;
    }
  }

  static async uploadImage(file, bucket = 'covers') {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

      if (error) {
        // Fallback Base64 si le bucket n'est pas configuré publiquement
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return publicData?.publicUrl || filePath;
    } catch (err) {
      console.warn('[SupabaseAdmin] Storage upload fallback Base64:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }
  }

  static async deleteStory(storyId, storyTitle, adminUser) {
    try {
      await supabase.from('chapters').delete().eq('story_id', storyId);
      await supabase.from('reviews').delete().eq('story_id', storyId);
      const { error } = await supabase.from('stories').delete().eq('id', storyId);
      if (error) throw error;

      clearAdminCache();

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'SUPPRESSION_HISTOIRE',
        'story',
        storyId,
        `Suppression définitive de l'histoire "${storyTitle || storyId}".`
      );

      return true;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur deleteStory:', err);
      throw err;
    }
  }

  /**
   * 3. Gestion des Chapitres
   */
  static async getChapters(storyId, forceRefresh = false) {
    return this.getChaptersByStoryId(storyId, forceRefresh);
  }

  static async getChaptersByStoryId(storyId, forceRefresh = false) {
    if (!storyId) return [];
    const cacheKey = `chapters_${storyId}`;
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('chapters')
          .select('*')
          .eq('story_id', storyId)
          .order('number', { ascending: true }),
        6000
      );

      if (error) throw error;
      const result = data || [];
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getChaptersByStoryId:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || [];
    }
  }

  static async upsertChapter(chapter, adminUser) {
    try {
      const words = (chapter.content || '').trim().split(/\s+/).filter(Boolean).length;
      const mins = chapter.read_time_min || Math.max(1, Math.ceil(words / 200));

      const payload = {
        id: chapter.id || `${chapter.story_id}-ch-${chapter.number || Date.now()}`,
        story_id: chapter.story_id,
        number: Number(chapter.number) || 1,
        title: chapter.title.trim(),
        duration: `${mins} min`,
        read_time_min: mins,
        content: chapter.content || '',
        created_at: chapter.created_at || new Date().toISOString()
      };

      // 1. Appel via la fonction RPC sécurisée
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_upsert_chapter', {
          p_id: payload.id,
          p_story_id: payload.story_id,
          p_number: payload.number,
          p_title: payload.title,
          p_duration: payload.duration,
          p_read_time_min: payload.read_time_min,
          p_content: payload.content,
          p_admin_id: adminUser?.id || null,
          p_admin_name: adminUser?.name || 'Admin'
        });
        if (!rpcErr && rpcRes) {
          clearAdminCache();
          return { id: rpcRes.id || payload.id, ...payload };
        }
      } catch (e) {
        // En cas d'indisponibilité RPC, bascule sur l'upsert direct
      }

      // 2. Fallback direct sur la table chapters
      const { data, error } = await supabase.from('chapters').upsert(payload).select();
      if (error) throw error;

      clearAdminCache();

      const { count } = await supabase.from('chapters').select('id', { count: 'exact', head: true }).eq('story_id', chapter.story_id);
      await supabase.from('stories').update({ chapters_count: Math.max(1, count || 1) }).eq('id', chapter.story_id);

      return data?.[0] || payload;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur upsertChapter:', err);
      throw err;
    }
  }

  static async deleteChapter(chapterId, storyId, chapterTitle, adminUser) {
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
      if (error) throw error;

      clearAdminCache();

      const { count } = await supabase.from('chapters').select('id', { count: 'exact', head: true }).eq('story_id', storyId);
      await supabase.from('stories').update({ chapters_count: Math.max(1, count || 1) }).eq('id', storyId);

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'SUPPRESSION_CHAPITRE',
        'chapter',
        chapterId,
        `Suppression du chapitre "${chapterTitle || chapterId}".`
      );

      return true;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur deleteChapter:', err);
      throw err;
    }
  }

  /**
   * 4. Gestion des Auteurs
   */
  static async getAuthors(forceRefresh = false) {
    const cacheKey = 'admin_authors';
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await withTimeout(
        supabase.from('authors').select('*').order('created_at', { ascending: false }),
        6000
      );
      if (error) throw error;
      const result = data || [];
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getAuthors:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || [];
    }
  }

  static async updateAuthorStatus(authorId, status, adminUser) {
    try {
      const { error } = await supabase.from('authors').update({ status }).eq('id', authorId);
      if (error) throw error;

      clearAdminCache('admin_authors');

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'MODIFICATION_STATUT_AUTEUR',
        'author',
        authorId,
        `Statut auteur passé à "${status}".`
      );
      return true;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur updateAuthorStatus:', err);
      throw err;
    }
  }

  /**
   * 5. Gestion des Utilisateurs & Rôles
   */
  static async getUsers(search = '', role = 'all', status = 'all', forceRefresh = false) {
    const cacheKey = `users_${search}_${role}_${status}`;
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (role !== 'all') query = query.eq('role', role);
      if (status !== 'all') query = query.eq('status', status);
      if (search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,username.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
      }

      const { data, error } = await withTimeout(query, 6000);
      if (error) throw error;
      const result = data || [];
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getUsers:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || [];
    }
  }

  static async setUserRole(userId, newRole, adminUser) {
    try {
      const { data, error } = await supabase.rpc('admin_set_user_role', {
        p_user_id: userId,
        p_new_role: newRole,
        p_admin_id: adminUser.id,
        p_admin_name: adminUser.name
      });
      if (error) throw error;

      clearAdminCache('users_');
      return data;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur setUserRole:', err);
      throw err;
    }
  }

  static async setUserStatus(userId, status, adminUser) {
    try {
      const { data, error } = await supabase.rpc('admin_set_user_status', {
        p_user_id: userId,
        p_status: status,
        p_admin_id: adminUser.id,
        p_admin_name: adminUser.name
      });
      if (error) throw error;

      clearAdminCache('users_');
      return data;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur setUserStatus:', err);
      throw err;
    }
  }

  /**
   * 6. Modération des Commentaires
   */
  static async getReviews(filters = {}, forceRefresh = false) {
    const cacheKey = `reviews_${JSON.stringify(filters)}`;
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await withTimeout(query, 6000);
      if (error) throw error;
      const result = data || [];
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getReviews:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || [];
    }
  }

  static async updateReviewStatus(reviewId, status, adminUser) {
    try {
      const { error } = await supabase.from('reviews').update({ status }).eq('id', reviewId);
      if (error) throw error;

      clearAdminCache('reviews');

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'MODERATION_COMMENTAIRE',
        'review',
        reviewId,
        `Statut du commentaire passé à "${status}".`
      );
      return true;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur updateReviewStatus:', err);
      throw err;
    }
  }

  /**
   * 7. Centre des Signalements
   */
  static async getReports(status = 'all', forceRefresh = false) {
    const cacheKey = `reports_${status}`;
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (status !== 'all') query = query.eq('status', status);

      const { data, error } = await withTimeout(query, 6000);
      if (error) throw error;
      const result = data || [];
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getReports:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || [];
    }
  }

  static async updateReportStatus(reportId, status, adminUser) {
    try {
      const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
      if (error) throw error;

      clearAdminCache('reports');

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'TRAITEMENT_SIGNALEMENT',
        'report',
        reportId,
        `Signalement marqué comme "${status}".`
      );
      return true;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur updateReportStatus:', err);
      throw err;
    }
  }

  /**
   * 8. Catégories & Tags
   */
  static async getCategories(forceRefresh = false) {
    const cacheKey = 'admin_categories';
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await withTimeout(
        supabase.from('categories').select('*').order('name', { ascending: true }),
        6000
      );
      if (error) throw error;
      const result = data || [];
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getCategories:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || [];
    }
  }

  static async upsertCategory(cat, adminUser) {
    try {
      const { data, error } = await supabase.from('categories').upsert(cat).select();
      if (error) throw error;

      clearAdminCache('admin_categories');

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'ENREGISTREMENT_CATEGORIE',
        'category',
        cat.id,
        `Catégorie "${cat.name}" enregistrée.`
      );
      return data?.[0] || cat;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur upsertCategory:', err);
      throw err;
    }
  }

  static async getTags(forceRefresh = false) {
    const cacheKey = 'admin_tags';
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await withTimeout(
        supabase.from('tags').select('*').order('usage_count', { ascending: false }),
        6000
      );
      if (error) throw error;
      const result = data || [];
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getTags:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || [];
    }
  }

  static async upsertTag(tagName, adminUser) {
    try {
      const tagId = tagName.toLowerCase().trim();
      const payload = { id: tagId, name: tagName.trim() };
      const { data, error } = await supabase.from('tags').upsert(payload).select();
      if (error) throw error;

      clearAdminCache('admin_tags');

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'CREATION_TAG',
        'tag',
        tagId,
        `Tag "${tagName}" créé.`
      );
      return data?.[0] || payload;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur upsertTag:', err);
      throw err;
    }
  }

  /**
   * 9. Notifications Broadcaster
   */
  static async broadcastNotification({ targetGroup, targetUserId, title, message, icon, storyId }, adminUser) {
    try {
      const { data, error } = await supabase.rpc('admin_broadcast_notification', {
        p_target_group: targetGroup || 'ALL',
        p_target_user_id: targetUserId || null,
        p_title: title.trim(),
        p_description: message.trim(),
        p_icon: icon || '📢',
        p_story_id: storyId || null,
        p_admin_id: adminUser.id,
        p_admin_name: adminUser.name
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur broadcastNotification:', err);
      throw err;
    }
  }

  /**
   * 10. Paramètres & Journalisation
   */
  static async getSettings(forceRefresh = false) {
    const cacheKey = 'admin_settings';
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await withTimeout(
        supabase.from('app_settings').select('*'),
        6000
      );
      if (error) throw error;
      const settingsMap = {};
      (data || []).forEach(row => {
        settingsMap[row.key] = row.value;
      });
      saveToCache(cacheKey, settingsMap);
      return settingsMap;
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getSettings:', err);
      const fallback = adminCache.get(cacheKey)?.data;
      return fallback || {};
    }
  }

  static async saveSettings(key, value, adminUser) {
    try {
      const { error } = await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;

      clearAdminCache('admin_settings');

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'MODIFICATION_PARAMETRES',
        'settings',
        key,
        `Mise à jour des paramètres "${key}".`
      );
      return true;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur saveSettings:', err);
      throw err;
    }
  }

  static async getAdminLogs(limit = 50) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit),
        6000
      );
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur getAdminLogs:', err);
      return [];
    }
  }

  static async logAction(adminId, adminName, action, targetType, targetId, details) {
    try {
      await supabase.from('admin_logs').insert({
        id: 'log_' + Math.random().toString(36).substring(2, 10),
        admin_id: adminId || 'admin',
        admin_name: adminName || 'Administrateur',
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[SupabaseAdmin] Erreur logging:', err);
    }
  }
}
