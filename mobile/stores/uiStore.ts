import { create } from 'zustand';

interface UIState {
  accentColor: string;
  showMiniPlayer: boolean;
  activeTab: string;
  setAccentColor: (color: string) => void;
  setShowMiniPlayer: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  accentColor: '#1DB954',
  showMiniPlayer: false,
  activeTab: 'index',
  setAccentColor: (color) => set({ accentColor: color }),
  setShowMiniPlayer: (show) => set({ showMiniPlayer: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
