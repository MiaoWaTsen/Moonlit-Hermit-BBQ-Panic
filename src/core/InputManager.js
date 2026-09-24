/**
 * InputManager: Handles Keyboard & Touch Joysticks
 * Supports 1P (WASD/Arrows + Space/F + E/G) & 2P Mode (P1: WASD+F+G, P2: Arrows+K+L)
 */

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.virtualVector = { x: 0, y: 0 };
    this.is2PMode = false;
    
    // Player 1 Pickup / Throw States
    this.p1PickupPressTime = 0;
    this.p1IsPickupHeld = false;
    this.p1PickupJustPressed = false;
    this.p1ThrowJustReleased = false;
    this.p1ThrowPower = 1.0;

    // Player 1 Interact (E / G)
    this.p1InteractJustPressed = false;
    this.p1IsInteractingHeld = false;

    // Player 2 Pickup / Throw States (K)
    this.p2PickupPressTime = 0;
    this.p2IsPickupHeld = false;
    this.p2PickupJustPressed = false;
    this.p2ThrowJustReleased = false;
    this.p2ThrowPower = 1.0;

    // Player 2 Interact (L)
    this.p2InteractJustPressed = false;
    this.p2IsInteractingHeld = false;

    this.initKeyboard();
  }

  reset() {
    this.keys.clear();
    this.p1IsPickupHeld = false;
    this.p1PickupJustPressed = false;
    this.p1ThrowJustReleased = false;
    this.p1IsInteractingHeld = false;
    this.p1InteractJustPressed = false;

    this.p2IsPickupHeld = false;
    this.p2PickupJustPressed = false;
    this.p2ThrowJustReleased = false;
    this.p2IsInteractingHeld = false;
    this.p2InteractJustPressed = false;
  }

  initKeyboard() {
    window.addEventListener('blur', () => {
      this.reset();
    });

    window.addEventListener('keydown', (e) => {
      // Allow browser shortcuts like F12, Ctrl+R, etc.
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyK', 'KeyL'].includes(e.code)) {
        e.preventDefault();
      }

      // P1 Triggers
      if (!this.keys.has(e.code)) {
        if (e.code === 'Space' || e.code === 'KeyF') {
          this.p1IsPickupHeld = true;
          this.p1PickupPressTime = performance.now();
        }
        if (e.code === 'KeyE' || e.code === 'KeyG') {
          this.p1InteractJustPressed = true;
        }

        // P2 Triggers (K / L)
        if (e.code === 'KeyK') {
          this.p2IsPickupHeld = true;
          this.p2PickupPressTime = performance.now();
        }
        if (e.code === 'KeyL') {
          this.p2InteractJustPressed = true;
        }
      }

      if (e.code === 'KeyE' || e.code === 'KeyG') {
        this.p1IsInteractingHeld = true;
      }
      if (e.code === 'KeyL') {
        this.p2IsInteractingHeld = true;
      }

      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);

      // P1 Pickup / Throw Release
      if (e.code === 'Space' || e.code === 'KeyF') {
        if (this.p1IsPickupHeld) {
          const hold = performance.now() - this.p1PickupPressTime;
          this.p1IsPickupHeld = false;
          if (hold < 220) {
            this.p1PickupJustPressed = true;
          } else {
            this.p1ThrowJustReleased = true;
            this.p1ThrowPower = Math.min(1.4, 0.7 + (hold / 600));
          }
        }
      }
      if (e.code === 'KeyE' || e.code === 'KeyG') {
        this.p1IsInteractingHeld = false;
      }

      // P2 Pickup / Throw Release (K)
      if (e.code === 'KeyK') {
        if (this.p2IsPickupHeld) {
          const hold = performance.now() - this.p2PickupPressTime;
          this.p2IsPickupHeld = false;
          if (hold < 220) {
            this.p2PickupJustPressed = true;
          } else {
            this.p2ThrowJustReleased = true;
            this.p2ThrowPower = Math.min(1.4, 0.7 + (hold / 600));
          }
        }
      }
      if (e.code === 'KeyL') {
        this.p2IsInteractingHeld = false;
      }
    });
  }

  getP1ThrowCharge() {
    if (!this.p1IsPickupHeld) return 0;
    const hold = performance.now() - this.p1PickupPressTime;
    if (hold < 150) return 0;
    return Math.min(1.0, (hold - 150) / 400);
  }

  getP2ThrowCharge() {
    if (!this.p2IsPickupHeld) return 0;
    const hold = performance.now() - this.p2PickupPressTime;
    if (hold < 150) return 0;
    return Math.min(1.0, (hold - 150) / 400);
  }

  getP1Movement() {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('KeyW') || (!this.is2PMode && this.keys.has('ArrowUp'))) dy -= 1;
    if (this.keys.has('KeyS') || (!this.is2PMode && this.keys.has('ArrowDown'))) dy += 1;
    if (this.keys.has('KeyA') || (!this.is2PMode && this.keys.has('ArrowLeft'))) dx -= 1;
    if (this.keys.has('KeyD') || (!this.is2PMode && this.keys.has('ArrowRight'))) dx += 1;

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

  getP2Movement() {
    if (!this.is2PMode) return { x: 0, y: 0 };
    let dx = 0;
    let dy = 0;

    if (this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('ArrowRight')) dx += 1;

    const length = Math.hypot(dx, dy);
    if (length > 1) {
      dx /= length;
      dy /= length;
    }

    return { x: dx, y: dy };
  }

  // P1 Consume
  consumeP1Pickup() {
    const p = this.p1PickupJustPressed;
    this.p1PickupJustPressed = false;
    return p;
  }
  consumeP1Throw() {
    const r = this.p1ThrowJustReleased;
    const pow = this.p1ThrowPower;
    this.p1ThrowJustReleased = false;
    return r ? pow : null;
  }
  isP1Interacting() {
    return this.p1IsInteractingHeld;
  }

  // P2 Consume
  consumeP2Pickup() {
    const p = this.p2PickupJustPressed;
    this.p2PickupJustPressed = false;
    return p;
  }
  consumeP2Throw() {
    const r = this.p2ThrowJustReleased;
    const pow = this.p2ThrowPower;
    this.p2ThrowJustReleased = false;
    return r ? pow : null;
  }
  isP2Interacting() {
    return this.p2IsInteractingHeld;
  }
}
