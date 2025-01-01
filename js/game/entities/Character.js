import { MAX_HEALTH } from '../core/constants.js';

export class Character {
  constructor(x, y, width, height, color, ctx) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.health = MAX_HEALTH;
    this.velocity = 0;
    this.ctx = ctx;
  }

  draw() {
    // Draw health bar
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(this.x, this.y - 20, this.width, 10);
    this.ctx.fillStyle = 'green';
    this.ctx.fillRect(
      this.x,
      this.y - 20,
      (this.width * this.health) / MAX_HEALTH,
      10,
    );
  }

  move(deltaTime) {
    this.y += this.velocity * deltaTime;
    if (this.y < 0) this.y = 0;
    if (this.y > this.ctx.canvas.height - this.height)
      this.y = this.ctx.canvas.height - this.height;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
}
