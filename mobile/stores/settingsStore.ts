import { create } from 'zustand';

interface SettingsState {
  crossfadeDuration: number;
  sleepTimerMinutes: number | null;
  playbackSpeed: number;
  lastfmUsername: string;
  setCrossfadeDuration: (duration: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  setPlaybackSpeed: (speed: number) => void;
  setLastfmUsername: (username: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  crossfadeDuration: 3,
  sleepTimerMinutes: null,
  playbackSpeed: 1.0,
  lastfmUsername: '',
  setCrossfadeDuration: (duration) => set({ crossfadeDuration: duration }),
  setSleepTimer: (minutes) => set({ sleepTimerMinutes: minutes }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setLastfmUsername: (username) => set({ lastfmUsername: username }),
}));
