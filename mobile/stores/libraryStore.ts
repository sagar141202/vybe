import { create } from 'zustand';
import type { Track } from './playerStore';

interface LibraryState {
  likedTracks: Track[];
  recentlyPlayed: Track[];
  downloads: Track[];
  playlists: { id: string; name: string; tracks: Track[] }[];
  likeTrack: (track: Track) => void;
  unlikeTrack: (videoId: string) => void;
  isLiked: (videoId: string) => boolean;
  addToRecent: (track: Track) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedTracks: [],
  recentlyPlayed: [],
  downloads: [],
  playlists: [],

  likeTrack: (track) => set((s) => ({
    likedTracks: [track, ...s.likedTracks.filter(t => t.video_id !== track.video_id)],
  })),

  unlikeTrack: (videoId) => set((s) => ({
    likedTracks: s.likedTracks.filter(t => t.video_id !== videoId),
  })),

  isLiked: (videoId) => get().likedTracks.some(t => t.video_id === videoId),

  addToRecent: (track) => set((s) => ({
    recentlyPlayed: [track, ...s.recentlyPlayed.filter(t => t.video_id !== track.video_id)].slice(0, 50),
  })),
}));
