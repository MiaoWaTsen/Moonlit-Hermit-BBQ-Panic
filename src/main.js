/**
 * Main Application Entry Point
 * Initializes Game Loop, Canvas, Audio & UI
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
    
    this.lastTime = performance.now();
    this.initTouchControls();
    this.startLoop();
  }

  initTouchControls() {
    // Detect mobile touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mobileControls = document.getElementById('mobile-controls');
    if (isTouchDevice && mobileControls) {
      mobileControls.classList.remove('hidden');

      const btnPickup = document.getElementById('btn-mobile-pickup');
      const btnInteract = document.getElementById('btn-mobile-interact');

      btnPickup?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.inputManager.pickupJustPressed = true;
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
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Clamp dt
      this.lastTime = currentTime;

      // Update Game State
      this.gameWorld.update(dt, this.inputManager);

      // Render Canvas
      this.renderer.render(this.gameWorld);

      // Update Floating HUD Prompt
      this.updateHUDPrompt();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  updateHUDPrompt() {
    const prompt = this.gameWorld.interactionPrompt;
    if (prompt && this.promptEl) {
      this.promptEl.classList.remove('hidden');
      const p1 = this.gameWorld.player1;
      
      // Calculate canvas bounding rect to position floating prompt
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = rect.width / this.canvas.clientWidth;
      const scaleY = rect.height / this.canvas.clientHeight;

      const screenX = rect.left + p1.x * scaleX;
      const screenY = rect.top + (p1.y - p1.radius - 20) * scaleY;

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

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
