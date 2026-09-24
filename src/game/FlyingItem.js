/**
 * FlyingItem: Represents an airborne item thrown by player with parabolic arc physics
 */

import { TILE_SIZE, TILE_TYPES } from '../core/Constants.js';

export class FlyingItem {
  constructor(item, startX, startY, dirX, dirY, power = 1.0) {
    this.item = item;
    this.x = startX;
    this.y = startY;
    this.z = 20; // Initial elevation above ground
    
    const throwSpeed = 320 * power;
    this.vx = dirX * throwSpeed;
    this.vy = dirY * throwSpeed;
    this.vz = 180 * power; // Initial upward launch velocity
    this.gravity = -500;   // Downward gravity acceleration
    this.hasLanded = false;
  }

  update(dt, gameWorld) {
    if (this.hasLanded) return true;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vz += this.gravity * dt;
    this.z += this.vz * dt;

    // Trail particle
    if (Math.random() < 0.4) {
      gameWorld.particleSystem.emit(this.x, this.y - this.z, 'sparkle', 1);
    }

    // Check Ground Landing
    if (this.z <= 0) {
      this.z = 0;
      this.hasLanded = true;
      this.resolveLanding(gameWorld);
      return true; // Finished flying
    }

    return false;
  }

  resolveLanding(gameWorld) {
    const gx = Math.floor(this.x / TILE_SIZE);
    const gy = Math.floor(this.y / TILE_SIZE);

    // Clamp inside map boundary
    const targetX = Math.max(0, Math.min(gameWorld.mapGrid.cols - 1, gx));
    const targetY = Math.max(0, Math.min(gameWorld.mapGrid.rows - 1, gy));

    const tileType = gameWorld.mapGrid.getTileType(targetX, targetY);
    const itemOnCounter = gameWorld.mapGrid.getItemAt(targetX, targetY);

    gameWorld.soundManager.playDrop();

    // 1. Landing in Trash
    if (tileType === TILE_TYPES.TRASH) {
      gameWorld.particleSystem.emit((targetX + 0.5) * TILE_SIZE, (targetY + 0.5) * TILE_SIZE, 'spark', 5);
      return;
    }

    // 2. Landing on Counter / Cutting Board / Grill
    if (tileType === TILE_TYPES.COUNTER || tileType === TILE_TYPES.CUTTING_BOARD || tileType === TILE_TYPES.GRILL) {
      if (!itemOnCounter) {
        if (tileType === TILE_TYPES.GRILL && this.item.isChoppable()) {
          // Unchopped meat drops onto nearest counter instead
          gameWorld.mapGrid.setItemAt(targetX, targetY, this.item);
        } else {
          gameWorld.mapGrid.setItemAt(targetX, targetY, this.item);
        }
        gameWorld.particleSystem.emit((targetX + 0.5) * TILE_SIZE, (targetY + 0.5) * TILE_SIZE, 'sparkle', 4);
        return;
      } else {
        // Plate assembly on landing!
        if (itemOnCounter.isPlate() && this.item.isFood()) {
          if (itemOnCounter.addIngredient(this.item)) {
            gameWorld.particleSystem.emit((targetX + 0.5) * TILE_SIZE, (targetY + 0.5) * TILE_SIZE, 'sparkle', 8);
            return;
          }
        }
      }
    }

    // 3. Fallback: Find nearest available counter or drop on current tile
    let placed = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = targetX + dx;
        const ny = targetY + dy;
        if (nx >= 0 && nx < gameWorld.mapGrid.cols && ny >= 0 && ny < gameWorld.mapGrid.rows) {
          const nType = gameWorld.mapGrid.getTileType(nx, ny);
          if (nType === TILE_TYPES.COUNTER && !gameWorld.mapGrid.getItemAt(nx, ny)) {
            gameWorld.mapGrid.setItemAt(nx, ny, this.item);
            placed = true;
            break;
          }
        }
      }
      if (placed) break;
    }

    if (!placed) {
      // Emergency place on target tile
      gameWorld.mapGrid.setItemAt(targetX, targetY, this.item);
    }
  }

  render(ctx) {
    ctx.save();
    // Shadow directly beneath flying item
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flying object elevated by this.z
    const drawY = this.y - this.z;
    ctx.translate(this.x, drawY);

    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.item.getEmojiIcon(), 0, 0);

    ctx.restore();
  }
}
