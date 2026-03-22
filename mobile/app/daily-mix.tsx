import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { usePlayTrack } from '../hooks/usePlayTrack';
import { usePlayerStore } from '../stores/playerStore';
import { getRecommendations } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import type { Track } from '../components/TrackListItem';

const { width, height } = Dimensions.get('window');

const MIX_COLORS: [string, string][] = [
  ['#C4B5FD', '#818CF8'],
  ['#7DD3FC', '#6366F1'],
  ['#86EFAC', '#34D399'],
  ['#FDE68A', '#F59E0B'],
];

function formatDuration(ms: number | null): string {
  if (!ms) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function DailyMixScreen() {
  const { playTrack } = usePlayTrack();
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const mixIndex = today.getDay() % MIX_COLORS.length;
  const colors = MIX_COLORS[mixIndex];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    getRecommendations(20)
      .then(data => setTracks(data || []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
  const totalMin = Math.floor(totalDuration / 60000);

  const playAll = () => {
    if (tracks.length > 0) playTrack(tracks[0], tracks);
  };

  const shufflePlay = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Hero */}
      <View style={styles.hero}>
        <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.deco1} /><View style={styles.deco2} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <View style={styles.backBtnInner}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.mixBadge}>
            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.mixBadgeText}>✦ DAILY MIX</Text>
          </View>
          <Text style={styles.heroTitle}>Your Daily Mix</Text>
          <Text style={styles.heroDate}>{dateStr}</Text>
          <Text style={styles.heroMeta}>
            {tracks.length} tracks · {totalMin > 0 ? `${totalMin} min` : 'Loading...'}
          </Text>

          {/* Art grid */}
          <View style={styles.artGrid}>
            {tracks.slice(0, 4).map((track, i) => (
              <View key={i} style={styles.artGridItem}>
                {track.thumbnail_url ? (
                  <Image source={{ uri: track.thumbnail_url }} style={styles.artGridImg} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.artGridImg}>
                    <Text style={{ fontSize: 16 }}>🎵</Text>
                  </LinearGradient>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.playBtn} onPress={playAll}>
            <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.playBtnText}>Play Mix</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shuffleBtn} onPress={shufflePlay}>
            <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="shuffle" size={20} color="#7C3AED" />
            <Text style={styles.shuffleBtnText}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        {/* AI badge */}
        <View style={styles.aiBadge}>
          <LinearGradient colors={['rgba(167,139,250,0.12)', 'rgba(125,211,252,0.06)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.aiEmoji}>🤖</Text>
          <Text style={styles.aiText}>Generated by SoundFree AI based on your listening habits</Text>
        </View>

        {/* Track list */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.trackList}>
          {loading ? (
            <Text style={styles.loadingText}>Building your mix...</Text>
          ) : tracks.length === 0 ? (
            <EmptyState
              emoji="🤖"
              title="Daily Mix not ready"
              subtitle="Play more music to generate your personalised Daily Mix"
              actionLabel="Start Listening"
              onAction={() => router.push('/(tabs)/search')}
            />
          ) : (
            tracks.map((track, i) => {
              const isPlaying = currentTrack?.video_id === track.video_id;
              return (
                <TouchableOpacity
                  key={track.video_id}
                  style={[styles.trackRow, isPlaying && styles.trackRowActive]}
                  onPress={() => playTrack(track, tracks)}
                >
                  {isPlaying && (
                    <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
                  )}
                  <Text style={[styles.trackNum, isPlaying && { color: colors[0] }]}>
                    {isPlaying ? '▶' : `${i + 1}`}
                  </Text>
                  {track.thumbnail_url ? (
                    <Image source={{ uri: track.thumbnail_url }} style={styles.trackThumb} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={colors} style={styles.trackThumb}>
                      <Text style={{ fontSize: 14 }}>🎵</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, isPlaying && { color: colors[0] }]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <View style={styles.trackMeta}>
                      <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                      {track.reason && (
                        <>
                          <Text style={styles.metaDot}>·</Text>
                          <Text style={styles.trackReason}>{track.reason}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.trackRight}>
                    {track.bpm && <Text style={styles.bpmBadge}>{Math.round(track.bpm)} BPM</Text>}
                    <Text style={styles.trackDuration}>{formatDuration(track.duration_ms)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 160 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  hero: { height: 340, overflow: 'hidden', position: 'relative' },
  deco1: { position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)' },
  deco2: { position: 'absolute', left: -40, bottom: 10, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' },
  backBtn: { position: 'absolute', top: 56, left: 24, zIndex: 10 },
  backBtnInner: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 6 },
  mixBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', marginBottom: 4 },
  mixBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  heroDate: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  heroMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  artGrid: { flexDirection: 'row', gap: 6, marginTop: 12 },
  artGridItem: { width: 54, height: 54, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  artGridImg: { width: 54, height: 54, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, backgroundColor: '#FAFBFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, paddingTop: 24 },
  controls: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 16 },
  playBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderRadius: 30, overflow: 'hidden', justifyContent: 'center' },
  playBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  shuffleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderRadius: 30, overflow: 'hidden', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  shuffleBtnText: { fontSize: 15, fontWeight: '600', color: '#7C3AED' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginBottom: 16, padding: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  aiEmoji: { fontSize: 16 },
  aiText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18 },
  trackList: { paddingHorizontal: 16 },
  loadingText: { textAlign: 'center', color: '#9CA3AF', padding: 40, fontSize: 14 },
  emptyWrap: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, marginBottom: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  trackRowActive: { borderColor: 'rgba(167,139,250,0.4)' },
  trackNum: { width: 22, fontSize: 13, color: '#9CA3AF', fontWeight: '700', textAlign: 'center' },
  trackThumb: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trackMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackArtist: { fontSize: 12, color: '#6B7280' },
  metaDot: { fontSize: 12, color: '#9CA3AF' },
  trackReason: { fontSize: 11, color: '#A78BFA', fontWeight: '600' },
  trackRight: { alignItems: 'flex-end', gap: 3 },
  bpmBadge: { fontSize: 10, color: '#A78BFA', fontWeight: '700', backgroundColor: 'rgba(167,139,250,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trackDuration: { fontSize: 12, color: '#9CA3AF' },
});
