/**
 * Main Application Entry Point
 * Synchronizes Game Simulation, HUD, Order Tickets, Audio, Auth, Leaderboard,
 * 1P/2P Local Co-op, Game Over Settlement & Mobile Controls
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
    this.gameWorld = new GameWorld(false);
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
    this.modeToggleBtn = document.getElementById('btn-mode-toggle');
    this.desktopHelperBar = document.getElementById('desktop-helper-bar');

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

    // State & Caches
    this.is2PMode = false;
    this.dishesServedCount = 0;
    this.maxComboReached = 1.0;
    this.renderedOrderIds = new Set();
    this.isPausedForModal = true;
    this.hasRecordedGameOver = false;

    this.lastTime = performance.now();
    this.initPlayerHUD();
    this.initAudioToggle();
    this.initModeToggle();
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

  setGameMode(is2P) {
    this.is2PMode = is2P;
    this.inputManager.is2PMode = is2P;
    this.gameWorld.set2PMode(is2P);

    if (this.modeToggleBtn) {
      this.modeToggleBtn.textContent = this.is2PMode ? '👥 2P 雙人' : '👥 1P 單人';
    }

    const card1P = document.getElementById('mode-select-1p');
    const card2P = document.getElementById('mode-select-2p');
    if (card1P && card2P) {
      if (this.is2PMode) {
        card1P.classList.remove('active');
        card2P.classList.add('active');
        const badge1P = card1P.querySelector('.mode-badge');
        const badge2P = card2P.querySelector('.mode-badge');
        if (badge1P) badge1P.textContent = '切換';
        if (badge2P) badge2P.textContent = '已選擇';
      } else {
        card2P.classList.remove('active');
        card1P.classList.add('active');
        const badge1P = card1P.querySelector('.mode-badge');
        const badge2P = card2P.querySelector('.mode-badge');
        if (badge1P) badge1P.textContent = '已選擇';
        if (badge2P) badge2P.textContent = '切換';
      }
    }

    this.updateHelperBar();
  }

  initModeToggle() {
    this.modeToggleBtn?.addEventListener('click', () => {
      this.setGameMode(!this.is2PMode);
      this.gameWorld.soundManager.playPickup();
    });
  }

  updateHelperBar() {
    if (!this.desktopHelperBar) return;
    if (this.is2PMode) {
      this.desktopHelperBar.innerHTML = `
        <div class="key-hint"><kbd>1P 🐰 玉兔</kbd> WASD 移動 | Space 拿放前拋 | E 切菜洗碗</div>
        <div class="key-hint"><kbd>2P 🪓 吳剛</kbd> 方向鍵 移動 | K 拿放前拋 | L 切菜洗碗</div>
        <div class="key-hint"><kbd>H / R</kbd> 食譜</div>
        <div class="key-hint mode-indicator">👥 2P 雙人協作</div>
      `;
    } else {
      this.desktopHelperBar.innerHTML = `
        <div class="key-hint"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 或 <kbd>方向鍵</kbd> 移動</div>
        <div class="key-hint"><kbd>Space</kbd> 拿放 (短按) / 前拋 (長按)</div>
        <div class="key-hint"><kbd>E</kbd> 備料切菜 / 水槽洗碗</div>
        <div class="key-hint"><kbd>H</kbd> 或 <kbd>R</kbd> 查看食譜</div>
        <div class="key-hint mode-indicator">1P 單人修練</div>
      `;
    }
  }

  initTutorialModal() {
    const closeModal = () => {
      this.tutorialModal?.classList.add('hidden');
      this.isPausedForModal = false;
      this.inputManager.reset();
      this.lastTime = performance.now();
      this.gameWorld.soundManager.playPickup();
      this.canvas?.focus();
    };

    const openModal = () => {
      this.tutorialModal?.classList.remove('hidden');
      this.isPausedForModal = true;
      this.inputManager.reset();
      this.gameWorld.soundManager.playDrop();
    };

    const card1P = document.getElementById('mode-select-1p');
    const card2P = document.getElementById('mode-select-2p');
    card1P?.addEventListener('click', () => {
      this.setGameMode(false);
      this.gameWorld.soundManager.playPickup();
    });
    card2P?.addEventListener('click', () => {
      this.setGameMode(true);
      this.gameWorld.soundManager.playPickup();
    });

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

    this.authManager.recordGame(score);
    this.leaderboardManager.addScore(username, score, maxCombo);

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
    this.gameWorld = new GameWorld(this.is2PMode);
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
      const isTutorialOpen = !this.tutorialModal?.classList.contains('hidden');

      // Allow 1 / 2 key to switch mode during modal or game
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        this.setGameMode(false);
        this.gameWorld.soundManager.playPickup();
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        this.setGameMode(true);
        this.gameWorld.soundManager.playPickup();
      }

      // Toggle or Close Cookbook modal with H, R, Space, Enter, Escape
      if (e.code === 'KeyH' || e.code === 'KeyR') {
        if (isTutorialOpen) {
          this.tutorialModal?.classList.add('hidden');
          this.isPausedForModal = false;
          this.inputManager.reset();
          this.lastTime = performance.now();
          this.gameWorld.soundManager.playPickup();
          this.canvas?.focus();
        } else {
          this.tutorialModal?.classList.remove('hidden');
          this.isPausedForModal = true;
          this.inputManager.reset();
          this.gameWorld.soundManager.playDrop();
        }
      } else if (isTutorialOpen && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
        e.preventDefault();
        this.tutorialModal?.classList.add('hidden');
        this.isPausedForModal = false;
        this.inputManager.reset();
        this.lastTime = performance.now();
        this.gameWorld.soundManager.playPickup();
        this.canvas?.focus();
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
        this.inputManager.p1IsPickupHeld = true;
        this.inputManager.p1PickupPressTime = performance.now();
      });

      btnPickup?.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (this.inputManager.p1IsPickupHeld) {
          const hold = performance.now() - this.inputManager.p1PickupPressTime;
          this.inputManager.p1IsPickupHeld = false;
          if (hold < 220) {
            this.inputManager.p1PickupJustPressed = true;
          } else {
            this.inputManager.p1ThrowJustReleased = true;
            this.inputManager.p1ThrowPower = Math.min(1.4, 0.7 + (hold / 600));
          }
        }
      });

      btnInteract?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.inputManager.p1InteractJustPressed = true;
        this.inputManager.p1IsInteractingHeld = true;
      });

      btnInteract?.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.inputManager.p1IsInteractingHeld = false;
      });
    }
  }

  startLoop() {
    const loop = (currentTime) => {
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      if (!this.isPausedForModal) {
        this.gameWorld.update(dt, this.inputManager);

        if (this.gameWorld.combo > this.maxComboReached) {
          this.maxComboReached = this.gameWorld.combo;
        }

        if (this.gameWorld.isGameOver) {
          this.triggerGameOverSettlement();
        }
      }

      this.renderer.render(this.gameWorld, this.inputManager);
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
