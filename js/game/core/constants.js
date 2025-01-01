// Game constants
export const MAX_HEALTH = 100;
export const HEALTH_INCREASE_PER_LEVEL = 50;
export const PLAYER_SPEED = 100; // pixels per second
export const SPIKE_SPEED = 200; // pixels per second
export const FIRE_SPEED = 100; // pixels per second
export const SPIN_SPEED = 3; // radians per second
export const MAX_AMMO = 8;
export const RELOAD_TIME = 1000; // milliseconds
export const BASE_FIRE_RATE = 2000; // milliseconds
export const BASE_FIRE_SIZE = 10;
export const SPIKE_DAMAGE = 10;
export const FIRE_DAMAGE = 5;

// Game states
export const GAME_STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
  LEVEL_COMPLETE: 'level_complete',
};
