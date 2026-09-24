/**
 * Renderer2D: High-DPI Canvas 2D Game Renderer with Rich Mid-Autumn Aesthetic
 * Includes Progress Bars for Cutting, BBQ Grills, Dishwashing,
 * Flying Items in Parabolic Arc, and Throw Trajectory Guides
 */

import { TILE_SIZE, MAP_COLS, MAP_ROWS, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_TYPES, ITEM_TYPES } from '../core/Constants.js';

export class Renderer2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animClock = 0;
    
    this.setupCanvasDPI();
    window.addEventListener('resize', () => this.setupCanvasDPI());
  }

  setupCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = CANVAS_WIDTH * dpr;
    this.canvas.height = CANVAS_HEIGHT * dpr;
    this.canvas.style.width = `${CANVAS_WIDTH}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT}px`;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;
  }

  render(world, inputManager) {
    this.animClock += 0.05;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Map Floor and Walls
    this.renderMapBase(world.mapGrid);

    // 2. Draw Station Highlights (Targeted by player)
    this.renderTargetHighlight(world.player1);

    // 3. Draw Stations and Stationary Items
    this.renderStationsAndItems(world.mapGrid);

    // 4. Draw Players
    for (const player of world.players) {
      this.renderPlayer(player);
      // Draw Throw Trajectory if charging throw
      if (inputManager) {
        const charge = player.id === 'p2'
          ? (typeof inputManager.getP2ThrowCharge === 'function' ? inputManager.getP2ThrowCharge() : 0)
          : (typeof inputManager.getP1ThrowCharge === 'function' ? inputManager.getP1ThrowCharge() : 0);
        if (charge > 0 && player.heldItem) {
          this.renderThrowTrajectory(player, charge);
        }
      }
    }

    // 5. Draw Dynamic Floating Prompt Following Player
    if (world.interactionPrompt) {
      this.renderInteractionPrompt(world.player1, world.interactionPrompt);
    }

    // 6. Draw Flying Airborne Items
    for (const flying of world.flyingItems) {
      flying.render(ctx);
    }

    // 7. Draw Progress Bars (Cutting / Cooking / Washing)
    this.renderStationProgressBars(world.mapGrid);

    // 8. Draw Particle System
    world.particleSystem.render(ctx);

    // 9. Draw Floating Status & Score Messages
    if (world.floatingMessages) {
      for (const msg of world.floatingMessages) {
        this.renderFloatingMessage(msg);
      }
    }
  }

  renderMapBase(mapGrid) {
    const ctx = this.ctx;

    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const type = mapGrid.getTileType(x, y);

        if (type === TILE_TYPES.FLOOR) {
          // Checkerboard lunar floor tiles
          const isEven = (x + y) % 2 === 0;
          ctx.fillStyle = isEven ? '#1e263d' : '#182033';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          
          // Subtle tile grid lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (type === TILE_TYPES.WALL) {
          // Dark space border wall with gold crest trim
          ctx.fillStyle = '#0f1422';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = 'rgba(245, 176, 65, 0.15)';
          ctx.fillRect(px, py, TILE_SIZE, 4);
        }
      }
    }
  }

  renderStationsAndItems(mapGrid) {
    const ctx = this.ctx;

    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const type = mapGrid.getTileType(x, y);
        const item = mapGrid.getItemAt(x, y);

        // Draw Station Base if it's a station
        if (type !== TILE_TYPES.FLOOR && type !== TILE_TYPES.WALL) {
          this.drawStationBase(ctx, px, py, type);
        }

        // Draw item placed on ANY counter or dropped on floor
        if (item) {
          this.drawItem(ctx, px + TILE_SIZE / 2, py + TILE_SIZE / 2, item, 0.9);
        }
      }
    }
  }

  drawStationBase(ctx, px, py, type) {
    ctx.save();
    switch (type) {
      case TILE_TYPES.COUNTER:
        ctx.fillStyle = '#7a4d33';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;

      case TILE_TYPES.CRATE_BEEF:
        ctx.fillStyle = '#8b261e';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🥩', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '牛肉箱');
        break;

      case TILE_TYPES.CRATE_VEGGIE:
        ctx.fillStyle = '#1e6b37';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🫑', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '蔬菜箱');
        break;

      case TILE_TYPES.CRATE_TOAST:
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍞', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '吐司箱');
        break;

      case TILE_TYPES.CUTTING_BOARD:
        ctx.fillStyle = '#9e6d48';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#eed6aa';
        ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔪', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '切菜台');
        break;

      case TILE_TYPES.GRILL:
        ctx.fillStyle = '#22252c';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        
        const pulse = Math.sin(this.animClock * 3) * 0.15 + 0.85;
        const grad = ctx.createRadialGradient(
          px + TILE_SIZE / 2, py + TILE_SIZE / 2, 4,
          px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 - 4
        );
        grad.addColorStop(0, `rgba(255, 87, 34, ${pulse})`);
        grad.addColorStop(0.6, `rgba(211, 47, 47, ${pulse * 0.8})`);
        grad.addColorStop(1, '#1b1d24');
        ctx.fillStyle = grad;
        ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
        
        ctx.strokeStyle = '#757575';
        ctx.lineWidth = 1.5;
        for (let i = 10; i < TILE_SIZE - 6; i += 8) {
          ctx.beginPath();
          ctx.moveTo(px + 6, py + i);
          ctx.lineTo(px + TILE_SIZE - 6, py + i);
          ctx.stroke();
        }
        this.drawStationLabel(ctx, px, py, '炭火烤爐');
        break;

      case TILE_TYPES.SINK:
        ctx.fillStyle = '#455a64';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#00acc1';
        ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚰', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '洗碗水槽');
        break;

      case TILE_TYPES.DELIVERY:
        ctx.fillStyle = '#b78103';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, 4);
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛎️', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 2);
        this.drawStationLabel(ctx, px, py, '出餐口');
        break;

      case TILE_TYPES.TRASH:
        ctx.fillStyle = '#37474f';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🗑️', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '垃圾桶');
        break;
    }
    ctx.restore();
  }

  drawStationLabel(ctx, px, py, text) {
    ctx.save();
    ctx.font = 'bold 9px "Noto Sans TC", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(text, px + TILE_SIZE / 2, py + TILE_SIZE - 4);
    ctx.restore();
  }

  renderStationProgressBars(mapGrid) {
    const ctx = this.ctx;

    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const type = mapGrid.getTileType(x, y);
        const item = mapGrid.getItemAt(x, y);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (!item) continue;

        // 1. Cutting Progress Bar
        if (type === TILE_TYPES.CUTTING_BOARD && item.chopProgress > 0 && item.chopProgress < 1.0) {
          this.drawProgressBar(ctx, px, py - 6, item.chopProgress, '#00e5ff', '🔪');
        }

        // 2. BBQ Grill Cooking Progress Bar & Warnings
        if (type === TILE_TYPES.GRILL) {
          if (item.isBurnt()) {
            this.drawStatusTag(ctx, px + TILE_SIZE / 2, py - 6, '⬛ 烤焦了！', '#e74c3c');
          } else if (item.isBurningWarning()) {
            const blink = Math.sin(this.animClock * 15) > 0;
            const progress = (item.cookProgress - 1.0) / 1.0;
            this.drawProgressBar(ctx, px, py - 6, progress, blink ? '#ff1744' : '#ff9100', '⚠️');
          } else if (item.isPerfect()) {
            this.drawStatusTag(ctx, px + TILE_SIZE / 2, py - 6, '✨ 熟了！', '#2ecc71');
          } else if (item.cookProgress > 0) {
            this.drawProgressBar(ctx, px, py - 6, item.cookProgress, '#ff9800', '🔥');
          }
        }

        // 3. Sink Washing Progress Bar
        if (type === TILE_TYPES.SINK && item.isDirtyPlate()) {
          const washProg = mapGrid.getWashProgress(x, y);
          if (washProg > 0 && washProg < 1.0) {
            this.drawProgressBar(ctx, px, py - 6, washProg, '#00e5ff', '🚰');
          }
        }
      }
    }
  }

  drawProgressBar(ctx, x, y, progress, color, icon = '') {
    const barWidth = TILE_SIZE - 8;
    const barHeight = 7;
    const px = x + 4;
    const py = y;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.fillRect(px, py, barWidth, barHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, barWidth, barHeight);

    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, Math.max(0, (barWidth - 2) * Math.min(progress, 1.0)), barHeight - 2);

    if (icon) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, px - 2, py + barHeight / 2);
    }
    ctx.restore();
  }

  drawStatusTag(ctx, cx, cy, text, bgColor) {
    ctx.save();
    ctx.font = 'bold 9px "Noto Sans TC", sans-serif';
    const textWidth = ctx.measureText(text).width;
    const padding = 5;
    
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(cx - textWidth / 2 - padding, cy - 6, textWidth + padding * 2, 14, 7);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + 1);
    ctx.restore();
  }

  renderTargetHighlight(player) {
    const target = player.getTargetInteractionGrid();
    const px = target.x * TILE_SIZE;
    const py = target.y * TILE_SIZE;

    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.restore();
  }

  renderThrowTrajectory(player, charge) {
    const ctx = this.ctx;
    const cx = player.x;
    const cy = player.y;
    const dirX = player.facing.x;
    const dirY = player.facing.y;
    const distance = (TILE_SIZE * 2.5) * (0.5 + charge * 0.7);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.75)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dirX * distance, cy + dirY * distance);
    ctx.stroke();

    // Target landing circle
    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(cx + dirX * distance, cy + dirY * distance, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderPlayer(player) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Drop shadow under player
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + player.radius * 0.8, player.radius * 0.9, player.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Character body
    const bob = player.isMoving ? Math.sin(player.walkAnimTimer) * 3 : 0;
    const cx = player.x;
    const cy = player.y + bob;

    if (player.id === 'p2') {
      // Player 2: 吳剛大廚 (Wu Gang Chef - Heroic Brown & Green)
      ctx.fillStyle = '#ffcc80'; // Skin tone body
      ctx.beginPath();
      ctx.arc(cx, cy, player.radius, 0, Math.PI * 2);
      ctx.fill();

      // Chef / Warrior Bandana (Forest Green)
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.arc(cx, cy - 4, player.radius * 0.95, 0.9 * Math.PI, 2.1 * Math.PI);
      ctx.fill();

      // Bandana Tail
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(cx - player.radius - 4, cy - 6, 8, 4);

      // Heroic Eyebrows & Eyes
      ctx.fillStyle = '#1b1b1b';
      ctx.fillRect(cx - 7, cy - 5, 4, 2);
      ctx.fillRect(cx + 3, cy - 5, 4, 2);
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 1, 2, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy - 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beard / Tough smile
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    } else {
      // Player 1: 玉兔大廚 (Moon Rabbit Chef - White Bunny)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, player.radius, 0, Math.PI * 2);
      ctx.fill();

      // Chef Red Scarf
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, player.radius * 0.9, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.fill();

      // Bunny Ears
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 7, cy - player.radius - 8, 4, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb6c1';
      ctx.beginPath();
      ctx.ellipse(cx - 7, cy - player.radius - 8, 2, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx + 7, cy - player.radius - 8, 4, 10, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb6c1';
      ctx.beginPath();
      ctx.ellipse(cx + 7, cy - player.radius - 8, 2, 7, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Cute Eyes & Blush
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 2, 2.2, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 105, 180, 0.6)';
      ctx.beginPath();
      ctx.arc(cx - 9, cy + 2, 3, 0, Math.PI * 2);
      ctx.arc(cx + 9, cy + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Facing indicator
    const arrowDist = player.radius + 6;
    const ax = cx + player.facing.x * arrowDist;
    const ay = cy + player.facing.y * arrowDist;
    ctx.fillStyle = player.id === 'p2' ? '#4caf50' : '#ffd700';
    ctx.beginPath();
    ctx.arc(ax, ay, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Player Indicator Badge
    ctx.save();
    ctx.font = 'bold 10px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tagText = player.id === 'p2' ? '2P 🪓 吳剛' : '1P 🐰 玉兔';
    const tagBg = player.id === 'p2' ? 'rgba(46, 125, 50, 0.85)' : 'rgba(211, 47, 47, 0.85)';
    const textWidth = ctx.measureText(tagText).width;
    const badgeY = cy - player.radius - (player.heldItem ? 38 : 14);

    ctx.fillStyle = tagBg;
    ctx.beginPath();
    ctx.roundRect(cx - textWidth / 2 - 4, badgeY - 7, textWidth + 8, 14, 6);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, cx, badgeY + 1);
    ctx.restore();

    // 4. Held Item
    if (player.heldItem) {
      this.drawItem(ctx, cx, cy - player.radius - 18, player.heldItem, 1.1);
    }

    ctx.restore();
  }

  drawItem(ctx, x, y, item, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // If it's a Clean Plate
    if (item.isPlate()) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#c5d1e8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw assembled ingredients on plate
      if (item.ingredients.length > 0) {
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = item.ingredients.map(t => {
          if (t.includes('BEEF')) return '🥩';
          if (t.includes('VEGGIE')) return '🫑';
          if (t.includes('TOAST')) return '🍞';
          return '✨';
        }).join('');
        ctx.fillText(icons, 0, 0);
      }
    } 
    // If it's a Dirty Plate
    else if (item.isDirtyPlate()) {
      ctx.fillStyle = '#cfd8dc';
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Oil stains & dirty bubbles
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧼', 0, 0);
    }
    // If it's single food or object
    else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.getEmojiIcon(), 0, 1);
    }

    ctx.restore();
  }

  renderInteractionPrompt(player, prompt) {
    const ctx = this.ctx;
    ctx.save();

    const cx = player.x;
    const cy = player.y - player.radius - (player.heldItem ? 52 : 32);

    ctx.font = 'bold 11px "Noto Sans TC", sans-serif';
    const keyBadgeText = prompt.key;
    const actionText = ' ' + prompt.text;
    
    ctx.font = 'bold 10px sans-serif';
    const keyWidth = ctx.measureText(keyBadgeText).width + 10;
    ctx.font = 'bold 11px "Noto Sans TC", sans-serif';
    const actionWidth = ctx.measureText(actionText).width + 4;
    
    const totalWidth = keyWidth + actionWidth + 12;
    const boxHeight = 22;
    const startX = cx - totalWidth / 2;
    const startY = cy - boxHeight / 2;

    // Background Bubble
    ctx.fillStyle = 'rgba(10, 16, 30, 0.94)';
    ctx.beginPath();
    ctx.roundRect(startX, startY, totalWidth, boxHeight, 7);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Key Badge (Gold Pill)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.roundRect(startX + 4, startY + 3, keyWidth, boxHeight - 6, 4);
    ctx.fill();

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(keyBadgeText, startX + 4 + keyWidth / 2, startY + boxHeight / 2 + 1);

    // Prompt Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(actionText, startX + 6 + keyWidth, startY + boxHeight / 2 + 1);

    ctx.restore();
  }

  renderFloatingMessage(msg) {
    const ctx = this.ctx;
    ctx.save();
    const alpha = Math.max(0, Math.min(1, msg.timer / 0.5));
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 12px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(msg.text).width;
    const boxWidth = textWidth + 18;
    const boxHeight = 24;

    // Dark rounded pill backdrop
    ctx.fillStyle = 'rgba(10, 16, 30, 0.92)';
    ctx.beginPath();
    ctx.roundRect(msg.x - boxWidth / 2, msg.y - boxHeight / 2, boxWidth, boxHeight, 12);
    ctx.fill();
    ctx.strokeStyle = msg.color || '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = msg.color || '#ffd700';
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = msg.color || '#ffffff';
    ctx.fillText(msg.text, msg.x, msg.y);
    ctx.restore();
  }
}
