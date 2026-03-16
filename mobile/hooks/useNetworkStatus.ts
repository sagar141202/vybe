import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

// Simple connectivity check — ping the backend
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.53.24.112:8000';

let isOnline = true;
const listeners = new Set<(online: boolean) => void>();

function notify(online: boolean) {
  if (online !== isOnline) {
    isOnline = online;
    listeners.forEach(cb => cb(online));
  }
}

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// Start background polling
let pollInterval: ReturnType<typeof setInterval> | null = null;

function startPolling() {
  if (pollInterval) return;
  checkConnectivity().then(notify);
  pollInterval = setInterval(async () => {
    const online = await checkConnectivity();
    notify(online);
  }, 15000);
}

startPolling();

export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    listeners.add(setOnline);

    // Check when app comes to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkConnectivity().then(notify);
    });

    return () => {
      listeners.delete(setOnline);
      sub.remove();
    };
  }, []);

  return { isOnline: online, isOffline: !online };
}
