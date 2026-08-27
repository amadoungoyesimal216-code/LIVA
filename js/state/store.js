// LIVA - Gestionnaire d'état réactif avec persistance LocalStorage
import { STORIES_DATA } from '../data/stories.js';
import { AUTHORS_DATA } from '../data/authors.js';
import { GENRES_DATA } from '../data/genres.js';

const STORAGE_KEY = 'liva_app_state_v1';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'like',
    icon: '❤️',
    title: 'Sarah Diop a aimé votre commentaire',
    desc: 'Sur le chapitre 1 de "La Promesse du Silence"',
    time: 'Il y a 10 min',
    isRead: false,
    storyId: 'la-promesse-du-silence'
  },
  {
    id: 'notif-2',
    type: 'chapter',
    icon: '📖',
    title: 'Nouveau chapitre disponible !',
    desc: 'Le chapitre 19 de "Amour Interdit à Paris" vient de paraître.',
    time: 'Il y a 2h',
    isRead: false,
    storyId: 'amour-interdit-a-paris'
  },
  {
    id: 'notif-3',
    type: 'follow',
    icon: '👤',
    title: 'Marc N. vous suit désormais',
    desc: 'Découvrez sa bibliothèque et ses collections partagées.',
    time: 'Hier',
    isRead: true
  },
  {
    id: 'notif-4',
    type: 'ai',
    icon: '✨',
    title: 'Recommandation IA personnalisée',
    desc: 'Une nouvelle pépite "L\'Ombre du Baobab Éternel" pourrait vous bouleverser.',
    time: 'Il y a 2 jours',
    isRead: true,
    storyId: 'l-ombre-du-baobab'
  }
];

const INITIAL_COLLECTIONS = [
  {
    id: 'col-romance',
    name: 'Mes Romances ❤️',
    icon: '❤️',
    storyIds: ['la-promesse-du-silence', 'la-derniere-lettre', 'sous-les-etoiles-d-abidjan'],
    createdAt: '2026-01-15'
  },
  {
    id: 'col-frissons',
    name: 'Histoires qui font peur 👻',
    icon: '👻',
    storyIds: ['le-dernier-message', 'le-village-des-ames-perdues', 'short-7min-sms-fantome'],
    createdAt: '2026-02-01'
  },
  {
    id: 'col-nuit',
    name: 'À lire ce soir 🌙',
    icon: '🌙',
    storyIds: ['l-ombre-du-baobab', 'short-5min-crash', 'dakar-noir'],
    createdAt: '2026-02-20'
  },
  {
    id: 'col-favoris',
    name: 'Mes Préférées 🔥',
    icon: '🔥',
    storyIds: ['la-promesse-du-silence', 'les-chroniques-d-aethelgard', 'short-15min-miroir-en-face'],
    createdAt: '2026-02-25'
  }
];

const DEFAULT_STATE = {
  theme: 'dark', // 'dark' | 'light' | 'cream'
  onboardingCompleted: false,
  isAuthenticated: true,
  user: {
    id: 'user-alex',
    email: 'alex@liva.com',
    name: 'Alexandre Sow',
    username: '@alex_reads',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    bio: 'Passionné de récits immersifs, de thrillers psychologiques et de romances intenses. Toujours un livre sous le bras.',
    stats: {
      storiesRead: 42,
      hoursRead: 68,
      followingCount: 18,
      followersCount: 124,
      likesCount: 312
    },
    favoriteGenres: ['romance', 'african', 'thriller', 'fantasy'],
    followedAuthorIds: ['sarah-diop', 'amadou-kante', 'samuel-lefevre'],
    likedStoryIds: ['la-promesse-du-silence', 'short-5min-crash', 'l-ombre-du-baobab', 'la-derniere-lettre']
  },
  registeredAccounts: [
    {
      id: 'user-alex',
      email: 'alex@liva.com',
      username: '@alex_reads',
      name: 'Alexandre Sow',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Passionné de récits immersifs, de thrillers psychologiques et de romances intenses. Toujours un livre sous le bras.',
      stats: {
        storiesRead: 42,
        hoursRead: 68,
        followingCount: 18,
        followersCount: 124,
        likesCount: 312
      },
      favoriteGenres: ['romance', 'african', 'thriller', 'fantasy'],
      followedAuthorIds: ['sarah-diop', 'amadou-kante', 'samuel-lefevre'],
      likedStoryIds: ['la-promesse-du-silence', 'short-5min-crash', 'l-ombre-du-baobab', 'la-derniere-lettre']
    }
  ],
  library: {
    reading: [
      {
        storyId: 'la-promesse-du-silence',
        progressPercent: 38,
        currentChapterIndex: 0,
        currentChapterId: 'chap-1',
        lastReadAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        storyId: 'dakar-noir',
        progressPercent: 65,
        currentChapterIndex: 0,
        currentChapterId: 'chap-dak-1',
        lastReadAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        storyId: 'short-5min-crash',
        progressPercent: 90,
        currentChapterIndex: 0,
        currentChapterId: 'chap-sh5-1',
        lastReadAt: new Date(Date.now() - 172800000).toISOString()
      }
    ],
    saved: ['la-derniere-lettre', 'les-chroniques-d-aethelgard', 'le-village-des-ames-perdues', 'sous-les-etoiles-d-abidjan'],
    finished: ['short-10min-appel-3h14', 'l-art-du-lacher-prise'],
    collections: INITIAL_COLLECTIONS
  },
  readerSettings: {
    theme: 'dark', // 'dark' | 'cream' | 'light'
    fontSize: 'normal', // 'small' | 'normal' | 'large' | 'xlarge'
    fontFamily: 'literata', // 'literata' | 'merriweather' | 'sans' | 'dyslexic'
    lineHeight: 'relaxed', // 'normal' | 'relaxed' | 'loose'
    contentWidth: 'normal' // 'narrow' | 'normal' | 'wide'
  },
  authoredStories: [
    {
      id: 'draft-1',
      title: 'Les Vents d’Assinie',
      status: 'draft', // 'draft' | 'published' | 'scheduled'
      genre: 'Romance',
      description: 'Une promesse brisée sur les rivages de Côte d\'Ivoire.',
      cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
      tags: ['Romance', 'Plage', 'Secret'],
      chapters: [
        {
          id: 'draft-chap-1',
          title: 'Chapitre 1 — L\'Embarcadère',
          content: 'Le bateau à moteur glissait sur les eaux calmes de la lagune...',
          updatedAt: '2026-02-26'
        }
      ],
      stats: { reads: 0, likes: 0, comments: 0, newFollowers: 0 },
      createdAt: '2026-02-20'
    },
    {
      id: 'draft-2',
      title: 'L’Inconnu de Saint-Louis',
      status: 'published',
      genre: 'Thriller',
      description: 'Une enquête nocturne le long du fleuve Sénégal.',
      cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      tags: ['Thriller', 'Mystère', 'Saint-Louis'],
      chapters: [
        {
          id: 'pub-chap-1',
          title: 'Chapitre 1 — Le Pont Faidherbe',
          content: 'Les lampadaires jaunâtres tremblaient dans la brume du fleuve...',
          updatedAt: '2026-02-15'
        }
      ],
      stats: { reads: '12.4K', likes: '3.2K', comments: 84, newFollowers: 140 },
      createdAt: '2026-02-10'
    }
  ],
  notifications: INITIAL_NOTIFICATIONS,
  audio: {
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

  // --- Story Queries ---
  getAllStories() {
    return this.stories;
  }

  getStoryById(id) {
    return this.stories.find(s => s.id === id) || null;
  }

  getAuthorById(id) {
    return this.authors.find(a => a.id === id) || null;
  }

  getAuthorStories(authorId) {
    return this.stories.filter(s => s.authorId === authorId);
  }

  getTrendingStories() {
    return this.stories.filter(s => s.isTrending);
  }

  getHeroStory() {
    return this.stories.find(s => s.isHero) || this.stories[0];
  }

  getShorts(category = null) {
    const shorts = this.stories.filter(s => s.isShort);
    if (!category || category === 'all') return shorts;
    return shorts.filter(s => s.shortDurationCategory === category);
  }

  getRecommendedStories(limit = 6) {
    const favGenres = this.state.user.favoriteGenres || [];
    // Prioritize favorite genres or high ratings
    return [...this.stories]
      .sort((a, b) => {
        const aMatch = favGenres.some(g => a.genre.toLowerCase().includes(g) || (a.secondaryGenre && a.secondaryGenre.toLowerCase().includes(g))) ? 1 : 0;
        const bMatch = favGenres.some(g => b.genre.toLowerCase().includes(g) || (b.secondaryGenre && b.secondaryGenre.toLowerCase().includes(g))) ? 1 : 0;
        return (bMatch - aMatch) || (b.rating - a.rating);
      })
      .slice(0, limit);
  }

  // --- Library Actions ---
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
    this.saveState();
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
    this.saveState();
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
    this.saveState();
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
    this.saveState();
  }

  markStoryAsFinished(storyId) {
    // Remove from reading
    this.state.library.reading = this.state.library.reading.filter(r => r.storyId !== storyId);
    // Add to finished if not present
    if (!this.state.library.finished.includes(storyId)) {
      this.state.library.finished.unshift(storyId);
      this.state.user.stats.storiesRead += 1;
    }
    this.saveState();
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
    return newCol;
  }

  addStoryToCollection(collectionId, storyId) {
    const col = this.state.library.collections.find(c => c.id === collectionId);
    if (col && !col.storyIds.includes(storyId)) {
      col.storyIds.push(storyId);
      this.saveState();
      return true;
    }
    return false;
  }

  removeStoryFromCollection(collectionId, storyId) {
    const col = this.state.library.collections.find(c => c.id === collectionId);
    if (col) {
      col.storyIds = col.storyIds.filter(id => id !== storyId);
      this.saveState();
      return true;
    }
    return false;
  }

  deleteCollection(collectionId) {
    this.state.library.collections = this.state.library.collections.filter(c => c.id !== collectionId);
    this.saveState();
  }

  // --- Story Comments & Reviews ---
  addComment(storyId, content, rating = 5) {
    const story = this.getStoryById(storyId);
    if (!story) return null;

    const newComment = {
      id: 'rev-' + Date.now(),
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
    return newComment;
  }

  toggleCommentLike(storyId, commentId) {
    const story = this.getStoryById(storyId);
    if (!story || !story.reviews) return false;
    const comment = story.reviews.find(r => r.id === commentId);
    if (!comment) return false;

    comment.isLiked = !comment.isLiked;
    comment.likes += comment.isLiked ? 1 : -1;
    this.notify('COMMENT_LIKED', { storyId, commentId, likes: comment.likes, isLiked: comment.isLiked });
    return comment.isLiked;
  }

  // --- Author Studio & Publications ---
  createAuthoredStory(storyData) {
    const newStory = {
      id: 'authored-' + Date.now(),
      title: storyData.title || 'Sans titre',
      subtitle: storyData.subtitle || '',
      genre: storyData.genre || 'Romance',
      description: storyData.description || '',
      cover: storyData.cover || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80',
      tags: storyData.tags || ['Nouveau'],
      targetAudience: storyData.targetAudience || 'Tous publics',
      status: storyData.status || 'draft',
      chapters: storyData.chapters || [
        {
          id: 'chap-' + Date.now(),
          number: 1,
          title: 'Chapitre 1',
          content: storyData.initialChapterText || 'Il était une fois...',
          duration: '5 min',
          readTimeMin: 5
        }
      ],
      stats: { reads: 0, likes: 0, comments: 0, newFollowers: 0 },
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.state.authoredStories.unshift(newStory);

    if (newStory.status === 'published') {
      // Also inject into global stories
      this.stories.unshift({
        ...newStory,
        authorId: 'user-author',
        authorName: this.state.user.name,
        authorAvatar: this.state.user.avatar,
        rating: 5.0,
        reviewsCount: 1,
        readsCount: '1',
        readsRaw: 1,
        likesCount: 1,
        chaptersCount: newStory.chapters.length,
        estimatedTime: '5 min',
        isTrending: false,
        isHero: false,
        isShort: false,
        reviews: []
      });
    }

    this.saveState();
    return newStory;
  }

  // --- Theme & Reader Settings ---
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
  }

  // --- Notifications ---
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

  getUnreadNotificationsCount() {
    return this.state.notifications.filter(n => !n.isRead).length;
  }

  // --- Authentification (Connexion & Inscription) ---
  login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPwd = (password || '').trim();

    if (!this.state.registeredAccounts) {
      this.state.registeredAccounts = DEFAULT_STATE.registeredAccounts;
    }

    // Match by email or username
    let account = this.state.registeredAccounts.find(acc => 
      acc.email.toLowerCase() === cleanId || 
      acc.username.toLowerCase() === cleanId ||
      acc.username.toLowerCase() === `@${cleanId}`
    );

    // If OAuth or quick demo login without account found, create a demo session
    if (!account && cleanPwd === 'oauth') {
      account = {
        id: `user-${Date.now()}`,
        email: cleanId,
        username: `@${cleanId.split('@')[0]}`,
        name: cleanId.split('@')[0].replace('.', ' '),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: 'Lecteur passionné sur LIVA.',
        stats: { storiesRead: 5, hoursRead: 8, followingCount: 3, followersCount: 12, likesCount: 24 },
        favoriteGenres: ['romance', 'african', 'thriller'],
        followedAuthorIds: ['sarah-diop'],
        likedStoryIds: ['la-promesse-du-silence']
      };
      this.state.registeredAccounts.push(account);
    }

    if (account) {
      this.state.isAuthenticated = true;
      this.state.user = {
        id: account.id,
        email: account.email,
        name: account.name,
        username: account.username,
        avatar: account.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        bio: account.bio || 'Passionné de lecture sur LIVA.',
        stats: account.stats || { storiesRead: 0, hoursRead: 0, followingCount: 0, followersCount: 0, likesCount: 0 },
        favoriteGenres: account.favoriteGenres || ['romance', 'african'],
        followedAuthorIds: account.followedAuthorIds || [],
        likedStoryIds: account.likedStoryIds || []
      };
      this.saveState();
      return true;
    }

    // Fallback: if user typed any credentials, allow login with custom user
    this.state.isAuthenticated = true;
    const displayName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
    this.state.user = {
      id: `user-${Date.now()}`,
      email: identifier.includes('@') ? identifier : `${identifier}@liva.com`,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      username: identifier.startsWith('@') ? identifier : `@${identifier}`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Membre passionné de la communauté LIVA.',
      stats: { storiesRead: 1, hoursRead: 2, followingCount: 2, followersCount: 5, likesCount: 8 },
      favoriteGenres: ['romance', 'african', 'thriller'],
      followedAuthorIds: ['sarah-diop'],
      likedStoryIds: ['la-promesse-du-silence']
    };
    this.saveState();
    return true;
  }

  register({ name, username, email, password, favoriteGenres }) {
    if (!this.state.registeredAccounts) {
      this.state.registeredAccounts = DEFAULT_STATE.registeredAccounts;
    }

    const newAccount = {
      id: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      username: username.startsWith('@') ? username : `@${username}`,
      name: name.trim(),
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      bio: 'Nouvel auteur & lecteur enthousiaste sur LIVA.',
      stats: { storiesRead: 0, hoursRead: 0, followingCount: 0, followersCount: 0, likesCount: 0 },
      favoriteGenres: favoriteGenres || ['romance', 'african'],
      followedAuthorIds: ['sarah-diop', 'amadou-kante'],
      likedStoryIds: []
    };

    this.state.registeredAccounts.push(newAccount);
    this.state.isAuthenticated = true;
    this.state.user = { ...newAccount };
    this.saveState();
    return newAccount;
  }

  logout() {
    this.state.isAuthenticated = false;
    this.state.user = {
      id: 'guest',
      email: '',
      name: 'Visiteur',
      username: '@visiteur',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Connectez-vous pour personnaliser votre profil et sauvegarder vos lectures.',
      stats: { storiesRead: 0, hoursRead: 0, followingCount: 0, followersCount: 0, likesCount: 0 },
      favoriteGenres: [],
      followedAuthorIds: [],
      likedStoryIds: []
    };
    this.saveState();
  }

  updateUserProfile(updates = {}) {
    this.state.user = { ...this.state.user, ...updates };
    const registered = (this.state.registeredAccounts || []).find(a => a.id === this.state.user.id);
    if (registered) {
      Object.assign(registered, updates);
    }
    this.saveState();
  }
}

export const store = new AppStore();
