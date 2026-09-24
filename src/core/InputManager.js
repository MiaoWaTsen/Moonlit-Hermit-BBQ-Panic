/**
 * InputManager: Handles Keyboard (WASD, Arrows, Space, F, E, G) & Touch Joysticks
 */

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.virtualVector = { x: 0, y: 0 };
    
    // Action trigger flags (single press events)
    this.pickupJustPressed = false;
    this.interactJustPressed = false;
    this.isInteractingHeld = false;

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent default scrolling on game control keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keys.has(e.code)) {
        if (e.code === 'Space' || e.code === 'KeyF') {
          this.pickupJustPressed = true;
        }
        if (e.code === 'KeyE' || e.code === 'KeyG') {
          this.interactJustPressed = true;
        }
      }

      if (e.code === 'KeyE' || e.code === 'KeyG') {
        this.isInteractingHeld = true;
      }

      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'KeyE' || e.code === 'KeyG') {
        this.isInteractingHeld = false;
      }
    });
  }

  // Get movement direction vector for Player 1 (Normalized -1 to 1)
  getP1Movement() {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;

    // Combine with virtual touch joystick if active
    if (this.virtualVector.x !== 0 || this.virtualVector.y !== 0) {
      dx = this.virtualVector.x;
      dy = this.virtualVector.y;
    }

    const length = Math.hypot(dx, dy);
    if (length > 1) {
      dx /= length;
      dy /= length;
    }

    return { x: dx, y: dy };
  }

  // Consume single-frame action presses
  consumePickupPress() {
    const pressed = this.pickupJustPressed;
    this.pickupJustPressed = false;
    return pressed;
  }

  consumeInteractPress() {
    const pressed = this.interactJustPressed;
    this.interactJustPressed = false;
    return pressed;
  }

  isInteracting() {
    return this.isInteractingHeld;
  }
}
