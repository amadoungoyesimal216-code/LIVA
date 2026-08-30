// LIVA - Gestionnaire d'État Réactif Full-Stack avec Source de Vérité Supabase Cloud
import { STORIES_DATA } from '../data/stories.js';
import { AUTHORS_DATA } from '../data/authors.js';
import { GENRES_DATA } from '../data/genres.js';
import { SupabaseService } from '../services/supabaseClient.js';

const STORAGE_KEY = 'liva_app_state_v2';

export const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNzkyOENBIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkYwMDgwIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSI2NCIgZmlsbD0idXJsKCNncmFkKSIvPjxjaXJjbGUgY3g9IjY0IiBjeT0iNTAiIHI9IjIyIiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjkiLz48cGF0aCBkPSJNMjggMTA2IEMyOCA4NCA0NCA3NiA2NCA3NiBDODQgNzYgMTAwIDg0IDEwMCAxMDYgWiIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC45Ii8+PC9zdmc+';

const GUEST_USER = {
  id: 'guest',
  email: '',
  name: 'Visiteur',
  username: '@visiteur',
  avatar: DEFAULT_AVATAR,
  bio: 'Connectez-vous pour débloquer votre bibliothèque et sauvegarder vos lectures.',
  stats: {
    storiesRead: 0,
    hoursRead: 0,
    followingCount: 0,
    followersCount: 0,
    likesCount: 0
  },
  favoriteGenres: [],
  followedAuthorIds: [],
  likedStoryIds: []
};

const DEFAULT_STATE = {
  theme: 'dark', // 'dark' | 'light' | 'cream'
  onboardingCompleted: false,
  isAuthenticated: false,
  user: { ...GUEST_USER },
  library: {
    reading: [],
    saved: [],
    finished: [],
    offline: [],
    collections: []
  },
  authoredStories: [],
  notifications: [],
  readerSettings: {
    fontFamily: 'Literata',
    fontSize: 19,
    lineHeight: 1.8,
    maxWidth: 720,
    theme: 'dark',
    bionicMode: false,
    textAlignment: 'justify'
  },
  audioState: {
    isPlaying: false,
    storyId: null,
    chapterId: null,
    progressPercent: 0,
    currentTimeSec: 0,
    durationSec: 360,
    playbackRate: 1,
    voiceName: 'Amira (Voix IA Chaleureuse)'
  }
};

class AppStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
    
    // Initialiser immédiatement avec le cache local pour 0ms d'attente
    let initialStories = [...STORIES_DATA];
    try {
      const cached = localStorage.getItem('liva_cached_public_stories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialStories = parsed;
        }
      }
    } catch (e) {}

    this.stories = initialStories;
    this.authors = [...AUTHORS_DATA];
    this.genres = [...GENRES_DATA];
    this.isSyncing = false;

    // Initialisation asynchrone avec Supabase
    this.initSupabaseSync();
  }

  /**
   * Initialisation et synchronisation cloud Supabase
   */
  async initSupabaseSync() {
    this.isSyncing = true;
    try {
      // 1. Charger le catalogue public depuis Supabase
      const [remoteStories, remoteAuthors] = await Promise.all([
        SupabaseService.fetchStories(true),
        SupabaseService.fetchAuthors(true)
      ]);

      if (remoteStories && remoteStories.length > 0) {
        this.stories = remoteStories;
      }
      if (remoteAuthors && remoteAuthors.length > 0) {
        this.authors = remoteAuthors;
      }

      // 2. Vérifier si une session Supabase active existe
      const session = await SupabaseService.getSession();
      if (session && session.user) {
        await this.loadUserData(session.user.id, session.user.email);
      } else {
        // Mode invité propre
        this.state.isAuthenticated = false;
        this.state.user = { ...GUEST_USER };
        this.state.library = { reading: [], saved: [], finished: [], offline: [], collections: [] };
        this.state.notifications = [];
        this.saveState();
      }

      // 3. Écouter les changements d'authentification Supabase en temps réel
      SupabaseService.onAuthStateChange(async (event, currentSession) => {
        if (event === 'SIGNED_IN' && currentSession?.user) {
          await this.loadUserData(currentSession.user.id, currentSession.user.email);
        } else if (event === 'SIGNED_OUT') {
          this.state.isAuthenticated = false;
          this.state.user = { ...GUEST_USER };
          this.state.library = { reading: [], saved: [], finished: [], offline: [], collections: [] };
          this.state.notifications = [];
          this.saveState();
        }
      });

      this.notify('SUPABASE_INIT_SUCCESS');
      this.notify('SUPABASE_SYNC_COMPLETE');
      this.notify('STORIES_LOADED', { count: this.stories.length });
    } catch (e) {
      console.warn('[AppStore] Erreur synchronisation Supabase:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Recharge immédiatement et force la mise à jour des histoires depuis Supabase
   */
  async reloadStories(forceRefresh = true) {
    try {
      if (forceRefresh) {
        SupabaseService.clearPublicCache();
      }
      const remoteStories = await SupabaseService.fetchStories(forceRefresh);
      if (remoteStories && remoteStories.length > 0) {
        this.stories = remoteStories;
        this.notify('STORIES_LOADED', { count: this.stories.length });
        this.notify('SUPABASE_SYNC_COMPLETE');
      }
      return this.stories;
    } catch (err) {
      console.warn('[AppStore] Erreur reloadStories:', err);
      return this.stories;
    }
  }

  /**
   * Charge l'ensemble des données personnelles réelles d'un utilisateur depuis Supabase
   */
  async loadUserData(userId, email = '') {
    try {
      const [profile, libraryData, collections, follows, notifs] = await Promise.all([
        SupabaseService.fetchUserProfile(userId),
        SupabaseService.fetchUserLibrary(userId),
        SupabaseService.fetchUserCollections(userId),
        SupabaseService.fetchUserFollows(userId),
        SupabaseService.fetchUserNotifications(userId)
      ]);

      this.state.isAuthenticated = true;

      if (profile) {
        this.state.user = {
          id: profile.id,
          email: profile.email || email,
          name: profile.name || 'Lecteur Liva',
          username: profile.username || '@lecteur',
          avatar: profile.avatar || DEFAULT_AVATAR,
          bio: profile.bio || '',
          role: profile.role || (['amadoungoyesimal216@gmail.com', 'pangoyesimal@gmail.com'].includes(profile.email || email) ? 'ADMIN' : 'USER'),
          status: profile.status || 'active',
          stats: profile.stats || {
            storiesRead: (libraryData?.reading || []).filter(r => r.progressPercent >= 100).length,
            hoursRead: 0,
            followingCount: (follows || []).length,
            followersCount: 0,
            likesCount: (libraryData?.liked || []).length
          },
          favoriteGenres: profile.favoriteGenres || [],
          followedAuthorIds: follows || [],
          likedStoryIds: libraryData?.liked || []
        };
      } else {
        // Profil initial vierge
        this.state.user = {
          id: userId,
          email: email,
          name: email.split('@')[0],
          username: `@${email.split('@')[0]}`,
          avatar: DEFAULT_AVATAR,
          bio: '',
          role: (['amadoungoyesimal216@gmail.com', 'pangoyesimal@gmail.com'].includes(email) ? 'ADMIN' : 'USER'),
          status: 'active',
          stats: { storiesRead: 0, hoursRead: 0, followingCount: 0, followersCount: 0, likesCount: 0 },
          favoriteGenres: [],
          followedAuthorIds: [],
          likedStoryIds: []
        };
      }

      this.state.library = {
        reading: libraryData?.reading || [],
        saved: libraryData?.saved || [],
        finished: (libraryData?.reading || []).filter(r => r.progressPercent >= 100).map(r => r.storyId),
        offline: [],
        collections: collections || []
      };

      this.state.notifications = notifs || [];
      this.saveState();
      this.notify('USER_DATA_LOADED');
    } catch (err) {
      console.error('[AppStore] Erreur loadUserData:', err);
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          user: { ...DEFAULT_STATE.user, ...(parsed.user || {}) },
          library: { ...DEFAULT_STATE.library, ...(parsed.library || {}) },
          readerSettings: { ...DEFAULT_STATE.readerSettings, ...(parsed.readerSettings || {}) }
        };
      }
    } catch (e) {
      console.warn('Could not load LIVA state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save LIVA state to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(changeType = 'GENERAL_UPDATE', payload = null) {
    for (const listener of this.listeners) {
      try {
        listener(this.state, changeType, payload);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  // --- Permissions & Contrôle d'Accès par Rôle ---
  getUserRole() {
    return (this.state.user?.role || 'USER').toUpperCase();
  }

  isAdmin() {
    return Boolean(this.state.isAuthenticated && this.getUserRole() === 'ADMIN');
  }

  isModerator() {
    const role = this.getUserRole();
    return Boolean(this.state.isAuthenticated && (role === 'MODERATOR' || role === 'ADMIN'));
  }

  isAuthor() {
    const role = this.getUserRole();
    return Boolean(this.state.isAuthenticated && (role === 'AUTHOR' || role === 'ADMIN'));
  }

  // --- Histoires & Auteurs ---
  getAllStories() {
    return this.stories || [];
  }

  getStoryById(id) {
    if (!id) return null;
    return (this.stories || []).find(s => String(s.id).trim() === String(id).trim()) || null;
  }

  getHeroStory() {
    const list = this.stories || [];
    return list.find(s => s.isHero && s.status === 'published') || 
           list.find(s => s.isHero) || 
           list.find(s => s.status === 'published') || 
           list[0] || 
           null;
  }

  getTrendingStories() {
    const list = this.stories || [];
    const trending = list.filter(s => s.isTrending && s.status === 'published');
    if (trending.length > 0) return trending;
    const anyTrending = list.filter(s => s.isTrending);
    if (anyTrending.length > 0) return anyTrending;
    return list.filter(s => s.status === 'published').slice(0, 6);
  }

  getShorts(category = 'all') {
    const list = this.stories || [];
    let shorts = list.filter(s => s.isShort && s.status === 'published');
    if (shorts.length === 0) {
      shorts = list.filter(s => s.isShort);
    }
    if (shorts.length === 0) {
      shorts = list.filter(s => s.status === 'published');
    }
    if (category !== 'all') {
      const filtered = shorts.filter(s => s.estimatedTime && s.estimatedTime.includes(category));
      if (filtered.length > 0) return filtered;
    }
    return shorts;
  }

  getStoriesByGenre(genreId) {
    const list = this.stories || [];
    if (!genreId || genreId === 'all') return list;
    const gObj = this.genres.find(g => g.id === genreId.toLowerCase());
    const gName = gObj ? gObj.name.toLowerCase() : genreId.toLowerCase();
    const gId = genreId.toLowerCase();

    return list.filter(s => {
      const storyGenre = (s.genre || '').toLowerCase();
      const storySecGenre = (s.secondaryGenre || '').toLowerCase();
      const storyTags = (s.tags || []).map(t => t.toLowerCase());

      return storyGenre === gName ||
             storyGenre === gId ||
             storySecGenre === gName ||
             storySecGenre === gId ||
             storyTags.includes(gName) ||
             storyTags.includes(gId) ||
             (gId === 'african' && (storyGenre.includes('afric') || storySecGenre.includes('afric') || storyTags.some(t => t.includes('afric') || t.includes('dakar') || t.includes('baobab')))) ||
             (gId === 'fantasy' && (storyGenre.includes('fanta') || storySecGenre.includes('fanta') || storyTags.some(t => t.includes('fanta')))) ||
             (gId === 'horror' && (storyGenre.includes('horr') || storySecGenre.includes('horr') || storyTags.some(t => t.includes('horr')))) ||
             ((gId === 'contes' || gId === 'tales') && (storyGenre.includes('conte') || storySecGenre.includes('conte') || storyTags.some(t => t.includes('conte') || t.includes('légende')))) ||
             (gId === 'scifi' && (storyGenre.includes('sci') || storySecGenre.includes('sci') || storyTags.some(t => t.includes('sci')))) ||
             (gId === 'romance' && (storyGenre.includes('roman') || storySecGenre.includes('roman') || storyTags.some(t => t.includes('roman')))) ||
             (gId === 'thriller' && (storyGenre.includes('thrill') || storySecGenre.includes('thrill') || storyTags.some(t => t.includes('thrill') || t.includes('suspense')))) ||
             (gId === 'mystery' && (storyGenre.includes('myst') || storySecGenre.includes('myst') || storyTags.some(t => t.includes('myst')))) ||
             (gId === 'drama' && (storyGenre.includes('dram') || storySecGenre.includes('dram') || storyTags.some(t => t.includes('dram')))) ||
             ((gId === 'humour' || gId === 'humor') && (storyGenre.includes('humour') || storySecGenre.includes('humour') || storyGenre.includes('humor') || storyTags.some(t => t.includes('humour')))) ||
             (gId === 'realfacts' && (storyGenre.includes('réel') || storyGenre.includes('reel') || storyTags.some(t => t.includes('histoire vraie') || t.includes('réel')))) ||
             (gId === 'personal_dev' && (storyGenre.includes('personnel') || storyTags.some(t => t.includes('bien-être') || t.includes('mindset'))));
    });
  }

  getRecommendedStories(limit = 6) {
    const list = (this.stories || []).filter(s => s.status === 'published');
    const userGenres = this.state.user.favoriteGenres || [];
    if (userGenres.length === 0) {
      return list.length > 0 ? list.slice(0, limit) : (this.stories || []).slice(0, limit);
    }
    const matched = list.filter(s => 
      userGenres.some(ug => ug.toLowerCase() === s.genre.toLowerCase() || (s.secondaryGenre && ug.toLowerCase() === s.secondaryGenre.toLowerCase()))
    );
    return matched.length > 0 ? matched.slice(0, limit) : (list.length > 0 ? list.slice(0, limit) : (this.stories || []).slice(0, limit));
  }

  getAuthorById(authorId) {
    return this.authors.find(a => a.id === authorId) || null;
  }

  getStoriesByAuthor(authorId) {
    return this.stories.filter(s => s.authorId === authorId);
  }

  // --- Bibliothèque & Progrès ---
  isSaved(storyId) {
    return this.state.library.saved.includes(storyId);
  }

  isLiked(storyId) {
    return this.state.user.likedStoryIds.includes(storyId);
  }

  isFollowedAuthor(authorId) {
    return this.state.user.followedAuthorIds.includes(authorId);
  }

  getReadingProgress(storyId) {
    return this.state.library.reading.find(r => r.storyId === storyId) || null;
  }

  toggleSaveStory(storyId) {
    const saved = [...this.state.library.saved];
    const index = saved.indexOf(storyId);
    let added = false;
    if (index > -1) {
      saved.splice(index, 1);
    } else {
      saved.unshift(storyId);
      added = true;
    }
    this.state.library.saved = saved;
    this.state.user.stats.likesCount = this.state.user.likedStoryIds.length;
    this.saveState();
    SupabaseService.syncUserLibrary(this.state.user.id, storyId, { isSaved: added });
    return added;
  }

  toggleLikeStory(storyId) {
    const likes = [...this.state.user.likedStoryIds];
    const index = likes.indexOf(storyId);
    let liked = false;
    if (index > -1) {
      likes.splice(index, 1);
    } else {
      likes.unshift(storyId);
      liked = true;
    }
    this.state.user.likedStoryIds = likes;
    this.state.user.stats.likesCount = likes.length;
    this.saveState();
    SupabaseService.syncUserLibrary(this.state.user.id, storyId, { isLiked: liked });
    return liked;
  }

  toggleFollowAuthor(authorId) {
    const followed = [...this.state.user.followedAuthorIds];
    const index = followed.indexOf(authorId);
    let isNowFollowing = false;
    if (index > -1) {
      followed.splice(index, 1);
    } else {
      followed.unshift(authorId);
      isNowFollowing = true;
    }
    this.state.user.followedAuthorIds = followed;
    this.state.user.stats.followingCount = followed.length;
    this.saveState();
    SupabaseService.syncFollow(this.state.user.id, authorId, isNowFollowing);
    return isNowFollowing;
  }

  updateReadingProgress(storyId, chapterIndex = 0, chapterId = '', progressPercent = 0) {
    const reading = [...this.state.library.reading];
    const existingIndex = reading.findIndex(r => r.storyId === storyId);

    const record = {
      storyId,
      progressPercent: Math.min(100, Math.max(0, Math.round(progressPercent))),
      currentChapterIndex: chapterIndex,
      currentChapterId: chapterId,
      lastReadAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      reading[existingIndex] = { ...reading[existingIndex], ...record };
    } else {
      reading.unshift(record);
    }

    this.state.library.reading = reading;
    if (record.progressPercent >= 100 && !this.state.library.finished.includes(storyId)) {
      this.state.library.finished.unshift(storyId);
      this.state.user.stats.storiesRead = this.state.library.finished.length;
    }

    this.saveState();
    SupabaseService.syncUserLibrary(this.state.user.id, storyId, {
      progressPercent: record.progressPercent,
      currentChapterIndex: chapterIndex
    });
  }

  /**
   * Marque explicitement une histoire comme 100% terminée
   */
  markStoryAsFinished(storyId) {
    const story = this.getStoryById(storyId);
    const lastChapterIndex = story && story.chapters && story.chapters.length > 0 ? story.chapters.length - 1 : 0;
    const lastChapterId = story && story.chapters && story.chapters[lastChapterIndex] ? story.chapters[lastChapterIndex].id : '';

    this.updateReadingProgress(storyId, lastChapterIndex, lastChapterId, 100);

    if (!this.state.library.finished.includes(storyId)) {
      this.state.library.finished.unshift(storyId);
      this.state.user.stats.storiesRead = this.state.library.finished.length;
      this.saveState();
    }

    if (this.state.isAuthenticated && this.state.user?.id) {
      SupabaseService.syncUserLibrary(this.state.user.id, storyId, {
        progressPercent: 100,
        currentChapterIndex: lastChapterIndex
      });
    }

    this.notify('STORY_FINISHED', { storyId });
  }

  createCollection(name, icon = '📚') {
    const newCol = {
      id: 'col-' + Date.now(),
      name,
      icon,
      storyIds: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.state.library.collections.unshift(newCol);
    this.saveState();
    SupabaseService.createCollection(this.state.user.id, newCol);
    return newCol;
  }

  addStoryToCollection(collectionId, storyId) {
    const col = this.state.library.collections.find(c => c.id === collectionId);
    if (col && !col.storyIds.includes(storyId)) {
      col.storyIds.push(storyId);
      this.saveState();
      SupabaseService.addStoryToCollection(collectionId, storyId);
      return true;
    }
    return false;
  }

  removeStoryFromCollection(collectionId, storyId) {
    const col = this.state.library.collections.find(c => c.id === collectionId);
    if (col) {
      col.storyIds = col.storyIds.filter(id => id !== storyId);
      this.saveState();
      SupabaseService.removeStoryFromCollection(collectionId, storyId);
      return true;
    }
    return false;
  }

  deleteCollection(collectionId) {
    this.state.library.collections = this.state.library.collections.filter(c => c.id !== collectionId);
    this.saveState();
    SupabaseService.deleteCollection(collectionId);
  }

  // --- Story Comments & Reviews ---
  addComment(storyId, content, rating = 5) {
    const story = this.getStoryById(storyId);
    if (!story) return null;

    const newComment = {
      id: 'rev-' + Date.now(),
      userId: this.state.user.id,
      userName: this.state.user.name,
      userAvatar: this.state.user.avatar,
      rating,
      date: 'À l\'instant',
      content,
      likes: 0,
      isLiked: false
    };

    if (!story.reviews) story.reviews = [];
    story.reviews.unshift(newComment);
    story.reviewsCount = (story.reviewsCount || 0) + 1;
    this.notify('COMMENT_ADDED', { storyId, comment: newComment });
    SupabaseService.addReview(storyId, newComment);
    return newComment;
  }

  toggleCommentLike(storyId, commentId) {
    const story = this.getStoryById(storyId);
    if (!story || !story.reviews) return false;
    const comment = story.reviews.find(r => r.id === commentId);
    if (!comment) return false;

    comment.isLiked = !comment.isLiked;
    comment.likes += comment.isLiked ? 1 : -1;
    this.notify('COMMENT_LIKED', { storyId, commentId, likes: comment.likes });
    return comment.isLiked;
  }

  // --- Espace Créateur / Studio ---
  async saveAuthoredStory(storyData) {
    const isEdit = !!storyData.id;
    const storyId = storyData.id || `story-${Date.now()}`;
    const currentUser = this.state.user || {};
    const authorName = storyData.authorName || currentUser.name || currentUser.username || 'Auteur LIVA';
    const authorAvatar = storyData.authorAvatar || currentUser.avatar || DEFAULT_AVATAR;
    const authorId = storyData.authorId || currentUser.id || 'user-author';

    const newStory = {
      id: storyId,
      title: (storyData.title || 'Sans titre').trim(),
      subtitle: storyData.subtitle || storyData.secondaryGenre || '',
      genre: storyData.genre || 'Romance',
      secondaryGenre: storyData.secondaryGenre || '',
      authorId: authorId,
      authorName: authorName,
      authorAvatar: authorAvatar,
      cover: storyData.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      banner: storyData.banner || storyData.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      description: (storyData.description || '').trim(),
      tags: Array.isArray(storyData.tags) ? storyData.tags : [storyData.genre || 'Romance'],
      status: storyData.status || 'draft',
      chapters: storyData.chapters || [
        { id: `${storyId}-chap-1`, number: 1, title: 'Chapitre 1', duration: '5 min', readTimeMin: 5, content: 'Écrivez votre récit...' }
      ],
      chaptersCount: (storyData.chapters || []).length || 1,
      estimatedTime: storyData.estimatedTime || '5 min',
      rating: 5.0,
      reviewsCount: 0,
      readsCount: storyData.status === 'published' ? '1' : '0',
      readsRaw: storyData.status === 'published' ? 1 : 0,
      likesCount: 0,
      isTrending: false,
      isHero: false,
      isShort: storyData.isShort !== undefined ? storyData.isShort : false,
      featuredBadge: storyData.status === 'published' ? '● Publiée' : '⚡ Brouillon',
      createdAt: storyData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: storyData.stats || { reads: 0, likes: 0, comments: 0 }
    };

    // 1. Mise à jour des histoires créées par l'utilisateur
    if (!this.state.authoredStories) this.state.authoredStories = [];
    const idx = this.state.authoredStories.findIndex(s => s.id === storyId);
    if (idx > -1) {
      this.state.authoredStories[idx] = { ...this.state.authoredStories[idx], ...newStory };
    } else {
      this.state.authoredStories.unshift(newStory);
    }

    // 2. Si publiée, mise à jour dans le catalogue global public
    const existingGlobalIdx = this.stories.findIndex(s => s.id === storyId);
    if (newStory.status === 'published') {
      if (existingGlobalIdx > -1) {
        this.stories[existingGlobalIdx] = newStory;
      } else {
        this.stories.unshift(newStory);
      }
    } else if (existingGlobalIdx > -1) {
      this.stories.splice(existingGlobalIdx, 1);
    }

    this.saveState();
    this.notify('AUTHORED_STORY_SAVED', { story: newStory });

    // 3. Sauvegarde dans Supabase Cloud & Invalidation du Cache
    await SupabaseService.saveAuthoredStory(newStory);
    SupabaseService.clearPublicCache();
    await this.reloadStories(true);
    return newStory;
  }

  // --- Paramètres de Thème & Lecteur ---
  setTheme(themeName) {
    this.state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    this.saveState();
  }

  setReaderSettings(settings) {
    this.state.readerSettings = { ...this.state.readerSettings, ...settings };
    this.saveState();
  }

  // --- Onboarding ---
  completeOnboarding(preferences = {}) {
    this.state.onboardingCompleted = true;
    if (preferences.genres) {
      this.state.user.favoriteGenres = preferences.genres;
    }
    if (preferences.authors) {
      this.state.user.followedAuthorIds = preferences.authors;
    }
    this.saveState();
    SupabaseService.saveProfile(this.state.user);
  }

  // --- Notifications ---
  getUnreadNotificationsCount() {
    return (this.state.notifications || []).filter(n => !n.isRead).length;
  }

  markNotificationAsRead(notifId) {
    const notif = this.state.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      this.saveState();
    }
  }

  markAllNotificationsAsRead() {
    this.state.notifications.forEach(n => (n.isRead = true));
    this.saveState();
  }

  deleteNotification(notifId) {
    this.state.notifications = this.state.notifications.filter(n => n.id !== notifId);
    this.saveState();
  }

  clearAllNotifications() {
    this.state.notifications = [];
    this.saveState();
  }

  // --- Authentification Réelle avec Supabase ---
  async login(email, password) {
    try {
      const { user, profile } = await SupabaseService.signIn(email, password);
      await this.loadUserData(user.id, user.email);
      return { success: true, user: this.state.user };
    } catch (err) {
      console.warn('[AppStore] Erreur login:', err.message);
      return { success: false, error: err.message || 'Identifiant ou mot de passe incorrect.' };
    }
  }

  async register({ name, username, email, password, favoriteGenres }) {
    try {
      const { user } = await SupabaseService.signUp(email, password, { name, username, favoriteGenres });
      await this.loadUserData(user.id, email);
      return { success: true, user: this.state.user };
    } catch (err) {
      console.warn('[AppStore] Erreur register:', err.message);
      return { success: false, error: err.message || 'Impossible de créer le compte.' };
    }
  }

  async logout() {
    await SupabaseService.signOut();
    this.state.isAuthenticated = false;
    this.state.user = { ...GUEST_USER };
    this.state.library = { reading: [], saved: [], finished: [], offline: [], collections: [] };
    this.state.notifications = [];
    this.saveState();
  }

  updateUserProfile(updates = {}) {
    this.state.user = { ...this.state.user, ...updates };
    this.saveState();
    SupabaseService.saveProfile(this.state.user);
  }
}

export const store = new AppStore();
