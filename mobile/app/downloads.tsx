import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getAllTracks, getTotalSize, LocalTrack } from '../services/localDb';
import { usePlayTrack } from '../hooks/usePlayTrack';
import { usePlayerStore } from '../stores/playerStore';
import { deleteDownload } from '../hooks/useDownload';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Ionicons } from '@expo/vector-icons';
import { TrackRowSkeleton } from '../components/Skeleton';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const THUMB_COLORS = [
  ['#C4B5FD','#A78BFA'],['#7DD3FC','#93C5FD'],
  ['#86EFAC','#6EE7B7'],['#FDE68A','#FCA5A5'],
  ['#FBCFE8','#F9A8D4'],
];

export default function DownloadsScreen() {
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayTrack();
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const { isOffline } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const loadTracks = async () => {
    const all = await getAllTracks();
    const size = await getTotalSize();
    setTracks(all);
    setTotalSize(size);
    setLoading(false);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    loadTracks();
  }, []);

  const handleDelete = async (videoId: string) => {
    await deleteDownload(videoId);
    loadTracks();
  };

  const handlePlay = (track: LocalTrack) => {
    const asTrack = {
      video_id: track.video_id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration_ms: track.duration_ms,
      thumbnail_url: track.thumbnail_url,
    };
    playTrack(asTrack, tracks.map(t => ({
      video_id: t.video_id, title: t.title, artist: t.artist,
      album: t.album, duration_ms: t.duration_ms, thumbnail_url: t.thumbnail_url,
    })));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#F0FDF4', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(134,239,172,0.3)', 'rgba(110,231,183,0.2)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#059669" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Downloads</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Offline badge */}
        {isOffline && (
          <View style={styles.offlineBadge}>
            <LinearGradient colors={['rgba(134,239,172,0.3)', 'rgba(110,231,183,0.2)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.offlineText}>Offline mode — playing from device</Text>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient colors={['#86EFAC', '#6EE7B7']} style={styles.heroArt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.heroEmoji}>⬇️</Text>
            </LinearGradient>
            <Text style={styles.heroTitle}>Downloads</Text>
            <Text style={styles.heroCount}>
              {tracks.length} tracks · {formatSize(totalSize)}
            </Text>
            {tracks.length > 0 && (
              <TouchableOpacity style={styles.playAllBtn} onPress={() => tracks.length > 0 && handlePlay(tracks[0])}>
                <LinearGradient colors={['#86EFAC', '#6EE7B7']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Ionicons name="play" size={18} color="#065F46" />
                <Text style={styles.playAllText}>Play All Offline</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Loading downloads...</Text>
          ) : tracks.length === 0 ? (
            <View style={styles.emptyCard}>
              <LinearGradient colors={['rgba(134,239,172,0.1)', 'rgba(110,231,183,0.05)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No downloads yet</Text>
              <Text style={styles.emptySub}>Tap ⬇️ on any track in the Full Player to save it offline</Text>
              <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/(tabs)/search')}>
                <LinearGradient colors={['#86EFAC', '#6EE7B7']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Text style={styles.searchBtnText}>Find Music</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.trackList}>
              {tracks.map((track, i) => {
                const isPlaying = currentTrack?.video_id === track.video_id;
                const colorIndex = track.video_id.charCodeAt(0) % THUMB_COLORS.length;
                return (
                  <TouchableOpacity
                    key={track.video_id}
                    style={[styles.trackRow, isPlaying && styles.trackRowActive]}
                    onPress={() => handlePlay(track)}
                  >
                    {isPlaying && (
                      <LinearGradient colors={['rgba(134,239,172,0.2)', 'rgba(110,231,183,0.1)']} style={StyleSheet.absoluteFillObject} />
                    )}
                    <View style={styles.thumbWrap}>
                      {track.thumbnail_url ? (
                        <Image source={{ uri: track.thumbnail_url }} style={styles.thumb} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={THUMB_COLORS[colorIndex] as [string,string]} style={styles.thumb}>
                          <Text style={{ fontSize: 18 }}>🎵</Text>
                        </LinearGradient>
                      )}
                      {isPlaying && (
                        <View style={styles.playingOverlay}>
                          <Text style={{ fontSize: 12, color: '#FFF' }}>▶</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.trackInfo}>
                      <Text style={[styles.trackTitle, isPlaying && { color: '#059669' }]} numberOfLines={1}>{track.title}</Text>
                      <Text style={styles.trackMeta} numberOfLines={1}>
                        {track.artist} · {formatSize(track.file_size || 0)}
                      </Text>
                    </View>
                    <Text style={styles.duration}>{formatDuration(track.duration_ms)}</Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(track.video_id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FCA5A5" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={{ height: 160 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(134,239,172,0.4)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginBottom: 8, padding: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(134,239,172,0.3)' },
  offlineText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  scroll: { paddingBottom: 20 },
  hero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  heroArt: { width: 120, height: 120, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#1E1B4B', marginBottom: 4 },
  heroCount: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  playAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(134,239,172,0.5)' },
  playAllText: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  loadingText: { textAlign: 'center', color: '#9CA3AF', padding: 40 },
  emptyCard: { marginHorizontal: 24, padding: 40, borderRadius: 28, overflow: 'hidden', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(134,239,172,0.2)' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  searchBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30, overflow: 'hidden' },
  searchBtnText: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  trackList: { paddingHorizontal: 16, gap: 6 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', overflow: 'hidden' },
  trackRowActive: { borderColor: 'rgba(134,239,172,0.4)' },
  thumbWrap: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(134,239,172,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trackMeta: { fontSize: 12, color: '#6B7280' },
  duration: { fontSize: 12, color: '#9CA3AF', minWidth: 36, textAlign: 'right' },
  deleteBtn: { padding: 4 },
});
