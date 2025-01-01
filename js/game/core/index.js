import { Game } from './game.js';
import { Controls } from './controls.js';
import { Renderer } from './renderer.js';
import { AudioManager } from '../utils/audio.js';
import { StorageManager } from '../utils/storage.js';
import { ParticleSystem } from '../effects/Particles.js';

export function initGame(canvas) {
  const renderer = new Renderer(canvas);
  const game = new Game(canvas);
  const controls = new Controls(game);
  const audio = new AudioManager();
  const storage = new StorageManager();
  const particles = new ParticleSystem(canvas.getContext('2d'));

  // Load audio assets
  audio.loadSound('title', 'assets/audio/title.mp3', true);
  audio.loadSound('background', 'assets/audio/background.mp3', true);

  // Load high score from storage
  const highScore = storage.load('highScore', 0);
  game.highScore = highScore;

  // Start the game loop
  function gameLoop(timestamp) {
    // Clear the canvas
    renderer.clear();

    // Update game state
    game.update(timestamp);
    controls.update();
    particles.update();

    // Draw everything
    game.draw();
    particles.draw();

    // Request next frame
    requestAnimationFrame(gameLoop);
  }

  // Start the game
  game.start();
  requestAnimationFrame(gameLoop);

  return {
    game,
    controls,
    renderer,
    audio,
    storage,
    particles,
  };
}
