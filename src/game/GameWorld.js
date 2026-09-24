/**
 * GameWorld: Core Simulation Orchestrator
 * Supports 1P and 2P Local Co-op (P1: Rabbit Chef, P2: Wu Gang Chef)
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
  constructor(is2P = false, p1Name = '玉兔大廚', p2Name = '吳剛大廚', mapId = 'map1') {
    this.is2PMode = is2P;
    this.p1Name = p1Name;
    this.p2Name = p2Name;
    this.mapId = mapId;
    this.mapGrid = new MapGrid(this.is2PMode, this.mapId);

    const p1Spawn = this.mapId === 'map2' ? { x: 2, y: 3 } : { x: 2, y: 4 };
    const p2Spawn = this.mapId === 'map2' ? { x: 10, y: 3 } : { x: 8, y: 4 };

    this.player1 = new Player('p1', this.p1Name, p1Spawn.x, p1Spawn.y, '🐰', '#ffd700');
    this.player2 = new Player('p2', this.p2Name, p2Spawn.x, p2Spawn.y, '🪓', '#e74c3c');
    
    this.players = this.is2PMode ? [this.player1, this.player2] : [this.player1];
    
    this.soundManager = new SoundManager();
    this.orderManager = new OrderManager(3);
    this.particleSystem = new ParticleSystem();
    
    this.flyingItems = [];
    this.dirtyDishReturns = [];
    this.interactionPrompt = null;
    
    // Game stats
    this.score = 0;
    this.combo = 1.0;
    this.timeRemaining = 180; // 3 minutes
    this.isGameOver = false;

    this.initWorld();
  }

  set2PMode(enabled, p1Name = this.p1Name, p2Name = this.p2Name, mapId = this.mapId) {
    this.is2PMode = enabled;
    this.p1Name = p1Name;
    this.p2Name = p2Name;
    this.mapId = mapId;
    this.player1.name = this.p1Name;
    this.player2.name = this.p2Name;
    this.mapGrid = new MapGrid(this.is2PMode, this.mapId);
    this.players = enabled ? [this.player1, this.player2] : [this.player1];
  }

  initWorld() {
    this.orderManager.initOrders();
    this.orderManager.onOrderExpired = (order) => {
      this.soundManager.playBuzzer();
      this.combo = 1.0;
      this.score = Math.max(0, this.score - 50);
    };
  }

  update(dt, inputManager) {
    if (this.isGameOver) return;

    // 1. Update Game Timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isGameOver = true;
      this.orderManager.activeOrders = [];
      return;
    }

    // 2. Process Player 1 Movement
    const p1Move = inputManager.getP1Movement();
    this.player1.update(dt, p1Move, this.mapGrid);

    // 3. Process Player 2 Movement (if in 2P mode)
    if (this.is2PMode) {
      const p2Move = inputManager.getP2Movement();
      this.player2.update(dt, p2Move, this.mapGrid);
    }

    // 4. Process Throwing Physics
    const p1Throw = inputManager.consumeP1Throw();
    if (p1Throw && this.player1.heldItem) {
      this.throwHeldItem(this.player1, p1Throw);
    }

    if (this.is2PMode) {
      const p2Throw = inputManager.consumeP2Throw();
      if (p2Throw && this.player2.heldItem) {
        this.throwHeldItem(this.player2, p2Throw);
      }
    }

    // 5. Process Interactions for P1 and P2 (Support Space/K and E/L)
    this.handlePlayerInteractions(
      this.player1, 
      dt, 
      inputManager.consumeP1Pickup(), 
      inputManager.isP1Interacting(),
      inputManager.consumeP1InteractJustPressed()
    );
    if (this.is2PMode) {
      this.handlePlayerInteractions(
        this.player2, 
        dt, 
        inputManager.consumeP2Pickup(), 
        inputManager.isP2Interacting(),
        inputManager.consumeP2InteractJustPressed()
      );
    }

    // 6. Update Grills & Cooking
    this.updateGrills(dt);

    // 7. Update Flying Items
    for (let i = this.flyingItems.length - 1; i >= 0; i--) {
      const isDone = this.flyingItems[i].update(dt, this);
      if (isDone) {
        this.flyingItems.splice(i, 1);
      }
    }

    // 8. Update Dirty Dish Return Queue
    this.updateDirtyDishReturns(dt);

    // 9. Update Orders
    this.orderManager.update(dt);

    // 10. Update Particles
    this.particleSystem.update(dt);

    // 11. Update Floating Messages
    if (this.floatingMessages) {
      for (let i = this.floatingMessages.length - 1; i >= 0; i--) {
        const msg = this.floatingMessages[i];
        msg.timer -= dt;
        msg.y -= dt * 22; // Smoothly float upwards
        if (msg.timer <= 0) {
          this.floatingMessages.splice(i, 1);
        }
      }
    }

    // 12. Compute prompt for HUD
    this.updateInteractionPrompt(inputManager);
  }

  showFloatingMessage(text, x, y, color = '#ffd700') {
    if (!this.floatingMessages) this.floatingMessages = [];
    this.floatingMessages.push({
      text,
      x,
      y,
      color,
      timer: 1.8,
      maxTimer: 1.8
    });
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

  handlePlayerInteractions(player, dt, pickupPressed, isInteracting, interactJustPressed = false) {
    const target = player.getTargetInteractionGrid();
    const tileType = this.mapGrid.getTileType(target.x, target.y);
    const itemOnCounter = this.mapGrid.getItemAt(target.x, target.y);
    const targetCenterX = (target.x + 0.5) * TILE_SIZE;
    const targetCenterY = (target.y + 0.5) * TILE_SIZE;

    // Continuous Cutting (Holding E/G or L)
    if (tileType === TILE_TYPES.CUTTING_BOARD && itemOnCounter && itemOnCounter.isChoppable()) {
      if (isInteracting) {
        const completed = itemOnCounter.advanceChop(dt);
        const worldX = targetCenterX;
        const worldY = targetCenterY;
        
        if (Math.random() < 0.25) this.soundManager.playChop();
        this.particleSystem.emit(worldX, worldY, 'chop', 2);
        if (completed) {
          this.soundManager.playPickup();
          this.particleSystem.emit(worldX, worldY, 'sparkle', 12);
        }
      }
    }

    // Continuous Washing (Holding E/G or L)
    if (tileType === TILE_TYPES.SINK && itemOnCounter && itemOnCounter.isDirtyPlate()) {
      if (isInteracting) {
        const washed = this.mapGrid.advanceWash(target.x, target.y, dt);
        const worldX = targetCenterX;
        const worldY = targetCenterY;

        if (Math.random() < 0.25) this.soundManager.playWash();
        this.particleSystem.emit(worldX, worldY, 'sparkle', 2);

        if (washed) {
          itemOnCounter.type = ITEM_TYPES.PLATE;
          itemOnCounter.ingredients = [];
          this.mapGrid.setWashProgress(target.x, target.y, 0);
          this.soundManager.playPickup();
          this.particleSystem.emit(worldX, worldY, 'sparkle', 18);
          this.showFloatingMessage('✨ 餐盤已洗淨！🍽️', worldX, worldY - 12, '#00e5ff');
        }
      }
    }

    // Serving / Delivery (Triggered by either Space / K or E / L)
    if (tileType === TILE_TYPES.DELIVERY && (pickupPressed || interactJustPressed)) {
      if (player.heldItem) {
        if (player.heldItem.isPlate()) {
          const result = this.orderManager.matchAndServe(player.heldItem);
          if (result && result.success) {
            const earned = Math.floor(result.points * this.combo);
            this.score += earned;
            this.combo = Math.min(2.5, +(this.combo + 0.2).toFixed(1));
            this.dishesServedCount = (this.dishesServedCount || 0) + 1;
            if (this.onOrderServed) this.onOrderServed(result);

            this.soundManager.playOrderSuccess();
            this.particleSystem.emit(targetCenterX, targetCenterY, 'sparkle', 25);
            this.showFloatingMessage(result.message || `+${earned}分`, targetCenterX, targetCenterY - 10, '#ffd700');

            player.heldItem = null;
            this.dirtyDishReturns.push({ timer: 2.5 });
            return;
          } else {
            this.soundManager.playBuzzer();
            this.combo = 1.0;
            this.showFloatingMessage(result?.message || '❌ 配方不符！', targetCenterX, targetCenterY - 10, '#ff4757');
            return;
          }
        } else if (player.heldItem.isFood()) {
          this.soundManager.playWarning();
          this.showFloatingMessage('⚠️ 需先將食材裝入餐盤 (🍽️) 再出餐！', targetCenterX, targetCenterY - 10, '#ffa502');
          return;
        }
      }
    }

    // Pickup / Drop / Interact (Quick Tap)
    if (pickupPressed) {
      if (player.heldItem) {
        // Trash
        if (tileType === TILE_TYPES.TRASH) {
          this.soundManager.playDrop();
          this.particleSystem.emit(targetCenterX, targetCenterY, 'spark', 6);
          this.showFloatingMessage('🗑️ 已丟棄', targetCenterX, targetCenterY - 10, '#94a3b8');
          player.heldItem = null;
          return;
        }

        // Place on Counter / Cutting Board / Grill / Sink / Floor
        if (tileType === TILE_TYPES.COUNTER || tileType === TILE_TYPES.CUTTING_BOARD || tileType === TILE_TYPES.GRILL || tileType === TILE_TYPES.SINK || tileType === TILE_TYPES.FLOOR) {
          if (!itemOnCounter) {
            if (tileType === TILE_TYPES.GRILL && player.heldItem.isChoppable()) {
              this.soundManager.playWarning();
              this.showFloatingMessage('⚠️ 生食材需先在砧板切碎！🔪', targetCenterX, targetCenterY - 10, '#ffa502');
              return;
            }

            this.mapGrid.setItemAt(target.x, target.y, player.heldItem);
            this.soundManager.playDrop();
            player.heldItem = null;
            return;
          } else {
            // Food assembly onto Plate on counter
            if (itemOnCounter.isPlate() && player.heldItem.isFood()) {
              if (itemOnCounter.addIngredient(player.heldItem)) {
                this.soundManager.playPickup();
                this.particleSystem.emit(targetCenterX, targetCenterY, 'sparkle', 8);
                player.heldItem = null;
                return;
              } else {
                this.soundManager.playWarning();
                if (player.heldItem.type === ITEM_TYPES.CHOPPED_BEEF || player.heldItem.type === ITEM_TYPES.CHOPPED_VEGGIE || player.heldItem.type === ITEM_TYPES.RAW_BEEF || player.heldItem.type === ITEM_TYPES.RAW_VEGGIE) {
                  this.showFloatingMessage('⚠️ 食材需先在烤爐上烤熟！🔥', targetCenterX, targetCenterY - 10, '#ff7f50');
                } else {
                  this.showFloatingMessage('⚠️ 餐盤已裝滿或食材無效！', targetCenterX, targetCenterY - 10, '#ffa502');
                }
                return;
              }
            }
            // Plate in hand picking up food from counter/grill
            if (player.heldItem.isPlate() && itemOnCounter.isFood()) {
              if (player.heldItem.addIngredient(itemOnCounter)) {
                this.soundManager.playPickup();
                this.particleSystem.emit(targetCenterX, targetCenterY, 'sparkle', 8);
                this.mapGrid.setItemAt(target.x, target.y, null);
                return;
              } else {
                this.soundManager.playWarning();
                if (itemOnCounter.type === ITEM_TYPES.CHOPPED_BEEF || itemOnCounter.type === ITEM_TYPES.CHOPPED_VEGGIE || itemOnCounter.type === ITEM_TYPES.RAW_BEEF || itemOnCounter.type === ITEM_TYPES.RAW_VEGGIE) {
                  this.showFloatingMessage('⚠️ 食材需先在烤爐上烤熟！🔥', targetCenterX, targetCenterY - 10, '#ff7f50');
                } else {
                  this.showFloatingMessage('⚠️ 餐盤已裝滿或食材無效！', targetCenterX, targetCenterY - 10, '#ffa502');
                }
                return;
              }
            }
          }
        }
      } 
      // Empty-handed
      else {
        if (tileType === TILE_TYPES.CRATE_BEEF) {
          player.heldItem = Item.create(ITEM_TYPES.RAW_BEEF);
          this.soundManager.playPickup();
          return;
        }
        if (tileType === TILE_TYPES.CRATE_VEGGIE) {
          player.heldItem = Item.create(ITEM_TYPES.RAW_VEGGIE);
          this.soundManager.playPickup();
          return;
        }
        if (tileType === TILE_TYPES.CRATE_TOAST) {
          player.heldItem = Item.create(ITEM_TYPES.TOAST);
          this.soundManager.playPickup();
          return;
        }

        if (itemOnCounter) {
          player.heldItem = itemOnCounter;
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
        let returnX = this.mapId === 'map2' ? 10 : 3;
        let returnY = this.mapId === 'map2' ? 6 : 0;
        if (!this.mapGrid.getItemAt(returnX, returnY)) {
          this.mapGrid.setItemAt(returnX, returnY, Item.create(ITEM_TYPES.DIRTY_PLATE));
        } else {
          const altX = this.mapId === 'map2' ? 10 : 4;
          const altY = this.mapId === 'map2' ? 5 : 0;
          this.mapGrid.setItemAt(altX, altY, Item.create(ITEM_TYPES.DIRTY_PLATE));
        }
        this.soundManager.playDrop();
        this.dirtyDishReturns.splice(i, 1);
      }
    }
  }

  updateInteractionPrompt(inputManager) {
    const charge = inputManager.getP1ThrowCharge();
    if (charge > 0 && this.player1.heldItem) {
      this.interactionPrompt = { key: '放開空白鍵', text: `蓄力前拋 (${Math.floor(charge * 100)}%) 🚀` };
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
