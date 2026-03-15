import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { useEffect } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import { useSettingsStore } from '../stores/settingsStore';

function StoreLoader() {
  const loadLibrary = useLibraryStore(s => s.loadFromStorage);
  const loadSettings = useSettingsStore(s => s.loadFromStorage);

  useEffect(() => {
    loadLibrary();
    loadSettings();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <StoreLoader />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
