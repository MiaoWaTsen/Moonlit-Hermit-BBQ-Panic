/**
 * Player: Handles Movement Physics, Collision, Facing Direction & Holding Items
 */

import { TILE_SIZE, DIRECTIONS, ITEM_TYPES } from '../core/Constants.js';

export class Player {
  constructor(id, name, startGridX, startGridY, avatar = '🐰', color = '#ffd700') {
    this.id = id;
    this.name = name;
    this.x = (startGridX + 0.5) * TILE_SIZE;
    this.y = (startGridY + 0.5) * TILE_SIZE;
    this.vx = 0;
    this.vy = 0;
    this.speed = 250; // Pixels per second (snappy & agile)
    this.radius = TILE_SIZE * 0.32; // Collision circle radius
    
    this.facing = DIRECTIONS.DOWN;
    this.heldItem = null;
    this.avatar = avatar;
    this.color = color;

    // Visual animation states
    this.walkAnimTimer = 0;
    this.isMoving = false;
    this.squashStretch = 1.0;
  }

  update(dt, inputVector, mapGrid) {
    if (inputVector.x !== 0 || inputVector.y !== 0) {
      this.isMoving = true;
      this.walkAnimTimer += dt * 10;

      // Update facing direction based on dominant movement axis
      if (Math.abs(inputVector.x) > Math.abs(inputVector.y)) {
        this.facing = inputVector.x > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
      } else {
        this.facing = inputVector.y > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
      }

      const moveX = inputVector.x * this.speed * dt;
      const moveY = inputVector.y * this.speed * dt;

      // Perform X and Y axis separated sliding collision
      this.moveWithCollision(moveX, 0, mapGrid);
      this.moveWithCollision(0, moveY, mapGrid);
    } else {
      this.isMoving = false;
      this.walkAnimTimer = 0;
    }
  }

  moveWithCollision(dx, dy, mapGrid) {
    const targetX = this.x + dx;
    const targetY = this.y + dy;

    // Check collision against surrounding grid tiles
    const minGridX = Math.floor((targetX - this.radius) / TILE_SIZE);
    const maxGridX = Math.floor((targetX + this.radius) / TILE_SIZE);
    const minGridY = Math.floor((targetY - this.radius) / TILE_SIZE);
    const maxGridY = Math.floor((targetY + this.radius) / TILE_SIZE);

    let collides = false;

    for (let gy = minGridY; gy <= maxGridY; gy++) {
      for (let gx = minGridX; gx <= maxGridX; gx++) {
        if (!mapGrid.isWalkable(gx, gy)) {
          // Calculate closest point on tile AABB to player circle
          const tileLeft = gx * TILE_SIZE;
          const tileRight = (gx + 1) * TILE_SIZE;
          const tileTop = gy * TILE_SIZE;
          const tileBottom = (gy + 1) * TILE_SIZE;

          const closestX = Math.max(tileLeft, Math.min(targetX, tileRight));
          const closestY = Math.max(tileTop, Math.min(targetY, tileBottom));

          const distSq = (targetX - closestX) ** 2 + (targetY - closestY) ** 2;
          if (distSq < this.radius ** 2) {
            collides = true;
            break;
          }
        }
      }
      if (collides) break;
    }

    if (!collides) {
      this.x = targetX;
      this.y = targetY;
    }
  }

  // Get the grid coordinate the player is currently facing towards
  getTargetInteractionGrid() {
    const currentGridX = Math.floor(this.x / TILE_SIZE);
    const currentGridY = Math.floor(this.y / TILE_SIZE);

    return {
      x: currentGridX + this.facing.x,
      y: currentGridY + this.facing.y
    };
  }
}
