// LIVA - Gestionnaire d'État Réactif Full-Stack avec Source de Vérité Supabase Cloud
import { STORIES_DATA } from '../data/stories.js';
import { AUTHORS_DATA } from '../data/authors.js';
import { GENRES_DATA } from '../data/genres.js';
import { SupabaseService } from '../services/supabaseClient.js';

const STORAGE_KEY = 'liva_app_state_v2';

export const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237928CA"/><stop offset="100%" stop-color="%23FF0080"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(%23grad)"/><circle cx="64" cy="50" r="22" fill="%23FFFFFF" opacity="0.9"/><path d="M28 106 C28 84 44 76 64 76 C84 76 100 84 100 106 Z" fill="%23FFFFFF" opacity="0.9"/></svg>';

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
    this.stories = [...STORIES_DATA];
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
        SupabaseService.fetchStories(),
        SupabaseService.fetchAuthors()
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
    } catch (e) {
      console.warn('[AppStore] Erreur synchronisation Supabase:', e);
    } finally {
      this.isSyncing = false;
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
          avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          bio: profile.bio || '',
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
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          bio: '',
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

  // --- Histoires & Auteurs ---
  getAllStories() {
    return this.stories;
  }

  getStoryById(id) {
    return this.stories.find(s => s.id === id) || null;
  }

  getHeroStory() {
    return this.stories.find(s => s.isHero) || this.stories[0];
  }

  getTrendingStories() {
    return this.stories.filter(s => s.isTrending);
  }

  getShorts(category = 'all') {
    let shorts = this.stories.filter(s => s.isShort);
    if (category !== 'all') {
      shorts = shorts.filter(s => s.estimatedTime.includes(category));
    }
    return shorts;
  }

  getStoriesByGenre(genreId) {
    if (!genreId || genreId === 'all') return this.stories;
    const gObj = this.genres.find(g => g.id === genreId);
    const gName = gObj ? gObj.name.toLowerCase() : genreId.toLowerCase();
    return this.stories.filter(s => 
      s.genre.toLowerCase() === gName || 
      (s.secondaryGenre && s.secondaryGenre.toLowerCase() === gName) ||
      (s.tags && s.tags.some(t => t.toLowerCase() === gName))
    );
  }

  getRecommendedStories(limit = 6) {
    const userGenres = this.state.user.favoriteGenres || [];
    if (userGenres.length === 0) {
      return this.stories.slice(0, limit);
    }
    const matched = this.stories.filter(s => 
      userGenres.some(ug => ug.toLowerCase() === s.genre.toLowerCase() || (s.secondaryGenre && ug.toLowerCase() === s.secondaryGenre.toLowerCase()))
    );
    return matched.length > 0 ? matched.slice(0, limit) : this.stories.slice(0, limit);
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
  saveAuthoredStory(storyData) {
    const isEdit = !!storyData.id;
    const storyId = storyData.id || `story-${Date.now()}`;

    const newStory = {
      id: storyId,
      title: storyData.title || 'Sans titre',
      subtitle: storyData.subtitle || '',
      genre: storyData.genre || 'Romance',
      secondaryGenre: storyData.secondaryGenre || '',
      cover: storyData.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      description: storyData.description || '',
      tags: storyData.tags || [storyData.genre || 'Romance'],
      status: storyData.status || 'draft',
      chapters: storyData.chapters || [
        { id: 'chap-1', number: 1, title: 'Chapitre 1', duration: '5 min', readTimeMin: 5, content: 'Commencez à écrire...' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: { reads: 0, likes: 0, comments: 0 }
    };

    if (isEdit) {
      const idx = this.state.authoredStories.findIndex(s => s.id === storyId);
      if (idx > -1) {
        this.state.authoredStories[idx] = { ...this.state.authoredStories[idx], ...newStory };
      }
    } else {
      this.state.authoredStories.unshift(newStory);
    }

    if (newStory.status === 'published') {
      const existingGlobalIdx = this.stories.findIndex(s => s.id === storyId);
      const storyCardObj = {
        ...newStory,
        authorId: this.state.user.id,
        authorName: this.state.user.name,
        authorAvatar: this.state.user.avatar,
        rating: 5.0,
        reviewsCount: 0,
        readsCount: '1',
        readsRaw: 1,
        likesCount: 0,
        chaptersCount: newStory.chapters.length,
        estimatedTime: '5 min',
        isTrending: false,
        isHero: false,
        isShort: false,
        reviews: []
      };
      if (existingGlobalIdx > -1) {
        this.stories[existingGlobalIdx] = storyCardObj;
      } else {
        this.stories.unshift(storyCardObj);
      }
    }

    this.saveState();
    SupabaseService.saveAuthoredStory(newStory);
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
