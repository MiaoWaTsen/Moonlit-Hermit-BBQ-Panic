/**
 * MapGrid: Manages 2D grid tiles, station types, and stationary items on counters
 */

import { MAP_COLS, MAP_ROWS, TILE_TYPES, ITEM_TYPES } from '../core/Constants.js';
import { Item } from './Item.js';

export class MapGrid {
  constructor() {
    this.cols = MAP_COLS;
    this.rows = MAP_ROWS;
    this.grid = [];
    this.itemsOnCounters = new Map(); // key: "x,y", value: Item object
    this.washProgress = new Map();     // key: "x,y", value: 0.0 to 1.0
    
    this.initMap();
  }

  initMap() {
    // 16 cols x 10 rows map layout
    // Legend:
    // W = WALL, F = FLOOR, C = COUNTER
    // B = CRATE_BEEF, V = CRATE_VEGGIE, T = CRATE_TOAST
    // K = CUTTING_BOARD, G = GRILL
    // S = SINK, D = DELIVERY, X = TRASH
    const mapLayout = [
      ['W', 'D', 'D', 'C', 'C', 'C', 'C', 'K', 'K', 'C', 'K', 'K', 'C', 'X', 'X', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['B', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'T'],
      ['B', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'T'],
      ['W', 'F', 'F', 'F', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'W'],
      ['V', 'F', 'F', 'F', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'T'],
      ['V', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'G', 'G', 'G', 'C', 'S', 'S', 'C', 'S', 'S', 'C', 'G', 'G', 'G', 'C', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
    ];

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
        const symbol = mapLayout[y]?.[x] || 'W';
        const type = typeMapping[symbol] || TILE_TYPES.FLOOR;
        row.push(type);
      }
      this.grid.push(row);
    }

    // Initialize exactly TWO clean plates on upper counters
    this.setItemAt(4, 0, Item.create(ITEM_TYPES.PLATE));
    this.setItemAt(5, 0, Item.create(ITEM_TYPES.PLATE));
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

  advanceWash(gridX, gridY, dt) {
    const current = this.getWashProgress(gridX, gridY);
    const updated = Math.min(1.0, current + dt / 2.0); // 2 seconds to wash clean
    this.washProgress.set(`${gridX},${gridY}`, updated);
    
    if (updated >= 1.0) {
      // Washed clean! Transform to clean plate
      this.setItemAt(gridX, gridY, Item.create(ITEM_TYPES.PLATE));
      this.washProgress.delete(`${gridX},${gridY}`);
      return true;
    }
    return false;
  }
}
