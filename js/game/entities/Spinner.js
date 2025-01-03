import { Character } from './Character.js';
import {
  MAX_AMMO,
  RELOAD_TIME,
  SPIN_SPEED,
  SPIKE_SPEED,
  MAX_HEALTH,
} from '../core/constants.js';

export class Spinner extends Character {
  constructor(ctx) {
    super(50, ctx.canvas.height / 2 - 25, 50, 50, '#111', ctx);
    this.spikes = [];
    this.rotation = 0;
    this.ammo = MAX_AMMO;
    this.reloadProgress = 0;
    this.isReloading = false;
    this.lastUpdate = performance.now();
    this.lastShootTime = 0;
    this.shootCooldown = 250; // 250ms cooldown between shots
    this.maxHealth = MAX_HEALTH;
    this.invulnerable = false;
    this.invulnerabilityDuration = 1000; // 1 second of invulnerability after taking damage
    this.invulnerabilityTimer = 0;
  }

  takeDamage(amount) {
    if (this.invulnerable) return;
    super.takeDamage(amount);
    this.invulnerable = true;
    this.invulnerabilityTimer = 0;
  }

  draw() {
    // Add flashing effect when invulnerable
    if (this.invulnerable) {
      this.ctx.globalAlpha =
        0.5 + Math.sin(this.invulnerabilityTimer / 50) * 0.3;
    }

    super.draw();

    this.ctx.save();
    this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    this.ctx.rotate(this.rotation);

    // Draw reload progress circle if reloading
    if (this.isReloading) {
      const progress = this.reloadProgress / RELOAD_TIME;
      const radius = this.width / 2 + 25;

      // Draw background circle
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 4;
      this.ctx.stroke();

      // Draw progress arc
      this.ctx.beginPath();
      this.ctx.arc(
        0,
        0,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + progress * Math.PI * 2,
      );
      this.ctx.strokeStyle = '#0f0';
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
    }

    // Draw the spinner body with metallic effect
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);

    // Create metallic gradient
    const gradient = this.ctx.createRadialGradient(
      -8,
      -8,
      0,
      0,
      0,
      this.width / 2,
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.3, '#888');
    gradient.addColorStop(1, '#111');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Add metallic ring
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw spikes
    this.ctx.beginPath();
    for (let i = 0; i < this.ammo; i++) {
      const angle = (i / MAX_AMMO) * Math.PI * 2;
      const spikeX = Math.cos(angle) * (this.width / 2);
      const spikeY = Math.sin(angle) * (this.height / 2);
      const spikeEndX = Math.cos(angle) * (this.width / 2 + 20);
      const spikeEndY = Math.sin(angle) * (this.height / 2 + 20);
      this.ctx.moveTo(spikeX, spikeY);
      this.ctx.lineTo(spikeEndX, spikeEndY);
    }
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    this.ctx.strokeStyle = '#111';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();

    // Draw projectile spikes
    this.spikes.forEach((spike) => {
      this.ctx.save();
      this.ctx.translate(spike.x, spike.y);

      // Draw spike with outline
      this.ctx.beginPath();
      this.ctx.moveTo(20, 0);
      this.ctx.lineTo(0, -6);
      this.ctx.lineTo(0, 6);
      this.ctx.closePath();

      // White outline
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Dark fill
      this.ctx.fillStyle = '#111';
      this.ctx.fill();

      this.ctx.restore();
    });

    // Reset alpha
    if (this.invulnerable) {
      this.ctx.globalAlpha = 1;
    }
  }

  shoot() {
    const now = performance.now();
    if (
      this.ammo > 0 &&
      !this.isReloading &&
      now - this.lastShootTime >= this.shootCooldown
    ) {
      this.spikes.push({
        x: this.x + this.width,
        y: this.y + this.height / 2,
      });
      this.ammo--;
      this.lastShootTime = now;
    }
  }

  reload() {
    if (!this.isReloading && this.ammo < MAX_AMMO) {
      this.isReloading = true;
      this.reloadProgress = 0;
    }
  }

  update(deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds

    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTimer += deltaTime;
      if (this.invulnerabilityTimer >= this.invulnerabilityDuration) {
        this.invulnerable = false;
      }
    }

    this.move(dt);
    // Spin animation
    this.rotation += SPIN_SPEED * dt;

    // Handle reloading
    if (this.isReloading) {
      this.reloadProgress += deltaTime;
      if (this.reloadProgress >= RELOAD_TIME) {
        this.ammo = MAX_AMMO;
        this.isReloading = false;
      }
    }

    // Update spikes
    this.spikes = this.spikes.filter((spike) => {
      spike.x += SPIKE_SPEED * dt;
      return spike.x < this.ctx.canvas.width;
    });
  }
}
