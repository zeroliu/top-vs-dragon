export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.isMuted = false;
  }

  loadSound(name, src, isMusic = false) {
    const audio = new Audio(src);
    audio.volume = isMusic ? this.musicVolume : this.sfxVolume;
    this.sounds.set(name, { audio, isMusic });
  }

  play(name, loop = false) {
    const sound = this.sounds.get(name);
    if (sound && !this.isMuted) {
      sound.audio.loop = loop;
      sound.audio.currentTime = 0;
      sound.audio.play();
    }
  }

  stop(name) {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.audio.pause();
      sound.audio.currentTime = 0;
    }
  }

  pause(name) {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.audio.pause();
    }
  }

  resume(name) {
    const sound = this.sounds.get(name);
    if (sound && !this.isMuted) {
      sound.audio.play();
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => {
      if (sound.isMusic) {
        sound.audio.volume = this.musicVolume;
      }
    });
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => {
      if (!sound.isMusic) {
        sound.audio.volume = this.sfxVolume;
      }
    });
  }

  mute() {
    this.isMuted = true;
    this.sounds.forEach((sound) => {
      sound.audio.volume = 0;
    });
  }

  unmute() {
    this.isMuted = false;
    this.sounds.forEach((sound) => {
      sound.audio.volume = sound.isMusic ? this.musicVolume : this.sfxVolume;
    });
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }
}
