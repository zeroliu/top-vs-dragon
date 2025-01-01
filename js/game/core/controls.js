import { PLAYER_SPEED } from './constants.js';

export class Controls {
  constructor(game) {
    this.game = game;
    this.isTouchDevice = 'ontouchstart' in window;
    this.touchControls = {
      up: { active: false },
      down: { active: false },
      shoot: { active: false },
      reload: { active: false },
    };
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.isTouchDevice) {
      this.setupTouchControls();
    } else {
      this.setupKeyboardControls();
    }
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      if (!this.game.spinner) return;

      switch (event.key) {
        case 'ArrowUp':
          this.game.spinner.velocity = -PLAYER_SPEED;
          break;
        case 'ArrowDown':
          this.game.spinner.velocity = PLAYER_SPEED;
          break;
        case ' ':
          this.game.spinner.shoot();
          break;
        case 'r':
          this.game.spinner.reload();
          break;
      }
    });

    document.addEventListener('keyup', (event) => {
      if (!this.game.spinner) return;

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          this.game.spinner.velocity = 0;
          break;
      }
    });
  }

  setupTouchControls() {
    const controls = document.createElement('div');
    controls.id = 'mobile-controls';
    controls.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      z-index: 2000;
      pointer-events: none;
    `;

    const movementControls = document.createElement('div');
    movementControls.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: auto;
    `;

    const actionControls = document.createElement('div');
    actionControls.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: auto;
    `;

    const buttonStyle = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.5);
      color: white;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      touch-action: none;
    `;

    const upButton = document.createElement('div');
    upButton.style.cssText = buttonStyle;
    upButton.textContent = '↑';

    const downButton = document.createElement('div');
    downButton.style.cssText = buttonStyle;
    downButton.textContent = '↓';

    const shootButton = document.createElement('div');
    shootButton.style.cssText = buttonStyle;
    shootButton.textContent = '⚡';

    const reloadButton = document.createElement('div');
    reloadButton.style.cssText = buttonStyle;
    reloadButton.textContent = '↻';

    this.setupTouchButton(upButton, 'up');
    this.setupTouchButton(downButton, 'down');
    this.setupTouchButton(shootButton, 'shoot');
    this.setupTouchButton(reloadButton, 'reload');

    movementControls.appendChild(upButton);
    movementControls.appendChild(downButton);
    actionControls.appendChild(shootButton);
    actionControls.appendChild(reloadButton);

    controls.appendChild(movementControls);
    controls.appendChild(actionControls);

    document.body.appendChild(controls);
  }

  setupTouchButton(button, action) {
    const handleStart = (event) => {
      event.preventDefault();
      if (!this.game.spinner) return;

      this.touchControls[action].active = true;
      switch (action) {
        case 'up':
          this.game.spinner.velocity = -PLAYER_SPEED;
          break;
        case 'down':
          this.game.spinner.velocity = PLAYER_SPEED;
          break;
        case 'shoot':
          this.game.spinner.shoot();
          break;
        case 'reload':
          this.game.spinner.reload();
          break;
      }
    };

    const handleEnd = (event) => {
      event.preventDefault();
      if (!this.game.spinner) return;

      this.touchControls[action].active = false;
      if (action === 'up' || action === 'down') {
        if (!this.touchControls.up.active && !this.touchControls.down.active) {
          this.game.spinner.velocity = 0;
        }
      }
    };

    button.addEventListener('touchstart', handleStart);
    button.addEventListener('touchend', handleEnd);
    button.addEventListener('touchcancel', handleEnd);
  }

  update() {
    if (!this.game.spinner) return;

    // Handle continuous shooting for touch controls
    if (this.touchControls.shoot.active) {
      this.game.spinner.shoot();
    }
  }
}
