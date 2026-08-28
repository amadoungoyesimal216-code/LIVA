// LIVA ADMIN — Service Supabase dédié à l'Administration & Back-Office
import { supabase } from './supabaseClient.js';

export class SupabaseAdminService {
  /**
   * 1. Métriques Clés & KPI du Dashboard
   */
  static async getDashboardStats() {
    try {
      const { data, error } = await supabase.rpc('admin_get_stats');
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getDashboardStats:', err);
      return null;
    }
  }

  /**
   * 2. Gestion des Histoires
   */
  static async getStories(filters = {}) {
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

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getStories:', err);
      return [];
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

  static async deleteStory(storyId, storyTitle, adminUser) {
    try {
      // 1. Supprimer les chapitres
      await supabase.from('chapters').delete().eq('story_id', storyId);
      // 2. Supprimer les avis
      await supabase.from('reviews').delete().eq('story_id', storyId);
      // 3. Supprimer l'histoire
      const { error } = await supabase.from('stories').delete().eq('id', storyId);
      if (error) throw error;

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
  static async getChapters(storyId) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('number', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getChapters:', err);
      return [];
    }
  }

  static async upsertChapter(chapter, adminUser) {
    try {
      const chapterId = chapter.id || `${chapter.story_id}-ch-${chapter.number || Date.now()}`;
      const payload = {
        id: chapterId,
        story_id: chapter.story_id,
        number: parseInt(chapter.number) || 1,
        title: chapter.title.trim(),
        duration: chapter.duration || '5 min',
        read_time_min: parseInt(chapter.read_time_min) || 5,
        content: chapter.content || '',
        created_at: chapter.created_at || new Date().toISOString()
      };

      const { data, error } = await supabase.from('chapters').upsert(payload).select();
      if (error) throw error;

      // Mettre à jour le nombre de chapitres de l'histoire
      const { count } = await supabase.from('chapters').select('id', { count: 'exact', head: true }).eq('story_id', chapter.story_id);
      await supabase.from('stories').update({ chapters_count: count || 1 }).eq('id', chapter.story_id);

      await this.logAction(
        adminUser.id,
        adminUser.name,
        'ENREGISTREMENT_CHAPITRE',
        'chapter',
        chapterId,
        `Chapitre ${payload.number} ("${payload.title}") enregistré pour l'histoire ${chapter.story_id}.`
      );

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
  static async getAuthors() {
    try {
      const { data, error } = await supabase.from('authors').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getAuthors:', err);
      return [];
    }
  }

  static async updateAuthorStatus(authorId, status, adminUser) {
    try {
      const { error } = await supabase.from('authors').update({ status }).eq('id', authorId);
      if (error) throw error;

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
  static async getUsers(search = '', role = 'all', status = 'all') {
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (role !== 'all') query = query.eq('role', role);
      if (status !== 'all') query = query.eq('status', status);
      if (search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,username.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getUsers:', err);
      return [];
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
      return data;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur setUserStatus:', err);
      throw err;
    }
  }

  /**
   * 6. Modération des Commentaires
   */
  static async getReviews(filters = {}) {
    try {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getReviews:', err);
      return [];
    }
  }

  static async updateReviewStatus(reviewId, status, adminUser) {
    try {
      const { error } = await supabase.from('reviews').update({ status }).eq('id', reviewId);
      if (error) throw error;

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
  static async getReports(status = 'all') {
    try {
      let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (status !== 'all') query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getReports:', err);
      return [];
    }
  }

  static async updateReportStatus(reportId, status, adminUser) {
    try {
      const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
      if (error) throw error;

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
  static async getCategories() {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getCategories:', err);
      return [];
    }
  }

  static async upsertCategory(cat, adminUser) {
    try {
      const { data, error } = await supabase.from('categories').upsert(cat).select();
      if (error) throw error;

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

  static async getTags() {
    try {
      const { data, error } = await supabase.from('tags').select('*').order('usage_count', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getTags:', err);
      return [];
    }
  }

  static async upsertTag(tagName, adminUser) {
    try {
      const tagId = tagName.toLowerCase().trim();
      const payload = { id: tagId, name: tagName.trim() };
      const { data, error } = await supabase.from('tags').upsert(payload).select();
      if (error) throw error;

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
  static async getSettings() {
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;
      const settingsMap = {};
      (data || []).forEach(row => {
        settingsMap[row.key] = row.value;
      });
      return settingsMap;
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getSettings:', err);
      return {};
    }
  }

  static async saveSettings(key, value, adminUser) {
    try {
      const { error } = await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;

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
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[SupabaseAdmin] Erreur getAdminLogs:', err);
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
