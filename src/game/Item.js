/**
 * Item Class: Represents any carryable object (Ingredients, Plates, Skewers)
 * Includes Chopping & BBQ Cooking State Machine
 */

import { ITEM_TYPES } from '../core/Constants.js';

export const CHOP_TIME_REQUIRED = 1.2; // Fast & snappy chopping (was 2.0)
export const COOK_TIME_PERFECT = 3.0;  // Seconds to reach perfect cooked
export const COOK_TIME_BURNT = 6.5;    // Generous time before burning (was 4.0)

export class Item {
  constructor(type, metadata = {}) {
    this.id = 'item_' + Math.random().toString(36).substring(2, 9);
    this.type = type;
    this.metadata = metadata;
    this.chopProgress = metadata.chopProgress || 0; // 0.0 to 1.0
    this.cookProgress = metadata.cookProgress || 0; // 0.0 (raw) -> 1.0 (perfect) -> 2.0 (burnt)
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

  isChoppable() {
    return (this.type === ITEM_TYPES.RAW_BEEF || this.type === ITEM_TYPES.RAW_VEGGIE) && this.chopProgress < 1.0;
  }

  isCookable() {
    if (this.cookProgress >= 2.0) return false;
    return (
      this.type === ITEM_TYPES.CHOPPED_BEEF ||
      this.type === ITEM_TYPES.CHOPPED_VEGGIE ||
      this.type === ITEM_TYPES.TOAST ||
      this.type === ITEM_TYPES.COOKED_BEEF ||
      this.type === ITEM_TYPES.COOKED_VEGGIE ||
      this.type === ITEM_TYPES.COOKED_TOAST
    );
  }

  advanceChop(dt) {
    if (!this.isChoppable()) return false;
    this.chopProgress += dt / CHOP_TIME_REQUIRED;
    if (this.chopProgress >= 1.0) {
      this.chopProgress = 1.0;
      if (this.type === ITEM_TYPES.RAW_BEEF) {
        this.type = ITEM_TYPES.CHOPPED_BEEF;
      } else if (this.type === ITEM_TYPES.RAW_VEGGIE) {
        this.type = ITEM_TYPES.CHOPPED_VEGGIE;
      }
      return true;
    }
    return false;
  }

  advanceCook(dt) {
    if (this.cookProgress >= 2.0) return { justCooked: false, justBurnt: false };

    let justCooked = false;
    let justBurnt = false;

    if (this.cookProgress < 1.0) {
      this.cookProgress += dt / COOK_TIME_PERFECT;
      if (this.cookProgress >= 1.0) {
        if (this.type === ITEM_TYPES.CHOPPED_BEEF) this.type = ITEM_TYPES.COOKED_BEEF;
        else if (this.type === ITEM_TYPES.CHOPPED_VEGGIE) this.type = ITEM_TYPES.COOKED_VEGGIE;
        else if (this.type === ITEM_TYPES.TOAST) this.type = ITEM_TYPES.COOKED_TOAST;
        justCooked = true;
      }
    } else {
      this.cookProgress += dt / COOK_TIME_BURNT;
      if (this.cookProgress >= 2.0) {
        this.cookProgress = 2.0;
        if (this.type === ITEM_TYPES.COOKED_BEEF) this.type = ITEM_TYPES.BURNT_BEEF;
        else if (this.type === ITEM_TYPES.COOKED_VEGGIE) this.type = ITEM_TYPES.BURNT_VEGGIE;
        else if (this.type === ITEM_TYPES.COOKED_TOAST) this.type = ITEM_TYPES.BURNT_BEEF;
        justBurnt = true;
      }
    }

    return { justCooked, justBurnt };
  }

  isPerfect() {
    return this.cookProgress >= 1.0 && this.cookProgress < 1.7;
  }

  isBurningWarning() {
    return this.cookProgress >= 1.7 && this.cookProgress < 2.0;
  }

  isBurnt() {
    return this.cookProgress >= 2.0 || this.type === ITEM_TYPES.BURNT_BEEF || this.type === ITEM_TYPES.BURNT_VEGGIE;
  }

  canAddToPlate(foodItem) {
    if (!this.isPlate()) return false;
    if (foodItem.isBurnt()) return false;
    if (foodItem.chopProgress < 1.0 && foodItem.type !== ITEM_TYPES.TOAST) return false;
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
      case ITEM_TYPES.RAW_BEEF: return '生牛肉片 (需切)';
      case ITEM_TYPES.CHOPPED_BEEF: return '切片牛 (待烤)';
      case ITEM_TYPES.COOKED_BEEF: return '香烤牛五花 (完美)';
      case ITEM_TYPES.BURNT_BEEF: return '焦炭牛肉 (已燒焦)';

      case ITEM_TYPES.RAW_VEGGIE: return '新鮮青椒 (需切)';
      case ITEM_TYPES.CHOPPED_VEGGIE: return '切片青椒 (待烤)';
      case ITEM_TYPES.COOKED_VEGGIE: return '炙烤青椒 (完美)';
      case ITEM_TYPES.BURNT_VEGGIE: return '焦炭青椒 (已燒焦)';

      case ITEM_TYPES.TOAST: return '鮮奶吐司 (待烤)';
      case ITEM_TYPES.COOKED_TOAST: return '炭烤吐司 (完美)';

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
      case ITEM_TYPES.CHOPPED_BEEF: return '🥩';
      case ITEM_TYPES.COOKED_BEEF: return '🍖';
      case ITEM_TYPES.BURNT_BEEF: return '⬛';

      case ITEM_TYPES.RAW_VEGGIE: return '🫑';
      case ITEM_TYPES.CHOPPED_VEGGIE: return '🫑';
      case ITEM_TYPES.COOKED_VEGGIE: return '🫑';
      case ITEM_TYPES.BURNT_VEGGIE: return '⬛';

      case ITEM_TYPES.TOAST: return '🍞';
      case ITEM_TYPES.COOKED_TOAST: return '🥪';

      case ITEM_TYPES.PLATE: return '🍽️';
      case ITEM_TYPES.DIRTY_PLATE: return '🥣';
      default: return '📦';
    }
  }
}
