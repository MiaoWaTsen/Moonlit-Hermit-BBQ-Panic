/**
 * MapGrid: Manages 2D grid tiles, station types, and stationary items on counters
 */

import { MAP_COLS, MAP_ROWS, TILE_TYPES, TILE_SIZE, ITEM_TYPES } from '../core/Constants.js';
import { Item } from './Item.js';

export class MapGrid {
  constructor() {
    this.cols = MAP_COLS;
    this.rows = MAP_ROWS;
    this.grid = [];
    this.itemsOnCounters = new Map(); // key: "x,y", value: Item object
    this.stationStates = new Map();   // key: "x,y", value: object with cooking/prep states
    
    this.initMap();
  }

  initMap() {
    // 16 cols x 10 rows map layout
    // Legend:
    // W = WALL, F = FLOOR, C = COUNTER
    // B = CRATE_BEEF, V = CRATE_VEGGIE, T = CRATE_TOAST
    // K = CUTTING_BOARD, G = GRILL, P = PLATE_STACK
    // S = SINK, D = DELIVERY, X = TRASH
    const mapLayout = [
      ['W', 'W', 'D', 'D', 'C', 'P', 'P', 'C', 'K', 'K', 'C', 'X', 'W', 'W', 'W', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['B', 'F', 'C', 'C', 'C', 'F', 'F', 'F', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'T'],
      ['B', 'F', 'C', 'C', 'C', 'F', 'F', 'F', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'T'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['V', 'F', 'F', 'F', 'F', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['V', 'F', 'F', 'F', 'F', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'G', 'G', 'G', 'C', 'C', 'S', 'S', 'C', 'C', 'G', 'G', 'C', 'C', 'X', 'W'],
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
      'P': TILE_TYPES.PLATE_STACK,
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

        // Initialize station internal state if needed
        if (type === TILE_TYPES.GRILL) {
          this.stationStates.set(`${x},${y}`, { isCooking: false, heatTime: 0 });
        }
      }
      this.grid.push(row);
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
    }
  }

  getStationState(gridX, gridY) {
    return this.stationStates.get(`${gridX},${gridY}`);
  }
}
