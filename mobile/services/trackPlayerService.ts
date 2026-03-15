import TrackPlayer from 'react-native-track-player';

export async function setupTrackPlayer() {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 10,
    });
    await TrackPlayer.updateOptions({
      capabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
        TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
        TrackPlayer.CAPABILITY_STOP,
        TrackPlayer.CAPABILITY_SEEK_TO,
      ],
      compactCapabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
      ],
    });
  } catch (e) {
    console.log('TrackPlayer already initialized');
  }
}

export async function playTrack(track: {
  id: string;
  url: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
}) {
  await TrackPlayer.reset();
  await TrackPlayer.add({
    id: track.id,
    url: track.url,
    title: track.title,
    artist: track.artist,
    artwork: track.artwork,
    duration: track.duration ? track.duration / 1000 : undefined,
  });
  await TrackPlayer.play();
}
