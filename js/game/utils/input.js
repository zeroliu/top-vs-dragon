export class InputHandler {
  constructor() {
    this.keys = {};
    this.touches = {};
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (event) => {
      this.keys[event.key] = true;
    });

    window.addEventListener('keyup', (event) => {
      this.keys[event.key] = false;
    });

    // Touch events
    window.addEventListener('touchstart', (event) => {
      event.preventDefault();
      Array.from(event.touches).forEach((touch) => {
        this.touches[touch.identifier] = {
          x: touch.clientX,
          y: touch.clientY,
        };
      });
    });

    window.addEventListener('touchmove', (event) => {
      event.preventDefault();
      Array.from(event.touches).forEach((touch) => {
        this.touches[touch.identifier] = {
          x: touch.clientX,
          y: touch.clientY,
        };
      });
    });

    window.addEventListener('touchend', (event) => {
      event.preventDefault();
      Array.from(event.changedTouches).forEach((touch) => {
        delete this.touches[touch.identifier];
      });
    });
  }

  isKeyPressed(key) {
    return this.keys[key] || false;
  }

  getTouchPositions() {
    return Object.values(this.touches);
  }

  isTouchActive() {
    return Object.keys(this.touches).length > 0;
  }
}
