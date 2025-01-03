import { MAX_HEALTH } from '../core/constants.js';

const VERTICAL_PADDING = 100; // Padding from top and bottom edges

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
    // Add padding to vertical movement
    if (this.y < VERTICAL_PADDING) this.y = VERTICAL_PADDING;
    if (this.y > this.ctx.canvas.height - VERTICAL_PADDING - this.height)
      this.y = this.ctx.canvas.height - VERTICAL_PADDING - this.height;
  }

  takeDamage(amount) {
    const oldHealth = this.health;
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    console.log(
      `Health reduced from ${oldHealth} to ${this.health} (damage: ${amount})`,
    );
  }
}
