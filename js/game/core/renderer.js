export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameWidth = 800; // Base game width
    this.gameHeight = 450; // Base game height (16:9 aspect ratio)
    this.scale = 1;
    this.resizeCanvas();
    this.setupResizeHandler();
  }

  resizeCanvas() {
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const dpr = window.devicePixelRatio || 1;

    // Calculate the maximum scale that fits the window
    const scaleX = windowWidth / this.gameWidth;
    const scaleY = windowHeight / this.gameHeight;
    this.scale = Math.min(scaleX, scaleY);

    // Set the canvas size in pixels
    this.canvas.width = this.gameWidth;
    this.canvas.height = this.gameHeight;

    // Set the display size (scaled)
    this.canvas.style.width = `${this.gameWidth * this.scale}px`;
    this.canvas.style.height = `${this.gameHeight * this.scale}px`;

    // Center the canvas
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '50%';
    this.canvas.style.top = '50%';
    this.canvas.style.transform = 'translate(-50%, -50%)';
  }

  setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      // Debounce resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.resizeCanvas();
      }, 250);
    });
  }

  clear() {
    this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
  }

  drawImage(image, x, y, width, height) {
    this.ctx.drawImage(image, x, y, width, height);
  }

  drawSprite(sprite, x, y, rotation = 0, scale = 1) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    this.ctx.scale(scale, scale);
    sprite.draw(this.ctx, -sprite.width / 2, -sprite.height / 2);
    this.ctx.restore();
  }

  drawRect(x, y, width, height, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  drawCircle(x, y, radius, color) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawText(text, x, y, options = {}) {
    const {
      font = '16px Arial',
      color = '#000',
      align = 'left',
      baseline = 'top',
    } = options;

    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x, y);
  }

  drawLine(x1, y1, x2, y2, color = '#000', width = 1) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.stroke();
  }

  drawPolygon(points, color, fill = true) {
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.closePath();

    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
    }
  }

  drawGradient(x, y, width, height, colors, vertical = false) {
    const gradient = vertical
      ? this.ctx.createLinearGradient(x, y, x, y + height)
      : this.ctx.createLinearGradient(x, y, x + width, y);

    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, height);
  }

  drawRadialGradient(x, y, radius, colors) {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);

    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  setAlpha(alpha) {
    this.ctx.globalAlpha = alpha;
  }

  setShadow(color, blur, offsetX = 0, offsetY = 0) {
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = blur;
    this.ctx.shadowOffsetX = offsetX;
    this.ctx.shadowOffsetY = offsetY;
  }

  clearShadow() {
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  save() {
    this.ctx.save();
  }

  restore() {
    this.ctx.restore();
  }

  translate(x, y) {
    this.ctx.translate(x, y);
  }

  rotate(angle) {
    this.ctx.rotate(angle);
  }

  scale(x, y) {
    this.ctx.scale(x, y);
  }
}
