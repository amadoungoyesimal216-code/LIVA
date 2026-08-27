// LIVA - Service d'Intégration Supabase Cloud Client (Auth & Persistance Réelle)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://tfvstehpbkxcisiomdpg.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdnN0ZWhwYmt4Y2lzaW9tZHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTc5NDEsImV4cCI6MjEwMzQzMzk0MX0.nTqJf0y2zQsAt1r_AZYzLNdj7V06YmTY63gMR_7PN04';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Service de persistance et d'authentification Supabase pour LIVA
 */
export class SupabaseService {
  // ==========================================
  // 1. AUTHENTIFICATION SUPABASE RÉELLE
  // ==========================================

  /**
   * Inscription d'un véritable utilisateur avec confirmation immédiate
   */
  static async signUp(email, password, { name, username, favoriteGenres }) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.startsWith('@') ? username : `@${username}`;
      const cleanGenres = favoriteGenres || ['romance', 'african'];

      // 1. Appel RPC sécurisé (création auth.users + profiles avec mot de passe haché)
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('register_user_direct', {
        p_email: cleanEmail,
        p_password: password,
        p_name: name.trim(),
        p_username: cleanUsername,
        p_genres: cleanGenres
      });

      if (rpcErr) {
        throw new Error(rpcErr.message || 'Erreur lors de la création du compte.');
      }

      if (rpcRes && rpcRes.success === false) {
        throw new Error(rpcRes.error || 'Erreur lors de l\'enregistrement.');
      }

      // 2. Connexion immédiate pour obtenir la session JWT
      const loginRes = await this.signIn(cleanEmail, password);
      return loginRes;
    } catch (err) {
      console.error('[SupabaseService] Erreur signUp:', err);
      throw err;
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  static async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Utilisateur non trouvé.');

      // Charger le profil de l'utilisateur
      const profile = await this.fetchUserProfile(data.user.id);
      return { user: data.user, profile, session: data.session };
    } catch (err) {
      console.error('[SupabaseService] Erreur signIn:', err);
      throw err;
    }
  }

  /**
   * Déconnexion complète
   */
  static async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[SupabaseService] Erreur signOut:', err);
    }
  }

  /**
   * Récupération de la session active actuelle
   */
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return null;
      return data.session;
    } catch (err) {
      return null;
    }
  }

  /**
   * Écouteur des changements d'état d'authentification
   */
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  // ==========================================
  // 2. DONNÉES UTILISATEURS (PROFIL & DONNÉES PRIVÉES)
  // ==========================================

  /**
   * Récupère le profil réel d'un utilisateur par son ID
   */
  static async fetchUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        name: data.name || 'Lecteur Liva',
        username: data.username || '@lecteur',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        bio: data.bio || '',
        stats: data.stats || { storiesRead: 0, hoursRead: 0, followingCount: 0, followersCount: 0, likesCount: 0 },
        favoriteGenres: data.favorite_genres || ['romance', 'african']
      };
    } catch (err) {
      console.warn('[SupabaseService] fetchUserProfile:', err);
      return null;
    }
  }

  /**
   * Récupère la bibliothèque personnelle d'un utilisateur
   */
  static async fetchUserLibrary(userId) {
    try {
      const { data, error } = await supabase
        .from('user_library')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return { reading: [], saved: [], liked: [] };

      const reading = data
        .filter(r => (r.progress_percent > 0 || r.current_chapter_index > 0))
        .map(r => ({
          storyId: r.story_id,
          progressPercent: r.progress_percent || 0,
          currentChapterIndex: r.current_chapter_index || 0,
          lastReadAt: r.updated_at
        }));

      const saved = data.filter(r => r.is_saved).map(r => r.story_id);
      const liked = data.filter(r => r.is_liked).map(r => r.story_id);

      return { reading, saved, liked };
    } catch (err) {
      console.warn('[SupabaseService] fetchUserLibrary:', err);
      return { reading: [], saved: [], liked: [] };
    }
  }

  /**
   * Récupère les collections d'un utilisateur
   */
  static async fetchUserCollections(userId) {
    try {
      const { data: cols, error: errCols } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (errCols || !cols) return [];

      const { data: items } = await supabase
        .from('collection_stories')
        .select('*');

      return cols.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || '📚',
        description: c.description || '',
        storyIds: (items || []).filter(i => i.collection_id === c.id).map(i => i.story_id),
        createdAt: c.created_at
      }));
    } catch (err) {
      console.warn('[SupabaseService] fetchUserCollections:', err);
      return [];
    }
  }

  /**
   * Récupère les auteurs suivis par un utilisateur
   */
  static async fetchUserFollows(userId) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('author_id')
        .eq('follower_id', userId);

      if (error || !data) return [];
      return data.map(f => f.author_id);
    } catch (err) {
      return [];
    }
  }

  /**
   * Récupère les notifications réelles d'un utilisateur
   */
  static async fetchUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        desc: n.description,
        icon: n.icon || '✨',
        storyId: n.story_id,
        isRead: n.is_read,
        time: 'Récemment'
      }));
    } catch (err) {
      return [];
    }
  }

  // ==========================================
  // 3. PERSISTANCE DES ACTIONS UTILISATEUR
  // ==========================================

  /**
   * Met à jour la progression de lecture ou le statut favori/like
   */
  static async syncUserLibrary(userId, storyId, data) {
    if (!userId || userId === 'guest') return;
    try {
      const updateData = {
        user_id: userId,
        story_id: storyId,
        updated_at: new Date().toISOString()
      };
      if (data.progressPercent !== undefined) updateData.progress_percent = data.progressPercent;
      if (data.currentChapterIndex !== undefined) updateData.current_chapter_index = data.currentChapterIndex;
      if (data.isSaved !== undefined) updateData.is_saved = data.isSaved;
      if (data.isLiked !== undefined) updateData.is_liked = data.isLiked;

      await supabase.from('user_library').upsert(updateData);
    } catch (err) {
      console.warn('[SupabaseService] syncUserLibrary error:', err);
    }
  }

  /**
   * Suivre ou ne plus suivre un auteur
   */
  static async syncFollow(followerId, authorId, isFollowing) {
    if (!followerId || followerId === 'guest') return;
    try {
      if (isFollowing) {
        await supabase.from('follows').upsert({ follower_id: followerId, author_id: authorId });
      } else {
        await supabase.from('follows').delete().match({ follower_id: followerId, author_id: authorId });
      }
    } catch (err) {
      console.warn('[SupabaseService] syncFollow error:', err);
    }
  }

  /**
   * Créer une collection personnalisée
   */
  static async createCollection(userId, collection) {
    if (!userId || userId === 'guest') return;
    try {
      await supabase.from('collections').insert({
        id: collection.id,
        user_id: userId,
        name: collection.name,
        icon: collection.icon || '📚',
        description: collection.description || ''
      });
    } catch (err) {
      console.warn('[SupabaseService] createCollection error:', err);
    }
  }

  /**
   * Ajouter une histoire à une collection
   */
  static async addStoryToCollection(collectionId, storyId) {
    try {
      await supabase.from('collection_stories').upsert({
        collection_id: collectionId,
        story_id: storyId
      });
    } catch (err) {
      console.warn('[SupabaseService] addStoryToCollection error:', err);
    }
  }

  /**
   * Retirer une histoire d'une collection
   */
  static async removeStoryFromCollection(collectionId, storyId) {
    try {
      await supabase.from('collection_stories').delete().match({
        collection_id: collectionId,
        story_id: storyId
      });
    } catch (err) {
      console.warn('[SupabaseService] removeStoryFromCollection error:', err);
    }
  }

  /**
   * Supprimer une collection
   */
  static async deleteCollection(collectionId) {
    try {
      await supabase.from('collections').delete().eq('id', collectionId);
    } catch (err) {
      console.warn('[SupabaseService] deleteCollection error:', err);
    }
  }

  /**
   * Enregistrer un avis sur une histoire
   */
  static async addReview(storyId, review) {
    try {
      await supabase.from('reviews').insert({
        id: `${storyId}-${review.id || Date.now()}`,
        story_id: storyId,
        user_id: review.userId || 'user-anon',
        user_name: review.userName,
        user_avatar: review.userAvatar,
        rating: review.rating,
        date: review.date || 'À l\'instant',
        content: review.content,
        likes: 0
      });
    } catch (err) {
      console.warn('[SupabaseService] addReview error:', err);
    }
  }

  /**
   * Sauvegarder ou mettre à jour un profil utilisateur
   */
  static async saveProfile(profile) {
    if (!profile.id || profile.id === 'guest') return;
    try {
      await supabase.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        name: profile.name,
        avatar: profile.avatar,
        bio: profile.bio,
        stats: profile.stats || {},
        favorite_genres: profile.favoriteGenres || ['romance', 'african']
      });
    } catch (err) {
      console.warn('[SupabaseService] saveProfile error:', err);
    }
  }

  /**
   * Sauvegarde une histoire rédigée dans le Studio Auteur
   */
  static async saveAuthoredStory(story) {
    try {
      await supabase.from('stories').upsert({
        id: story.id,
        title: story.title,
        subtitle: story.subtitle || '',
        author_id: story.authorId || 'user-current',
        author_name: story.authorName || 'Auteur LIVA',
        author_avatar: story.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        cover: story.cover,
        banner: story.banner || story.cover,
        genre: story.genre,
        secondary_genre: story.secondaryGenre || '',
        rating: 5.0,
        reviews_count: 0,
        reads_count: '0',
        reads_raw: 0,
        likes_count: 0,
        chapters_count: story.chapters ? story.chapters.length : 1,
        estimated_time: story.estimatedTime || '5 min',
        is_trending: false,
        is_hero: false,
        is_short: !!story.isShort,
        featured_badge: story.status === 'published' ? '● Publiée' : '⚡ Brouillon',
        description: story.description,
        tags: story.tags || [story.genre],
        status: story.status || 'published'
      });

      if (story.chapters && story.chapters.length > 0) {
        const chaptersData = story.chapters.map((c, idx) => ({
          id: `${story.id}-chap-${idx + 1}`,
          story_id: story.id,
          number: idx + 1,
          title: c.title || `Chapitre ${idx + 1}`,
          duration: c.duration || '5 min',
          read_time_min: c.readTimeMin || 5,
          content: c.content || ''
        }));
        await supabase.from('chapters').upsert(chaptersData);
      }
    } catch (err) {
      console.warn('[SupabaseService] saveAuthoredStory error:', err);
    }
  }

  // ==========================================
  // 4. DONNÉES PUBLIQUES (HISTOIRES & AUTEURS)
  // ==========================================

  /**
   * Récupère toutes les histoires publiées avec chapitres et avis
   */
  static async fetchStories() {
    try {
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .order('rating', { ascending: false });

      if (error || !storiesData || storiesData.length === 0) return null;

      const { data: chaptersData } = await supabase.from('chapters').select('*').order('number', { ascending: true });
      const { data: reviewsData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });

      return storiesData.map(s => {
        const storyChapters = (chaptersData || []).filter(c => c.story_id === s.id).map(c => ({
          id: c.id.replace(`${s.id}-`, ''),
          number: c.number,
          title: c.title,
          duration: c.duration,
          readTimeMin: c.read_time_min,
          content: c.content
        }));

        const storyReviews = (reviewsData || []).filter(r => r.story_id === s.id).map(r => ({
          id: r.id.replace(`${s.id}-`, ''),
          userId: r.user_id,
          userName: r.user_name,
          userAvatar: r.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          rating: r.rating,
          date: r.date,
          content: r.content,
          likes: r.likes || 0
        }));

        return {
          id: s.id,
          title: s.title,
          subtitle: s.subtitle,
          authorId: s.author_id,
          authorName: s.author_name,
          authorAvatar: s.author_avatar,
          cover: s.cover,
          banner: s.banner,
          genre: s.genre,
          secondaryGenre: s.secondary_genre,
          rating: Number(s.rating) || 5.0,
          reviewsCount: s.reviews_count,
          readsCount: s.reads_count,
          readsRaw: s.reads_raw,
          likesCount: s.likes_count,
          chaptersCount: s.chapters_count,
          estimatedTime: s.estimated_time,
          isTrending: s.is_trending,
          isHero: s.is_hero,
          isShort: s.is_short,
          featuredBadge: s.featured_badge,
          description: s.description,
          tags: s.tags || [],
          status: s.status || 'published',
          audioDuration: s.audio_duration,
          audioVoice: s.audio_voice,
          chapters: storyChapters,
          reviews: storyReviews
        };
      });
    } catch (err) {
      console.warn('[SupabaseService] fetchStories offline/fallback:', err);
      return null;
    }
  }

  /**
   * Récupère tous les auteurs vérifiés
   */
  static async fetchAuthors() {
    try {
      const { data, error } = await supabase.from('authors').select('*').order('followers_raw', { ascending: false });
      if (error || !data || data.length === 0) return null;
      return data.map(a => ({
        id: a.id,
        name: a.name,
        username: a.username,
        avatar: a.avatar,
        bio: a.bio,
        followers: a.followers,
        followersCount: a.followers_raw,
        verified: a.verified,
        totalReads: a.total_reads,
        storiesCount: a.stories_count,
        likesCount: a.likes_count
      }));
    } catch (err) {
      console.warn('[SupabaseService] fetchAuthors offline/fallback:', err);
      return null;
    }
  }
}
