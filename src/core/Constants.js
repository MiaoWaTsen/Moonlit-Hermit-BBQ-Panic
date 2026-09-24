/**
 * Game Global Constants & Enums
 */

export const TILE_SIZE = 56;
export const MAP_COLS = 16;
export const MAP_ROWS = 10;

export const CANVAS_WIDTH = MAP_COLS * TILE_SIZE; // 896px
export const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE; // 560px

export const TILE_TYPES = {
  FLOOR: 'FLOOR',
  WALL: 'WALL',
  COUNTER: 'COUNTER',            // Normal empty countertop for placing items
  CRATE_BEEF: 'CRATE_BEEF',      // Supplies raw beef
  CRATE_VEGGIE: 'CRATE_VEGGIE',  // Supplies green pepper/veggie
  CRATE_TOAST: 'CRATE_TOAST',    // Supplies toast bread
  CUTTING_BOARD: 'CUTTING_BOARD',// Prep/chopping station
  GRILL: 'GRILL',                // BBQ Charcoal grill
  PLATE_STACK: 'PLATE_STACK',    // Clean plates
  SINK: 'SINK',                  // Washing dirty dishes
  DELIVERY: 'DELIVERY',          // Serving food
  TRASH: 'TRASH'                 // Trash bin for burnt/wrong items
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
