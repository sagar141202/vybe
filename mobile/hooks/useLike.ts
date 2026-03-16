import { useCallback } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import type { Track } from '../components/TrackListItem';

export function useLike(track: Track | null) {
  const likedTracks = useLibraryStore(s => s.likedTracks);
  const likeTrackFn = useLibraryStore(s => s.likeTrack);
  const unlikeTrackFn = useLibraryStore(s => s.unlikeTrack);

  const liked = track ? likedTracks.some(t => t.video_id === track.video_id) : false;

  const toggleLike = useCallback(async () => {
    if (!track) return;
    if (liked) {
      await unlikeTrackFn(track.video_id);
    } else {
      await likeTrackFn(track);
    }
  }, [track, liked]);

  return { liked, toggleLike };
}
