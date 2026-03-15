import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  crossfadeDuration: number;
  sleepTimerMinutes: number | null;
  playbackSpeed: number;
  lastfmUsername: string;
  audioQuality: 'low' | 'medium' | 'high';
  setCrossfadeDuration: (duration: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  setPlaybackSpeed: (speed: number) => void;
  setLastfmUsername: (username: string) => void;
  setAudioQuality: (quality: 'low' | 'medium' | 'high') => void;
  loadFromStorage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  crossfadeDuration: 3,
  sleepTimerMinutes: null,
  playbackSpeed: 1.0,
  lastfmUsername: '',
  audioQuality: 'high',

  setCrossfadeDuration: async (duration) => {
    set({ crossfadeDuration: duration });
    await AsyncStorage.setItem('settings_crossfade', String(duration));
  },

  setSleepTimer: async (minutes) => {
    set({ sleepTimerMinutes: minutes });
    await AsyncStorage.setItem('settings_sleep', String(minutes ?? ''));
  },

  setPlaybackSpeed: async (speed) => {
    set({ playbackSpeed: speed });
    await AsyncStorage.setItem('settings_speed', String(speed));
  },

  setLastfmUsername: async (username) => {
    set({ lastfmUsername: username });
    await AsyncStorage.setItem('settings_lastfm', username);
  },

  setAudioQuality: async (quality) => {
    set({ audioQuality: quality });
    await AsyncStorage.setItem('settings_quality', quality);
  },

  loadFromStorage: async () => {
    try {
      const crossfade = await AsyncStorage.getItem('settings_crossfade');
      const speed = await AsyncStorage.getItem('settings_speed');
      const lastfm = await AsyncStorage.getItem('settings_lastfm');
      const quality = await AsyncStorage.getItem('settings_quality');
      set({
        crossfadeDuration: crossfade ? Number(crossfade) : 3,
        playbackSpeed: speed ? Number(speed) : 1.0,
        lastfmUsername: lastfm ?? '',
        audioQuality: (quality as 'low' | 'medium' | 'high') ?? 'high',
      });
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
  },
}));
