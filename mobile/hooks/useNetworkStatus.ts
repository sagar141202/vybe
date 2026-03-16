import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

let isOnline = true;
const listeners = new Set<(online: boolean) => void>();

function notify(online: boolean) {
  isOnline = online;
  listeners.forEach(cb => cb(online));
}

// Subscribe to real network changes
NetInfo.addEventListener(state => {
  notify(!!state.isConnected && !!state.isInternetReachable);
});

// Initial check
NetInfo.fetch().then(state => {
  notify(!!state.isConnected && !!state.isInternetReachable);
});

export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    listeners.add(setOnline);
    // Refresh on mount
    NetInfo.fetch().then(state => {
      const connected = !!state.isConnected && !!state.isInternetReachable;
      setOnline(connected);
    });
    return () => { listeners.delete(setOnline); };
  }, []);

  return { isOnline: online, isOffline: !online };
}
