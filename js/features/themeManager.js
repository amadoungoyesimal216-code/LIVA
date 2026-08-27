// LIVA - Gestionnaire de Thème (Sombre / Clair / Crème)
import { Toast } from '../components/Toast.js';

export class ThemeManager {
  constructor(store) {
    this.store = store;
  }

  init() {
    const currentTheme = this.store.state.theme || 'dark';
    this.applyTheme(currentTheme, false);

    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cycleTheme();
      });
    });

    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.currentTarget.getAttribute('data-set-theme');
        this.applyTheme(theme, true);
      });
    });
  }

  cycleTheme() {
    const themes = ['dark', 'light', 'cream'];
    const current = this.store.state.theme || 'dark';
    const nextIndex = (themes.indexOf(current) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    this.applyTheme(nextTheme, true);
  }

  applyTheme(themeName, showToast = true) {
    document.documentElement.setAttribute('data-theme', themeName);
    this.store.setTheme(themeName);

    // Update active states in UI buttons
    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      if (btn.getAttribute('data-set-theme') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update theme toggle icons
    const icons = {
      dark: '🌙',
      light: '☀️',
      cream: '📖'
    };

    const names = {
      dark: 'Mode Sombre',
      light: 'Mode Clair',
      cream: 'Mode Crème (Liseuse)'
    };

    document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
      icon.textContent = icons[themeName] || '🌙';
    });

    if (showToast) {
      Toast.show(`Thème activé : ${names[themeName]}`, 'info', icons[themeName]);
    }
  }
}
