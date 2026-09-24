/**
 * GameWorld: Core Simulation Orchestrator
 */

import { MapGrid } from './MapGrid.js';
import { Player } from './Player.js';
import { Item } from './Item.js';
import { TILE_TYPES, ITEM_TYPES } from '../core/Constants.js';

export class GameWorld {
  constructor() {
    this.mapGrid = new MapGrid();
    this.player1 = new Player('p1', '月白之隱 (玉兔大廚)', 3, 3, '🐰', '#ffd700');
    this.players = [this.player1];
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

    // 2. Process interactions (Pickup / Drop / Interact)
    this.handleInteractions(inputManager);

    // 3. Compute active prompt for target station
    this.updateInteractionPrompt();
  }

  handleInteractions(inputManager) {
    const target = this.player1.getTargetInteractionGrid();
    const tileType = this.mapGrid.getTileType(target.x, target.y);
    const itemOnCounter = this.mapGrid.getItemAt(target.x, target.y);

    // Pickup / Drop Action (Space / F)
    if (inputManager.consumePickupPress()) {
      // Case 1: Player is holding an item
      if (this.player1.heldItem) {
        // Drop into Trash Bin
        if (tileType === TILE_TYPES.TRASH) {
          this.player1.heldItem = null;
          return;
        }

        // Place on empty Counter or Station
        if (tileType === TILE_TYPES.COUNTER || tileType === TILE_TYPES.CUTTING_BOARD || tileType === TILE_TYPES.GRILL) {
          if (!itemOnCounter) {
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
      // Case 2: Player is empty-handed
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

  updateInteractionPrompt() {
    const target = this.player1.getTargetInteractionGrid();
    const tileType = this.mapGrid.getTileType(target.x, target.y);
    const itemOnCounter = this.mapGrid.getItemAt(target.x, target.y);

    if (tileType === TILE_TYPES.FLOOR || tileType === TILE_TYPES.WALL) {
      this.interactionPrompt = null;
      return;
    }

    if (this.player1.heldItem) {
      if (tileType === TILE_TYPES.TRASH) {
        this.interactionPrompt = { key: 'SPACE', text: '丟棄垃圾' };
      } else if (tileType === TILE_TYPES.COUNTER || tileType === TILE_TYPES.CUTTING_BOARD || tileType === TILE_TYPES.GRILL) {
        if (!itemOnCounter) {
          this.interactionPrompt = { key: 'SPACE', text: '放置物品' };
        } else if (itemOnCounter.isPlate()) {
          this.interactionPrompt = { key: 'SPACE', text: '放入餐盤' };
        }
      } else if (tileType === TILE_TYPES.DELIVERY && this.player1.heldItem.isPlate()) {
        this.interactionPrompt = { key: 'SPACE', text: '出餐送達' };
      } else {
        this.interactionPrompt = null;
      }
    } else {
      if (tileType === TILE_TYPES.CRATE_BEEF) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取生牛肉' };
      } else if (tileType === TILE_TYPES.CRATE_VEGGIE) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取鮮青椒' };
      } else if (tileType === TILE_TYPES.CRATE_TOAST) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取吐司' };
      } else if (tileType === TILE_TYPES.PLATE_STACK) {
        this.interactionPrompt = { key: 'SPACE', text: '拿取餐盤' };
      } else if (itemOnCounter) {
        this.interactionPrompt = { key: 'SPACE', text: `拿取 ${itemOnCounter.getDisplayName()}` };
      } else {
        this.interactionPrompt = null;
      }
    }
  }
}
