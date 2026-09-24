/**
 * Main Application Entry Point
 * Complete SDD Implementation with:
 * 1. Initial Nickname Entry -> Recipe/Mode Screen Flow
 * 2. 1P Starts Immediately / 2P Prompts for Player 2 Name
 * 3. In-Game Mode Switching Locked
 * 4. 2P Provides 3 Plates (1P Provides 2 Plates)
 * 5. Separate 1P and 2P Leaderboards
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
    
    // Player names
    this.p1Name = '玉兔大廚';
    this.p2Name = '吳剛大廚';

    this.is2PMode = false;
    this.gameStarted = false;
    this.isPausedForModal = true;
    this.currentLbMode = '1p';

    this.gameWorld = new GameWorld(false, this.p1Name, this.p2Name);
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
    this.desktopHelperBar = document.getElementById('desktop-helper-bar');

    // Modals
    this.authModal = document.getElementById('auth-modal');
    this.authCloseBtn = document.getElementById('btn-auth-close');
    this.authForm = document.getElementById('auth-form');
    this.authMsgEl = document.getElementById('auth-msg');

    this.tutorialModal = document.getElementById('tutorial-modal');
    this.tutorialHeaderTitle = document.getElementById('tutorial-header-title');
    this.modeSelectSection = document.getElementById('mode-select-section');
    this.tutorialCloseBtn = document.getElementById('btn-tutorial-close');
    this.tutorialStartBtn = document.getElementById('btn-tutorial-start');

    this.player2Modal = document.getElementById('player2-modal');
    this.p1SummaryName = document.getElementById('p1-summary-name');
    this.p2Form = document.getElementById('p2-form');
    this.p2UsernameInput = document.getElementById('p2-username');
    this.p2CloseBtn = document.getElementById('btn-p2-close');

    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.leaderboardCloseBtn = document.getElementById('btn-leaderboard-close');
    this.leaderboardConfirmBtn = document.getElementById('btn-leaderboard-confirm');
    this.leaderboardTbody = document.getElementById('leaderboard-tbody');
    this.lbTab1P = document.getElementById('lb-tab-1p');
    this.lbTab2P = document.getElementById('lb-tab-2p');

    this.gameoverModal = document.getElementById('gameover-modal');
    this.settleScoreEl = document.getElementById('settle-score');
    this.settleDishesEl = document.getElementById('settle-dishes');
    this.settleComboEl = document.getElementById('settle-combo');
    this.settleTitleEl = document.getElementById('settle-title');
    this.settleModeTag = document.getElementById('settle-mode-tag');
    this.settleRestartBtn = document.getElementById('btn-settle-restart');
    this.settleViewLbBtn = document.getElementById('btn-settle-view-leaderboard');

    // Stats & Tracking
    this.dishesServedCount = 0;
    this.maxComboReached = 1.0;
    this.renderedOrderIds = new Set();
    this.hasRecordedGameOver = false;

    this.lastTime = performance.now();
    this.initAudioToggle();
    this.initAuthModal();
    this.initTutorialModal();
    this.initPlayer2Modal();
    this.initLeaderboardModal();
    this.initGameOverModal();
    this.initGlobalShortcuts();
    this.initTouchControls();
    this.updateHelperBar();
    this.startLoop();
  }

  initAudioToggle() {
    this.soundToggleBtn?.addEventListener('click', () => {
      const isMuted = this.gameWorld.soundManager.toggleMute();
      this.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      this.soundToggleBtn.title = isMuted ? '點擊開啟音效' : '點擊靜音';
    });
  }

  updateHelperBar() {
    if (!this.desktopHelperBar) return;
    if (this.is2PMode) {
      this.desktopHelperBar.innerHTML = `
        <div class="key-hint"><kbd>1P 🐰 ${this.p1Name}</kbd> WASD 移動 | Space 拿放前拋 | E 切菜洗碗</div>
        <div class="key-hint"><kbd>2P 🪓 ${this.p2Name}</kbd> 方向鍵 移動 | K 拿放前拋 | L 切菜洗碗</div>
        <div class="key-hint"><kbd>H / R</kbd> 查看食譜</div>
        <div class="key-hint mode-indicator">👥 2P 雙人協作 (3個盤子)</div>
      `;
    } else {
      this.desktopHelperBar.innerHTML = `
        <div class="key-hint"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 或 <kbd>方向鍵</kbd> 移動</div>
        <div class="key-hint"><kbd>Space</kbd> 拿放 (短按) / 前拋 (長按)</div>
        <div class="key-hint"><kbd>E</kbd> 備料切菜 / 水槽洗碗</div>
        <div class="key-hint"><kbd>H</kbd> 或 <kbd>R</kbd> 查看食譜</div>
        <div class="key-hint mode-indicator">1P 單人修練 (2個盤子)</div>
      `;
    }
  }

  // Step 1: Initial Nickname Entry (Guest Mode)
  initAuthModal() {
    const usernameInput = document.getElementById('auth-username');

    this.hudPlayerBadge?.addEventListener('click', () => {
      this.authModal?.classList.remove('hidden');
      this.isPausedForModal = true;
      usernameInput?.focus();
    });

    this.authForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = usernameInput?.value.trim() || '玉兔大廚';
      this.p1Name = u;
      this.authManager.loginGuest(u);

      if (this.hudPlayerNameEl) this.hudPlayerNameEl.textContent = this.p1Name;
      if (this.p1SummaryName) this.p1SummaryName.textContent = this.p1Name;

      this.gameWorld.soundManager.playOrderSuccess();
      this.authModal?.classList.add('hidden');

      // Proceed to Step 2: Tutorial & Mode Selection
      this.tutorialModal?.classList.remove('hidden');
      this.isPausedForModal = true;
    });
  }

  // Step 2: Tutorial & Mode Selection
  initTutorialModal() {
    const card1P = document.getElementById('mode-select-1p');
    const card2P = document.getElementById('mode-select-2p');

    // Select 1P: Starts immediately!
    card1P?.addEventListener('click', () => {
      this.startGame(false);
    });

    // Select 2P: Prompts for Player 2 name!
    card2P?.addEventListener('click', () => {
      this.tutorialModal?.classList.add('hidden');
      if (this.p1SummaryName) this.p1SummaryName.textContent = this.p1Name;
      this.player2Modal?.classList.remove('hidden');
      this.p2UsernameInput?.focus();
      this.gameWorld.soundManager.playPickup();
    });

    this.tutorialStartBtn?.addEventListener('click', () => {
      if (!this.gameStarted) {
        this.startGame(false);
      } else {
        // Just dismiss in-game recipe manual
        this.tutorialModal?.classList.add('hidden');
        this.isPausedForModal = false;
        this.inputManager.reset();
        this.lastTime = performance.now();
        this.gameWorld.soundManager.playPickup();
        this.canvas?.focus();
      }
    });

    this.tutorialCloseBtn?.addEventListener('click', () => {
      if (!this.gameStarted) {
        this.startGame(false);
      } else {
        this.tutorialModal?.classList.add('hidden');
        this.isPausedForModal = false;
        this.inputManager.reset();
        this.lastTime = performance.now();
        this.canvas?.focus();
      }
    });

    this.recipeOpenBtn?.addEventListener('click', () => {
      this.tutorialModal?.classList.remove('hidden');
      this.isPausedForModal = true;
      this.inputManager.reset();
      this.gameWorld.soundManager.playDrop();
    });
  }

  // Step 3: Player 2 Name Input Modal
  initPlayer2Modal() {
    this.p2Form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.p2Name = this.p2UsernameInput?.value.trim() || '吳剛大廚';
      this.player2Modal?.classList.add('hidden');
      this.startGame(true);
    });

    this.p2CloseBtn?.addEventListener('click', () => {
      this.player2Modal?.classList.add('hidden');
      this.tutorialModal?.classList.remove('hidden');
    });
  }

  // Core Game Start Dispatcher
  startGame(is2P) {
    this.gameStarted = true;
    this.is2PMode = is2P;
    this.inputManager.is2PMode = is2P;
    this.currentLbMode = is2P ? '2p' : '1p';

    // Lock mode selection for in-game recipe manual
    if (this.modeSelectSection) {
      this.modeSelectSection.style.display = 'none';
    }
    if (this.tutorialHeaderTitle) {
      this.tutorialHeaderTitle.innerHTML = '月宮大廚修練手冊 <small>中秋烤肉食譜手冊 (按 H / R 或 空白鍵 關閉)</small>';
    }
    if (this.tutorialStartBtn) {
      this.tutorialStartBtn.textContent = '返回廚房繼續烤肉 (Space / Enter / Esc)';
    }

    // Hide all popups
    this.authModal?.classList.add('hidden');
    this.tutorialModal?.classList.add('hidden');
    this.player2Modal?.classList.add('hidden');
    this.gameoverModal?.classList.add('hidden');
    this.leaderboardModal?.classList.add('hidden');

    // Create fresh GameWorld with correct plate count & player names
    this.gameWorld = new GameWorld(this.is2PMode, this.p1Name, this.p2Name);
    this.dishesServedCount = 0;
    this.maxComboReached = 1.0;
    this.renderedOrderIds.clear();
    this.hasRecordedGameOver = false;

    // Update HUD
    if (this.hudPlayerNameEl) {
      this.hudPlayerNameEl.textContent = this.is2PMode ? `${this.p1Name} & ${this.p2Name}` : this.p1Name;
    }

    this.isPausedForModal = false;
    this.inputManager.reset();
    this.lastTime = performance.now();
    this.updateHelperBar();
    this.canvas?.focus();
    this.gameWorld.soundManager.playOrderSuccess();
  }

  // Leaderboard Modal (Separate 1P and 2P)
  initLeaderboardModal() {
    const openLB = (mode = this.currentLbMode) => {
      this.currentLbMode = mode;
      this.renderLeaderboardTable(mode);
      this.leaderboardModal?.classList.remove('hidden');
      this.isPausedForModal = true;
      this.gameWorld.soundManager.playPickup();
    };

    const closeLB = () => {
      this.leaderboardModal?.classList.add('hidden');
      if (this.gameStarted && !this.gameWorld.isGameOver) {
        this.isPausedForModal = false;
        this.inputManager.reset();
        this.lastTime = performance.now();
        this.canvas?.focus();
      }
    };

    this.lbTab1P?.addEventListener('click', () => {
      this.currentLbMode = '1p';
      this.renderLeaderboardTable('1p');
    });

    this.lbTab2P?.addEventListener('click', () => {
      this.currentLbMode = '2p';
      this.renderLeaderboardTable('2p');
    });

    this.leaderboardOpenBtn?.addEventListener('click', () => openLB(this.is2PMode ? '2p' : '1p'));
    this.leaderboardCloseBtn?.addEventListener('click', closeLB);
    this.leaderboardConfirmBtn?.addEventListener('click', closeLB);
  }

  renderLeaderboardTable(mode = '1p') {
    if (!this.leaderboardTbody) return;

    if (this.lbTab1P && this.lbTab2P) {
      if (mode === '2p') {
        this.lbTab1P.classList.remove('active');
        this.lbTab2P.classList.add('active');
      } else {
        this.lbTab2P.classList.remove('active');
        this.lbTab1P.classList.add('active');
      }
    }

    const scores = this.leaderboardManager.getScores(mode);

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
      this.gameoverModal?.classList.add('hidden');
      this.startGame(this.is2PMode);
    });

    this.settleViewLbBtn?.addEventListener('click', () => {
      this.gameoverModal?.classList.add('hidden');
      this.currentLbMode = this.is2PMode ? '2p' : '1p';
      this.renderLeaderboardTable(this.currentLbMode);
      this.leaderboardModal?.classList.remove('hidden');
    });
  }

  triggerGameOverSettlement() {
    if (this.hasRecordedGameOver) return;
    this.hasRecordedGameOver = true;
    this.isPausedForModal = true;

    const score = this.gameWorld.score;
    const maxCombo = this.maxComboReached;
    const mode = this.is2PMode ? '2p' : '1p';
    const displayName = this.is2PMode ? `${this.p1Name} & ${this.p2Name}` : this.p1Name;

    this.authManager.recordGame(score);
    this.leaderboardManager.addScore(displayName, score, maxCombo, mode);

    let title = '👨‍🍳 月宮學徒';
    if (score >= 2500) title = '👑 米其林月宮神廚 (天下第一)';
    else if (score >= 1800) title = '🔥 萬家烤肉達人 (香飄十里)';
    else if (score >= 1000) title = '✨ 廣寒宮熟練掌杓人';
    else if (score >= 400) title = '🍢 炭火初學者';

    if (this.settleScoreEl) this.settleScoreEl.textContent = score.toLocaleString();
    if (this.settleDishesEl) this.settleDishesEl.textContent = `${this.dishesServedCount} 份`;
    if (this.settleComboEl) this.settleComboEl.textContent = `x${maxCombo.toFixed(1)}`;
    if (this.settleTitleEl) this.settleTitleEl.textContent = `🎉 ${title}`;
    if (this.settleModeTag) this.settleModeTag.textContent = this.is2PMode ? '👥 2P 雙人協作模式' : '🐰 1P 單人修練模式';

    this.gameWorld.soundManager.playOrderSuccess();
    this.gameoverModal?.classList.remove('hidden');
  }

  initGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      const isTutorialOpen = !this.tutorialModal?.classList.contains('hidden');

      // Toggle or Close Cookbook manual with H, R, Space, Enter, Escape
      if (e.code === 'KeyH' || e.code === 'KeyR') {
        if (isTutorialOpen) {
          if (this.gameStarted) {
            this.tutorialModal?.classList.add('hidden');
            this.isPausedForModal = false;
            this.inputManager.reset();
            this.lastTime = performance.now();
            this.gameWorld.soundManager.playPickup();
            this.canvas?.focus();
          }
        } else if (this.gameStarted && !this.gameWorld.isGameOver) {
          this.tutorialModal?.classList.remove('hidden');
          this.isPausedForModal = true;
          this.inputManager.reset();
          this.gameWorld.soundManager.playDrop();
        }
      } else if (isTutorialOpen && this.gameStarted && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
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

      if (!this.isPausedForModal && this.gameStarted) {
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
            <div class="order-timer-fill" id="timer-fill-${order.id}"></div>
          </div>
        `;
        this.ordersContainer.appendChild(card);
        this.renderedOrderIds.add(order.id);
      }

      const fill = document.getElementById(`timer-fill-${order.id}`);
      if (fill) {
        const pct = Math.max(0, Math.min(100, (order.remainingTime / order.totalPatience) * 100));
        fill.style.width = `${pct}%`;
        fill.className = pct > 50 ? 'order-timer-fill' : pct > 25 ? 'order-timer-fill warning' : 'order-timer-fill danger';
      }
    }
  }

  updateHUDPrompt() {
    if (!this.promptEl) return;
    const prompt = this.gameWorld.interactionPrompt;
    if (prompt) {
      this.promptEl.classList.remove('hidden');
      const badge = this.promptEl.querySelector('.key-badge');
      const txt = this.promptEl.querySelector('.prompt-text');
      if (badge) badge.textContent = prompt.key;
      if (txt) txt.textContent = prompt.text;
    } else {
      this.promptEl.classList.add('hidden');
    }
  }
}

// Bootstrap Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
