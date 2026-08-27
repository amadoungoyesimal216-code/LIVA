// LIVA - Application Principale & Routeur SPA
import { store } from './state/store.js?v=7';
import { ThemeManager } from './features/themeManager.js?v=7';
import { AudioPlayer } from './features/audioPlayer.js?v=7';
import { Toast } from './components/Toast.js?v=7';
import { Modal } from './components/Modal.js?v=7';
import { GENRES_DATA } from './data/genres.js?v=7';

// Views
import { HomeView } from './views/HomeView.js?v=7';
import { ExploreView } from './views/ExploreView.js?v=7';
import { StoryView } from './views/StoryView.js?v=7';
import { ReaderView } from './views/ReaderView.js?v=7';
import { LibraryView } from './views/LibraryView.js?v=7';
import { CreateView } from './views/CreateView.js?v=7';
import { ProfileView } from './views/ProfileView.js?v=7';
import { SwipeView } from './views/SwipeView.js?v=7';
import { OnboardingView } from './views/OnboardingView.js?v=7';
import { AuthView } from './views/AuthView.js?v=7';

class AppRouter {
  constructor(store) {
    this.store = store;
    this.routes = {};
    this.currentView = null;
    this.viewContainer = document.getElementById('view-container');
  }

  register(path, viewInstance) {
    this.routes[path] = viewInstance;
  }

  navigate(url) {
    window.location.hash = url.startsWith('/') ? '#' + url : '#/' + url;
  }

  refresh() {
    this.handleRoute();
  }

  handleRoute() {
    const rawHash = window.location.hash.slice(1) || '/';
    const [pathPart, queryPart] = rawHash.split('?');
    const searchParams = new URLSearchParams(queryPart || '');
    const queryObj = Object.fromEntries(searchParams.entries());

    // Hide or show layout elements based on view (e.g. Reader view or Auth view)
    const isReader = pathPart.startsWith('/reader');
    const isAuthPage = pathPart === '/auth';
    const isStandalone = isReader || isAuthPage;

    const desktopSidebar = document.getElementById('desktop-sidebar');
    const bottomNav = document.getElementById('bottom-nav');
    const topbar = document.getElementById('topbar-header');
    const audioBar = document.getElementById('floating-audio-bar');
    const mainContent = document.querySelector('.main-content');

    if (desktopSidebar) desktopSidebar.style.display = isStandalone ? 'none' : '';
    if (bottomNav) bottomNav.style.display = isStandalone ? 'none' : '';
    if (topbar) topbar.style.display = isStandalone ? 'none' : '';
    if (audioBar) audioBar.style.display = isStandalone ? 'none' : '';

    if (mainContent) {
      if (isStandalone) {
        mainContent.style.marginLeft = '0';
        mainContent.style.padding = '0';
        mainContent.style.width = '100%';
        mainContent.style.maxWidth = '100%';
      } else {
        mainContent.style.marginLeft = '';
        mainContent.style.padding = '';
        mainContent.style.width = '';
        mainContent.style.maxWidth = '';
      }
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // Update active nav links
    this.updateActiveNavLinks(pathPart);

    // Update User Avatar and Name in Header/Sidebar
    this.syncUserUI();

    // Route Guards (Protection des routes d'écriture privées)
    const isAuthenticated = this.store.state.isAuthenticated;
    const protectedRoutes = ['/create'];
    if (protectedRoutes.includes(pathPart) && !isAuthenticated) {
      Toast.show('Veuillez vous connecter pour accéder au Studio d\'Écriture ✍️', 'warning', '🔒');
      this.navigate('/auth?mode=login');
      return;
    }

    // Route matching
    if (pathPart === '/' || pathPart === '') {
      this.renderView(this.routes['/'], queryObj);
    } else if (pathPart === '/explore') {
      this.renderView(this.routes['/explore'], queryObj);
    } else if (pathPart.startsWith('/story/')) {
      const storyId = pathPart.replace('/story/', '');
      this.renderView(this.routes['/story'], { id: storyId, ...queryObj });
    } else if (pathPart.startsWith('/reader/')) {
      const parts = pathPart.replace('/reader/', '').split('/');
      const storyId = parts[0];
      const chapterIndex = parts[1] || '0';
      this.renderView(this.routes['/reader'], { id: storyId, chapterIndex, ...queryObj });
    } else if (pathPart === '/library') {
      this.renderView(this.routes['/library'], queryObj);
    } else if (pathPart === '/create') {
      this.renderView(this.routes['/create'], queryObj);
    } else if (pathPart.startsWith('/profile/author/')) {
      const authorId = pathPart.replace('/profile/author/', '');
      this.renderView(this.routes['/profile'], { authorId, ...queryObj });
    } else if (pathPart === '/profile') {
      this.renderView(this.routes['/profile'], queryObj);
    } else if (pathPart === '/auth') {
      this.renderView(this.routes['/auth'], queryObj);
    } else if (pathPart === '/swipe') {
      this.renderView(this.routes['/swipe'], queryObj);
    } else {
      // Default to home
      this.renderView(this.routes['/'], queryObj);
    }
  }

  syncUserUI() {
    const user = this.store.state.user;
    const isAuth = this.store.state.isAuthenticated;

    // Desktop sidebar user mini card
    const sideUserName = document.querySelector('.user-mini-name');
    const sideUserHandle = document.querySelector('.user-mini-handle');
    const sideUserAvatar = document.querySelector('.user-mini-card img');

    if (sideUserName) sideUserName.textContent = isAuth ? user.name : 'Se connecter';
    if (sideUserHandle) sideUserHandle.textContent = isAuth ? user.username : 'Créer un compte';
    if (sideUserAvatar) sideUserAvatar.src = isAuth ? user.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';

    // Topbar mobile avatar
    const topbarAvatar = document.querySelector('.topbar-avatar-wrap img');
    if (topbarAvatar) {
      topbarAvatar.src = user.avatar;
      topbarAvatar.title = isAuth ? user.name : 'Se connecter';
    }
  }

  renderView(viewInstance, params = {}) {
    if (!viewInstance || !this.viewContainer) return;
    this.currentView = viewInstance;
    this.viewContainer.innerHTML = viewInstance.render(params);
    viewInstance.attachEvents(this.viewContainer);
  }

  updateActiveNavLinks(path) {
    const rootPath = '/' + path.split('/')[1];
    document.querySelectorAll('[data-nav-route]').forEach(link => {
      const target = link.getAttribute('data-nav-route');
      if (target === rootPath || (rootPath === '/' && target === '/')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

// Initialize Application
function initApp() {
  const router = new AppRouter(store);
  const themeManager = new ThemeManager(store);
  const audioPlayer = new AudioPlayer(store);
  window.appAudioPlayer = audioPlayer;

  // Initialize features
  themeManager.init();
  audioPlayer.init();
  Modal.setupBackdropClose();

  // Register views
  router.register('/', new HomeView(store, router));
  router.register('/explore', new ExploreView(store, router));
  router.register('/story', new StoryView(store, router));
  router.register('/reader', new ReaderView(store, router));
  router.register('/library', new LibraryView(store, router));
  router.register('/create', new CreateView(store, router));
  router.register('/profile', new ProfileView(store, router));
  router.register('/swipe', new SwipeView(store, router));
  router.register('/auth', new AuthView(store, router));

  // Global Navigation clicks
  document.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', (e) => {
      const route = el.getAttribute('data-navigate');
      if (route) {
        document.getElementById('notif-dropdown')?.classList.remove('active');
        router.navigate(route);
      }
    });
  });

  // Global Logout Action
  document.addEventListener('click', async (e) => {
    const logoutBtn = e.target.closest('[data-action="logout"]');
    if (logoutBtn) {
      e.preventDefault();
      e.stopPropagation();
      await store.logout();
      Toast.show('Vous avez été déconnecté avec succès. À bientôt !', 'info', '👋', 3000);
      router.syncUserUI();
      router.navigate('/auth?mode=login');
    }
  });

  // Subscribe to store events (Auth & Cloud Sync)
  store.subscribe((state, changeType) => {
    router.syncUserUI();
    if (changeType === 'USER_DATA_LOADED' || changeType === 'SUPABASE_SYNC_COMPLETE') {
      router.refresh();
    }
  });

  // Listen to hash changes
  window.addEventListener('hashchange', () => router.handleRoute());

  // Setup Global Modals
  setupGlobalModals(store, router);

  // Setup Notifications Drawer
  setupNotifications(store, router);

  // Trigger initial route
  router.handleRoute();

  // Check Onboarding
  if (!store.state.onboardingCompleted) {
    const onbView = new OnboardingView(store, () => router.refresh());
    const onbContainer = document.getElementById('onboarding-modal-container');
    if (onbContainer) {
      onbContainer.innerHTML = onbView.render();
      onbView.attachEvents(onbContainer.querySelector('#modal-onboarding'));
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function setupNotifications(store, router) {
  const triggerBtn = document.getElementById('btn-topbar-notifications');
  const dropdown = document.getElementById('notif-dropdown');
  const countBadge = document.getElementById('notif-unread-count');
  const listContainer = document.getElementById('notif-list-container');
  const markAllBtn = document.getElementById('btn-mark-all-read');
  const clearAllBtn = document.getElementById('btn-clear-all-notifs');
  let activeFilter = 'all'; // 'all' | 'unread'

  const updateNotifUI = () => {
    const unreadCount = store.getUnreadNotificationsCount();
    if (countBadge) {
      countBadge.textContent = unreadCount;
      countBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }

    if (!listContainer) return;

    let items = store.state.notifications || [];
    if (activeFilter === 'unread') {
      items = items.filter(n => !n.isRead);
    }

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--space-6) var(--space-4);">
          <span style="font-size: 2.2rem; margin-bottom: var(--space-2);">🔔</span>
          <h4 style="font-size: 0.95rem; font-weight: 700;">Aucune notification</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${activeFilter === 'unread' ? 'Toutes vos notifications sont lues.' : 'Vous êtes à jour !'}</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = items.map(n => `
      <div class="notif-item ${!n.isRead ? 'unread' : ''}" data-notif-id="${n.id}" data-story-id="${n.storyId || ''}" data-type="${n.type || ''}">
        <span class="notif-icon">${n.icon || '🔔'}</span>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-desc">${n.desc}</div>
          <div class="notif-time">${n.time}</div>
        </div>
        <button class="btn btn-ghost notif-delete-btn" data-delete-id="${n.id}" title="Supprimer">✕</button>
      </div>
    `).join('');

    // Clicking a notification item
    listContainer.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.notif-delete-btn')) return;
        const id = item.getAttribute('data-notif-id');
        const storyId = item.getAttribute('data-story-id');
        const type = item.getAttribute('data-type');

        store.markNotificationAsRead(id);
        updateNotifUI();
        dropdown?.classList.remove('active');

        if (type === 'chapter' && storyId) {
          Toast.show('Ouverture du nouveau chapitre...', 'info', '📖');
          router.navigate(`/reader/${storyId}/0`);
        } else if (type === 'follow') {
          Toast.show('Consultation du profil...', 'info', '👤');
          router.navigate('/profile');
        } else if (storyId) {
          Toast.show('Ouverture de l\'histoire...', 'info', '✨');
          router.navigate(`/story/${storyId}`);
        } else {
          Toast.show('Notification lue', 'info', '✓');
        }
      });
    });

    // Delete single notification
    listContainer.querySelectorAll('.notif-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        store.deleteNotification(id);
        updateNotifUI();
        Toast.show('Notification supprimée', 'info', '🗑️');
      });
    });
  };

  // Toggle dropdown on bell click
  triggerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle('active');
  });

  // Filter tabs in notifications
  dropdown?.querySelectorAll('.notif-tab-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.querySelectorAll('.notif-tab-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter') || 'all';
      updateNotifUI();
    });
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notif-dropdown') && !e.target.closest('#btn-topbar-notifications')) {
      dropdown?.classList.remove('active');
    }
  });

  // Mark all as read
  markAllBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    store.markAllNotificationsAsRead();
    updateNotifUI();
    Toast.show('Toutes les notifications sont marquées comme lues', 'success', '✓');
  });

  // Clear all notifications
  clearAllBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    store.clearAllNotifications();
    updateNotifUI();
    Toast.show('Toutes les notifications ont été effacées', 'info', '🗑️');
  });

  updateNotifUI();
}

function setupGlobalModals(store, router) {
  // 1. Create Collection Modal
  const modalCol = document.getElementById('modal-create-collection');
  const btnSaveCol = document.getElementById('btn-submit-create-collection');
  const inputColName = document.getElementById('new-col-name');
  const selectColIcon = document.getElementById('new-col-icon');

  btnSaveCol?.addEventListener('click', () => {
    const name = inputColName?.value.trim();
    const icon = selectColIcon?.value || '📚';
    if (!name) {
      Toast.show('Veuillez donner un nom à votre collection.', 'warning', '⚠️');
      return;
    }
    store.createCollection(name, icon);
    Modal.close('modal-create-collection');
    Toast.show(`Collection "${name}" créée !`, 'success', '✨');
    router.refresh();
  });

  // 2. Create Story Modal
  const modalStory = document.getElementById('modal-create-story');
  const btnSubmitStory = document.getElementById('btn-submit-create-story');

  btnSubmitStory?.addEventListener('click', () => {
    const title = document.getElementById('create-story-title')?.value.trim();
    const genre = document.getElementById('create-story-genre')?.value;
    const desc = document.getElementById('create-story-desc')?.value.trim();
    const tagsRaw = document.getElementById('create-story-tags')?.value.trim();
    const coverUrl = document.getElementById('create-story-cover')?.value.trim();
    const initialText = document.getElementById('create-story-chapter-1')?.value.trim();

    if (!title) {
      Toast.show('Veuillez renseigner un titre pour votre histoire.', 'warning', '⚠️');
      return;
    }

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [genre];

    const newStory = store.createAuthoredStory({
      title,
      genre,
      description: desc,
      tags,
      cover: coverUrl || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80',
      status: 'draft',
      initialChapterText: initialText || 'Il était une fois...'
    });

    Modal.close('modal-create-story');
    Toast.show(`Histoire "${title}" créée avec succès !`, 'success', '🎉');
    router.navigate('/create');
  });

  // 3. Chapter Editor Modal
  const modalEditor = document.getElementById('modal-chapter-editor');
  const btnSaveDraft = document.getElementById('btn-editor-save-draft');
  const btnPublishStory = document.getElementById('btn-editor-publish');
  const editorTextarea = document.getElementById('editor-chapter-content-input');
  const editorTitleInput = document.getElementById('editor-chapter-title-input');

  // Live count update
  editorTextarea?.addEventListener('input', () => {
    const text = editorTextarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const readTimeMin = Math.max(1, Math.ceil(words / 200));

    const wordsEl = modalEditor.querySelector('#editor-word-count');
    const timeEl = modalEditor.querySelector('#editor-read-time');
    if (wordsEl) wordsEl.textContent = `${words} mots`;
    if (timeEl) timeEl.textContent = `⏱️ ~${readTimeMin} min de lecture`;
  });

  btnSaveDraft?.addEventListener('click', () => {
    const storyId = modalEditor.getAttribute('data-editing-story-id');
    const authored = (store.state.authoredStories || []).find(s => s.id === storyId);
    if (authored) {
      if (!authored.chapters) authored.chapters = [{}];
      authored.chapters[0].title = editorTitleInput?.value.trim() || 'Chapitre 1';
      authored.chapters[0].content = editorTextarea?.value.trim() || '';
      authored.chapters[0].updatedAt = new Date().toISOString().split('T')[0];
      store.saveState();
    }
    Toast.show('Brouillon sauvegardé avec succès !', 'info', '💾');
    Modal.close('modal-chapter-editor');
    router.refresh();
  });

  btnPublishStory?.addEventListener('click', () => {
    const storyId = modalEditor.getAttribute('data-editing-story-id');
    const authored = (store.state.authoredStories || []).find(s => s.id === storyId);
    if (authored) {
      if (!authored.chapters) authored.chapters = [{}];
      authored.chapters[0].title = editorTitleInput?.value.trim() || 'Chapitre 1';
      authored.chapters[0].content = editorTextarea?.value.trim() || '';
      authored.chapters[0].updatedAt = new Date().toISOString().split('T')[0];
      authored.status = 'published';
      store.saveState();
      Toast.show('Félicitations ! Votre histoire est désormais publiée sur Liva 🌟', 'success', '🚀');
    }
    Modal.close('modal-chapter-editor');
    router.refresh();
  });

  // 4. Edit Profile Bio Modal
  const btnSaveBio = document.getElementById('btn-submit-edit-profile');
  const inputBio = document.getElementById('edit-user-bio-input');
  const inputName = document.getElementById('edit-user-name-input');

  btnSaveBio?.addEventListener('click', () => {
    if (inputName?.value.trim()) store.state.user.name = inputName.value.trim();
    if (inputBio?.value.trim()) store.state.user.bio = inputBio.value.trim();
    store.saveState();
    Modal.close('modal-edit-profile');
    Toast.show('Profil mis à jour !', 'success', '✨');
    router.refresh();
  });
}
