import { useCallback } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useUIStore } from '../stores/uiStore';
import { getStreamUrl } from '../lib/api';
import type { Track } from '../components/TrackListItem';

async function _playTrack(track: Track) {
  try {
    const streamData = await getStreamUrl(track.video_id);
    if (!streamData?.stream_url) throw new Error('No stream URL');

    usePlayerStore.getState().setCurrentTrack({ ...track, stream_url: streamData.stream_url });

    if ((global as any)._soundInstance) {
      try { await (global as any)._soundInstance.unloadAsync(); } catch (_) {}
      (global as any)._soundInstance = null;
    }

    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: streamData.stream_url },
      { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
      (status: any) => {
        if (status.isLoaded) {
          usePlayerStore.getState().setPosition(status.positionMillis ?? 0);
          usePlayerStore.getState().setDuration(status.durationMillis ?? 0);
          if (status.didJustFinish) {
            usePlayerStore.getState().nextTrack();
          }
        }
      }
    );

    (global as any)._soundInstance = sound;
    usePlayerStore.getState().setIsPlaying(true);

  } catch (e) {
    console.error('Failed to play track:', e);
    usePlayerStore.getState().setIsPlaying(false);
  }
}

// Exported for playerStore auto-play
export const playTrackAuto = _playTrack;

export function usePlayTrack() {
  const setCurrentTrack = usePlayerStore(s => s.setCurrentTrack);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const setQueue = usePlayerStore(s => s.setQueue);
  const setIsLoading = useUIStore(s => s.setIsLoading);
  const addToRecent = useLibraryStore(s => s.addToRecent);

  const playTrack = useCallback(async (track: Track, queue?: Track[]) => {
    try {
      setIsLoading(true);
      setCurrentTrack(track);
      setIsPlaying(false);
      if (queue) setQueue(queue, queue.findIndex(t => t.video_id === track.video_id));
      await _playTrack(track);
      addToRecent(track);
    } catch (e) {
      console.error('playTrack error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    const { isPlaying, setIsPlaying } = usePlayerStore.getState();
    const sound = (global as any)._soundInstance;
    if (sound) {
      if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); }
      else { await sound.playAsync(); setIsPlaying(true); }
    } else {
      setIsPlaying(!isPlaying);
    }
  }, []);

  return { playTrack, togglePlayPause };
}

export async function seekToPosition(positionMs: number) {
  const sound = (global as any)._soundInstance;
  if (sound) {
    await sound.setPositionAsync(positionMs);
    usePlayerStore.getState().setPosition(positionMs);
  }
}
