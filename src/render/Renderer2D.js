/**
 * Renderer2D: High-DPI Canvas 2D Game Renderer with Rich Mid-Autumn Aesthetic
 */

import { TILE_SIZE, MAP_COLS, MAP_ROWS, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_TYPES, ITEM_TYPES } from '../core/Constants.js';

export class Renderer2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
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

  render(world) {
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

        if (type === TILE_TYPES.FLOOR || type === TILE_TYPES.WALL) continue;

        // Draw Station Counter Base
        this.drawStationBase(ctx, px, py, type);

        // Draw item placed on counter
        if (item) {
          this.drawItem(ctx, px + TILE_SIZE / 2, py + TILE_SIZE / 2, item, 0.9);
        }
      }
    }
  }

  drawStationBase(ctx, px, py, type) {
    // Top-down counter with 3D bevel edge
    const r = 6;
    ctx.save();

    // Default Counter
    ctx.fillStyle = '#6d432b'; // Wood tone
    ctx.strokeStyle = '#422818';
    ctx.lineWidth = 2;

    switch (type) {
      case TILE_TYPES.COUNTER:
        // Polished mahogany prep table
        ctx.fillStyle = '#7a4d33';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;

      case TILE_TYPES.CRATE_BEEF:
        // Red wooden crate
        ctx.fillStyle = '#8b261e';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🥩', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '牛肉箱');
        break;

      case TILE_TYPES.CRATE_VEGGIE:
        // Green wooden crate
        ctx.fillStyle = '#1e6b37';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🫑', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '蔬菜箱');
        break;

      case TILE_TYPES.CRATE_TOAST:
        // Golden wooden crate
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍞', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '吐司箱');
        break;

      case TILE_TYPES.CUTTING_BOARD:
        // Light wood chopping board with knife icon
        ctx.fillStyle = '#9e6d48';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        // Inner board
        ctx.fillStyle = '#eed6aa';
        ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔪', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '切菜台');
        break;

      case TILE_TYPES.GRILL:
        // Charcoal BBQ grill with glowing coals
        ctx.fillStyle = '#22252c';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        // Burning charcoal glow inside
        const grad = ctx.createRadialGradient(
          px + TILE_SIZE / 2, py + TILE_SIZE / 2, 4,
          px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 - 4
        );
        grad.addColorStop(0, '#ff5722');
        grad.addColorStop(0.5, '#d32f2f');
        grad.addColorStop(1, '#1b1d24');
        ctx.fillStyle = grad;
        ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
        
        // Grill wire mesh
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 1.5;
        for (let i = 10; i < TILE_SIZE - 6; i += 8) {
          ctx.beginPath();
          ctx.moveTo(px + 6, py + i);
          ctx.lineTo(px + TILE_SIZE - 6, py + i);
          ctx.stroke();
        }
        this.drawStationLabel(ctx, px, py, '炭火烤爐');
        break;

      case TILE_TYPES.PLATE_STACK:
        // Plate rack
        ctx.fillStyle = '#3a4a6b';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍽️', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        this.drawStationLabel(ctx, px, py, '餐盤架');
        break;

      case TILE_TYPES.SINK:
        // Stainless steel sink
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
        // Golden delivery window
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
        // Trash bin
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

  renderPlayer(player) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Drop shadow under player
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + player.radius * 0.8, player.radius * 0.9, player.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Character body (Cute Moon Rabbit Chef)
    const bob = player.isMoving ? Math.sin(player.walkAnimTimer) * 3 : 0;
    const cx = player.x;
    const cy = player.y + bob;

    // Rabbit White Body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Chef Red Scarf / Bandana
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(cx, cy + 4, player.radius * 0.9, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.fill();

    // Cute Long Bunny Ears
    ctx.fillStyle = '#ffffff';
    // Left ear
    ctx.beginPath();
    ctx.ellipse(cx - 7, cy - player.radius - 8, 4, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb6c1'; // Pink inner ear
    ctx.beginPath();
    ctx.ellipse(cx - 7, cy - player.radius - 8, 2, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx + 7, cy - player.radius - 8, 4, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb6c1'; // Pink inner ear
    ctx.beginPath();
    ctx.ellipse(cx + 7, cy - player.radius - 8, 2, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes and Cheeks
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 2, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Pink blush cheeks
    ctx.fillStyle = 'rgba(255, 105, 180, 0.6)';
    ctx.beginPath();
    ctx.arc(cx - 9, cy + 2, 3, 0, Math.PI * 2);
    ctx.arc(cx + 9, cy + 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Facing indicator badge (Chef hat feather or golden arrow)
    const arrowDist = player.radius + 6;
    const ax = cx + player.facing.x * arrowDist;
    const ay = cy + player.facing.y * arrowDist;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(ax, ay, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Held Item above head
    if (player.heldItem) {
      this.drawItem(ctx, cx, cy - player.radius - 20, player.heldItem, 1.1);
    }

    ctx.restore();
  }

  drawItem(ctx, x, y, item, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // If it's a Plate
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
        ctx.font = '14px sans-serif';
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
    // If it's single food or object
    else {
      // Background bubble for clarity
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
}
