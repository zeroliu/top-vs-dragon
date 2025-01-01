import { Character } from './Character.js';
import {
  MAX_HEALTH,
  HEALTH_INCREASE_PER_LEVEL,
  BASE_FIRE_RATE,
  BASE_FIRE_SIZE,
  FIRE_SPEED,
  PLAYER_SPEED,
} from '../core/constants.js';

export class Dragon extends Character {
  constructor(level, position = 0, ctx) {
    const totalWidth = 80 + level * 5;
    const totalHeight = 70 + level * 5;
    super(
      ctx.canvas.width - 100 - position * 100,
      ctx.canvas.height / 2 - totalHeight / 2,
      totalWidth,
      totalHeight,
      '#844',
      ctx,
    );
    this.fires = [];
    this.fireTimer = 0;
    this.targetY = this.y;
    this.level = level;
    this.health = MAX_HEALTH + (level - 1) * HEALTH_INCREASE_PER_LEVEL;
    this.maxHealth = this.health;
    this.fireRate = Math.max(BASE_FIRE_RATE - (level - 1) * 100, 500);
    this.fireSize = BASE_FIRE_SIZE + (level - 1) * 2;
    this.behaviorTimer = 0;
    this.currentBehavior = 'track';
    this.behaviorDuration = 2000;
    this.randomTarget = this.y;
  }

  draw() {
    super.draw();

    // Override health bar to show current/max health
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(this.x, this.y - 20, this.width, 10);
    this.ctx.fillStyle = 'green';
    this.ctx.fillRect(
      this.x,
      this.y - 20,
      (this.width * this.health) / this.maxHealth,
      10,
    );

    const redComponent = Math.max(170 - this.level * 20, 80);
    const baseColor = `rgb(${redComponent}, 40, 40)`;
    const darkerColor = `rgb(${redComponent - 40}, 20, 20)`;

    // Draw dragon body with gradient
    const bodyGradient = this.ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height,
    );
    bodyGradient.addColorStop(0, baseColor);
    bodyGradient.addColorStop(0.5, darkerColor);
    bodyGradient.addColorStop(1, baseColor);
    this.ctx.fillStyle = bodyGradient;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    this.drawScales(darkerColor);
    this.drawHead(baseColor, darkerColor);
    this.drawFires();
  }

  drawScales(darkerColor) {
    const scaleSize = Math.max(4 - (this.level - 1) * 0.3, 2);
    const scaleSpacing = Math.max(12 - (this.level - 1) * 0.5, 8);

    for (let i = 0; i < this.height / scaleSpacing; i++) {
      for (let j = 0; j < this.width / scaleSpacing; j++) {
        const scaleX = this.x + 10 + j * scaleSpacing;
        const scaleY = this.y + 10 + i * scaleSpacing;

        // Draw base scale
        this.ctx.beginPath();
        this.ctx.arc(scaleX, scaleY, scaleSize, 0, Math.PI * 2);
        this.ctx.fillStyle = darkerColor;
        this.ctx.fill();

        // Draw shine on scales
        this.ctx.beginPath();
        this.ctx.arc(scaleX - 1, scaleY - 1, scaleSize * 0.5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fill();
      }
    }
  }

  drawHead(baseColor, darkerColor) {
    const headSize = 30 + this.level * 2;

    // Draw neck
    this.ctx.beginPath();
    this.ctx.moveTo(this.x, this.y + this.height * 0.4);
    this.ctx.quadraticCurveTo(
      this.x - headSize * 0.5,
      this.y + this.height * 0.5,
      this.x - headSize,
      this.y + this.height * 0.5,
    );
    this.ctx.quadraticCurveTo(
      this.x - headSize * 0.5,
      this.y + this.height * 0.5,
      this.x,
      this.y + this.height * 0.6,
    );
    this.ctx.fillStyle = baseColor;
    this.ctx.fill();

    // Draw head
    this.ctx.beginPath();
    this.ctx.moveTo(this.x - headSize, this.y + this.height * 0.3);
    this.ctx.quadraticCurveTo(
      this.x - headSize - 10,
      this.y + this.height * 0.5,
      this.x - headSize,
      this.y + this.height * 0.7,
    );
    this.ctx.lineTo(this.x - headSize + 15, this.y + this.height * 0.6);
    this.ctx.lineTo(this.x - headSize + 15, this.y + this.height * 0.4);
    this.ctx.closePath();
    this.ctx.fillStyle = baseColor;
    this.ctx.fill();

    // Draw horns
    this.ctx.beginPath();
    this.ctx.moveTo(this.x - headSize + 5, this.y + this.height * 0.3);
    this.ctx.lineTo(this.x - headSize - 10, this.y + this.height * 0.2);
    this.ctx.lineTo(this.x - headSize + 10, this.y + this.height * 0.35);
    this.ctx.fillStyle = darkerColor;
    this.ctx.fill();

    this.drawEye(headSize);
  }

  drawEye(headSize) {
    const eyeX = this.x - headSize + 10;
    const eyeY = this.y + this.height * 0.45;
    const eyeSize = 5 + this.level * 0.5;

    // Draw eye glow
    const glowGradient = this.ctx.createRadialGradient(
      eyeX,
      eyeY,
      0,
      eyeX,
      eyeY,
      eyeSize * 2,
    );
    glowGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.fillRect(
      eyeX - eyeSize * 2,
      eyeY - eyeSize * 2,
      eyeSize * 4,
      eyeSize * 4,
    );

    // Draw eye
    this.ctx.beginPath();
    this.ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgb(255, ${Math.max(255 - this.level * 30, 0)}, 0)`;
    this.ctx.fill();

    // Draw eye shine
    this.ctx.beginPath();
    this.ctx.arc(eyeX - 1, eyeY - 1, eyeSize * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fill();
  }

  drawFires() {
    this.fires.forEach((fire) => {
      if (fire.exploding) {
        // Draw explosion
        const progress = fire.explosionTime / fire.explosionDuration;
        const radius = this.fireSize * (2 - progress) * 2;

        // Draw expanding circle
        this.ctx.beginPath();
        this.ctx.arc(fire.x, fire.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, ${150 - progress * 150}, 0, ${
          1 - progress
        })`;
        this.ctx.fill();

        // Draw sparks
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
          const sparkRadius = radius * (0.5 + Math.random() * 0.5);
          const x = fire.x + Math.cos(angle) * sparkRadius;
          const y = fire.y + Math.sin(angle) * sparkRadius;

          this.ctx.beginPath();
          this.ctx.arc(
            x,
            y,
            this.fireSize * (1 - progress) * 0.5,
            0,
            Math.PI * 2,
          );
          this.ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, 0, ${
            1 - progress
          })`;
          this.ctx.fill();
        }
      } else {
        // Draw original fireball with glow and trail
        this.drawFireGlow(fire.x, fire.y);
        this.drawFireball(fire.x, fire.y);
        this.drawFlameTrail(fire.x, fire.y);
        this.drawSparks(fire.x, fire.y);
      }
    });
  }

  drawFireGlow(fireX, fireY) {
    const glowGradient = this.ctx.createRadialGradient(
      fireX,
      fireY,
      0,
      fireX,
      fireY,
      this.fireSize * 3,
    );
    glowGradient.addColorStop(0, 'rgba(255, 200, 0, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.2)');
    glowGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.fillRect(
      fireX - this.fireSize * 3,
      fireY - this.fireSize * 3,
      this.fireSize * 6,
      this.fireSize * 6,
    );
  }

  drawFireball(fireX, fireY) {
    this.ctx.beginPath();
    this.ctx.arc(fireX, fireY, this.fireSize, 0, Math.PI * 2);
    const gradient = this.ctx.createRadialGradient(
      fireX - this.fireSize * 0.3,
      fireY - this.fireSize * 0.3,
      0,
      fireX,
      fireY,
      this.fireSize,
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.2, '#ffff00');
    gradient.addColorStop(0.4, '#ffaa00');
    gradient.addColorStop(0.8, '#ff4400');
    gradient.addColorStop(1, '#ff0000');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  drawFlameTrail(fireX, fireY) {
    const points = this.generateFlamePoints(fireX, fireY, 5);
    const gradient = this.ctx.createLinearGradient(
      fireX - this.fireSize * 3,
      fireY,
      fireX + this.fireSize * 3,
      fireY,
    );
    gradient.addColorStop(0, 'rgba(255, 50, 0, 0)');
    gradient.addColorStop(0.2, 'rgba(255, 100, 0, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 150, 0, 0.9)');
    gradient.addColorStop(0.6, 'rgba(255, 200, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = this.fireSize;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
  }

  generateFlamePoints(fireX, fireY, trailLength) {
    const points = [];
    for (let i = 0; i < trailLength; i++) {
      const offset = i * (this.fireSize * 1.5);
      const wave =
        Math.sin(fireX / 10 + i + performance.now() / 100) * (3 + this.level);
      points.push({
        x: fireX + offset,
        y: fireY + wave,
      });
    }
    return points;
  }

  drawSparks(fireX, fireY) {
    const numSparks = 3 + Math.floor(this.level / 2);
    for (let i = 0; i < numSparks; i++) {
      const sparkLife = ((fireX + i * 50) % 100) / 100;
      const sparkOffset = Math.sin(fireX / 10 + i) * this.fireSize;
      const sparkX = fireX + this.fireSize * 2 * sparkLife;
      const sparkY = fireY + sparkOffset * sparkLife;
      const sparkSize = (1 - sparkLife) * this.fireSize * 0.3;

      this.ctx.beginPath();
      this.ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, ${200 + sparkLife * 55}, 0, ${
        1 - sparkLife
      })`;
      this.ctx.fill();
    }
  }

  update(deltaTime, spinner) {
    const dt = deltaTime / 1000;

    this.move(dt);
    this.updateBehavior(deltaTime);

    // Update movement based on current behavior
    switch (this.currentBehavior) {
      case 'track':
        this.trackSpinner(spinner);
        break;
      case 'evade':
        this.evadeSpikes(spinner);
        break;
      case 'random':
        this.moveRandomly();
        break;
    }

    // Fire shooting logic
    this.fireTimer += deltaTime;
    if (this.fireTimer > this.fireRate) {
      this.shoot(spinner);
      this.fireTimer = 0;
    }

    // Update fires
    this.fires = this.fires.filter((fire) => {
      if (fire.exploding) {
        fire.explosionTime += deltaTime;
        return fire.explosionTime < fire.explosionDuration;
      } else {
        fire.x -= FIRE_SPEED * dt;
        return fire.x > 0;
      }
    });
  }

  updateBehavior(deltaTime) {
    this.behaviorTimer += deltaTime;
    if (this.behaviorTimer >= this.behaviorDuration) {
      this.behaviorTimer = 0;
      // Randomly choose next behavior with weights
      const rand = Math.random();
      if (rand < 0.5) {
        this.currentBehavior = 'track';
      } else if (rand < 0.8) {
        this.currentBehavior = 'evade';
      } else {
        this.currentBehavior = 'random';
        this.randomTarget =
          Math.random() * (this.ctx.canvas.height - this.height);
      }
      this.behaviorDuration = 1000 + Math.random() * 2000;
    }
  }

  trackSpinner(spinner) {
    this.targetY = spinner.y + spinner.height / 2 - this.height / 2;
    const distanceToTarget = this.targetY - this.y;
    const speedMultiplier = 1 + (this.level - 1) * 0.1;
    // Calculate velocity in pixels per second
    this.velocity =
      Math.sign(distanceToTarget) *
      Math.min(
        Math.abs(distanceToTarget) * 2 * speedMultiplier,
        PLAYER_SPEED * speedMultiplier,
      );
  }

  evadeSpikes(spinner) {
    const nearbySpikes = spinner.spikes.filter(
      (spike) => spike.x < this.x + this.width + 200 && spike.x > this.x - 50,
    );

    if (nearbySpikes.length > 0) {
      const avgSpikeY =
        nearbySpikes.reduce((sum, spike) => sum + spike.y, 0) /
        nearbySpikes.length;
      const moveUp = avgSpikeY > this.y + this.height / 2;
      // Set velocity in pixels per second
      this.velocity =
        (moveUp ? -1 : 1) * PLAYER_SPEED * (1 + (this.level - 1) * 0.1);
    } else {
      this.velocity *= 0.9; // Slow down gradually
    }
  }

  moveRandomly() {
    const distanceToTarget = this.randomTarget - this.y;
    // Set velocity in pixels per second
    this.velocity = Math.sign(distanceToTarget) * PLAYER_SPEED * 0.5;

    if (Math.abs(distanceToTarget) < 10) {
      this.randomTarget =
        Math.random() * (this.ctx.canvas.height - this.height);
    }
  }

  shoot(spinner) {
    const targetY = spinner.y + spinner.height / 2;
    this.fires.push({
      x: this.x,
      y: this.y + this.height / 2,
      targetY: targetY,
      exploding: false,
      explosionTime: 0,
      explosionDuration: 300, // 300ms explosion animation
    });
  }
}
