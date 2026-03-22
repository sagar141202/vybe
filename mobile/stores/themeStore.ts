import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme, Theme } from '../constants/theme';

interface ThemeState {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
  loadTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  theme: LightTheme,

  toggleTheme: () => {
    const newIsDark = !get().isDark;
    const newTheme = newIsDark ? DarkTheme : LightTheme;
    set({ isDark: newIsDark, theme: newTheme });
    AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  },

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme');
    if (saved === 'dark') {
      set({ isDark: true, theme: DarkTheme });
    }
  },
}));
