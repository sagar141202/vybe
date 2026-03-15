import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  crossfadeDuration: number;
  sleepTimerMinutes: number | null;
  playbackSpeed: number;
  lastfmUsername: string;
  audioQuality: 'low' | 'medium' | 'high';
  setCrossfadeDuration: (d: number) => void;
  setSleepTimer: (m: number | null) => void;
  setPlaybackSpeed: (s: number) => void;
  setLastfmUsername: (u: string) => void;
  setAudioQuality: (q: 'low' | 'medium' | 'high') => void;
  loadFromStorage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  crossfadeDuration: 3,
  sleepTimerMinutes: null,
  playbackSpeed: 1.0,
  lastfmUsername: '',
  audioQuality: 'high',
  setCrossfadeDuration: (d) => set({ crossfadeDuration: d }),
  setSleepTimer: (m) => set({ sleepTimerMinutes: m }),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),
  setLastfmUsername: (u) => set({ lastfmUsername: u }),
  setAudioQuality: (q) => set({ audioQuality: q }),
  loadFromStorage: async () => {
    try {
      const speed = await AsyncStorage.getItem('settings_speed');
      const lastfm = await AsyncStorage.getItem('settings_lastfm');
      const quality = await AsyncStorage.getItem('settings_quality');
      set({
        playbackSpeed: speed ? Number(speed) : 1.0,
        lastfmUsername: lastfm ?? '',
        audioQuality: (quality as any) ?? 'high',
      });
    } catch (e) { console.warn('Settings load failed', e); }
  },
}));
