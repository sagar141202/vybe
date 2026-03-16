import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlaylistStore } from '../stores/playlistStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHealth } from '../hooks/useHealth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  if (!isOffline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>📵 Offline — playing from downloaded library</Text>
    </View>
  );
}

function AppInit() {
  const loadLibrary = useLibraryStore(s => s.loadFromStorage);
  const loadPlaylists = usePlaylistStore(s => s.loadFromStorage);
  const loadSettings = useSettingsStore(s => s.loadFromStorage);

  useEffect(() => {
    loadLibrary();
    loadSettings();

    // Setup audio session for background + media keys
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AppInit />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', bottom: 152, left: 16, right: 16,
    backgroundColor: '#1E1B4B', paddingVertical: 12,
    paddingHorizontal: 20, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    zIndex: 999, elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  bannerText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', flex: 1, textAlign: 'center' },
});
// Playlist store loaded in AppInit - handled by libraryStore
