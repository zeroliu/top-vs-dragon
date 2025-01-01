// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio setup
const titleMusic = new Audio('title.mp3');
titleMusic.loop = true;
const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true;

// Load background images
const titleBackground = new Image();
titleBackground.src = 'title.png';
const battleBackground = new Image();
battleBackground.src = 'background.png';

// Game constants
const GAME_SPEED = 60;
const PLAYER_SPEED = 5;
const SPIKE_SPEED = 7;
const FIRE_SPEED = 6;
const MAX_HEALTH = 100;
const SPIN_SPEED = 0.1;
const MAX_AMMO = 8;
const RELOAD_TIME = 120;
const BASE_FIRE_RATE = 60;
const BASE_FIRE_SIZE = 10;
const HEALTH_INCREASE_PER_LEVEL = 50;
const DRAGONS_PER_LEVEL = 2;
const MAX_DRAGONS = 4;

// Expose game constants to window
window.PLAYER_SPEED = PLAYER_SPEED;

// Game state
window.gameStarted = false;
window.gameOver = false;
window.spinner = null;
let dragons = [new Dragon(1)];
let currentLevel = 1;
let transitioning = false;
let transitionTimer = 0;
let explosions = [];
let dragonHitEffects = [];
let screenShake = 0;

// Game classes
class Character {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.health = MAX_HEALTH;
    this.velocity = 0;
  }

  draw() {
    // Draw health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y - 20, this.width, 10);
    ctx.fillStyle = 'green';
    ctx.fillRect(
      this.x,
      this.y - 20,
      (this.width * this.health) / MAX_HEALTH,
      10,
    );
  }

  move() {
    this.y += this.velocity;
    if (this.y < 0) this.y = 0;
    if (this.y > canvas.height - this.height)
      this.y = canvas.height - this.height;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
}

class Spinner extends Character {
  constructor() {
    super(50, canvas.height / 2 - 25, 50, 50, '#111');
    this.spikes = [];
    this.rotation = 0;
    this.ammo = MAX_AMMO;
    this.reloadProgress = 0;
    this.isReloading = false;
  }

  draw() {
    super.draw();

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    // Draw reload progress circle if reloading
    if (this.isReloading) {
      const progress = this.reloadProgress / RELOAD_TIME;
      const radius = this.width / 2 + 25; // Slightly larger than the spikes

      // Draw background circle
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw progress arc
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + progress * Math.PI * 2,
      );
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Draw the spinner body with stronger metallic effect
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);

    // Create more pronounced metallic gradient
    const gradient = ctx.createRadialGradient(-8, -8, 0, 0, 0, this.width / 2);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.3, '#888');
    gradient.addColorStop(1, '#111');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add metallic ring
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw spikes with enhanced visibility
    ctx.beginPath();
    for (let i = 0; i < this.ammo; i++) {
      const angle = (i / MAX_AMMO) * Math.PI * 2;
      const spikeX = Math.cos(angle) * (this.width / 2);
      const spikeY = Math.sin(angle) * (this.height / 2);
      const spikeEndX = Math.cos(angle) * (this.width / 2 + 20);
      const spikeEndY = Math.sin(angle) * (this.height / 2 + 20);
      ctx.moveTo(spikeX, spikeY);
      ctx.lineTo(spikeEndX, spikeEndY);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Draw projectile spikes with enhanced visibility
    this.spikes.forEach((spike) => {
      ctx.save();
      ctx.translate(spike.x, spike.y);

      // Draw spike with outline
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(0, -6);
      ctx.lineTo(0, 6);
      ctx.closePath();

      // White outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dark fill
      ctx.fillStyle = '#111';
      ctx.fill();

      ctx.restore();
    });
  }

  shoot() {
    if (this.ammo > 0 && !this.isReloading) {
      this.spikes.push({
        x: this.x + this.width,
        y: this.y + this.height / 2,
      });
      this.ammo--;
    }
  }

  reload() {
    if (!this.isReloading && this.ammo < MAX_AMMO) {
      this.isReloading = true;
      this.reloadProgress = 0;
    }
  }

  update() {
    this.move();
    // Spin animation
    this.rotation += SPIN_SPEED;

    // Handle reloading
    if (this.isReloading) {
      this.reloadProgress++;
      if (this.reloadProgress >= RELOAD_TIME) {
        this.ammo = MAX_AMMO;
        this.isReloading = false;
      }
    }

    // Update spikes
    this.spikes = this.spikes.filter((spike) => {
      spike.x += SPIKE_SPEED;
      return spike.x < canvas.width;
    });
  }

  takeDamage(amount) {
    super.takeDamage(amount);
  }
}

class Dragon extends Character {
  constructor(level, position = 0) {
    const totalWidth = 80 + level * 5;
    const totalHeight = 70 + level * 5;
    super(
      canvas.width - 100 - position * 100, // Stagger dragon positions
      canvas.height / 2 - totalHeight / 2,
      totalWidth,
      totalHeight,
      '#844',
    );
    this.fires = [];
    this.fireTimer = 0;
    this.targetY = this.y;
    this.level = level;
    this.health = MAX_HEALTH + (level - 1) * HEALTH_INCREASE_PER_LEVEL;
    this.maxHealth = this.health;
    this.fireRate = Math.max(BASE_FIRE_RATE - (level - 1) * 5, 20);
    this.fireSize = BASE_FIRE_SIZE + (level - 1) * 2;
    this.behaviorTimer = 0;
    this.currentBehavior = 'track'; // 'track', 'evade', 'random'
    this.behaviorDuration = 120; // Duration of each behavior
    this.randomTarget = this.y;
  }

  draw() {
    super.draw();

    // Override health bar to show current/max health
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y - 20, this.width, 10);
    ctx.fillStyle = 'green';
    ctx.fillRect(
      this.x,
      this.y - 20,
      (this.width * this.health) / this.maxHealth,
      10,
    );

    const redComponent = Math.max(170 - this.level * 20, 80);
    const baseColor = `rgb(${redComponent}, 40, 40)`;
    const darkerColor = `rgb(${redComponent - 40}, 20, 20)`;

    // Draw dragon body with gradient
    const bodyGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height,
    );
    bodyGradient.addColorStop(0, baseColor);
    bodyGradient.addColorStop(0.5, darkerColor);
    bodyGradient.addColorStop(1, baseColor);
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw dragon scales with shine effect
    const scaleSize = Math.max(4 - (this.level - 1) * 0.3, 2);
    const scaleSpacing = Math.max(12 - (this.level - 1) * 0.5, 8);

    for (let i = 0; i < this.height / scaleSpacing; i++) {
      for (let j = 0; j < this.width / scaleSpacing; j++) {
        const scaleX = this.x + 10 + j * scaleSpacing;
        const scaleY = this.y + 10 + i * scaleSpacing;

        // Draw base scale
        ctx.beginPath();
        ctx.arc(scaleX, scaleY, scaleSize, 0, Math.PI * 2);
        ctx.fillStyle = darkerColor;
        ctx.fill();

        // Draw shine on scales
        ctx.beginPath();
        ctx.arc(scaleX - 1, scaleY - 1, scaleSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
      }
    }

    // Draw dragon head with more detail
    const headSize = 30 + this.level * 2;

    // Draw neck
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height * 0.4);
    ctx.quadraticCurveTo(
      this.x - headSize * 0.5,
      this.y + this.height * 0.5,
      this.x - headSize,
      this.y + this.height * 0.5,
    );
    ctx.quadraticCurveTo(
      this.x - headSize * 0.5,
      this.y + this.height * 0.5,
      this.x,
      this.y + this.height * 0.6,
    );
    ctx.fillStyle = baseColor;
    ctx.fill();

    // Draw head
    ctx.beginPath();
    ctx.moveTo(this.x - headSize, this.y + this.height * 0.3);
    ctx.quadraticCurveTo(
      this.x - headSize - 10,
      this.y + this.height * 0.5,
      this.x - headSize,
      this.y + this.height * 0.7,
    );
    ctx.lineTo(this.x - headSize + 15, this.y + this.height * 0.6);
    ctx.lineTo(this.x - headSize + 15, this.y + this.height * 0.4);
    ctx.closePath();
    ctx.fillStyle = baseColor;
    ctx.fill();

    // Draw horns
    ctx.beginPath();
    ctx.moveTo(this.x - headSize + 5, this.y + this.height * 0.3);
    ctx.lineTo(this.x - headSize - 10, this.y + this.height * 0.2);
    ctx.lineTo(this.x - headSize + 10, this.y + this.height * 0.35);
    ctx.fillStyle = darkerColor;
    ctx.fill();

    // Draw eye with glow effect
    const eyeX = this.x - headSize + 10;
    const eyeY = this.y + this.height * 0.45;
    const eyeSize = 5 + this.level * 0.5;

    // Draw eye glow
    const glowGradient = ctx.createRadialGradient(
      eyeX,
      eyeY,
      0,
      eyeX,
      eyeY,
      eyeSize * 2,
    );
    glowGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(
      eyeX - eyeSize * 2,
      eyeY - eyeSize * 2,
      eyeSize * 4,
      eyeSize * 4,
    );

    // Draw eye
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(255, ${Math.max(255 - this.level * 30, 0)}, 0)`;
    ctx.fill();

    // Draw eye shine
    ctx.beginPath();
    ctx.arc(eyeX - 1, eyeY - 1, eyeSize * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    // Draw fireballs with enhanced effects
    this.fires.forEach((fire) => {
      const fireX = fire.x; // Changed from fire.x - 15
      const fireY = fire.y;

      // Draw larger fire glow
      const glowGradient = ctx.createRadialGradient(
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
      ctx.fillStyle = glowGradient;
      ctx.fillRect(
        fireX - this.fireSize * 3,
        fireY - this.fireSize * 3,
        this.fireSize * 6,
        this.fireSize * 6,
      );

      // Draw main fireball
      ctx.beginPath();
      ctx.arc(fireX, fireY, this.fireSize, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        fireX - this.fireSize * 0.3,
        fireY - this.fireSize * 0.3,
        0, // Offset center for 3D effect
        fireX,
        fireY,
        this.fireSize,
      );
      gradient.addColorStop(0, '#fff'); // White hot center
      gradient.addColorStop(0.2, '#ffff00'); // Yellow
      gradient.addColorStop(0.4, '#ffaa00'); // Orange
      gradient.addColorStop(0.8, '#ff4400'); // Red-orange
      gradient.addColorStop(1, '#ff0000'); // Red edge
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw flame trail
      ctx.beginPath();
      ctx.moveTo(fireX + this.fireSize, fireY); // Start from right side of fireball

      // Create more dynamic flame trail
      const trailLength = 4 + Math.floor(this.level / 2);
      const points = [];

      // Generate control points for the flame
      for (let i = 0; i < trailLength; i++) {
        const offset = i * (this.fireSize * 1.5);
        const wave =
          Math.sin(fire.x / 10 + i + performance.now() / 100) *
          (3 + this.level);
        points.push({
          x: fireX + offset,
          y: fireY + wave,
        });
      }

      // Draw the flame using quadratic curves
      ctx.beginPath();
      ctx.moveTo(fireX, fireY - this.fireSize * 0.7); // Top of fireball

      // Upper part of flame
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2 - this.fireSize * 0.7;
        ctx.quadraticCurveTo(
          points[i].x,
          points[i].y - this.fireSize * 0.7,
          xc,
          yc,
        );
      }

      // Connect to bottom curve
      ctx.lineTo(points[points.length - 1].x + this.fireSize, fireY);

      // Lower part of flame
      for (let i = points.length - 1; i > 0; i--) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2 + this.fireSize * 0.7;
        ctx.quadraticCurveTo(
          points[i].x,
          points[i].y + this.fireSize * 0.7,
          xc,
          yc,
        );
      }

      ctx.lineTo(fireX, fireY + this.fireSize * 0.7); // Back to fireball

      // Create gradient for flame trail
      const trailGradient = ctx.createLinearGradient(
        fireX,
        fireY,
        fireX + this.fireSize * trailLength * 1.5,
        fireY,
      );
      trailGradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)'); // Yellow at base
      trailGradient.addColorStop(0.3, 'rgba(255, 120, 0, 0.8)'); // Orange
      trailGradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.5)'); // Red
      trailGradient.addColorStop(1, 'rgba(255, 0, 0, 0)'); // Transparent red at tip

      ctx.fillStyle = trailGradient;
      ctx.fill();

      // Add some spark particles
      const numSparks = 3 + Math.floor(this.level / 2);
      for (let i = 0; i < numSparks; i++) {
        const sparkLife = ((fire.x + i * 50) % 100) / 100; // 0 to 1 based on position
        const sparkOffset = Math.sin(fire.x / 10 + i) * this.fireSize;
        const sparkX = fireX + this.fireSize * 2 * sparkLife;
        const sparkY = fireY + sparkOffset * sparkLife;
        const sparkSize = (1 - sparkLife) * this.fireSize * 0.3;

        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${200 + sparkLife * 55}, 0, ${
          1 - sparkLife
        })`;
        ctx.fill();
      }
    });
  }

  update() {
    this.move();
    this.updateBehavior();

    // Update movement based on current behavior
    switch (this.currentBehavior) {
      case 'track':
        this.trackSpinner();
        break;
      case 'evade':
        this.evadeSpikes();
        break;
      case 'random':
        this.moveRandomly();
        break;
    }

    // Fire shooting logic
    this.fireTimer++;
    if (this.fireTimer > this.fireRate) {
      this.shoot();
      this.fireTimer = 0;
    }

    // Update fires
    this.fires = this.fires.filter((fire) => {
      fire.x -= FIRE_SPEED;
      return fire.x > 0;
    });
  }

  updateBehavior() {
    this.behaviorTimer++;
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
        this.randomTarget = Math.random() * (canvas.height - this.height);
      }
      this.behaviorDuration = 60 + Math.random() * 120; // Random duration between 1-3 seconds
    }
  }

  trackSpinner() {
    this.targetY = spinner.y + spinner.height / 2 - this.height / 2;
    const distanceToTarget = this.targetY - this.y;
    const speedMultiplier = 1 + (this.level - 1) * 0.1;
    this.velocity =
      Math.sign(distanceToTarget) *
      Math.min(
        Math.abs(distanceToTarget) * 0.1 * speedMultiplier,
        PLAYER_SPEED * speedMultiplier,
      );
  }

  evadeSpikes() {
    // Look for nearby spikes and try to dodge them
    const nearbySpikes = spinner.spikes.filter(
      (spike) =>
        spike.x < this.x + this.width + 200 && // Only care about spikes within range
        spike.x > this.x - 50,
    );

    if (nearbySpikes.length > 0) {
      // Move away from the average spike position
      const avgSpikeY =
        nearbySpikes.reduce((sum, spike) => sum + spike.y, 0) /
        nearbySpikes.length;
      const moveUp = avgSpikeY > this.y + this.height / 2;
      this.velocity =
        (moveUp ? -1 : 1) * PLAYER_SPEED * (1 + (this.level - 1) * 0.1);
    } else {
      this.velocity *= 0.9; // Slow down if no spikes nearby
    }
  }

  moveRandomly() {
    const distanceToTarget = this.randomTarget - this.y;
    this.velocity = Math.sign(distanceToTarget) * PLAYER_SPEED * 0.75;

    // If close to target, pick a new random target
    if (Math.abs(distanceToTarget) < 10) {
      this.randomTarget = Math.random() * (canvas.height - this.height);
    }
  }

  shoot() {
    const targetY = spinner.y + spinner.height / 2;
    this.fires.push({
      x: this.x,
      y: this.y + this.height / 2,
      targetY: targetY,
    });
  }

  takeDamage(amount) {
    super.takeDamage(amount);
  }
}

class Explosion {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.lifetime = 1; // Goes from 1 to 0
    this.particles = [];

    // Create explosion particles
    const numParticles = 12;
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size * (0.3 + Math.random() * 0.3),
      });
    }
  }

  update() {
    this.lifetime -= 0.05;
    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.size *= 0.95;
    });
  }

  draw(ctx) {
    this.particles.forEach((particle) => {
      const gradient = ctx.createRadialGradient(
        this.x + particle.x,
        this.y + particle.y,
        0,
        this.x + particle.x,
        this.y + particle.y,
        particle.size,
      );
      gradient.addColorStop(0, `rgba(255, 200, 0, ${this.lifetime})`);
      gradient.addColorStop(0.5, `rgba(255, 100, 0, ${this.lifetime})`);
      gradient.addColorStop(1, `rgba(255, 0, 0, ${this.lifetime * 0.5})`);

      ctx.beginPath();
      ctx.arc(
        this.x + particle.x,
        this.y + particle.y,
        particle.size,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = gradient;
      ctx.fill();
    });
  }

  isFinished() {
    return this.lifetime <= 0;
  }
}

class DragonHitEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lifetime = 1;
    this.particles = [];

    // Create metal spark particles
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI - Math.PI / 2; // Spread in left hemisphere
      const speed = 3 + Math.random() * 4;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#fff' : '#888', // Mix of white and gray particles
      });
    }
  }

  update() {
    this.lifetime -= 0.05;
    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // Add gravity effect
      particle.size *= 0.95;
    });
  }

  draw(ctx) {
    this.particles.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(
        this.x + particle.x,
        this.y + particle.y,
        particle.size,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `${particle.color}${Math.floor(this.lifetime * 255)
        .toString(16)
        .padStart(2, '0')}`;
      ctx.fill();
    });
  }

  isFinished() {
    return this.lifetime <= 0;
  }
}

// Game initialization and control
function startGame() {
  if (window.gameStarted) return;
  window.gameStarted = true;
  window.gameOver = false;
  window.spinner = new Spinner();
  dragons = [new Dragon(1)];
  currentLevel = 1;
  transitioning = false;
  transitionTimer = 0;
  explosions = [];
  dragonHitEffects = [];
  screenShake = 0;
  titleMusic.pause();
  titleMusic.currentTime = 0;
  backgroundMusic.play().catch((e) => console.log('Audio play failed:', e));
}

function endGame() {
  window.gameOver = true;
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function resetGame() {
  window.gameStarted = false;
  window.gameOver = false;
  window.spinner = null;
  dragons = [new Dragon(1)];
  currentLevel = 1;
  transitioning = false;
  transitionTimer = 0;
  explosions = [];
  dragonHitEffects = [];
  screenShake = 0;
}

// Expose game functions to window
window.startGame = startGame;
window.resetGame = resetGame;

// Helper function to draw text with shadow
function drawTextWithShadow(
  text,
  x,
  y,
  fontSize,
  color = '#fff',
  align = 'center',
) {
  ctx.font = fontSize + 'px Arial';
  ctx.textAlign = align;

  // Draw shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText(text, x + 2, y + 2);

  // Draw text
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// Helper function to draw text with background box
function drawTextWithBox(text, x, y, fontSize, padding = 10) {
  ctx.font = fontSize + 'px Arial';
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  // Draw semi-transparent background box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(
    x - textWidth / 2 - padding,
    y - textHeight - padding / 2,
    textWidth + padding * 2,
    textHeight + padding,
  );

  // Draw text
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

// Draw title screen
function drawTitleScreen() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#4f46e5');
  gradient.addColorStop(1, '#0ea5e9');

  ctx.fillStyle = gradient;
  ctx.font = 'bold 64px Poppins, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add multiple shadows for a stronger effect
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  // Draw main title
  ctx.fillText('Top vs Dragon', canvas.width / 2, canvas.height / 2 - 40);

  // Reset shadow for subtitle
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw subtitle
  ctx.font = '24px Poppins, Arial, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(
    'Click anywhere to start',
    canvas.width / 2,
    canvas.height / 2 + 40,
  );

  // Reset shadow effects
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// Update input handling
document.addEventListener('keydown', (e) => {
  if (!window.gameStarted) {
    if (e.key === ' ') {
      if (window.gameOver) {
        resetGame();
      }
      startGame();
      return;
    }
  } else {
    switch (e.key) {
      case 'ArrowUp':
        spinner.velocity = -PLAYER_SPEED;
        break;
      case 'ArrowDown':
        spinner.velocity = PLAYER_SPEED;
        break;
      case ' ':
        if (!window.gameOver) spinner.shoot();
        break;
      case 'r':
      case 'R':
        if (!window.gameOver) spinner.reload();
        break;
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    spinner.velocity = 0;
  }
});

// Collision detection
function checkCollisions() {
  // Check spinner's spikes hitting dragons
  spinner.spikes.forEach((spike, spikeIndex) => {
    dragons.forEach((dragon, dragonIndex) => {
      if (
        spike.x + 15 > dragon.x &&
        spike.x < dragon.x + dragon.width &&
        spike.y > dragon.y &&
        spike.y < dragon.y + dragon.height
      ) {
        dragon.takeDamage(10);
        spinner.spikes.splice(spikeIndex, 1);
        // Create metal spark effect at impact point
        dragonHitEffects.push(new DragonHitEffect(spike.x, spike.y));
        if (dragon.health <= 0) {
          dragons.splice(dragonIndex, 1);
        }
      }
    });
  });

  // Check all dragons' fires hitting spinner
  dragons.forEach((dragon) => {
    dragon.fires.forEach((fire, fireIndex) => {
      if (
        fire.x < spinner.x + spinner.width &&
        fire.x > spinner.x &&
        fire.y > spinner.y &&
        fire.y < spinner.y + spinner.height
      ) {
        spinner.takeDamage(10);
        dragon.fires.splice(fireIndex, 1);
        // Create explosion and screen shake
        explosions.push(new Explosion(fire.x, fire.y, dragon.fireSize * 2));
        screenShake = 20; // Set initial screen shake intensity
      }
    });
  });
}

// Game loop
function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply screen shake if active
  if (screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    screenShake *= 0.9; // Reduce shake intensity
    if (screenShake < 0.5) screenShake = 0;
  }

  if (!window.gameStarted) {
    drawTitleScreen();
    // Start playing title music if it's not already playing
    if (titleMusic.paused) {
      titleMusic.play().catch((e) => console.log('Audio play failed:', e));
    }
  } else if (!window.gameOver && !transitioning) {
    // Draw battle background
    if (battleBackground.complete) {
      ctx.drawImage(battleBackground, 0, 0, canvas.width, canvas.height);
    } else {
      // Fallback background color if image hasn't loaded
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Update
    spinner.update();
    dragons.forEach((dragon) => dragon.update());

    // Update and draw explosions
    explosions = explosions.filter((explosion) => {
      explosion.update();
      return !explosion.isFinished();
    });

    // Update and draw dragon hit effects
    dragonHitEffects = dragonHitEffects.filter((effect) => {
      effect.update();
      return !effect.isFinished();
    });

    checkCollisions();

    // Check win condition for current level
    if (dragons.length === 0) {
      transitioning = true;
      transitionTimer = TRANSITION_TIME;
    } else if (spinner.health <= 0) {
      endGame();
    }

    // Draw game elements
    spinner.draw();
    dragons.forEach((dragon) => dragon.draw());
    explosions.forEach((explosion) => explosion.draw(ctx));
    dragonHitEffects.forEach((effect) => effect.draw(ctx));

    // Draw level indicator with box
    drawTextWithBox(
      `Level ${currentLevel} - Dragons: ${dragons.length}`,
      120,
      30,
      24,
    );
  } else if (transitioning) {
    // Draw battle background during transition too
    if (battleBackground.complete) {
      ctx.drawImage(battleBackground, 0, 0, canvas.width, canvas.height);
    }

    transitionTimer--;
    if (transitionTimer <= 0) {
      currentLevel++;
      const numDragons = Math.min(
        1 + Math.floor((currentLevel - 1) / DRAGONS_PER_LEVEL),
        MAX_DRAGONS,
      );
      dragons = Array(numDragons)
        .fill(0)
        .map((_, i) => new Dragon(currentLevel, i));
      transitioning = false;
      spinner.health = Math.min(spinner.health + 30, MAX_HEALTH);
      spinner.ammo = MAX_AMMO;
      spinner.isReloading = false;
    }

    // Draw transition screen
    spinner.draw();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTextWithShadow(
      `Level ${currentLevel} Complete!`,
      canvas.width / 2,
      canvas.height / 2 - 30,
      48,
    );

    drawTextWithShadow(
      `Preparing Level ${currentLevel + 1}...`,
      canvas.width / 2,
      canvas.height / 2 + 30,
      32,
    );
  }

  if (window.gameOver) {
    // Draw the last frame of battle background under the game over overlay
    if (battleBackground.complete) {
      ctx.drawImage(battleBackground, 0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTextWithShadow(
      `Game Over - Reached Level ${currentLevel}`,
      canvas.width / 2,
      canvas.height / 2,
      48,
    );

    drawTextWithShadow(
      'Press SPACE to Play Again',
      canvas.width / 2,
      canvas.height / 2 + 50,
      24,
    );

    // Switch back to title music if game is over and not started
    if (!window.gameStarted && titleMusic.paused) {
      titleMusic.play().catch((e) => console.log('Audio play failed:', e));
    }
  }

  // Reset screen shake transform if it was applied
  if (screenShake > 0) {
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
