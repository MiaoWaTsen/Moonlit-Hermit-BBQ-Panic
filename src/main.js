/**
 * Main Application Entry Point
 * Synchronizes Game Simulation, HUD, Order Tickets, Audio, Auth, Leaderboard,
 * Game Over Settlement & Mobile Controls
 */

import { InputManager } from './core/InputManager.js';
import { GameWorld } from './game/GameWorld.js';
import { Renderer2D } from './render/Renderer2D.js';
import { AuthManager } from './auth/AuthManager.js';
import { LeaderboardManager } from './game/LeaderboardManager.js';

class App {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.inputManager = new InputManager();
    this.authManager = new AuthManager();
    this.leaderboardManager = new LeaderboardManager();
    this.gameWorld = new GameWorld();
    this.renderer = new Renderer2D(this.canvas);
    
    // UI Elements
    this.promptEl = document.getElementById('interaction-prompt');
    this.hudTimerEl = document.getElementById('hud-timer');
    this.hudScoreEl = document.getElementById('hud-score');
    this.hudComboEl = document.getElementById('hud-combo');
    this.hudPlayerNameEl = document.getElementById('hud-player-name');
    this.hudPlayerBadge = document.getElementById('hud-player-badge');
    this.ordersContainer = document.getElementById('order-tickets-container');
    this.soundToggleBtn = document.getElementById('btn-sound-toggle');
    this.recipeOpenBtn = document.getElementById('btn-recipe-open');
    this.leaderboardOpenBtn = document.getElementById('btn-leaderboard-open');

    // Modals
    this.tutorialModal = document.getElementById('tutorial-modal');
    this.tutorialCloseBtn = document.getElementById('btn-tutorial-close');
    this.tutorialStartBtn = document.getElementById('btn-tutorial-start');

    this.authModal = document.getElementById('auth-modal');
    this.authCloseBtn = document.getElementById('btn-auth-close');
    this.authForm = document.getElementById('auth-form');
    this.authMsgEl = document.getElementById('auth-msg');

    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.leaderboardCloseBtn = document.getElementById('btn-leaderboard-close');
    this.leaderboardConfirmBtn = document.getElementById('btn-leaderboard-confirm');
    this.leaderboardTbody = document.getElementById('leaderboard-tbody');

    this.gameoverModal = document.getElementById('gameover-modal');
    this.settleScoreEl = document.getElementById('settle-score');
    this.settleDishesEl = document.getElementById('settle-dishes');
    this.settleComboEl = document.getElementById('settle-combo');
    this.settleTitleEl = document.getElementById('settle-title');
    this.settleRestartBtn = document.getElementById('btn-settle-restart');
    this.settleViewLbBtn = document.getElementById('btn-settle-view-leaderboard');

    // Stats & DOM Caches
    this.dishesServedCount = 0;
    this.maxComboReached = 1.0;
    this.renderedOrderIds = new Set();
    this.isPausedForModal = true;
    this.hasRecordedGameOver = false;

    this.lastTime = performance.now();
    this.initPlayerHUD();
    this.initAudioToggle();
    this.initTutorialModal();
    this.initAuthModal();
    this.initLeaderboardModal();
    this.initGameOverModal();
    this.initGlobalShortcuts();
    this.initTouchControls();
    this.startLoop();
  }

  initPlayerHUD() {
    if (this.hudPlayerNameEl && this.authManager.currentUser) {
      this.hudPlayerNameEl.textContent = this.authManager.currentUser.username;
    }
  }

  initAudioToggle() {
    this.soundToggleBtn?.addEventListener('click', () => {
      const isMuted = this.gameWorld.soundManager.toggleMute();
      this.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      this.soundToggleBtn.title = isMuted ? '點擊開啟音效' : '點擊靜音';
    });
  }

  initTutorialModal() {
    const closeModal = () => {
      this.tutorialModal?.classList.add('hidden');
      this.isPausedForModal = false;
      this.lastTime = performance.now();
      this.gameWorld.soundManager.playPickup();
    };

    const openModal = () => {
      this.tutorialModal?.classList.remove('hidden');
      this.isPausedForModal = true;
      this.gameWorld.soundManager.playDrop();
    };

    this.tutorialStartBtn?.addEventListener('click', closeModal);
    this.tutorialCloseBtn?.addEventListener('click', closeModal);
    this.recipeOpenBtn?.addEventListener('click', openModal);
  }

  initAuthModal() {
    this.hudPlayerBadge?.addEventListener('click', () => {
      this.authModal?.classList.remove('hidden');
      this.isPausedForModal = true;
    });

    this.authCloseBtn?.addEventListener('click', () => {
      this.authModal?.classList.add('hidden');
      this.isPausedForModal = false;
    });

    let currentTab = 'login';
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    const pwdGroup = document.getElementById('group-password');
    const submitBtn = document.getElementById('btn-auth-submit');
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;

        if (this.authMsgEl) this.authMsgEl.classList.add('hidden');

        if (currentTab === 'guest') {
          if (pwdGroup) pwdGroup.style.display = 'none';
          if (submitBtn) submitBtn.textContent = '以訪客身份直接開玩';
          if (usernameInput) usernameInput.placeholder = '訪客暱稱 (選填)';
          if (passwordInput) passwordInput.required = false;
        } else if (currentTab === 'register') {
          if (pwdGroup) pwdGroup.style.display = 'flex';
          if (submitBtn) submitBtn.textContent = '註冊並登入月宮';
          if (usernameInput) usernameInput.placeholder = '請輸入 2~12 字大廚名稱';
          if (passwordInput) passwordInput.required = true;
        } else {
          if (pwdGroup) pwdGroup.style.display = 'flex';
          if (submitBtn) submitBtn.textContent = '登入月宮廚房';
          if (usernameInput) usernameInput.placeholder = '請輸入帳號 / 暱稱';
          if (passwordInput) passwordInput.required = true;
        }
      });
    });

    this.authForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = usernameInput?.value || '';
      const p = passwordInput?.value || '';
      let res;

      if (currentTab === 'guest') {
        res = this.authManager.loginGuest(u);
      } else if (currentTab === 'register') {
        res = this.authManager.register(u, p);
      } else {
        res = this.authManager.login(u, p);
      }

      if (res.success) {
        if (this.authMsgEl) {
          this.authMsgEl.textContent = `歡迎，${res.user.username}！`;
          this.authMsgEl.className = 'auth-msg success';
          this.authMsgEl.classList.remove('hidden');
        }
        this.initPlayerHUD();
        this.gameWorld.soundManager.playOrderSuccess();

        setTimeout(() => {
          this.authModal?.classList.add('hidden');
          this.isPausedForModal = false;
        }, 600);
      } else {
        if (this.authMsgEl) {
          this.authMsgEl.textContent = res.message;
          this.authMsgEl.className = 'auth-msg';
          this.authMsgEl.classList.remove('hidden');
        }
        this.gameWorld.soundManager.playBuzzer();
      }
    });
  }

  initLeaderboardModal() {
    const openLB = () => {
      this.renderLeaderboardTable();
      this.leaderboardModal?.classList.remove('hidden');
      this.isPausedForModal = true;
      this.gameWorld.soundManager.playPickup();
    };

    const closeLB = () => {
      this.leaderboardModal?.classList.add('hidden');
      this.isPausedForModal = false;
    };

    this.leaderboardOpenBtn?.addEventListener('click', openLB);
    this.leaderboardCloseBtn?.addEventListener('click', closeLB);
    this.leaderboardConfirmBtn?.addEventListener('click', closeLB);
  }

  renderLeaderboardTable() {
    if (!this.leaderboardTbody) return;
    const scores = this.leaderboardManager.getScores();

    let html = '';
    scores.forEach((entry, idx) => {
      let rankClass = '';
      let medal = `#${idx + 1}`;
      if (idx === 0) { rankClass = 'rank-gold'; medal = '🥇 冠軍'; }
      else if (idx === 1) { rankClass = 'rank-silver'; medal = '🥈 亞軍'; }
      else if (idx === 2) { rankClass = 'rank-bronze'; medal = '🥉 季軍'; }

      html += `
        <tr>
          <td class="${rankClass}">${medal}</td>
          <td><strong>${entry.name}</strong></td>
          <td class="rank-gold">${entry.score.toLocaleString()} 分</td>
          <td>${entry.combo || 'x1.0'}</td>
          <td>${entry.date || '-'}</td>
        </tr>
      `;
    });

    this.leaderboardTbody.innerHTML = html;
  }

  initGameOverModal() {
    this.settleRestartBtn?.addEventListener('click', () => {
      this.restartGame();
    });

    this.settleViewLbBtn?.addEventListener('click', () => {
      this.gameoverModal?.classList.add('hidden');
      this.leaderboardModal?.classList.remove('hidden');
      this.renderLeaderboardTable();
    });
  }

  triggerGameOverSettlement() {
    if (this.hasRecordedGameOver) return;
    this.hasRecordedGameOver = true;
    this.isPausedForModal = true;

    const score = this.gameWorld.score;
    const maxCombo = this.maxComboReached;
    const username = this.authManager.currentUser?.username || '訪客大廚';

    // Record score
    this.authManager.recordGame(score);
    this.leaderboardManager.addScore(username, score, maxCombo);

    // Dynamic Title Tier
    let title = '👨‍🍳 月宮學徒';
    if (score >= 2500) title = '👑 米其林月宮神廚 (天下第一)';
    else if (score >= 1800) title = '🔥 萬家烤肉達人 (香飄十里)';
    else if (score >= 1000) title = '✨ 廣寒宮熟練掌杓人';
    else if (score >= 400) title = '🍢 炭火初學者';

    if (this.settleScoreEl) this.settleScoreEl.textContent = score.toLocaleString();
    if (this.settleDishesEl) this.settleDishesEl.textContent = `${this.dishesServedCount} 份`;
    if (this.settleComboEl) this.settleComboEl.textContent = `x${maxCombo.toFixed(1)}`;
    if (this.settleTitleEl) this.settleTitleEl.textContent = `🎉 ${title}`;

    this.gameWorld.soundManager.playOrderSuccess();
    this.gameoverModal?.classList.remove('hidden');
  }

  restartGame() {
    this.gameoverModal?.classList.add('hidden');
    this.gameWorld = new GameWorld();
    this.dishesServedCount = 0;
    this.maxComboReached = 1.0;
    this.renderedOrderIds.clear();
    this.hasRecordedGameOver = false;
    this.isPausedForModal = false;
    this.lastTime = performance.now();
    this.gameWorld.soundManager.playPickup();
  }

  initGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Toggle Cookbook / Tutorial with H or R
      if (e.code === 'KeyH' || e.code === 'KeyR') {
        const isHidden = this.tutorialModal?.classList.contains('hidden');
        if (isHidden) {
          this.tutorialModal?.classList.remove('hidden');
          this.isPausedForModal = true;
        } else {
          this.tutorialModal?.classList.add('hidden');
          this.isPausedForModal = false;
        }
      }
    });
  }

  initTouchControls() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mobileControls = document.getElementById('mobile-controls');
    if (isTouchDevice && mobileControls) {
      mobileControls.classList.remove('hidden');

      const btnPickup = document.getElementById('btn-mobile-pickup');
      const btnInteract = document.getElementById('btn-mobile-interact');

      btnPickup?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.inputManager.isPickupHeld = true;
        this.inputManager.pickupPressTime = performance.now();
      });

      btnPickup?.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (this.inputManager.isPickupHeld) {
          const hold = performance.now() - this.inputManager.pickupPressTime;
          this.inputManager.isPickupHeld = false;
          if (hold < 220) {
            this.inputManager.pickupJustPressed = true;
          } else {
            this.inputManager.throwJustReleased = true;
            this.inputManager.throwPower = Math.min(1.4, 0.7 + (hold / 600));
          }
        }
      });

      btnInteract?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.inputManager.interactJustPressed = true;
        this.inputManager.isInteractingHeld = true;
      });

      btnInteract?.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.inputManager.isInteractingHeld = false;
      });
    }
  }

  startLoop() {
    const loop = (currentTime) => {
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      if (!this.isPausedForModal) {
        this.gameWorld.update(dt, this.inputManager);

        // Track stats
        if (this.gameWorld.combo > this.maxComboReached) {
          this.maxComboReached = this.gameWorld.combo;
        }

        // Check game over
        if (this.gameWorld.isGameOver) {
          this.triggerGameOverSettlement();
        }
      }

      // Render
      this.renderer.render(this.gameWorld, this.inputManager);

      // Update HUD
      this.updateHUD();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  updateHUD() {
    const mins = Math.floor(this.gameWorld.timeRemaining / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.gameWorld.timeRemaining % 60).toString().padStart(2, '0');
    if (this.hudTimerEl) this.hudTimerEl.textContent = `${mins}:${secs}`;

    if (this.hudScoreEl) this.hudScoreEl.textContent = this.gameWorld.score.toLocaleString();
    if (this.hudComboEl) this.hudComboEl.textContent = `x${this.gameWorld.combo.toFixed(1)}`;

    this.syncOrderTicketsDOM();
    this.updateHUDPrompt();
  }

  syncOrderTicketsDOM() {
    if (!this.ordersContainer) return;
    const activeOrders = this.gameWorld.orderManager.activeOrders;
    const activeIdSet = new Set(activeOrders.map(o => o.id));

    const existingCards = this.ordersContainer.querySelectorAll('.order-card');
    existingCards.forEach(card => {
      if (!activeIdSet.has(card.id)) {
        card.remove();
        this.renderedOrderIds.delete(card.id);
      }
    });

    const placeholder = this.ordersContainer.querySelector('.order-placeholder');
    if (activeOrders.length > 0 && placeholder) {
      placeholder.remove();
    } else if (activeOrders.length === 0 && !placeholder) {
      this.ordersContainer.innerHTML = '<div class="order-placeholder">等待神仙顧客點餐中...</div>';
      this.renderedOrderIds.clear();
      return;
    }

    for (const order of activeOrders) {
      let card = document.getElementById(order.id);
      if (!card) {
        card = document.createElement('div');
        card.className = 'order-card';
        card.id = order.id;

        const ingredientBadges = order.recipe.required.map(t => {
          if (t.includes('BEEF')) return '🥩';
          if (t.includes('VEGGIE')) return '🫑';
          if (t.includes('TOAST')) return '🍞';
          return '✨';
        }).join(' ');

        card.innerHTML = `
          <div class="order-header">
            <span>${order.recipe.icon} ${order.recipe.name}</span>
            <span class="order-pts">+${order.recipe.points}</span>
          </div>
          <div class="order-ingredients">${ingredientBadges}</div>
          <div class="order-timer-bar">
            <div class="order-timer-fill" style="width: 100%;"></div>
          </div>
        `;
        this.ordersContainer.appendChild(card);
        this.renderedOrderIds.add(order.id);
      }

      const fill = card.querySelector('.order-timer-fill');
      if (fill) {
        const progress = order.getProgress();
        const pct = Math.floor(progress * 100);
        fill.style.width = `${pct}%`;

        fill.classList.remove('warning', 'danger');
        if (progress < 0.25) fill.classList.add('danger');
        else if (progress < 0.5) fill.classList.add('warning');
      }
    }
  }

  updateHUDPrompt() {
    const prompt = this.gameWorld.interactionPrompt;
    if (prompt && this.promptEl && !this.isPausedForModal) {
      this.promptEl.classList.remove('hidden');
      const p1 = this.gameWorld.player1;
      
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = rect.width / this.canvas.clientWidth;
      const scaleY = rect.height / this.canvas.clientHeight;

      const screenX = rect.left + p1.x * scaleX;
      const screenY = rect.top + (p1.y - p1.radius - 24) * scaleY;

      this.promptEl.style.left = `${screenX}px`;
      this.promptEl.style.top = `${screenY}px`;

      const keyBadge = this.promptEl.querySelector('.key-badge');
      const textEl = this.promptEl.querySelector('.prompt-text');
      if (keyBadge) keyBadge.textContent = prompt.key;
      if (textEl) textEl.textContent = prompt.text;
    } else if (this.promptEl) {
      this.promptEl.classList.add('hidden');
    }
  }
}

// Start game
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
