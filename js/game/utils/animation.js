export class Animation {
  constructor(frames, duration) {
    this.frames = frames;
    this.frameDuration = duration / frames.length;
    this.currentFrame = 0;
    this.elapsed = 0;
    this.isPlaying = false;
    this.loop = false;
  }

  play(loop = false) {
    this.isPlaying = true;
    this.loop = loop;
    this.currentFrame = 0;
    this.elapsed = 0;
  }

  stop() {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.elapsed = 0;
  }

  pause() {
    this.isPlaying = false;
  }

  resume() {
    this.isPlaying = true;
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    this.elapsed += deltaTime;
    if (this.elapsed >= this.frameDuration) {
      this.currentFrame++;
      this.elapsed = 0;

      if (this.currentFrame >= this.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.stop();
        }
      }
    }
  }

  getCurrentFrame() {
    return this.frames[this.currentFrame];
  }
}

export class Sprite {
  constructor(image, frameWidth, frameHeight) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.animations = new Map();
    this.currentAnimation = null;
  }

  addAnimation(name, frames, duration) {
    this.animations.set(name, new Animation(frames, duration));
  }

  playAnimation(name, loop = false) {
    const animation = this.animations.get(name);
    if (animation) {
      this.currentAnimation = animation;
      animation.play(loop);
    }
  }

  update(deltaTime) {
    if (this.currentAnimation) {
      this.currentAnimation.update(deltaTime);
    }
  }

  draw(ctx, x, y, scale = 1) {
    if (!this.currentAnimation) return;

    const frame = this.currentAnimation.getCurrentFrame();
    const row = Math.floor(frame / (this.image.width / this.frameWidth));
    const col = frame % (this.image.width / this.frameWidth);

    ctx.drawImage(
      this.image,
      col * this.frameWidth,
      row * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      x,
      y,
      this.frameWidth * scale,
      this.frameHeight * scale,
    );
  }
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeIn(t) {
  return t * t;
}

export function easeOut(t) {
  return t * (2 - t);
}

export function bounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export function elastic(t) {
  return t === 0
    ? 0
    : t === 1
    ? 1
    : -Math.pow(2, 10 * t - 10) *
      Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
}
