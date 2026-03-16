import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlayTrack } from '../../hooks/usePlayTrack';
import { usePlayerStore } from '../../stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from '../../components/TrackListItem';

const { height } = Dimensions.get('window');

const ALBUM_COLORS = [
  ['#C4B5FD', '#A78BFA'],
  ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'],
  ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
  ['#D8B4FE', '#C084FC'],
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function formatDuration(ms: number | null): string {
  if (!ms) return '';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function totalDuration(tracks: Track[]): string {
  const total = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
  const min = Math.floor(total / 60000);
  return `${min} min`;
}

export default function AlbumScreen() {
  const params = useLocalSearchParams<{ name: string; artist: string; tracks: string; thumbnail: string }>();
  const albumName = params.name || 'Album';
  const artistName = params.artist || '';
  const thumbnail = params.thumbnail || '';
  const tracks: Track[] = params.tracks ? JSON.parse(params.tracks) : [];

  const { playTrack } = usePlayTrack();
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const scrollY = useRef(new Animated.Value(0)).current;

  const colorIndex = hashString(albumName) % ALBUM_COLORS.length;
  const colors = ALBUM_COLORS[colorIndex] as [string, string];

  const headerTranslate = scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, -80], extrapolate: 'clamp' });
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 200], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.2, 1], extrapolate: 'clamp' });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Parallax Hero */}
      <Animated.View style={[styles.hero, { transform: [{ translateY: headerTranslate }, { scale: headerScale }] }]}>
        <LinearGradient colors={[colors[0], colors[1]]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.deco1} /><View style={styles.deco2} />
        <Animated.View style={[styles.heroContent, { opacity: headerOpacity }]}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.albumArt} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.albumArt}>
              <Text style={{ fontSize: 48 }}>💿</Text>
            </LinearGradient>
          )}
          <Text style={styles.albumName} numberOfLines={2}>{albumName}</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/artist/[name]', params: { name: artistName } })}>
            <Text style={styles.artistName}>{artistName}</Text>
          </TouchableOpacity>
          <Text style={styles.albumMeta}>
            {tracks.length} tracks · {totalDuration(tracks)}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <View style={styles.backBtnInner}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <View style={{ height: 300 }} />
        <View style={styles.card}>
          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.playBtn} onPress={() => tracks.length > 0 && playTrack(tracks[0], tracks)}>
              <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.playBtnText}>Play Album</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shuffleBtn} onPress={() => {
              if (tracks.length === 0) return;
              const s = [...tracks].sort(() => Math.random() - 0.5);
              playTrack(s[0], s);
            }}>
              <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="shuffle" size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          {/* Track list */}
          <View style={styles.trackList}>
            {tracks.map((track, i) => {
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
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, isPlaying && { color: colors[0] }]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <Text style={styles.trackDuration}>{formatDuration(track.duration_ms)}</Text>
                  <Ionicons name="play-circle" size={28} color={isPlaying ? colors[0] : '#C4B5FD'} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Album footer */}
          <View style={styles.footer}>
            <LinearGradient colors={[colors[0] + '20', colors[1] + '10']} style={StyleSheet.absoluteFillObject} />
            <Text style={[styles.footerTitle, { color: colors[0] }]}>💿 {albumName}</Text>
            <Text style={styles.footerMeta}>
              {tracks.length} tracks · {totalDuration(tracks)} total
            </Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/artist/[name]', params: { name: artistName } })}>
              <Text style={[styles.footerArtist, { color: colors[0] }]}>by {artistName} →</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 160 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 380, overflow: 'hidden' },
  deco1: { position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)' },
  deco2: { position: 'absolute', left: -40, bottom: 10, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 70, gap: 8 },
  albumArt: { width: 140, height: 140, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  albumName: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, textAlign: 'center', paddingHorizontal: 24 },
  artistName: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textDecorationLine: 'underline' },
  albumMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  backBtn: { position: 'absolute', top: 56, left: 24, zIndex: 10 },
  backBtnInner: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  card: { backgroundColor: '#FAFBFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, paddingTop: 24, paddingHorizontal: 24, minHeight: height - 260 },
  controls: { flexDirection: 'row', gap: 12, marginBottom: 24, alignItems: 'center' },
  playBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, overflow: 'hidden', justifyContent: 'center' },
  playBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  shuffleBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  trackList: { gap: 4 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  trackRowActive: { borderColor: 'rgba(167,139,250,0.4)' },
  trackNum: { width: 24, fontSize: 14, color: '#9CA3AF', fontWeight: '700', textAlign: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trackArtist: { fontSize: 12, color: '#6B7280' },
  trackDuration: { fontSize: 12, color: '#9CA3AF', minWidth: 36, textAlign: 'right' },
  footer: { marginTop: 28, padding: 24, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)', gap: 6 },
  footerTitle: { fontSize: 17, fontWeight: '800' },
  footerMeta: { fontSize: 13, color: '#6B7280' },
  footerArtist: { fontSize: 14, fontWeight: '600' },
});
