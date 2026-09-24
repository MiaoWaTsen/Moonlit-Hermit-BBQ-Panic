/**
 * Game Global Constants & Enums
 * Compact Cozy Kitchen Dimensions for optimal single-player flow
 */

export const TILE_SIZE = 60;
export const MAP_COLS = 13;
export const MAP_ROWS = 8;

export const CANVAS_WIDTH = MAP_COLS * TILE_SIZE; // 780px
export const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE; // 480px

export const TILE_TYPES = {
  FLOOR: 'FLOOR',
  WALL: 'WALL',
  COUNTER: 'COUNTER',
  CRATE_BEEF: 'CRATE_BEEF',      // Supplies raw beef
  CRATE_VEGGIE: 'CRATE_VEGGIE',  // Supplies green pepper
  CRATE_TOAST: 'CRATE_TOAST',    // Supplies toast bread
  CUTTING_BOARD: 'CUTTING_BOARD',// Prep/chopping station
  GRILL: 'GRILL',                // BBQ Charcoal grill
  SINK: 'SINK',                  // Washing dirty dishes
  DELIVERY: 'DELIVERY',          // Serving food
  TRASH: 'TRASH'                 // Trash bin
};

export const DIRECTIONS = {
  UP: { x: 0, y: -1, angle: -Math.PI / 2 },
  DOWN: { x: 0, y: 1, angle: Math.PI / 2 },
  LEFT: { x: -1, y: 0, angle: Math.PI },
  RIGHT: { x: 1, y: 0, angle: 0 }
};

export const ITEM_TYPES = {
  RAW_BEEF: 'RAW_BEEF',
  CHOPPED_BEEF: 'CHOPPED_BEEF',
  COOKED_BEEF: 'COOKED_BEEF',
  BURNT_BEEF: 'BURNT_BEEF',
  
  RAW_VEGGIE: 'RAW_VEGGIE',
  CHOPPED_VEGGIE: 'CHOPPED_VEGGIE',
  COOKED_VEGGIE: 'COOKED_VEGGIE',
  BURNT_VEGGIE: 'BURNT_VEGGIE',

  TOAST: 'TOAST',
  COOKED_TOAST: 'COOKED_TOAST',

  PLATE: 'PLATE',
  DIRTY_PLATE: 'DIRTY_PLATE'
};
