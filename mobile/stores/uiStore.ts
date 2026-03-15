import { create } from 'zustand';

interface UIState {
  accentColor: string;
  showMiniPlayer: boolean;
  activeTab: string;
  isLoading: boolean;
  setAccentColor: (color: string) => void;
  setShowMiniPlayer: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  accentColor: '#A78BFA',
  showMiniPlayer: false,
  activeTab: 'index',
  isLoading: false,
  setAccentColor: (color) => set({ accentColor: color }),
  setShowMiniPlayer: (show) => set({ showMiniPlayer: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
