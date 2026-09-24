/**
 * MapGrid: Manages 2D grid tiles, station types, and stationary items on counters
 * Supports Multiple Maps:
 * - map1: 「月宮庭院」(Moon Palace Courtyard) - Compact Cozy Kitchen
 * - map2: 「桂樹林天台」(Osmanthus Grove Rooftop) - Split Co-op Toss Kitchen
 */

import { MAP_COLS, MAP_ROWS, TILE_TYPES, ITEM_TYPES } from '../core/Constants.js';
import { Item } from './Item.js';

export class MapGrid {
  constructor(is2P = false, mapId = 'map1') {
    this.cols = MAP_COLS;
    this.rows = MAP_ROWS;
    this.grid = [];
    this.itemsOnCounters = new Map(); // key: "x,y", value: Item object
    this.washProgress = new Map();     // key: "x,y", value: 0.0 to 1.0
    this.is2P = is2P;
    this.mapId = mapId;
    
    this.initMap();
  }

  initMap() {
    // 13 cols x 8 rows map layout
    // Legend:
    // W = WALL, F = FLOOR, C = COUNTER
    // B = CRATE_BEEF, V = CRATE_VEGGIE, T = CRATE_TOAST
    // K = CUTTING_BOARD, G = GRILL
    // S = SINK, D = DELIVERY, X = TRASH
    
    // Map 1: 月宮庭院 (Moon Palace Courtyard)
    const map1Layout = [
      ['W', 'D', 'D', 'C', 'C', 'C', 'K', 'K', 'C', 'K', 'C', 'X', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['B', 'F', 'F', 'F', 'C', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'T'],
      ['B', 'F', 'F', 'F', 'C', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'T'],
      ['V', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'T'],
      ['V', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'G', 'G', 'G', 'C', 'S', 'S', 'C', 'G', 'G', 'G', 'C', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
    ];

    // Map 2: 桂樹林天台 (Osmanthus Grove Rooftop - Split Co-op Arena)
    const map2Layout = [
      ['W', 'K', 'K', 'C', 'C', 'C', 'C', 'C', 'D', 'D', 'C', 'X', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['B', 'F', 'F', 'F', 'F', 'C', 'C', 'F', 'F', 'F', 'F', 'F', 'G'],
      ['B', 'F', 'F', 'F', 'F', 'C', 'C', 'F', 'F', 'F', 'F', 'F', 'G'],
      ['V', 'F', 'F', 'F', 'F', 'C', 'C', 'F', 'F', 'F', 'F', 'F', 'G'],
      ['V', 'F', 'F', 'F', 'F', 'C', 'C', 'F', 'F', 'F', 'F', 'F', 'S'],
      ['T', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'S'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
    ];

    const chosenLayout = this.mapId === 'map2' ? map2Layout : map1Layout;

    const typeMapping = {
      'W': TILE_TYPES.WALL,
      'F': TILE_TYPES.FLOOR,
      'C': TILE_TYPES.COUNTER,
      'B': TILE_TYPES.CRATE_BEEF,
      'V': TILE_TYPES.CRATE_VEGGIE,
      'T': TILE_TYPES.CRATE_TOAST,
      'K': TILE_TYPES.CUTTING_BOARD,
      'G': TILE_TYPES.GRILL,
      'S': TILE_TYPES.SINK,
      'D': TILE_TYPES.DELIVERY,
      'X': TILE_TYPES.TRASH
    };

    this.grid = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        const symbol = chosenLayout[y]?.[x] || 'W';
        const type = typeMapping[symbol] || TILE_TYPES.FLOOR;
        row.push(type);
      }
      this.grid.push(row);
    }

    // Plate Placement based on Map
    if (this.mapId === 'map2') {
      // Map 2: Place on central bridge countertops
      this.setItemAt(5, 2, Item.create(ITEM_TYPES.PLATE));
      this.setItemAt(6, 2, Item.create(ITEM_TYPES.PLATE));
      if (this.is2P) {
        this.setItemAt(5, 3, Item.create(ITEM_TYPES.PLATE));
      }
    } else {
      // Map 1: 1P gets 2 plates (4,0) & (5,0); 2P gets 3 plates (3,0), (4,0), (5,0)
      this.setItemAt(4, 0, Item.create(ITEM_TYPES.PLATE));
      this.setItemAt(5, 0, Item.create(ITEM_TYPES.PLATE));
      if (this.is2P) {
        this.setItemAt(3, 0, Item.create(ITEM_TYPES.PLATE));
      }
    }
  }

  getTileType(gridX, gridY) {
    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      return TILE_TYPES.WALL;
    }
    return this.grid[gridY][gridX];
  }

  isWalkable(gridX, gridY) {
    const type = this.getTileType(gridX, gridY);
    return type === TILE_TYPES.FLOOR;
  }

  isStation(gridX, gridY) {
    const type = this.getTileType(gridX, gridY);
    return type !== TILE_TYPES.FLOOR && type !== TILE_TYPES.WALL;
  }

  getItemAt(gridX, gridY) {
    return this.itemsOnCounters.get(`${gridX},${gridY}`) || null;
  }

  setItemAt(gridX, gridY, item) {
    if (item) {
      this.itemsOnCounters.set(`${gridX},${gridY}`, item);
    } else {
      this.itemsOnCounters.delete(`${gridX},${gridY}`);
      this.washProgress.delete(`${gridX},${gridY}`);
    }
  }

  getWashProgress(gridX, gridY) {
    return this.washProgress.get(`${gridX},${gridY}`) || 0;
  }

  setWashProgress(gridX, gridY, progress) {
    this.washProgress.set(`${gridX},${gridY}`, Math.max(0, Math.min(1.0, progress)));
  }

  advanceWash(gridX, gridY, dt, washDuration = 1.2) {
    const current = this.getWashProgress(gridX, gridY);
    const next = current + (dt / washDuration);
    this.setWashProgress(gridX, gridY, next);
    return next >= 1.0;
  }
}
