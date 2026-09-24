/**
 * OrderManager: Mid-Autumn Festival BBQ Recipe & Order Ticket System
 */

import { ITEM_TYPES } from '../core/Constants.js';

export const RECIPES = [
  {
    id: 'recipe_veggie_skewer',
    name: '炙烤鮮甜青椒',
    icon: '🫑',
    required: [ITEM_TYPES.COOKED_VEGGIE],
    points: 160,
    timeLimit: 80 // generous 80s
  },
  {
    id: 'recipe_toast_beef',
    name: '經典炭烤肉蛋吐司',
    icon: '🥪',
    required: [ITEM_TYPES.COOKED_TOAST, ITEM_TYPES.COOKED_BEEF],
    points: 250,
    timeLimit: 90 // generous 90s
  },
  {
    id: 'recipe_beef_veggie',
    name: '豪華雙饗烤肉拼盤',
    icon: '🍖',
    required: [ITEM_TYPES.COOKED_BEEF, ITEM_TYPES.COOKED_VEGGIE],
    points: 320,
    timeLimit: 105 // generous 105s
  },
  {
    id: 'recipe_grand_feast',
    name: '中秋團圓烤肉大席',
    icon: '✨',
    required: [ITEM_TYPES.COOKED_TOAST, ITEM_TYPES.COOKED_BEEF, ITEM_TYPES.COOKED_VEGGIE],
    points: 500,
    timeLimit: 125 // generous 125s
  }
];

export class OrderTicket {
  constructor(recipe) {
    this.id = 'ord_' + Math.random().toString(36).substring(2, 9);
    this.recipe = recipe;
    this.maxTime = recipe.timeLimit;
    this.timeRemaining = recipe.timeLimit;
    this.isExpired = false;
  }

  update(dt) {
    if (this.isExpired) return false;
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isExpired = true;
      return true; // Just expired
    }
    return false;
  }

  getProgress() {
    return Math.max(0, this.timeRemaining / this.maxTime);
  }
}

export class OrderManager {
  constructor(maxActiveOrders = 3) {
    this.maxActiveOrders = maxActiveOrders;
    this.activeOrders = [];
    this.spawnTimer = 2.0;
    this.onOrderExpired = null;
  }

  initOrders() {
    this.activeOrders = [];
    // Spawn 2 initial orders
    this.spawnOrder();
    this.spawnOrder();
  }

  spawnOrder() {
    if (this.activeOrders.length >= this.maxActiveOrders) return;
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    this.activeOrders.push(new OrderTicket(recipe));
  }

  update(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnOrder();
      this.spawnTimer = 8.0 + Math.random() * 6.0; // Next order in 8-14s
    }

    for (let i = this.activeOrders.length - 1; i >= 0; i--) {
      const order = this.activeOrders[i];
      const justExpired = order.update(dt);
      if (justExpired) {
        if (this.onOrderExpired) this.onOrderExpired(order);
        this.activeOrders.splice(i, 1);
      }
    }
  }

  // Normalize ingredients for robust recipe matching
  normalizeItemType(type) {
    if (type === ITEM_TYPES.TOAST || type === ITEM_TYPES.COOKED_TOAST) return 'BREAD';
    if (type === ITEM_TYPES.COOKED_BEEF) return 'BEEF';
    if (type === ITEM_TYPES.COOKED_VEGGIE) return 'VEGGIE';
    return type;
  }

  // Find if ingredients on plate match ANY valid recipe in the cookbook
  findMatchingRecipe(plateItem) {
    if (!plateItem.isPlate() || plateItem.ingredients.length === 0) return null;
    const normalizedPlate = plateItem.ingredients.map(t => this.normalizeItemType(t)).sort();

    for (const recipe of RECIPES) {
      const normalizedReq = recipe.required.map(t => this.normalizeItemType(t)).sort();
      if (normalizedReq.length === normalizedPlate.length &&
          normalizedReq.every((val, idx) => val === normalizedPlate[idx])) {
        return recipe;
      }
    }
    return null;
  }

  // Check if a served plate matches any active order (or is a valid off-menu dish)
  matchAndServe(plateItem) {
    if (!plateItem.isPlate() || plateItem.ingredients.length === 0) {
      return { success: false, reason: 'EMPTY_PLATE', message: '❌ 空餐盤無法出餐！' };
    }

    const matchedRecipe = this.findMatchingRecipe(plateItem);
    if (!matchedRecipe) {
      return { success: false, reason: 'INVALID_RECIPE', message: '❌ 料理配方不符！(請按 H 查看食譜)' };
    }

    const normalizedPlate = plateItem.ingredients.map(t => this.normalizeItemType(t)).sort();

    // 1. Check if it fulfills one of the active order tickets
    for (let i = 0; i < this.activeOrders.length; i++) {
      const order = this.activeOrders[i];
      const normalizedReq = order.recipe.required.map(t => this.normalizeItemType(t)).sort();

      if (normalizedReq.length === normalizedPlate.length && 
          normalizedReq.every((val, idx) => val === normalizedPlate[idx])) {
        
        const timeRatio = order.getProgress();
        const basePoints = order.recipe.points;
        const tip = timeRatio > 0.5 ? Math.floor(basePoints * 0.3) : 0;
        const totalPoints = basePoints + tip;
        
        this.activeOrders.splice(i, 1);
        return {
          success: true,
          isActiveOrder: true,
          recipe: order.recipe,
          points: totalPoints,
          isFast: timeRatio > 0.5,
          message: `🛎️ 成功出餐！${order.recipe.name} (+${totalPoints}分)`
        };
      }
    }

    // 2. If valid cookbook recipe but not currently in active tickets, accept as off-menu dish!
    const basePoints = Math.floor(matchedRecipe.points * 0.85);
    return {
      success: true,
      isActiveOrder: false,
      recipe: matchedRecipe,
      points: basePoints,
      isFast: false,
      message: `✨ 月宮額外出餐！${matchedRecipe.name} (+${basePoints}分)`
    };
  }
}
