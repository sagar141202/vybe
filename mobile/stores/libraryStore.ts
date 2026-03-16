import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { likeTrack, unlikeTrack } from '../lib/api';
import type { Track } from './playerStore';

interface LibraryState {
  likedTracks: Track[];
  recentlyPlayed: Track[];
  downloads: Track[];
  likeTrack: (track: Track) => Promise<void>;
  unlikeTrack: (videoId: string) => Promise<void>;
  isLiked: (videoId: string) => boolean;
  addToRecent: (track: Track) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedTracks: [],
  recentlyPlayed: [],
  downloads: [],

  likeTrack: async (track) => {
    // Optimistic update
    set((s) => ({
      likedTracks: [track, ...s.likedTracks.filter(t => t.video_id !== track.video_id)],
    }));
    await AsyncStorage.setItem('liked_tracks', JSON.stringify(get().likedTracks));
    try { await likeTrack(track.video_id); } catch (_) {}
  },

  unlikeTrack: async (videoId) => {
    // Optimistic update
    set((s) => ({ likedTracks: s.likedTracks.filter(t => t.video_id !== videoId) }));
    await AsyncStorage.setItem('liked_tracks', JSON.stringify(get().likedTracks));
    try { await unlikeTrack(videoId); } catch (_) {}
  },

  isLiked: (videoId) => get().likedTracks.some(t => t.video_id === videoId),

  addToRecent: async (track) => {
    set((s) => ({
      recentlyPlayed: [
        track,
        ...s.recentlyPlayed.filter(t => t.video_id !== track.video_id),
      ].slice(0, 50),
    }));
    await AsyncStorage.setItem('recently_played', JSON.stringify(get().recentlyPlayed));
  },

  loadFromStorage: async () => {
    try {
      const liked = await AsyncStorage.getItem('liked_tracks');
      const recent = await AsyncStorage.getItem('recently_played');
      set({
        likedTracks: liked ? JSON.parse(liked) : [],
        recentlyPlayed: recent ? JSON.parse(recent) : [],
      });
    } catch (e) {
      console.warn('Storage load failed', e);
    }
  },
}));
