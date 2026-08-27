// LIVA - Service d'Intégration Supabase Cloud Client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://tfvstehpbkxcisiomdpg.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdnN0ZWhwYmt4Y2lzaW9tZHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTc5NDEsImV4cCI6MjEwMzQzMzk0MX0.nTqJf0y2zQsAt1r_AZYzLNdj7V06YmTY63gMR_7PN04';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Service de persistance Supabase pour LIVA
 */
export class SupabaseService {
  /**
   * Récupère toutes les histoires avec leurs chapitres et avis
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

  /**
   * Enregistre un avis sur une histoire
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
   * Met à jour la progression de lecture ou le favori d'un utilisateur
   */
  static async syncUserLibrary(userId, storyId, data) {
    try {
      await supabase.from('user_library').upsert({
        user_id: userId,
        story_id: storyId,
        progress_percent: data.progressPercent || 0,
        current_chapter_index: data.currentChapterIndex || 0,
        is_saved: !!data.isSaved,
        is_liked: !!data.isLiked,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[SupabaseService] syncUserLibrary error:', err);
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

  /**
   * Sauvegarde ou met à jour le profil utilisateur
   */
  static async saveProfile(profile) {
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
}
