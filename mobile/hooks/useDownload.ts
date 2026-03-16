import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { useLibraryStore } from '../stores/libraryStore';
import type { Track } from '../components/TrackListItem';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.53.24.112:8000';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}soundfree/audio/`;

export interface DownloadState {
  progress: number; // 0-1
  status: 'idle' | 'downloading' | 'done' | 'error';
  localUri?: string;
}

// Global download state map
const downloadStates: Record<string, DownloadState> = {};
const listeners: Record<string, Set<(state: DownloadState) => void>> = {};

function notify(videoId: string, state: DownloadState) {
  downloadStates[videoId] = state;
  listeners[videoId]?.forEach(cb => cb(state));
}

export async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

export function getLocalPath(videoId: string): string {
  return `${DOWNLOAD_DIR}${videoId}.opus`;
}

export async function isDownloaded(videoId: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(getLocalPath(videoId));
  return info.exists && (info as any).size > 0;
}

export async function downloadTrack(track: Track): Promise<void> {
  const videoId = track.video_id;

  if (downloadStates[videoId]?.status === 'downloading') return;

  notify(videoId, { progress: 0, status: 'downloading' });

  try {
    await ensureDir();
    const localPath = getLocalPath(videoId);

    // Check if already downloaded
    const exists = await isDownloaded(videoId);
    if (exists) {
      notify(videoId, { progress: 1, status: 'done', localUri: localPath });
      return;
    }

    const downloadUrl = `${API_URL}/download/${videoId}`;

    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      localPath,
      {},
      (progress) => {
        const ratio = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        notify(videoId, { progress: ratio, status: 'downloading' });
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (result?.uri) {
      notify(videoId, { progress: 1, status: 'done', localUri: result.uri });
      console.log(`Downloaded: ${videoId} → ${result.uri}`);
    } else {
      throw new Error('Download failed — no URI returned');
    }

  } catch (e: any) {
    console.error('Download error:', e?.message);
    notify(videoId, { progress: 0, status: 'error' });
    // Clean up partial file
    try {
      await FileSystem.deleteAsync(getLocalPath(videoId), { idempotent: true });
    } catch (_) {}
  }
}

export async function deleteDownload(videoId: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(getLocalPath(videoId), { idempotent: true });
    notify(videoId, { progress: 0, status: 'idle' });
    console.log(`Deleted download: ${videoId}`);
  } catch (e) {
    console.error('Delete error:', e);
  }
}

export function useDownloadState(videoId: string): DownloadState & {
  download: (track: Track) => void;
  remove: () => void;
} {
  const [state, setState] = useState<DownloadState>(
    downloadStates[videoId] || { progress: 0, status: 'idle' }
  );

  // Subscribe to updates
  const subscribe = useCallback(() => {
    if (!listeners[videoId]) listeners[videoId] = new Set();
    const cb = (s: DownloadState) => setState({ ...s });
    listeners[videoId].add(cb);
    return () => listeners[videoId].delete(cb);
  }, [videoId]);

  useState(() => {
    // Check if already downloaded on mount
    isDownloaded(videoId).then(exists => {
      if (exists) {
        const path = getLocalPath(videoId);
        setState({ progress: 1, status: 'done', localUri: path });
        downloadStates[videoId] = { progress: 1, status: 'done', localUri: path };
      }
    });
    return subscribe();
  });

  const download = useCallback((track: Track) => {
    downloadTrack(track);
  }, []);

  const remove = useCallback(() => {
    deleteDownload(videoId);
    setState({ progress: 0, status: 'idle' });
  }, [videoId]);

  return { ...state, download, remove };
}
