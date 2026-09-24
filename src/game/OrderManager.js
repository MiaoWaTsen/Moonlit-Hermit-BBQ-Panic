/**
 * OrderManager: Mid-Autumn Festival BBQ Recipe & Order Ticket System
 */

import { ITEM_TYPES } from '../core/Constants.js';

export const RECIPES = [
  {
    id: 'recipe_toast_beef',
    name: '經典炭烤肉蛋吐司',
    icon: '🥪',
    required: [ITEM_TYPES.COOKED_TOAST, ITEM_TYPES.COOKED_BEEF],
    points: 250,
    timeLimit: 55
  },
  {
    id: 'recipe_veggie_skewer',
    name: '炙烤鮮甜青椒串',
    icon: '🍢',
    required: [ITEM_TYPES.COOKED_VEGGIE],
    points: 160,
    timeLimit: 45
  },
  {
    id: 'recipe_beef_veggie',
    name: '豪華雙饗烤肉拼盤',
    icon: '🍖',
    required: [ITEM_TYPES.COOKED_BEEF, ITEM_TYPES.COOKED_VEGGIE],
    points: 320,
    timeLimit: 60
  },
  {
    id: 'recipe_grand_feast',
    name: '中秋團圓烤肉大席',
    icon: '✨',
    required: [ITEM_TYPES.COOKED_TOAST, ITEM_TYPES.COOKED_BEEF, ITEM_TYPES.COOKED_VEGGIE],
    points: 500,
    timeLimit: 75
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

  // Check if a served plate matches any active order
  matchAndServe(plateItem) {
    if (!plateItem.isPlate() || plateItem.ingredients.length === 0) return null;

    const plateIngredients = [...plateItem.ingredients].sort();

    for (let i = 0; i < this.activeOrders.length; i++) {
      const order = this.activeOrders[i];
      const req = [...order.recipe.required].sort();

      if (req.length === plateIngredients.length && req.every((val, idx) => val === plateIngredients[idx])) {
        // Matched! Remove order and return reward details
        const timeRatio = order.getProgress();
        const basePoints = order.recipe.points;
        const tip = timeRatio > 0.5 ? Math.floor(basePoints * 0.3) : 0;
        
        this.activeOrders.splice(i, 1);
        return {
          recipe: order.recipe,
          points: basePoints + tip,
          isFast: timeRatio > 0.5
        };
      }
    }

    return null;
  }
}
