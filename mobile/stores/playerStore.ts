import { create } from 'zustand';
import { emitPlay } from '../services/playerEvents';

export interface Track {
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_ms: number | null;
  thumbnail_url: string | null;
  stream_url?: string;
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[]; // saved for shuffle restore
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
  radioMode: boolean;
  // Track sources for smart recommendations
  seedTrack: Track | null; // Track that started this queue/autoplay

  setCurrentTrack: (track: Track) => void;
  setQueue: (queue: Track[], index?: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleRadio: () => void;
  // New queue management actions
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setSeedTrack: (track: Track | null) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  originalQueue: [],
  currentIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  isShuffled: false,
  repeatMode: 'none',
  radioMode: true,
  seedTrack: null,

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setQueue: (queue, index = 0) => set({
    queue,
    originalQueue: queue,
    currentIndex: index,
  }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (pos) => set({ position: pos }),
  setDuration: (dur) => set({ duration: dur }),

  nextTrack: () => {
    const { queue, currentIndex, repeatMode, isShuffled, seedTrack, radioMode } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      const track = queue[currentIndex];
      emitPlay(track);
      return;
    }

    let nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else if (radioMode) {
        // Radio mode — fetch smart recommendations
        const currentTrack = queue[currentIndex];
        // Use seed track if available, otherwise use current track
        const seed = seedTrack || currentTrack;

        // Get recently played to exclude
        const recentIds = queue.slice(-10).map(t => t.video_id);

        set({ isPlaying: false });
        import('../services/radioService').then(({ fetchRadioTracks }) => {
          fetchRadioTracks(seed, {
            limit: 10,
            excludeIds: recentIds,
          }).then(newTracks => {
            if (newTracks.length > 0) {
              // Append new tracks to queue instead of replacing
              const newQueue = [...queue, ...newTracks];
              const newIndex = currentIndex + 1;
              set({
                queue: newQueue,
                currentIndex: newIndex,
                currentTrack: newTracks[0],
                position: 0
              });
              emitPlay(newTracks[0]);
            } else {
              set({ isPlaying: false });
            }
          });
        });
        return;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    set({ currentIndex: nextIndex, currentTrack: nextTrack, position: 0 });
    emitPlay(nextTrack);
  },

  previousTrack: () => {
    const { queue, currentIndex, position } = get();
    if (queue.length === 0) return;

    // If > 3s in, restart current track
    if (position > 3000) {
      const track = queue[currentIndex];
      emitPlay(track);
      return;
    }

    const prevIndex = Math.max(0, currentIndex - 1);
    const prevTrack = queue[prevIndex];
    set({ currentIndex: prevIndex, currentTrack: prevTrack, position: 0 });
    emitPlay(prevTrack);
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue, currentTrack, currentIndex } = get();

    if (!isShuffled) {
      // Shuffle ON — Fisher-Yates shuffle, keep current track first
      const rest = queue.filter((_, i) => i !== currentIndex);
      const shuffled = fisherYates(rest);
      const newQueue = currentTrack ? [currentTrack, ...shuffled] : shuffled;
      set({
        isShuffled: true,
        queue: newQueue,
        originalQueue: queue,
        currentIndex: 0,
      });
    } else {
      // Shuffle OFF — restore original order
      const current = currentTrack;
      const restoredIndex = current
        ? originalQueue.findIndex(t => t.video_id === current.video_id)
        : 0;
      set({
        isShuffled: false,
        queue: originalQueue,
        currentIndex: restoredIndex >= 0 ? restoredIndex : 0,
      });
    }
  },

  toggleRepeat: () => {
    const { repeatMode } = get();
    const modes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    set({ repeatMode: nextMode });
  },

  toggleRadio: () => {
    const { radioMode } = get();
    set({ radioMode: !radioMode });
    console.log('Radio mode:', !radioMode);
  },

  setSeedTrack: (track) => set({ seedTrack: track }),

  addToQueue: (track) => {
    const { queue, originalQueue, isShuffled } = get();
    // Prevent duplicates at the end of queue
    const lastTracks = queue.slice(-5);
    if (lastTracks.some(t => t.video_id === track.video_id)) {
      return;
    }
    const newQueue = [...queue, track];
    set({
      queue: newQueue,
      originalQueue: isShuffled ? originalQueue : newQueue,
    });
  },

  playNext: (track) => {
    const { queue, currentIndex, originalQueue, isShuffled } = get();
    // Check if track already exists in upcoming queue
    const upcomingIndices: number[] = [];
    for (let i = currentIndex + 1; i < queue.length; i++) {
      if (queue[i].video_id === track.video_id) {
        upcomingIndices.push(i);
      }
    }

    let newQueue = [...queue];
    // Remove existing instances from upcoming
    if (upcomingIndices.length > 0) {
      upcomingIndices.reverse().forEach(idx => {
        newQueue.splice(idx, 1);
      });
    }

    // Insert after current
    const insertIndex = currentIndex + 1;
    newQueue.splice(insertIndex, 0, track);

    set({
      queue: newQueue,
      originalQueue: isShuffled ? originalQueue : newQueue,
    });
  },

  removeFromQueue: (index) => {
    const { queue, currentIndex, originalQueue, isShuffled } = get();
    if (index < 0 || index >= queue.length) return;

    const newQueue = queue.filter((_, i) => i !== index);
    const newIndex = index < currentIndex ? currentIndex - 1 : currentIndex;

    set({
      queue: newQueue,
      originalQueue: isShuffled ? originalQueue.filter((_, i) => {
        // Find the original index
        const track = queue[index];
        return track ? i !== originalQueue.findIndex(t => t.video_id === track.video_id) : true;
      }) : newQueue,
      currentIndex: newIndex,
    });
  },

  moveQueueItem: (fromIndex, toIndex) => {
    const { queue, currentIndex } = get();
    if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;

    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);

    // Recalculate current index
    let newCurrentIndex = currentIndex;
    if (fromIndex === currentIndex) {
      newCurrentIndex = toIndex;
    } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
      newCurrentIndex = currentIndex + 1;
    }

    set({ queue: newQueue, currentIndex: newCurrentIndex });
  },

  clearQueue: () => {
    const { currentTrack } = get();
    if (currentTrack) {
      set({ queue: [currentTrack], currentIndex: 0, originalQueue: [currentTrack], isShuffled: false });
    } else {
      set({ queue: [], currentIndex: 0, originalQueue: [], isShuffled: false });
    }
  },
}));
