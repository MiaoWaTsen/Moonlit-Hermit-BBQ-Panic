/**
 * Item Class: Represents any carryable object (Ingredients, Plates, Skewers)
 */

import { ITEM_TYPES } from '../core/Constants.js';

export class Item {
  constructor(type, metadata = {}) {
    this.id = 'item_' + Math.random().toString(36).substring(2, 9);
    this.type = type;
    this.metadata = metadata; // e.g. ingredients list if it is a PLATE
    this.chopProgress = metadata.chopProgress || 0; // 0 to 1
    this.cookProgress = metadata.cookProgress || 0; // 0 (raw) -> 1 (perfect) -> 2 (burnt)
    this.ingredients = metadata.ingredients ? [...metadata.ingredients] : [];
  }

  static create(type, metadata = {}) {
    return new Item(type, metadata);
  }

  isPlate() {
    return this.type === ITEM_TYPES.PLATE;
  }

  isDirtyPlate() {
    return this.type === ITEM_TYPES.DIRTY_PLATE;
  }

  isFood() {
    return !this.isPlate() && !this.isDirtyPlate();
  }

  // Can this food item be placed onto this plate?
  canAddToPlate(foodItem) {
    if (!this.isPlate()) return false;
    // Disallow burnt food or dirty plates
    if (foodItem.type === ITEM_TYPES.BURNT_BEEF || foodItem.type === ITEM_TYPES.BURNT_VEGGIE) return false;
    // Don't duplicate same ingredient if full (max 3 components)
    if (this.ingredients.length >= 3) return false;
    return true;
  }

  addIngredient(foodItem) {
    if (this.canAddToPlate(foodItem)) {
      this.ingredients.push(foodItem.type);
      return true;
    }
    return false;
  }

  getDisplayName() {
    switch (this.type) {
      case ITEM_TYPES.RAW_BEEF: return '生牛肉片';
      case ITEM_TYPES.CHOPPED_BEEF: return '醃製切片牛';
      case ITEM_TYPES.COOKED_BEEF: return '香烤牛五花';
      case ITEM_TYPES.BURNT_BEEF: return '焦炭牛肉';

      case ITEM_TYPES.RAW_VEGGIE: return '新鮮青椒';
      case ITEM_TYPES.CHOPPED_VEGGIE: return '切片青椒串';
      case ITEM_TYPES.COOKED_VEGGIE: return '炙烤青椒';
      case ITEM_TYPES.BURNT_VEGGIE: return '焦炭青椒';

      case ITEM_TYPES.TOAST: return '鮮奶吐司';
      case ITEM_TYPES.COOKED_TOAST: return '炭烤焦香吐司';

      case ITEM_TYPES.PLATE: 
        if (this.ingredients.length === 0) return '乾淨餐盤';
        return `特製拼盤 (${this.ingredients.length}樣料)`;
      case ITEM_TYPES.DIRTY_PLATE: return '油膩髒盤子';
      default: return '未知物品';
    }
  }

  getEmojiIcon() {
    switch (this.type) {
      case ITEM_TYPES.RAW_BEEF: return '🥩';
      case ITEM_TYPES.CHOPPED_BEEF: return '🥓';
      case ITEM_TYPES.COOKED_BEEF: return '🍖';
      case ITEM_TYPES.BURNT_BEEF: return '⬛';

      case ITEM_TYPES.RAW_VEGGIE: return '🫑';
      case ITEM_TYPES.CHOPPED_VEGGIE: return '🍢';
      case ITEM_TYPES.COOKED_VEGGIE: return '🍢';
      case ITEM_TYPES.BURNT_VEGGIE: return '⬛';

      case ITEM_TYPES.TOAST: return '🍞';
      case ITEM_TYPES.COOKED_TOAST: return '🥪';

      case ITEM_TYPES.PLATE: return '🍽️';
      case ITEM_TYPES.DIRTY_PLATE: return '🥣';
      default: return '📦';
    }
  }
}
