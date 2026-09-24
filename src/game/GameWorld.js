/**
 * GameWorld: Core Simulation Orchestrator
 * Integrates Map, Player, BBQ Grills, Cutting Board, Item Throwing,
 * Orders, Delivery Scoring, Dirty Dish Washing, Sound and Particles
 */

import { MapGrid } from './MapGrid.js';
import { Player } from './Player.js';
import { Item } from './Item.js';
import { FlyingItem } from './FlyingItem.js';
import { OrderManager } from './OrderManager.js';
import { SoundManager } from '../audio/SoundManager.js';
import { ParticleSystem } from '../render/ParticleSystem.js';
import { TILE_TYPES, ITEM_TYPES, TILE_SIZE } from '../core/Constants.js';

export class GameWorld {
  constructor() {
    this.mapGrid = new MapGrid();
    this.player1 = new Player('p1', '月白之隱 (玉兔大廚)', 3, 3, '🐰', '#ffd700');
    this.players = [this.player1];
    
    this.soundManager = new SoundManager();
    this.orderManager = new OrderManager(3);
    this.particleSystem = new ParticleSystem();
    
    this.flyingItems = [];
    this.dirtyDishReturns = []; // { timer: seconds, count: 1 }
    this.interactionPrompt = null;
    
    // Game stats
    this.score = 0;
    this.combo = 1.0;
    this.timeRemaining = 180; // 3 minutes
    this.isGameOver = false;

    this.initWorld();
  }

  initWorld() {
    this.orderManager.initOrders();
    this.orderManager.onOrderExpired = (order) => {
      this.soundManager.playBuzzer();
      this.combo = 1.0;
      this.score = Math.max(0, this.score - 50); // Penalty for expired order
    };
  }

  update(dt, inputManager) {
    if (this.isGameOver) return;

    // 1. Update Game Timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isGameOver = true;
    }

    // 2. Process player 1 movement
    const p1Movement = inputManager.getP1Movement();
    this.player1.update(dt, p1Movement, this.mapGrid);

    // 3. Process Throwing Physics (Holding Space / F)
    const throwPower = inputManager.consumeThrowRelease();
    if (throwPower && this.player1.heldItem) {
      this.throwHeldItem(this.player1, throwPower);
    }

    // 4. Process Interactions (Pickup / Drop / Cutting / Washing)
    this.handleInteractions(dt, inputManager);

    // 5. Update Grills & Cooking
    this.updateGrills(dt);

    // 6. Update Active Flying Items
    for (let i = this.flyingItems.length - 1; i >= 0; i--) {
      const isDone = this.flyingItems[i].update(dt, this);
      if (isDone) {
        this.flyingItems.splice(i, 1);
      }
    }

    // 7. Update Dirty Dish Return Queue
    this.updateDirtyDishReturns(dt);

    // 8. Update Orders
    this.orderManager.update(dt);

    // 9. Update Particles
    this.particleSystem.update(dt);

    // 10. Compute active prompt for HUD
    this.updateInteractionPrompt(inputManager);
  }

  throwHeldItem(player, power) {
    const startX = player.x;
    const startY = player.y;
    const dirX = player.facing.x;
    const dirY = player.facing.y;

    const flying = new FlyingItem(player.heldItem, startX, startY, dirX, dirY, power);
    this.flyingItems.push(flying);
    player.heldItem = null;
    this.soundManager.playThrow();
  }

  handleInteractions(dt, inputManager) {
    const target = this.player1.getTargetInteractionGrid();
    const tileType = this.mapGrid.getTileType(target.x, target.y);
    const itemOnCounter = this.mapGrid.getItemAt(target.x, target.y);

    // --- Active Continuous Interaction 1: Cutting Board Chopping (Holding E / G) ---
    if (tileType === TILE_TYPES.CUTTING_BOARD && itemOnCounter && itemOnCounter.isChoppable()) {
      if (inputManager.isInteracting()) {
        const completed = itemOnCounter.advanceChop(dt);
        const worldX = (target.x + 0.5) * TILE_SIZE;
        const worldY = (target.y + 0.5) * TILE_SIZE;
        
        if (Math.random() < 0.25) this.soundManager.playChop();
        this.particleSystem.emit(worldX, worldY, 'chop', 2);
        if (completed) {
          this.soundManager.playPickup();
          this.particleSystem.emit(worldX, worldY, 'sparkle', 12);
        }
      }
    }

    // --- Active Continuous Interaction 2: Sink Dishwashing (Holding E / G) ---
    if (tileType === TILE_TYPES.SINK && itemOnCounter && itemOnCounter.isDirtyPlate()) {
      if (inputManager.isInteracting()) {
        const washed = this.mapGrid.advanceWash(target.x, target.y, dt);
        const worldX = (target.x + 0.5) * TILE_SIZE;
        const worldY = (target.y + 0.5) * TILE_SIZE;

        if (Math.random() < 0.2) this.soundManager.playWash();
        this.particleSystem.emit(worldX, worldY, 'sparkle', 1);

        if (washed) {
          this.soundManager.playPickup();
          this.particleSystem.emit(worldX, worldY, 'sparkle', 10);
        }
      }
    }

    // --- Discrete Pickup / Drop / Serve Action (Space / F Quick Tap) ---
    if (inputManager.consumePickupPress()) {
      // Case A: Player is holding an item
      if (this.player1.heldItem) {
        // Delivery Counter Submission
        if (tileType === TILE_TYPES.DELIVERY) {
          if (this.player1.heldItem.isPlate()) {
            const result = this.orderManager.matchAndServe(this.player1.heldItem);
            if (result) {
              // Successfully matched order!
              const earned = Math.floor(result.points * this.combo);
              this.score += earned;
              this.combo = Math.min(2.5, +(this.combo + 0.2).toFixed(1));
              
              this.soundManager.playOrderSuccess();
              this.particleSystem.emit((target.x + 0.5) * TILE_SIZE, (target.y + 0.5) * TILE_SIZE, 'sparkle', 25);
              
              this.player1.heldItem = null;
              // Schedule dirty plate return in 2.5 seconds
              this.dirtyDishReturns.push({ timer: 2.5 });
              return;
            } else {
              // Wrong order or incomplete recipe
              this.soundManager.playBuzzer();
              this.combo = 1.0;
              return;
            }
          }
        }

        // Drop into Trash Bin
        if (tileType === TILE_TYPES.TRASH) {
          this.soundManager.playDrop();
          this.particleSystem.emit((target.x + 0.5) * TILE_SIZE, (target.y + 0.5) * TILE_SIZE, 'spark', 6);
          this.player1.heldItem = null;
          return;
        }

        // Place on empty Counter / Cutting Board / Grill / Sink / Floor
        if (tileType === TILE_TYPES.COUNTER || tileType === TILE_TYPES.CUTTING_BOARD || tileType === TILE_TYPES.GRILL || tileType === TILE_TYPES.SINK || tileType === TILE_TYPES.FLOOR) {
          if (!itemOnCounter) {
            if (tileType === TILE_TYPES.GRILL && this.player1.heldItem.isChoppable()) {
              // Raw meat/veggie must be chopped before grilling
              this.soundManager.playWarning();
              return;
            }

            this.mapGrid.setItemAt(target.x, target.y, this.player1.heldItem);
            this.soundManager.playDrop();
            this.player1.heldItem = null;
            return;
          } else {
            // Food assembly onto Plate on Counter / Floor
            if (itemOnCounter.isPlate() && this.player1.heldItem.isFood()) {
              if (itemOnCounter.addIngredient(this.player1.heldItem)) {
                this.soundManager.playPickup();
                this.particleSystem.emit((target.x + 0.5) * TILE_SIZE, (target.y + 0.5) * TILE_SIZE, 'sparkle', 6);
                this.player1.heldItem = null;
                return;
              }
            }
            // Plate picking up food from Counter / Floor
            if (this.player1.heldItem.isPlate() && itemOnCounter.isFood()) {
              if (this.player1.heldItem.addIngredient(itemOnCounter)) {
                this.soundManager.playPickup();
                this.particleSystem.emit((target.x + 0.5) * TILE_SIZE, (target.y + 0.5) * TILE_SIZE, 'sparkle', 6);
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
          this.soundManager.playPickup();
          return;
        }
        if (tileType === TILE_TYPES.CRATE_VEGGIE) {
          this.player1.heldItem = Item.create(ITEM_TYPES.RAW_VEGGIE);
          this.soundManager.playPickup();
          return;
        }
        if (tileType === TILE_TYPES.CRATE_TOAST) {
          this.player1.heldItem = Item.create(ITEM_TYPES.TOAST);
          this.soundManager.playPickup();
          return;
        }

        // Pick item from Counter / Cutting board / Grill / Sink / Floor
        if (itemOnCounter) {
          this.player1.heldItem = itemOnCounter;
          this.soundManager.playPickup();
          this.mapGrid.setItemAt(target.x, target.y, null);
          return;
        }
      }
    }
  }

  updateGrills(dt) {
    for (let y = 0; y < this.mapGrid.rows; y++) {
      for (let x = 0; x < this.mapGrid.cols; x++) {
        const type = this.mapGrid.getTileType(x, y);
        if (type === TILE_TYPES.GRILL) {
          const item = this.mapGrid.getItemAt(x, y);
          const worldX = (x + 0.5) * TILE_SIZE;
          const worldY = (y + 0.5) * TILE_SIZE;

          if (Math.random() < 0.12) {
            this.particleSystem.emit(worldX, worldY, 'spark', 1);
          }

          if (item && item.isCookable()) {
            const { justCooked, justBurnt } = item.advanceCook(dt);

            if (item.isBurnt()) {
              this.particleSystem.emit(worldX, worldY, 'smoke_black', 2);
              if (justBurnt) {
                this.soundManager.playBuzzer();
                this.particleSystem.emit(worldX, worldY, 'smoke_black', 10);
              }
            } else if (item.isBurningWarning()) {
              this.particleSystem.emit(worldX, worldY, 'smoke_white', 2);
              this.particleSystem.emit(worldX, worldY, 'spark', 2);
              if (Math.random() < 0.1) this.soundManager.playWarning();
            } else if (item.isPerfect()) {
              this.particleSystem.emit(worldX, worldY, 'smoke_white', 1);
              if (justCooked) {
                this.soundManager.playPickup();
                this.particleSystem.emit(worldX, worldY, 'sparkle', 12);
              }
            } else {
              if (Math.random() < 0.25) {
                this.particleSystem.emit(worldX, worldY, 'smoke_white', 1);
              }
            }
          }
        }
      }
    }
  }

  updateDirtyDishReturns(dt) {
    for (let i = this.dirtyDishReturns.length - 1; i >= 0; i--) {
      const entry = this.dirtyDishReturns[i];
      entry.timer -= dt;
      if (entry.timer <= 0) {
        const returnX = 3;
        const returnY = 0;
        if (!this.mapGrid.getItemAt(returnX, returnY)) {
          this.mapGrid.setItemAt(returnX, returnY, Item.create(ITEM_TYPES.DIRTY_PLATE));
        } else if (!this.mapGrid.getItemAt(4, 0)) {
          this.mapGrid.setItemAt(4, 0, Item.create(ITEM_TYPES.DIRTY_PLATE));
        }
        this.soundManager.playDrop();
        this.dirtyDishReturns.splice(i, 1);
      }
    }
  }

  updateInteractionPrompt(inputManager) {
    const charge = inputManager.getThrowCharge();
    if (charge > 0 && this.player1.heldItem) {
      this.interactionPrompt = { key: '釋放空白鍵', text: `蓄力前拋 (${Math.floor(charge * 100)}%) 🚀` };
      return;
    }

    const target = this.player1.getTargetInteractionGrid();
    const tileType = this.mapGrid.getTileType(target.x, target.y);
    const itemOnCounter = this.mapGrid.getItemAt(target.x, target.y);

    if (tileType === TILE_TYPES.WALL) {
      this.interactionPrompt = null;
      return;
    }

    if (this.player1.heldItem) {
      if (tileType === TILE_TYPES.DELIVERY) {
        if (this.player1.heldItem.isPlate()) {
          this.interactionPrompt = { key: 'SPACE', text: '出餐送達 🛎️' };
        } else {
          this.interactionPrompt = { key: '⚠️', text: '需先將食材裝入餐盤！' };
        }
      } else if (tileType === TILE_TYPES.TRASH) {
        this.interactionPrompt = { key: 'SPACE', text: '丟棄至垃圾桶 🗑️' };
      } else if (tileType === TILE_TYPES.GRILL) {
        if (!itemOnCounter) {
          if (this.player1.heldItem.isChoppable()) {
            this.interactionPrompt = { key: '⚠️', text: '生料需先切碎備料！' };
          } else {
            this.interactionPrompt = { key: 'SPACE', text: '放置食材開始炭烤 🔥' };
          }
        }
      } else if (tileType === TILE_TYPES.CUTTING_BOARD) {
        if (!itemOnCounter) {
          this.interactionPrompt = { key: 'SPACE', text: '放置食材於備料砧板 🔪' };
        }
      } else if (tileType === TILE_TYPES.SINK) {
        if (!itemOnCounter && this.player1.heldItem.isDirtyPlate()) {
          this.interactionPrompt = { key: 'SPACE', text: '放置髒盤準備洗滌 🚰' };
        }
      } else if (tileType === TILE_TYPES.COUNTER || tileType === TILE_TYPES.FLOOR) {
        if (!itemOnCounter) {
          this.interactionPrompt = { key: 'SPACE', text: tileType === TILE_TYPES.FLOOR ? '放置於地面' : '放置於工作檯' };
        } else if (itemOnCounter.isPlate()) {
          this.interactionPrompt = { key: 'SPACE', text: '裝入餐盤 🍽️' };
        }
      } else {
        this.interactionPrompt = null;
      }
    } else {
      // Empty handed
      if (tileType === TILE_TYPES.CUTTING_BOARD && itemOnCounter && itemOnCounter.isChoppable()) {
        const pct = Math.floor(itemOnCounter.chopProgress * 100);
        this.interactionPrompt = { key: '長按 E', text: `切菜備料中 (${pct}%) 🔪` };
      } else if (tileType === TILE_TYPES.SINK && itemOnCounter && itemOnCounter.isDirtyPlate()) {
        const pct = Math.floor(this.mapGrid.getWashProgress(target.x, target.y) * 100);
        this.interactionPrompt = { key: '長按 E', text: `清洗油膩盤子 (${pct}%) 🚰` };
      } else if (tileType === TILE_TYPES.GRILL && itemOnCounter) {
        if (itemOnCounter.isBurnt()) {
          this.interactionPrompt = { key: 'SPACE', text: '拿取焦炭 (丟垃圾桶)' };
        } else if (itemOnCounter.isBurningWarning()) {
          this.interactionPrompt = { key: '⚠️ 快拿取！', text: '即將燒焦！' };
        } else if (itemOnCounter.isPerfect()) {
          this.interactionPrompt = { key: 'SPACE', text: '拿取完美烤物 ✨' };
        } else {
          const pct = Math.floor(itemOnCounter.cookProgress * 100);
          this.interactionPrompt = { key: 'SPACE', text: `烘烤中 (${pct}%)` };
        }
      } else if (tileType === TILE_TYPES.CRATE_BEEF) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取生牛肉 🥩' };
      } else if (tileType === TILE_TYPES.CRATE_VEGGIE) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取鮮青椒 🫑' };
      } else if (tileType === TILE_TYPES.CRATE_TOAST) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取鮮奶吐司 🍞' };
      } else if (itemOnCounter) {
        this.interactionPrompt = { key: 'SPACE', text: `拿取 ${itemOnCounter.getDisplayName()}` };
      } else {
        this.interactionPrompt = null;
      }
    }
  }
}
