import {
  GAME_STATE,
  FIRE_DAMAGE,
  SPIKE_DAMAGE,
  PLAYER_SPEED,
  MAX_HEALTH,
  HEALTH_INCREASE_PER_LEVEL,
} from './constants.js';
import {
  titleMusic,
  backgroundMusic,
  bossMusic,
  titleBackground,
  battleBackground,
} from './assets.js';
import { Spinner } from '../entities/Spinner.js';
import { Dragon } from '../entities/Dragon.js';
import { FireMinion, MOVEMENT_STATE } from '../entities/FireMinion.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = GAME_STATE.TITLE;
    this.level = 1;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    this.spinner = null;
    this.dragons = [];
    this.minions = [];
    this.lastTime = performance.now();
    this.screenShake = {
      intensity: 0,
      duration: 0,
      maxDuration: 200,
      maxIntensity: 15,
    };
    this.blinkTime = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  handleKeyDown(event) {
    if (this.state === GAME_STATE.PLAYING && this.spinner) {
      switch (event.key) {
        case 'ArrowUp':
          this.spinner.velocity = -PLAYER_SPEED;
          break;
        case 'ArrowDown':
          this.spinner.velocity = PLAYER_SPEED;
          break;
        case ' ':
          this.spinner.shoot();
          break;
        case 'r':
          this.spinner.reload();
          break;
      }
    }
  }

  handleKeyUp(event) {
    if (this.state === GAME_STATE.PLAYING && this.spinner) {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          this.spinner.velocity = 0;
          break;
      }
    }
  }

  handleClick(event) {
    switch (this.state) {
      case GAME_STATE.TITLE:
        this.startGame();
        break;
      case GAME_STATE.GAME_OVER:
      case GAME_STATE.LEVEL_COMPLETE:
        this.resetGame();
        break;
    }
  }

  startGame() {
    this.state = GAME_STATE.PLAYING;
    this.spinner = new Spinner(this.ctx);
    this.dragons = [];
    this.minions = [];

    // First two levels have minions
    if (this.level <= 2) {
      const minionCount = this.level === 1 ? 2 : 3;
      const dragonHealth = MAX_HEALTH + (3 - 1) * HEALTH_INCREASE_PER_LEVEL; // Level 3 dragon's health
      for (let i = 0; i < minionCount; i++) {
        this.minions.push(
          new FireMinion(
            this.canvas.width - 100, // All minions start at the same x position
            dragonHealth,
            this.ctx,
            i, // Pass the index as vertical offset
          ),
        );
      }
    } else {
      // Level 3 has dragon
      this.dragons = [new Dragon(this.level, 0, this.ctx)];
    }

    titleMusic.pause();
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
  }

  resetGame() {
    this.level = 1;
    this.score = 0;
    this.state = GAME_STATE.TITLE;
    this.spinner = null;
    this.dragons = [];
    this.minions = [];
    backgroundMusic.pause();
    bossMusic.pause();
    titleMusic.currentTime = 0;
    titleMusic.play();
  }

  update(deltaTime) {
    // Cap deltaTime to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 50);

    // Update blink timer
    this.blinkTime += cappedDeltaTime;

    switch (this.state) {
      case GAME_STATE.PLAYING:
        this.updateGame(cappedDeltaTime);
        break;
    }
  }

  updateGame(deltaTime) {
    // Update screen shake
    if (this.screenShake.duration > 0) {
      this.screenShake.duration = Math.max(
        0,
        this.screenShake.duration - deltaTime,
      );
    }

    // Update spinner
    if (this.spinner) {
      this.spinner.update(deltaTime);

      // Check for collisions with dragon fires
      this.dragons.forEach((dragon) => {
        dragon.fires.forEach((fire) => {
          if (
            !fire.exploding &&
            this.checkCollision(
              fire.x - dragon.fireSize,
              fire.y - dragon.fireSize,
              dragon.fireSize * 2,
              dragon.fireSize * 2,
              this.spinner.x,
              this.spinner.y,
              this.spinner.width,
              this.spinner.height,
            )
          ) {
            this.spinner.takeDamage(FIRE_DAMAGE);
            fire.exploding = true;
            fire.explosionTime = 0;
            this.screenShake.duration = this.screenShake.maxDuration;
            this.screenShake.intensity = this.screenShake.maxIntensity;
            if (this.spinner.health <= 0) {
              this.gameOver();
            }
          }
        });
      });

      // Check for minion collisions with left edge
      this.minions = this.minions.filter((minion) => {
        if (minion.x <= 0) {
          // Instead of damaging spinner, reset minion to right side
          minion.x = this.canvas.width - 100;
          return true;
        }

        // Check collision with spinner
        if (
          minion.movementState !== MOVEMENT_STATE.EXPLODING &&
          this.checkCollision(
            minion.x,
            minion.y,
            minion.width,
            minion.height,
            this.spinner.x,
            this.spinner.y,
            this.spinner.width,
            this.spinner.height,
          )
        ) {
          // Set minion to exploding and damage spinner
          minion.movementState = MOVEMENT_STATE.EXPLODING;
          minion.explosionRadius = 0;
          console.log(
            'Minion hit spinner, current spinner health:',
            this.spinner.health,
            'maxHealth:',
            this.spinner.maxHealth,
          );
          const damage = 50; // Fixed value for testing (half of MAX_HEALTH)
          this.spinner.takeDamage(damage);
          console.log(
            'After damage, spinner health:',
            this.spinner.health,
            'damage dealt:',
            damage,
          );
          this.screenShake.duration = this.screenShake.maxDuration;
          this.screenShake.intensity = this.screenShake.maxIntensity;

          // Check if spinner died
          if (this.spinner.health <= 0) {
            console.log('Spinner health reached 0, calling gameOver()');
            this.gameOver();
            return false; // Remove the minion from the array
          }
        }

        // If minion is exploding, check if it's done
        if (minion.movementState === MOVEMENT_STATE.EXPLODING) {
          const keepMinion =
            minion.explosionRadius <= minion.maxExplosionRadius;

          // If this was the last minion and it's done exploding
          if (!keepMinion && this.minions.length === 1 && this.level <= 2) {
            console.log(
              'Last minion finished exploding, checking level completion',
            );
            if (this.spinner.health > 0) {
              this.levelComplete();
            } else {
              this.gameOver();
            }
          }

          return keepMinion;
        }

        return true;
      });

      // Update all remaining minions
      this.minions.forEach((minion) => minion.update(deltaTime));

      // Check for spike hits on dragons and minions
      this.spinner.spikes.forEach((spike, spikeIndex) => {
        // Check dragons
        this.dragons.forEach((dragon) => {
          if (
            this.checkCollision(
              spike.x,
              spike.y - 3,
              20,
              6,
              dragon.x,
              dragon.y,
              dragon.width,
              dragon.height,
            )
          ) {
            dragon.takeDamage(SPIKE_DAMAGE);
            this.spinner.spikes.splice(spikeIndex, 1);
            if (dragon.health <= 0) {
              this.score += dragon.level * 100;
              this.dragons = this.dragons.filter((d) => d !== dragon);
              if (this.dragons.length === 0) {
                this.levelComplete();
              }
            }
          }
        });

        // Check minions
        this.minions.forEach((minion) => {
          if (
            this.checkCollision(
              spike.x,
              spike.y - 3,
              20,
              6,
              minion.x,
              minion.y,
              minion.width,
              minion.height,
            )
          ) {
            minion.takeDamage(SPIKE_DAMAGE);
            this.spinner.spikes.splice(spikeIndex, 1);
            if (minion.health <= 0) {
              this.score += 50;
              this.minions = this.minions.filter((m) => m !== minion);

              // Check if this was the last minion
              if (this.minions.length === 0 && this.level <= 2) {
                if (this.spinner.health <= 0) {
                  this.gameOver();
                } else {
                  this.levelComplete();
                }
              }
            }
          }
        });
      });
    }

    // Update dragons
    this.dragons.forEach((dragon) => dragon.update(deltaTime, this.spinner));
  }

  checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  gameOver() {
    console.log('gameOver() called, changing state to GAME_OVER');
    this.state = GAME_STATE.GAME_OVER;
    // Reset screen shake when game is over
    this.screenShake.duration = 0;
    this.screenShake.intensity = 0;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore);
    }
    backgroundMusic.pause();
    bossMusic.pause();
  }

  levelComplete() {
    this.state = GAME_STATE.LEVEL_COMPLETE;
    setTimeout(() => {
      this.level++;
      const currentHealth = this.spinner.health; // Store current health
      this.spinner = new Spinner(this.ctx);
      this.spinner.health = currentHealth; // Restore health
      this.dragons = [];
      this.minions = [];

      // Start next level with appropriate enemies
      if (this.level <= 2) {
        const minionCount = this.level === 1 ? 2 : 3;
        const dragonHealth = MAX_HEALTH + (3 - 1) * HEALTH_INCREASE_PER_LEVEL;
        for (let i = 0; i < minionCount; i++) {
          this.minions.push(
            new FireMinion(this.canvas.width - 100, dragonHealth, this.ctx, i),
          );
        }
      } else {
        // Dragon level - switch to boss music
        backgroundMusic.pause();
        bossMusic.currentTime = 0;
        bossMusic.play();
        this.dragons = [new Dragon(this.level, 0, this.ctx)];
      }

      this.state = GAME_STATE.PLAYING;
    }, 2000);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply screen shake if active
    if (this.screenShake.duration > 0) {
      const progress = this.screenShake.duration / this.screenShake.maxDuration;
      const intensity = this.screenShake.intensity * progress;
      const shakeX = (Math.random() * 2 - 1) * intensity;
      const shakeY = (Math.random() * 2 - 1) * intensity;
      this.ctx.save();
      this.ctx.translate(shakeX, shakeY);
    }

    switch (this.state) {
      case GAME_STATE.TITLE:
        this.drawTitle();
        break;
      case GAME_STATE.PLAYING:
        this.drawGame();
        break;
      case GAME_STATE.GAME_OVER:
        this.drawGameOver();
        break;
      case GAME_STATE.LEVEL_COMPLETE:
        this.drawLevelComplete();
        break;
    }

    // Reset screen shake transform
    if (this.screenShake.duration > 0) {
      this.ctx.restore();
    }
  }

  drawTitle() {
    // Draw background
    this.ctx.drawImage(
      titleBackground,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );

    // Set up shadow effect for all text
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetX = 4;
    this.ctx.shadowOffsetY = 4;

    // Draw main title with gradient
    const gradient = this.ctx.createLinearGradient(
      0,
      this.canvas.height / 3 - 30,
      0,
      this.canvas.height / 3 + 30,
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e0e7ff');

    this.ctx.fillStyle = gradient;
    this.ctx.font = 'bold 64px Poppins, Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'Top vs Dragon',
      this.canvas.width / 2,
      this.canvas.height / 3,
    );

    // Adjust shadow for subtitle
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    // Draw instructions with blinking effect
    const blinkAlpha = Math.abs(Math.sin(this.blinkTime / 500)); // Create pulsing alpha value
    this.ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
    this.ctx.font = '28px Poppins, Arial, sans-serif';
    this.ctx.fillText(
      'Click to Start',
      this.canvas.width / 2,
      (this.canvas.height * 2) / 3,
    );

    // Draw high score
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Poppins, Arial, sans-serif';
    this.ctx.fillText(
      `High Score: ${this.highScore}`,
      this.canvas.width / 2,
      (this.canvas.height * 3) / 4,
    );

    // Reset shadow effects
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  drawGame() {
    // Draw background
    this.ctx.drawImage(
      battleBackground,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );

    // Draw game entities
    if (this.spinner) {
      this.spinner.draw();
    }

    this.dragons.forEach((dragon) => dragon.draw());
    this.minions.forEach((minion) => minion.draw());

    this.drawHUD();
  }

  drawHUD() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Level: ${this.level}`, 20, 30);
    this.ctx.fillText(`Score: ${this.score}`, 20, 60);
    if (this.spinner) {
      this.ctx.textAlign = 'right';
      this.ctx.fillText(
        `Ammo: ${this.spinner.ammo}`,
        this.canvas.width - 20,
        30,
      );
    }
  }

  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'Game Over',
      this.canvas.width / 2,
      this.canvas.height / 3,
    );

    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2,
    );
    this.ctx.fillText(
      `High Score: ${this.highScore}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 40,
    );
    this.ctx.fillText(
      'Click to Play Again',
      this.canvas.width / 2,
      (this.canvas.height * 2) / 3,
    );
  }

  drawLevelComplete() {
    // Draw background
    this.ctx.drawImage(
      battleBackground,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );

    // Draw level complete message
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Level ${this.level} Complete!`,
      this.canvas.width / 2,
      this.canvas.height / 2,
    );

    // Draw score
    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 50,
    );
  }

  gameLoop(currentTime) {
    if (this.lastTime) {
      const deltaTime = currentTime - this.lastTime;
      this.update(deltaTime);
    }
    this.lastTime = currentTime;
    this.draw();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  start() {
    titleMusic.play();
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }
}
