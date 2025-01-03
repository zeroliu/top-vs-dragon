import { Character } from './Character.js';
import { MAX_HEALTH } from '../core/constants.js';

export const MOVEMENT_STATE = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
  EXPLODING: 'exploding',
};

const VERTICAL_PADDING = 100; // Padding from top and bottom edges
const MINION_GAP = 100; // Vertical gap between minions
const MINION_MAX_HEALTH = MAX_HEALTH / 4; // Minion has 1/4 of the max health

// Movement speed constants
const MINION_HORIZONTAL_SPEED = 150; // Pixels per second
const MINION_VERTICAL_SPEED = 200; // Pixels per second
const MINION_ACCELERATION = 300; // Pixels per second squared

export class FireMinion extends Character {
  constructor(x, dragonHealth, ctx, verticalOffset = 0) {
    // Calculate initial Y position based on vertical offset
    const startY = VERTICAL_PADDING + verticalOffset * MINION_GAP;
    super(x, startY, 40, 40, '#F44', ctx);

    // Set health and maxHealth to the same smaller value
    this.health = MINION_MAX_HEALTH;
    this.maxHealth = MINION_MAX_HEALTH;

    this.moveDirection = 1; // 1 for down, -1 for up
    this.targetSpeed = MINION_HORIZONTAL_SPEED;
    this.currentSpeed = 0;
    this.acceleration = MINION_ACCELERATION;
    this.verticalSpeed = MINION_VERTICAL_SPEED;
    this.movementState = MOVEMENT_STATE.VERTICAL;
    this.horizontalMoveTime = 0;
    this.horizontalMoveDuration = 1.5; // seconds to move horizontally
    this.exploding = false;
    this.explosionRadius = 0;
    this.maxExplosionRadius = 60;
    this.explosionSpeed = 120;

    // Set min and max Y with padding
    this.minY = VERTICAL_PADDING;
    this.maxY = ctx.canvas.height - VERTICAL_PADDING - this.height;
  }

  draw() {
    if (this.movementState === MOVEMENT_STATE.EXPLODING) {
      // Draw explosion
      this.ctx.fillStyle = `rgba(255, 68, 68, ${
        1 - this.explosionRadius / this.maxExplosionRadius
      })`;
      this.ctx.beginPath();
      this.ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.explosionRadius,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();
      return;
    }

    // Draw custom health bar
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(this.x, this.y - 20, this.width, 10);
    this.ctx.fillStyle = 'green';
    this.ctx.fillRect(
      this.x,
      this.y - 20,
      (this.width * this.health) / this.maxHealth,
      10,
    );

    // Draw minion body
    this.ctx.fillStyle = '#F44';
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw eyes
    this.ctx.fillStyle = '#FF0';
    this.ctx.beginPath();
    this.ctx.arc(this.x + 10, this.y + 15, 5, 0, Math.PI * 2);
    this.ctx.arc(this.x + 30, this.y + 15, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw mouth (angry expression)
    this.ctx.strokeStyle = '#FF0';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.x + 10, this.y + 30);
    this.ctx.lineTo(this.x + 20, this.y + 25);
    this.ctx.lineTo(this.x + 30, this.y + 30);
    this.ctx.stroke();
  }

  update(deltaTime) {
    const dt = deltaTime / 1000;

    if (this.movementState === MOVEMENT_STATE.EXPLODING) {
      this.explosionRadius += this.explosionSpeed * dt;
      // Keep the minion in the game until explosion animation is complete
      return this.explosionRadius <= this.maxExplosionRadius;
    }

    // Only update horizontal movement in HORIZONTAL state
    if (this.movementState === MOVEMENT_STATE.HORIZONTAL) {
      // Smooth left movement
      const speedDiff = this.targetSpeed - this.currentSpeed;
      if (Math.abs(speedDiff) > 0.1) {
        this.currentSpeed += Math.sign(speedDiff) * this.acceleration * dt;
      }
      this.x -= this.currentSpeed * dt;

      this.horizontalMoveTime += dt;
      if (this.horizontalMoveTime >= this.horizontalMoveDuration) {
        this.movementState = MOVEMENT_STATE.VERTICAL;
        this.currentSpeed = 0; // Reset speed when switching back to vertical
      }
    }

    if (this.movementState === MOVEMENT_STATE.VERTICAL) {
      // Move vertically
      this.y += this.verticalSpeed * this.moveDirection * dt;

      // Check vertical bounds and change direction or state
      if (this.y <= 0) {
        // Start explosion when touching top
        this.movementState = MOVEMENT_STATE.EXPLODING;
        this.explosionRadius = 0; // Reset explosion radius
        return true;
      }

      // Check if we've hit the vertical bounds
      if (this.y >= this.maxY) {
        this.y = this.maxY;
        this.moveDirection = -1;
        this.movementState = MOVEMENT_STATE.HORIZONTAL;
        this.horizontalMoveTime = 0;
      } else if (this.y <= this.minY) {
        this.y = this.minY;
        this.moveDirection = 1;
        this.movementState = MOVEMENT_STATE.HORIZONTAL;
        this.horizontalMoveTime = 0;
      }
    }

    // Always return true since we handle screen wrapping in game.js
    return true;
  }
}
