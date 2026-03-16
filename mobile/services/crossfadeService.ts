import { Audio } from 'expo-av';
import { usePlayerStore } from '../stores/playerStore';

const CROSSFADE_MS = 2500;
const STEPS = 25;
const STEP_MS = CROSSFADE_MS / STEPS;

let _sound: Audio.Sound | null = null;
let _fadeTimer: ReturnType<typeof setInterval> | null = null;

export function getCurrentSound(): Audio.Sound | null {
  return _sound;
}

export function setCurrentSound(s: Audio.Sound | null) {
  _sound = s;
  (global as any)._soundInstance = s;
}

function clearTimer() {
  if (_fadeTimer) { clearInterval(_fadeTimer); _fadeTimer = null; }
}

// Fade current sound volume down then resolve
export function fadeOutCurrent(): Promise<void> {
  return new Promise((resolve) => {
    if (!_sound) { resolve(); return; }
    let step = 0;
    const sound = _sound;
    clearTimer();
    _fadeTimer = setInterval(async () => {
      step++;
      const vol = Math.max(0, 1 - step / STEPS);
      try { await sound.setVolumeAsync(vol); } catch (_) {}
      if (step >= STEPS) {
        clearTimer();
        try { await sound.stopAsync(); await sound.unloadAsync(); } catch (_) {}
        resolve();
      }
    }, STEP_MS);
  });
}

// Fade new sound volume up
export async function fadeInNew(sound: Audio.Sound): Promise<void> {
  await sound.setVolumeAsync(0);
  await sound.playAsync();
  let step = 0;
  return new Promise((resolve) => {
    const timer = setInterval(async () => {
      step++;
      const vol = Math.min(1, step / STEPS);
      try { await sound.setVolumeAsync(vol); } catch (_) {}
      if (step >= STEPS) {
        clearInterval(timer);
        resolve();
      }
    }, STEP_MS);
  });
}

export function stopAll() {
  clearTimer();
  if (_sound) {
    _sound.stopAsync().catch(() => {});
    _sound.unloadAsync().catch(() => {});
    _sound = null;
    (global as any)._soundInstance = null;
  }
}
