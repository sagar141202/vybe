import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayTrack } from '../hooks/usePlayTrack';

const { width, height } = Dimensions.get('window');

const THUMB_COLORS = [
  ['#C4B5FD', '#A78BFA'],
  ['#7DD3FC', '#93C5FD'],
  ['#86EFAC', '#6EE7B7'],
  ['#FDE68A', '#FCA5A5'],
  ['#FBCFE8', '#F9A8D4'],
];

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function FullPlayer() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const position = usePlayerStore(s => s.position);
  const duration = usePlayerStore(s => s.duration);
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const nextTrack = usePlayerStore(s => s.nextTrack);
  const previousTrack = usePlayerStore(s => s.previousTrack);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const toggleRepeat = usePlayerStore(s => s.toggleRepeat);
  const { togglePlayPause } = usePlayTrack();

  const artScale = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true,
      tension: 60, friction: 12,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1.0 : 0.92,
      useNativeDriver: true,
      tension: 60, friction: 10,
    }).start();
  }, [isPlaying]);

  const progress = duration > 0 ? position / duration : 0;
  const colorIndex = currentTrack ? currentTrack.video_id.charCodeAt(0) % THUMB_COLORS.length : 0;

  if (!currentTrack) {
    router.back();
    return null;
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <StatusBar style="dark" />

      {/* Background */}
      <LinearGradient
        colors={['#F0F4FF', '#FAFBFF', '#F8F0FF']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blurred blob background */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.1)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.backIcon}>↓</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.artWrap}>
        <Animated.View style={[styles.artContainer, { transform: [{ scale: artScale }] }]}>
          {/* Glow */}
          <LinearGradient
            colors={['rgba(167,139,250,0.4)', 'rgba(125,211,252,0.3)']}
            style={styles.artGlow}
          />
          {currentTrack.thumbnail_url ? (
            <Image
              source={{ uri: currentTrack.thumbnail_url }}
              style={styles.art}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={THUMB_COLORS[colorIndex] as [string, string]}
              style={styles.art}
            >
              <Text style={styles.artEmoji}>��</Text>
            </LinearGradient>
          )}
        </Animated.View>
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <View style={styles.trackInfoRow}>
          <View style={styles.trackInfoText}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
          <TouchableOpacity style={styles.likeBtn}>
            <Text style={styles.likeIcon}>🤍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBg}>
          <LinearGradient
            colors={['#C4B5FD', '#7DD3FC']}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          {/* Thumb */}
          <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>-{formatTime(Math.max(0, duration - position))}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Shuffle */}
        <TouchableOpacity style={styles.controlBtn} onPress={toggleShuffle}>
          <Text style={[styles.controlIcon, isShuffled && styles.controlIconActive]}>⇄</Text>
        </TouchableOpacity>

        {/* Previous */}
        <TouchableOpacity style={styles.controlBtn} onPress={previousTrack}>
          <Text style={styles.controlIconLg}>⏮</Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
          <LinearGradient
            colors={['#C4B5FD', '#A78BFA', '#818CF8']}
            style={styles.playGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity style={styles.controlBtn} onPress={nextTrack}>
          <Text style={styles.controlIconLg}>⏭</Text>
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity style={styles.controlBtn} onPress={toggleRepeat}>
          <Text style={[styles.controlIcon, repeatMode !== 'none' && styles.controlIconActive]}>
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        {[
          { icon: '⬇️', label: 'Download' },
          { icon: '🎵', label: 'Lyrics' },
          { icon: '📋', label: 'Queue' },
          { icon: '⏱️', label: 'Sleep' },
          { icon: '↗️', label: 'Share' },
        ].map((a, i) => (
          <TouchableOpacity key={i} style={styles.actionBtn}>
            <View style={styles.actionIconWrap}>
              <LinearGradient
                colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.actionIcon}>{a.icon}</Text>
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  blob1: {
    position: 'absolute', top: -100, left: -80,
    width: width * 1.2, height: 400, borderRadius: 300,
    backgroundColor: 'rgba(167,139,250,0.15)',
  },
  blob2: {
    position: 'absolute', bottom: 100, right: -80,
    width: width, height: 350, borderRadius: 300,
    backgroundColor: 'rgba(125,211,252,0.1)',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  backIcon: { fontSize: 20, color: '#7C3AED' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 11, color: '#7C3AED', fontWeight: '800', letterSpacing: 2 },
  moreBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  moreIcon: { fontSize: 24, color: '#6B7280' },

  artWrap: { alignItems: 'center', paddingVertical: 24 },
  artContainer: { position: 'relative' },
  artGlow: {
    position: 'absolute', top: -20, left: -20,
    right: -20, bottom: -20, borderRadius: 50,
    opacity: 0.6,
  },
  art: {
    width: width * 0.72, height: width * 0.72,
    borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)',
  },
  artEmoji: { fontSize: 80 },

  trackInfo: { paddingHorizontal: 28, marginBottom: 20 },
  trackInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trackInfoText: { flex: 1 },
  trackTitle: { fontSize: 24, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.5, marginBottom: 4 },
  trackArtist: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  likeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  likeIcon: { fontSize: 26 },

  progressSection: { paddingHorizontal: 28, marginBottom: 24 },
  progressBg: {
    height: 5, backgroundColor: 'rgba(167,139,250,0.2)',
    borderRadius: 3, marginBottom: 8, position: 'relative',
  },
  progressFill: { height: 5, borderRadius: 3 },
  progressThumb: {
    position: 'absolute', top: -5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#A78BFA', marginLeft: -7,
    borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 28, marginBottom: 32,
  },
  controlBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  controlIcon: { fontSize: 22, color: '#9CA3AF' },
  controlIconActive: { color: '#7C3AED' },
  controlIconLg: { fontSize: 28, color: '#1E1B4B' },
  playBtn: { borderRadius: 40, overflow: 'hidden' },
  playGrad: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 28, color: '#FFFFFF' },

  actionRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
});
