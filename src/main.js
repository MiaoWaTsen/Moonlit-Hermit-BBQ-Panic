/**
 * Main Application Entry Point
 * Synchronizes Game Simulation, HUD, Order Tickets, Audio, Modal Guides & Mobile Controls
 */

import { InputManager } from './core/InputManager.js';
import { GameWorld } from './game/GameWorld.js';
import { Renderer2D } from './render/Renderer2D.js';

class App {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.inputManager = new InputManager();
    this.gameWorld = new GameWorld();
    this.renderer = new Renderer2D(this.canvas);
    
    // UI Elements
    this.promptEl = document.getElementById('interaction-prompt');
    this.hudTimerEl = document.getElementById('hud-timer');
    this.hudScoreEl = document.getElementById('hud-score');
    this.hudComboEl = document.getElementById('hud-combo');
    this.ordersContainer = document.getElementById('order-tickets-container');
    this.soundToggleBtn = document.getElementById('btn-sound-toggle');
    this.recipeOpenBtn = document.getElementById('btn-recipe-open');
    this.tutorialModal = document.getElementById('tutorial-modal');
    this.tutorialCloseBtn = document.getElementById('btn-tutorial-close');
    this.tutorialStartBtn = document.getElementById('btn-tutorial-start');

    // DOM order cache to avoid 60fps innerHTML re-rendering and flickering
    this.renderedOrderIds = new Set();
    this.isPausedForModal = true; // Start paused showing the initial tutorial cookbook

    this.lastTime = performance.now();
    this.initAudioToggle();
    this.initTutorialModal();
    this.initTouchControls();
    this.startLoop();
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
      this.lastTime = performance.now(); // Reset delta time
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

    window.addEventListener('keydown', (e) => {
      if (!this.tutorialModal?.classList.contains('hidden')) {
        if (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space') {
          e.preventDefault();
          closeModal();
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

      // Update Simulation only when not paused by modal
      if (!this.isPausedForModal) {
        this.gameWorld.update(dt, this.inputManager);
      }

      // Always render canvas
      this.renderer.render(this.gameWorld, this.inputManager);

      // Update HUD & Orders
      this.updateHUD();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  updateHUD() {
    // 1. Timer format MM:SS
    const mins = Math.floor(this.gameWorld.timeRemaining / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.gameWorld.timeRemaining % 60).toString().padStart(2, '0');
    if (this.hudTimerEl) this.hudTimerEl.textContent = `${mins}:${secs}`;

    // 2. Score & Combo
    if (this.hudScoreEl) this.hudScoreEl.textContent = this.gameWorld.score.toLocaleString();
    if (this.hudComboEl) this.hudComboEl.textContent = `x${this.gameWorld.combo.toFixed(1)}`;

    // 3. Render Order Tickets in HUD Bar (Smooth DOM sync without rebuilding innerHTML)
    this.syncOrderTicketsDOM();

    // 4. Update Floating Interactive Prompt
    this.updateHUDPrompt();
  }

  syncOrderTicketsDOM() {
    if (!this.ordersContainer) return;
    const activeOrders = this.gameWorld.orderManager.activeOrders;
    const activeIdSet = new Set(activeOrders.map(o => o.id));

    // Remove obsolete order DOM nodes
    const existingCards = this.ordersContainer.querySelectorAll('.order-card');
    existingCards.forEach(card => {
      if (!activeIdSet.has(card.id)) {
        card.remove();
        this.renderedOrderIds.delete(card.id);
      }
    });

    // Remove placeholder if orders exist, or add if empty
    const placeholder = this.ordersContainer.querySelector('.order-placeholder');
    if (activeOrders.length > 0 && placeholder) {
      placeholder.remove();
    } else if (activeOrders.length === 0 && !placeholder) {
      this.ordersContainer.innerHTML = '<div class="order-placeholder">等待神仙顧客點餐中...</div>';
      this.renderedOrderIds.clear();
      return;
    }

    // Add or update active orders
    for (const order of activeOrders) {
      let card = document.getElementById(order.id);
      if (!card) {
        // Create card element once
        card = document.createElement('div');
        card.className = 'order-card';
        card.id = order.id;

        const ingredientBadges = order.recipe.required.map(t => {
          if (t.includes('BEEF')) return '🥩';
          if (t.includes('VEGGIE')) return '🍢';
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

      // Update timer progress bar without re-creating DOM
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
