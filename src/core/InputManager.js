/**
 * InputManager: Handles Keyboard & Touch Joysticks
 * Supports Tap for Pickup/Drop & Hold/Release for Item Throwing
 */

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.virtualVector = { x: 0, y: 0 };
    
    // Pickup / Drop / Throw States
    this.pickupPressTime = 0;
    this.isPickupHeld = false;
    this.pickupJustPressed = false;
    this.throwJustReleased = false;
    this.throwPower = 1.0;

    // Interaction (E / G) States
    this.interactJustPressed = false;
    this.isInteractingHeld = false;

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keys.has(e.code)) {
        if (e.code === 'Space' || e.code === 'KeyF') {
          this.isPickupHeld = true;
          this.pickupPressTime = performance.now();
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

      if (e.code === 'Space' || e.code === 'KeyF') {
        if (this.isPickupHeld) {
          const holdDuration = performance.now() - this.pickupPressTime;
          this.isPickupHeld = false;

          if (holdDuration < 220) {
            // Quick tap: Normal Pickup / Drop
            this.pickupJustPressed = true;
          } else {
            // Long press release: Throw Item!
            this.throwJustReleased = true;
            this.throwPower = Math.min(1.4, 0.7 + (holdDuration / 600));
          }
        }
      }

      if (e.code === 'KeyE' || e.code === 'KeyG') {
        this.isInteractingHeld = false;
      }
    });
  }

  // Get current throw charging progress (0 to 1)
  getThrowCharge() {
    if (!this.isPickupHeld) return 0;
    const holdDuration = performance.now() - this.pickupPressTime;
    if (holdDuration < 150) return 0;
    return Math.min(1.0, (holdDuration - 150) / 400);
  }

  getP1Movement() {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;

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

  consumePickupPress() {
    const pressed = this.pickupJustPressed;
    this.pickupJustPressed = false;
    return pressed;
  }

  consumeThrowRelease() {
    const released = this.throwJustReleased;
    const power = this.throwPower;
    this.throwJustReleased = false;
    return released ? power : null;
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
