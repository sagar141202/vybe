import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlayTrack } from '../../hooks/usePlayTrack';
import { searchTracks } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from '../../components/TrackListItem';

const { width, height } = Dimensions.get('window');

const ARTIST_COLORS = [
  ['#C4B5FD', '#A78BFA', '#818CF8'],
  ['#7DD3FC', '#93C5FD', '#60A5FA'],
  ['#86EFAC', '#6EE7B7', '#34D399'],
  ['#FDE68A', '#FCA5A5', '#F87171'],
  ['#FBCFE8', '#F9A8D4', '#F472B6'],
  ['#D8B4FE', '#C084FC', '#A855F7'],
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export default function ArtistScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { playTrack } = usePlayTrack();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    searchTracks(name, 20)
      .then((results) => setTracks(results || []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, [name]);

  const colorIndex = hashString(name) % ARTIST_COLORS.length;
  const colors = ARTIST_COLORS[colorIndex] as [string, string, string];
  const topTracks = tracks.slice(0, 5);

  const headerTranslate = scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, -80], extrapolate: 'clamp' });
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 200], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.2, 1], extrapolate: 'clamp' });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Parallax Hero */}
      <Animated.View style={[styles.hero, { transform: [{ translateY: headerTranslate }, { scale: headerScale }] }]}>
        <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.deco1} /><View style={styles.deco2} /><View style={styles.deco3} />
        <Animated.View style={[styles.heroContent, { opacity: headerOpacity }]}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.artistName}>{name}</Text>
          <Text style={styles.artistMeta}>{tracks.length > 0 ? `${tracks.length} songs found` : 'Artist'}</Text>
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
        <View style={{ height: 280 }} />
        <View style={styles.card}>
          {/* Play row */}
          {tracks.length > 0 && (
            <View style={styles.playRow}>
              <TouchableOpacity style={styles.playAllBtn} onPress={() => playTrack(tracks[0], tracks)}>
                <LinearGradient colors={[colors[0], colors[1]]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Ionicons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shuffleBtn} onPress={() => {
                const s = [...tracks].sort(() => Math.random() - 0.5);
                playTrack(s[0], s);
              }}>
                <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="shuffle" size={18} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          )}

          {/* Top Tracks */}
          <Text style={styles.sectionTitle}>🎵 Top Tracks</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading tracks...</Text>
          ) : topTracks.length === 0 ? (
            <Text style={styles.emptyText}>No tracks found for "{name}"</Text>
          ) : topTracks.map((track, i) => (
            <TouchableOpacity key={track.video_id} style={styles.trackRow} onPress={() => playTrack(track, tracks)}>
              <LinearGradient colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']} style={StyleSheet.absoluteFillObject} />
              <LinearGradient colors={[colors[0], colors[1]]} style={styles.trackNum}>
                <Text style={styles.trackNumText}>{i + 1}</Text>
              </LinearGradient>
              {track.thumbnail_url && <Image source={{ uri: track.thumbnail_url }} style={styles.trackThumb} resizeMode="cover" />}
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.trackAlbum} numberOfLines={1}>{track.album || 'Single'}</Text>
              </View>
              <Ionicons name="play-circle" size={30} color={colors[0]} />
            </TouchableOpacity>
          ))}

          {tracks.length > 5 && (
            <TouchableOpacity style={styles.moreBtn} onPress={() => playTrack(tracks[5], tracks.slice(5))}>
              <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.moreBtnText}>+{tracks.length - 5} more tracks</Text>
              <Ionicons name="chevron-forward" size={16} color="#A78BFA" />
            </TouchableOpacity>
          )}

          {/* Albums */}
          {tracks.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>💿 Albums & Singles</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumsScroll}>
                {[...new Map(tracks.filter(t => t.album).map(t => [t.album, t])).values()].slice(0, 8).map((track) => (
                  <TouchableOpacity key={track.video_id} style={styles.albumCard} onPress={() => {
                    const albumTracks = tracks.filter(t => t.album === track.album);
                    router.push({
                      pathname: '/album/[name]',
                      params: {
                        name: track.album || 'Album',
                        artist: name,
                        thumbnail: track.thumbnail_url || '',
                        tracks: JSON.stringify(albumTracks),
                      }
                    });
                  }}>
                    {track.thumbnail_url ? (
                      <Image source={{ uri: track.thumbnail_url }} style={styles.albumArt} resizeMode="cover" />
                    ) : (
                      <LinearGradient colors={[colors[0], colors[1]]} style={styles.albumArt}>
                        <Text style={{ fontSize: 28 }}>💿</Text>
                      </LinearGradient>
                    )}
                    <Text style={styles.albumName} numberOfLines={2}>{track.album}</Text>
                    <Text style={styles.albumYear}>Album</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Info card */}
          <View style={styles.infoCard}>
            <LinearGradient colors={[colors[0] + '30', colors[1] + '20']} style={StyleSheet.absoluteFillObject} />
            <Text style={[styles.infoTitle, { color: colors[1] }]}>About {name}</Text>
            <Text style={styles.infoText}>Streaming {tracks.length} tracks from {name} via YouTube Music.</Text>
          </View>
          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 360, overflow: 'hidden' },
  deco1: { position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.12)' },
  deco2: { position: 'absolute', left: -40, bottom: 20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
  deco3: { position: 'absolute', right: 60, bottom: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  avatarWrap: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 48, fontWeight: '900', color: '#FFFFFF' },
  artistName: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginBottom: 6 },
  artistMeta: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  backBtn: { position: 'absolute', top: 56, left: 24, zIndex: 10 },
  backBtnInner: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  card: { backgroundColor: '#FAFBFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, paddingTop: 24, paddingHorizontal: 24, minHeight: height - 240 },
  playRow: { flexDirection: 'row', gap: 12, marginBottom: 28, alignItems: 'center' },
  playAllBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, overflow: 'hidden', justifyContent: 'center' },
  playAllText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  shuffleBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 14 },
  loadingText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: 24 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', padding: 24 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, marginBottom: 8, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  trackNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trackNumText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  trackThumb: { width: 44, height: 44, borderRadius: 10 },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  trackAlbum: { fontSize: 12, color: '#6B7280' },
  moreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 18, overflow: 'hidden', marginTop: 4, borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)' },
  moreBtnText: { fontSize: 14, color: '#A78BFA', fontWeight: '600' },
  albumsScroll: { gap: 14, paddingBottom: 8 },
  albumCard: { width: 130 },
  albumArt: { width: 130, height: 130, borderRadius: 16, marginBottom: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  albumName: { fontSize: 13, fontWeight: '700', color: '#1E1B4B', lineHeight: 18 },
  albumYear: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  infoCard: { marginTop: 28, padding: 24, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)' },
  infoTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
});
