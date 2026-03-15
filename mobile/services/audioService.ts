let Audio: any = null;

async function getAudio() {
  if (!Audio) {
    try {
      const av = await import('expo-av');
      Audio = av.Audio;
    } catch (e) {
      console.warn('expo-av not available');
      return null;
    }
  }
  return Audio;
}

let sound: any = null;

export async function setupAudio() {
  const AudioModule = await getAudio();
  if (!AudioModule) return;
  try {
    await AudioModule.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (e) {
    console.warn('Audio setup failed:', e);
  }
}

export async function playStream(url: string, onStatus?: (s: any) => void) {
  const AudioModule = await getAudio();
  if (!AudioModule) throw new Error('Audio not available');

  try {
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }

    const { sound: newSound } = await AudioModule.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, progressUpdateIntervalMillis: 1000 }
    );

    sound = newSound;
    if (onStatus) sound.setOnPlaybackStatusUpdate(onStatus);
    return sound;
  } catch (e) {
    console.error('Failed to play stream:', e);
    throw e;
  }
}

export async function pauseAudio() {
  if (sound) await sound.pauseAsync();
}

export async function resumeAudio() {
  if (sound) await sound.playAsync();
}

export async function stopAudio() {
  if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;
  }
}

export async function seekTo(positionMs: number) {
  if (sound) await sound.setPositionAsync(positionMs);
}

export function getCurrentSound() {
  return sound;
}
