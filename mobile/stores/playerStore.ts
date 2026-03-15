import { create } from 'zustand';

export interface Track {
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_ms: number | null;
  thumbnail_url: string | null;
  stream_url?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (queue: Track[], index?: number) => void;
  addToQueue: (track: Track) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  queue: [],
  queueIndex: 0,
  isShuffled: false,
  repeatMode: 'none',

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setQueue: (queue, index = 0) => set({ queue, queueIndex: index, currentTrack: queue[index] }),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),

  nextTrack: () => {
    const { queue, queueIndex, repeatMode, isShuffled } = get();
    if (repeatMode === 'one') {
      // Restart current track
      const sound = (global as any)._soundInstance;
      if (sound) sound.setPositionAsync(0);
      set({ position: 0 });
      return;
    }

    let nextIndex: number;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
    }

    if (nextIndex < queue.length) {
      set({ queueIndex: nextIndex, currentTrack: queue[nextIndex], position: 0 });
      // Auto-play next track
      const { playTrackAuto } = require('../hooks/usePlayTrack');
      playTrackAuto?.(queue[nextIndex]);
    } else if (repeatMode === 'all' && queue.length > 0) {
      set({ queueIndex: 0, currentTrack: queue[0], position: 0 });
      const { playTrackAuto } = require('../hooks/usePlayTrack');
      playTrackAuto?.(queue[0]);
    } else {
      set({ isPlaying: false });
    }
  },

  previousTrack: () => {
    const { queue, queueIndex, position } = get();

    // If more than 3 seconds in — restart current track
    if (position > 3000) {
      const sound = (global as any)._soundInstance;
      if (sound) sound.setPositionAsync(0);
      set({ position: 0 });
      return;
    }

    // Otherwise go to previous
    const prev = queueIndex - 1;
    if (prev >= 0) {
      set({ queueIndex: prev, currentTrack: queue[prev], position: 0 });
      const { playTrackAuto } = require('../hooks/usePlayTrack');
      playTrackAuto?.(queue[prev]);
    }
  },

  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),
  toggleRepeat: () => set((s) => ({
    repeatMode: s.repeatMode === 'none' ? 'one' : s.repeatMode === 'one' ? 'all' : 'none',
  })),
}));
