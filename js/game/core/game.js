import {
  GAME_STATE,
  FIRE_DAMAGE,
  SPIKE_DAMAGE,
  PLAYER_SPEED,
} from './constants.js';
import {
  titleMusic,
  backgroundMusic,
  titleBackground,
  battleBackground,
} from './assets.js';
import { Spinner } from '../entities/Spinner.js';
import { Dragon } from '../entities/Dragon.js';

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
    this.lastTime = performance.now();
    this.screenShake = {
      intensity: 0,
      duration: 0,
      maxDuration: 200, // 200ms shake duration
      maxIntensity: 15, // maximum pixels to shake
    };
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
    this.dragons = [new Dragon(this.level, 0, this.ctx)];
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
    backgroundMusic.pause();
    titleMusic.currentTime = 0;
    titleMusic.play();
  }

  update(deltaTime) {
    // Cap deltaTime to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 50);

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
            // Trigger screen shake
            this.screenShake.duration = this.screenShake.maxDuration;
            this.screenShake.intensity = this.screenShake.maxIntensity;
            if (this.spinner.health <= 0) {
              this.gameOver();
            }
          }
        });
      });

      // Check for spike hits on dragons
      this.spinner.spikes.forEach((spike, spikeIndex) => {
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
      });
    }

    // Update dragons
    this.dragons.forEach((dragon) => dragon.update(deltaTime, this.spinner));
  }

  checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  gameOver() {
    this.state = GAME_STATE.GAME_OVER;
    // Reset screen shake when game is over
    this.screenShake.duration = 0;
    this.screenShake.intensity = 0;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore);
    }
    backgroundMusic.pause();
  }

  levelComplete() {
    this.state = GAME_STATE.LEVEL_COMPLETE;
    setTimeout(() => {
      this.level++;
      this.spinner = new Spinner(this.ctx);
      this.dragons = [
        new Dragon(this.level, 0, this.ctx),
        new Dragon(this.level, 1, this.ctx),
      ];
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

    // Draw title
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'Dragon Spinner',
      this.canvas.width / 2,
      this.canvas.height / 3,
    );

    // Draw instructions
    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      'Click to Start',
      this.canvas.width / 2,
      (this.canvas.height * 2) / 3,
    );
    this.ctx.font = '18px Arial';
    this.ctx.fillText(
      `High Score: ${this.highScore}`,
      this.canvas.width / 2,
      (this.canvas.height * 3) / 4,
    );
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

    // Draw game objects
    if (this.spinner) this.spinner.draw();
    this.dragons.forEach((dragon) => dragon.draw());

    // Draw HUD
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
