/**
 * GameWorld: Core Simulation Orchestrator
 * Manages Kitchen Stations, Cutting Board, Grill State Machine & Particles
 */

import { MapGrid } from './MapGrid.js';
import { Player } from './Player.js';
import { Item } from './Item.js';
import { ParticleSystem } from '../render/ParticleSystem.js';
import { TILE_TYPES, ITEM_TYPES, TILE_SIZE } from '../core/Constants.js';

export class GameWorld {
  constructor() {
    this.mapGrid = new MapGrid();
    this.player1 = new Player('p1', '月白之隱 (玉兔大廚)', 3, 3, '🐰', '#ffd700');
    this.players = [this.player1];
    this.particleSystem = new ParticleSystem();
    this.interactionPrompt = null;
    
    // Game stats
    this.score = 0;
    this.combo = 1.0;
    this.timeRemaining = 180; // 3 minutes
  }

  update(dt, inputManager) {
    // 1. Process player 1 movement
    const p1Movement = inputManager.getP1Movement();
    this.player1.update(dt, p1Movement, this.mapGrid);

    // 2. Process interactions (Pickup / Drop / Cutting / Washing)
    this.handleInteractions(dt, inputManager);

    // 3. Update all active BBQ Grills across the kitchen map
    this.updateGrills(dt);

    // 4. Update Particle System
    this.particleSystem.update(dt);

    // 5. Compute active HUD prompt
    this.updateInteractionPrompt(inputManager);
  }

  handleInteractions(dt, inputManager) {
    const target = this.player1.getTargetInteractionGrid();
    const tileType = this.mapGrid.getTileType(target.x, target.y);
    const itemOnCounter = this.mapGrid.getItemAt(target.x, target.y);

    // --- Interaction 1: Cutting Board Active Chopping (Holding E / G) ---
    if (tileType === TILE_TYPES.CUTTING_BOARD && itemOnCounter && itemOnCounter.isChoppable()) {
      if (inputManager.isInteracting()) {
        const completed = itemOnCounter.advanceChop(dt);
        const worldX = (target.x + 0.5) * TILE_SIZE;
        const worldY = (target.y + 0.5) * TILE_SIZE;
        
        this.particleSystem.emit(worldX, worldY, 'chop', 2);
        if (completed) {
          this.particleSystem.emit(worldX, worldY, 'sparkle', 10);
        }
      }
    }

    // --- Interaction 2: Pickup / Drop Action (Space / F) ---
    if (inputManager.consumePickupPress()) {
      // Case A: Player is holding an item
      if (this.player1.heldItem) {
        // Drop into Trash Bin
        if (tileType === TILE_TYPES.TRASH) {
          this.player1.heldItem = null;
          return;
        }

        // Place on empty Counter / Cutting Board / Grill
        if (tileType === TILE_TYPES.COUNTER || tileType === TILE_TYPES.CUTTING_BOARD || tileType === TILE_TYPES.GRILL) {
          if (!itemOnCounter) {
            // If placing on Grill, ensure it is cookable or chopped (raw meat/veggie must be chopped first)
            if (tileType === TILE_TYPES.GRILL) {
              if (this.player1.heldItem.isChoppable()) {
                // Must be chopped first before grilling
                return;
              }
            }

            this.mapGrid.setItemAt(target.x, target.y, this.player1.heldItem);
            this.player1.heldItem = null;
            return;
          } else {
            // Check plate assembly: If held item is food and counter has plate
            if (itemOnCounter.isPlate() && this.player1.heldItem.isFood()) {
              if (itemOnCounter.addIngredient(this.player1.heldItem)) {
                this.player1.heldItem = null;
                return;
              }
            }
            // Or if held item is plate and counter has food
            if (this.player1.heldItem.isPlate() && itemOnCounter.isFood()) {
              if (this.player1.heldItem.addIngredient(itemOnCounter)) {
                this.mapGrid.setItemAt(target.x, target.y, null);
                return;
              }
            }
          }
        }
      } 
      // Case B: Player is empty-handed
      else {
        // Pick from Ingredient Crates
        if (tileType === TILE_TYPES.CRATE_BEEF) {
          this.player1.heldItem = Item.create(ITEM_TYPES.RAW_BEEF);
          return;
        }
        if (tileType === TILE_TYPES.CRATE_VEGGIE) {
          this.player1.heldItem = Item.create(ITEM_TYPES.RAW_VEGGIE);
          return;
        }
        if (tileType === TILE_TYPES.CRATE_TOAST) {
          this.player1.heldItem = Item.create(ITEM_TYPES.TOAST);
          return;
        }

        // Pick clean Plate from Plate Stack
        if (tileType === TILE_TYPES.PLATE_STACK) {
          this.player1.heldItem = Item.create(ITEM_TYPES.PLATE);
          return;
        }

        // Pick item from Counter / Cutting board / Grill
        if (itemOnCounter) {
          this.player1.heldItem = itemOnCounter;
          this.mapGrid.setItemAt(target.x, target.y, null);
          return;
        }
      }
    }
  }

  // BBQ Grill Cooking State Machine update
  updateGrills(dt) {
    for (let y = 0; y < this.mapGrid.rows; y++) {
      for (let x = 0; x < this.mapGrid.cols; x++) {
        const type = this.mapGrid.getTileType(x, y);
        if (type === TILE_TYPES.GRILL) {
          const item = this.mapGrid.getItemAt(x, y);
          const worldX = (x + 0.5) * TILE_SIZE;
          const worldY = (y + 0.5) * TILE_SIZE;

          // Always emit faint charcoal embers from grill
          if (Math.random() < 0.15) {
            this.particleSystem.emit(worldX, worldY, 'spark', 1);
          }

          if (item && item.isCookable()) {
            const { justCooked, justBurnt } = item.advanceCook(dt);

            if (item.isBurnt()) {
              // Black heavy smoke
              this.particleSystem.emit(worldX, worldY, 'smoke_black', 2);
              if (justBurnt) {
                this.particleSystem.emit(worldX, worldY, 'smoke_black', 8);
              }
            } else if (item.isBurningWarning()) {
              // Warning smoke & embers
              this.particleSystem.emit(worldX, worldY, 'smoke_white', 2);
              this.particleSystem.emit(worldX, worldY, 'spark', 2);
            } else if (item.isPerfect()) {
              // Perfect sizzle
              this.particleSystem.emit(worldX, worldY, 'smoke_white', 1);
              if (justCooked) {
                this.particleSystem.emit(worldX, worldY, 'sparkle', 12);
              }
            } else {
              // Raw cooking
              if (Math.random() < 0.3) {
                this.particleSystem.emit(worldX, worldY, 'smoke_white', 1);
              }
            }
          }
        }
      }
    }
  }

  updateInteractionPrompt(inputManager) {
    const target = this.player1.getTargetInteractionGrid();
    const tileType = this.mapGrid.getTileType(target.x, target.y);
    const itemOnCounter = this.mapGrid.getItemAt(target.x, target.y);

    if (tileType === TILE_TYPES.FLOOR || tileType === TILE_TYPES.WALL) {
      this.interactionPrompt = null;
      return;
    }

    if (this.player1.heldItem) {
      if (tileType === TILE_TYPES.TRASH) {
        this.interactionPrompt = { key: 'SPACE', text: '丟棄至垃圾桶' };
      } else if (tileType === TILE_TYPES.GRILL) {
        if (!itemOnCounter) {
          if (this.player1.heldItem.isChoppable()) {
            this.interactionPrompt = { key: '⚠️', text: '需先在切菜台備料！' };
          } else {
            this.interactionPrompt = { key: 'SPACE', text: '放置食材開始炭烤' };
          }
        }
      } else if (tileType === TILE_TYPES.CUTTING_BOARD) {
        if (!itemOnCounter) {
          this.interactionPrompt = { key: 'SPACE', text: '放置食材於備料砧板' };
        }
      } else if (tileType === TILE_TYPES.COUNTER) {
        if (!itemOnCounter) {
          this.interactionPrompt = { key: 'SPACE', text: '放置於工作檯' };
        } else if (itemOnCounter.isPlate()) {
          this.interactionPrompt = { key: 'SPACE', text: '裝入餐盤' };
        }
      } else if (tileType === TILE_TYPES.DELIVERY && this.player1.heldItem.isPlate()) {
        this.interactionPrompt = { key: 'SPACE', text: '出餐送達' };
      } else {
        this.interactionPrompt = null;
      }
    } else {
      // Empty handed
      if (tileType === TILE_TYPES.CUTTING_BOARD && itemOnCounter && itemOnCounter.isChoppable()) {
        const pct = Math.floor(itemOnCounter.chopProgress * 100);
        this.interactionPrompt = { key: '長按 E', text: `切菜備料中 (${pct}%)` };
      } else if (tileType === TILE_TYPES.GRILL && itemOnCounter) {
        if (itemOnCounter.isBurnt()) {
          this.interactionPrompt = { key: 'SPACE', text: '拿取焦炭 (丟垃圾桶)' };
        } else if (itemOnCounter.isBurningWarning()) {
          this.interactionPrompt = { key: '⚠️ 快拿取！', text: '即將燒焦！' };
        } else if (itemOnCounter.isPerfect()) {
          this.interactionPrompt = { key: 'SPACE', text: '拿取完美烤物 ✨' };
        } else {
          const pct = Math.floor(itemOnCounter.cookProgress * 100);
          this.interactionPrompt = { key: 'SPACE', text: `拿取烘烤中食材 (${pct}%)` };
        }
      } else if (tileType === TILE_TYPES.CRATE_BEEF) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取生牛肉 🥩' };
      } else if (tileType === TILE_TYPES.CRATE_VEGGIE) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取鮮青椒 🫑' };
      } else if (tileType === TILE_TYPES.CRATE_TOAST) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取鮮奶吐司 🍞' };
      } else if (tileType === TILE_TYPES.PLATE_STACK) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取乾淨餐盤 🍽️' };
      } else if (itemOnCounter) {
        this.interactionPrompt = { key: 'SPACE', text: `拿取 ${itemOnCounter.getDisplayName()}` };
      } else {
        this.interactionPrompt = null;
      }
    }
  }
}
