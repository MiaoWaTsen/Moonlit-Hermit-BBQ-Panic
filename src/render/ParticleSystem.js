/**
 * ParticleSystem: Lightweight canvas particle system for sparks, steam, smoke, and cooking sparkles
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, type = 'spark', count = 3) {
    for (let i = 0; i < count; i++) {
      let p;
      if (type === 'spark') {
        // Fire / Charcoal spark (fly upwards with gravity and fade)
        p = {
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 40,
          vy: -Math.random() * 50 - 30,
          size: Math.random() * 3 + 1.5,
          color: Math.random() > 0.5 ? '#ff9800' : '#ffd700',
          alpha: 1.0,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 1.0
        };
      } else if (type === 'smoke_white') {
        // White cooking steam
        p = {
          x: x + (Math.random() - 0.5) * 16,
          y: y - 5,
          vx: (Math.random() - 0.5) * 15,
          vy: -Math.random() * 25 - 15,
          size: Math.random() * 4 + 3,
          color: 'rgba(230, 240, 255, 0.6)',
          alpha: 0.7,
          life: 0.8 + Math.random() * 0.4,
          maxLife: 1.2
        };
      } else if (type === 'smoke_black') {
        // Black burnt smoke
        p = {
          x: x + (Math.random() - 0.5) * 20,
          y: y - 5,
          vx: (Math.random() - 0.5) * 30,
          vy: -Math.random() * 45 - 25,
          size: Math.random() * 6 + 4,
          color: 'rgba(30, 30, 30, 0.85)',
          alpha: 0.9,
          life: 1.0 + Math.random() * 0.5,
          maxLife: 1.5
        };
      } else if (type === 'sparkle') {
        // Golden festive star sparkles
        p = {
          x: x + (Math.random() - 0.5) * 24,
          y: y + (Math.random() - 0.5) * 24,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30 - 10,
          size: Math.random() * 3.5 + 2,
          color: '#ffd700',
          alpha: 1.0,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8
        };
      } else if (type === 'chop') {
        // Vegetable / Meat bits popping
        p = {
          x: x + (Math.random() - 0.5) * 12,
          y: y,
          vx: (Math.random() - 0.5) * 60,
          vy: -Math.random() * 60 - 20,
          size: Math.random() * 3 + 2,
          color: Math.random() > 0.5 ? '#2ecc71' : '#e74c3c',
          alpha: 1.0,
          life: 0.4,
          maxLife: 0.4
        };
      }

      if (p) this.particles.push(p);
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size *= 0.98; // Gradual shrink
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
