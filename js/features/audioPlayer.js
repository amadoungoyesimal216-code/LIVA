// LIVA - Lecteur Audio & Synthèse Vocale IA
import { Toast } from '../components/Toast.js';

export class AudioPlayer {
  constructor(store) {
    this.store = store;
    this.isPlaying = false;
    this.currentStory = null;
    this.currentChapter = null;
    this.currentTime = 0;
    this.duration = 180; // seconds
    this.playbackRate = 1.0;
    this.timer = null;
    this.speechUtterance = null;
  }

  init() {
    this.container = document.getElementById('floating-audio-bar');
    if (!this.container) return;

    this.playBtn = this.container.querySelector('#audio-play-toggle');
    this.titleEl = this.container.querySelector('#audio-bar-title');
    this.voiceEl = this.container.querySelector('#audio-bar-voice');
    this.coverEl = this.container.querySelector('#audio-bar-cover-img');
    this.scrubberFill = this.container.querySelector('#audio-scrubber-fill');
    this.rateBtn = this.container.querySelector('#audio-rate-btn');
    this.closeBtn = this.container.querySelector('#audio-close-btn');

    this.bindEvents();
  }

  bindEvents() {
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.rateBtn) {
      this.rateBtn.addEventListener('click', () => this.cyclePlaybackRate());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.stopAndHide());
    }

    const skipBack = this.container.querySelector('#audio-skip-back');
    if (skipBack) {
      skipBack.addEventListener('click', () => this.seekBy(-15));
    }

    const skipForward = this.container.querySelector('#audio-skip-forward');
    if (skipForward) {
      skipForward.addEventListener('click', () => this.seekBy(15));
    }

    const track = this.container.querySelector('#audio-scrubber-track');
    if (track) {
      track.addEventListener('click', (e) => {
        const rect = track.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.currentTime = percent * this.duration;
        this.updateProgressUI();
      });
    }
  }

  playStory(storyId, chapterIndex = 0) {
    const story = this.store.getStoryById(storyId);
    if (!story) return;

    this.currentStory = story;
    this.currentChapter = story.chapters[chapterIndex] || story.chapters[0];
    this.currentTime = 0;
    this.duration = (this.currentChapter?.readTimeMin || 5) * 60;

    // Update UI elements
    if (this.titleEl) this.titleEl.textContent = `${story.title} · ${this.currentChapter?.title || 'Chapitre 1'}`;
    if (this.voiceEl) this.voiceEl.innerHTML = `<span>🎙️</span> ${story.audioVoice || 'Voix IA Amira'}`;
    if (this.coverEl) this.coverEl.src = story.cover;

    this.container.classList.add('active');
    this.startPlayback();
    Toast.show(`Lecture audio démarrée : ${story.title}`, 'info', '🎧');
  }

  startPlayback() {
    this.isPlaying = true;
    this.updatePlayBtnUI();

    // Start timer for simulated playback scrubber
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.currentTime < this.duration) {
        this.currentTime += 1 * this.playbackRate;
        this.updateProgressUI();
      } else {
        this.pause();
        Toast.show('Lecture du chapitre terminée', 'info', '✨');
      }
    }, 1000);

    // Optional Web Speech API synthesis if available
    if ('speechSynthesis' in window && this.currentChapter?.content) {
      window.speechSynthesis.cancel();
      const cleanText = this.currentChapter.content.replace(/[#*—]/g, '');
      this.speechUtterance = new SpeechSynthesisUtterance(cleanText.substring(0, 500));
      this.speechUtterance.lang = 'fr-FR';
      this.speechUtterance.rate = this.playbackRate;
      window.speechSynthesis.speak(this.speechUtterance);
    }
  }

  pause() {
    this.isPlaying = false;
    this.updatePlayBtnUI();
    if (this.timer) clearInterval(this.timer);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.startPlayback();
    }
  }

  seekBy(seconds) {
    this.currentTime = Math.max(0, Math.min(this.duration, this.currentTime + seconds));
    this.updateProgressUI();
    Toast.show(`${seconds > 0 ? '+15s' : '-15s'}`, 'info', '⏱️', 1200);
  }

  cyclePlaybackRate() {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(this.playbackRate);
    this.playbackRate = rates[(currentIndex + 1) % rates.length];

    if (this.rateBtn) {
      this.rateBtn.textContent = `${this.playbackRate}x`;
    }

    if (this.speechUtterance) {
      this.speechUtterance.rate = this.playbackRate;
    }

    Toast.show(`Vitesse : ${this.playbackRate}x`, 'info', '⚡', 1500);
  }

  updateProgressUI() {
    const percent = (this.currentTime / this.duration) * 100;
    if (this.scrubberFill) {
      this.scrubberFill.style.width = `${percent}%`;
    }
  }

  updatePlayBtnUI() {
    if (this.playBtn) {
      this.playBtn.innerHTML = this.isPlaying ? '⏸️' : '▶️';
    }
    const waveEl = this.container.querySelector('.audio-waves');
    if (waveEl) {
      waveEl.style.opacity = this.isPlaying ? '1' : '0.3';
    }
  }

  stopAndHide() {
    this.pause();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.container.classList.remove('active');
  }
}
