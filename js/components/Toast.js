// LIVA - Système de Toast Notifications
export class Toast {
  static container = null;

  static init() {
    if (!this.container) {
      let el = document.getElementById('toast-container');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toast-container';
        el.className = 'toast-container';
        document.body.appendChild(el);
      }
      this.container = el;
    }
  }

  static show(message, type = 'info', icon = '✨', duration = 3200) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${icon}</span>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.9)';
      toast.style.transition = 'all 0.25s ease-out';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
}
