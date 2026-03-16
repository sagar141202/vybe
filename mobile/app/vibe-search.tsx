import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Animated, Image, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { api } from '../lib/api';
import { usePlayTrack } from '../hooks/usePlayTrack';
import { usePlayerStore } from '../stores/playerStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SUGGESTIONS = [
  { label: 'Rainy night lo-fi', emoji: '🌧️', query: 'rainy night lofi chill study' },
  { label: 'Workout pump', emoji: '💪', query: 'high energy workout pump up intense' },
  { label: 'Late night drive', emoji: '🚗', query: 'late night drive dark atmospheric' },
  { label: 'Morning coffee', emoji: '☕', query: 'peaceful morning calm acoustic' },
  { label: 'Party banger', emoji: '🎉', query: 'party dance upbeat energetic happy' },
  { label: 'Heartbreak', emoji: '💔', query: 'sad emotional heartbreak melancholic' },
  { label: 'Focus deep work', emoji: '🎯', query: 'focus concentration instrumental ambient' },
  { label: 'Summer vibes', emoji: '🌊', query: 'summer beach happy uplifting tropical' },
  { label: 'Midnight feels', emoji: '🌙', query: 'midnight dark moody introspective' },
  { label: 'Road trip', emoji: '🛣️', query: 'road trip feel good sing along' },
];

const THUMB_COLORS = [
  ['#C4B5FD','#A78BFA'], ['#7DD3FC','#93C5FD'],
  ['#86EFAC','#6EE7B7'], ['#FDE68A','#FCA5A5'],
  ['#FBCFE8','#F9A8D4'],
];

export default function VibeSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { playTrack } = usePlayTrack();
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSearch = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);

    Animated.sequence([
      Animated.timing(searchScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.spring(searchScale, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();

    try {
      const { data } = await api.post('/vibe/search', {
        query: searchQuery,
        limit: 20,
        search_youtube: true,
      });
      setResults(data || []);
    } catch (e: any) {
      console.error('Vibe search error:', e?.message);
      setResults([]);
    }
    setLoading(false);
  };

  const playAll = () => {
    if (results.length > 0) playTrack(results[0], results);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#F5F0FF', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      {/* Decorative blobs */}
      <View style={styles.blob1} pointerEvents="none">
        <LinearGradient colors={['rgba(196,181,253,0.4)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </View>
      <View style={styles.blob2} pointerEvents="none">
        <LinearGradient colors={['rgba(125,211,252,0.3)', 'transparent']} style={{ flex: 1, borderRadius: 300 }} />
      </View>

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.1)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Vibe Search</Text>
            <Text style={styles.headerSub}>AI-powered semantic playlist</Text>
          </View>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search input */}
          <Animated.View style={[styles.searchWrap, { transform: [{ scale: searchScale }] }]}>
            <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.searchEmoji}>✨</Text>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Describe a vibe, mood or moment..."
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
              selectionColor="#A78BFA"
              multiline={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                <Ionicons name="close-circle" size={20} color="#C4B5FD" />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Search button */}
          <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()} disabled={loading || !query.trim()}>
            <LinearGradient
              colors={query.trim() ? ['#C4B5FD', '#A78BFA'] : ['rgba(167,139,250,0.3)', 'rgba(167,139,250,0.2)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Text style={styles.searchBtnText}>
              {loading ? '🔮 Finding your vibe...' : '✨ Find My Vibe'}
            </Text>
          </TouchableOpacity>

          {/* Suggestions */}
          {!searched && (
            <>
              <Text style={styles.suggestionsTitle}>Try a vibe</Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => { setQuery(s.query); handleSearch(s.query); }}
                  >
                    <LinearGradient
                      colors={[THUMB_COLORS[i % THUMB_COLORS.length][0] + '30', THUMB_COLORS[i % THUMB_COLORS.length][1] + '20']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.suggestionEmoji}>{s.emoji}</Text>
                    <Text style={styles.suggestionLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              <View style={styles.resultsHeader}>
                <View>
                  <Text style={styles.resultsTitle}>✨ Your Vibe Playlist</Text>
                  <Text style={styles.resultsSub}>{results.length} tracks matching "{query}"</Text>
                </View>
                <TouchableOpacity style={styles.playAllBtn} onPress={playAll}>
                  <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                  <Text style={styles.playAllText}>Play</Text>
                </TouchableOpacity>
              </View>

              {results.map((track, i) => {
                const isPlaying = currentTrack?.video_id === track.video_id;
                const colorIndex = i % THUMB_COLORS.length;
                const similarity = track.similarity || 0;
                return (
                  <TouchableOpacity
                    key={track.video_id}
                    style={[styles.resultRow, isPlaying && styles.resultRowActive]}
                    onPress={() => playTrack(track, results)}
                  >
                    {isPlaying && (
                      <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(125,211,252,0.08)']} style={StyleSheet.absoluteFillObject} />
                    )}
                    <View style={styles.resultThumbWrap}>
                      {track.thumbnail_url ? (
                        <Image source={{ uri: track.thumbnail_url }} style={styles.resultThumb} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={THUMB_COLORS[colorIndex] as [string,string]} style={styles.resultThumb}>
                          <Text style={{ fontSize: 18 }}>🎵</Text>
                        </LinearGradient>
                      )}
                      {isPlaying && (
                        <View style={styles.playingOverlay}>
                          <Text style={{ fontSize: 12, color: '#FFF' }}>▶</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultTitle, isPlaying && { color: '#7C3AED' }]} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text style={styles.resultArtist} numberOfLines={1}>{track.artist}</Text>
                    </View>
                    <View style={styles.resultMeta}>
                      {similarity > 0 && (
                        <View style={[styles.matchBadge, {
                          backgroundColor: similarity > 0.7
                            ? 'rgba(134,239,172,0.2)'
                            : similarity > 0.5
                            ? 'rgba(167,139,250,0.15)'
                            : 'rgba(156,163,175,0.1)'
                        }]}>
                          <Text style={[styles.matchText, {
                            color: similarity > 0.7 ? '#059669' : similarity > 0.5 ? '#7C3AED' : '#9CA3AF'
                          }]}>
                            {similarity > 0.7 ? '✦ Best' : similarity > 0.5 ? '✓ Good' : '~ Fair'}
                          </Text>
                        </View>
                      )}
                      {track.bpm && (
                        <Text style={styles.bpmText}>{Math.round(track.bpm)} BPM</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Empty state */}
          {searched && !loading && results.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🎭</Text>
              <Text style={styles.emptyTitle}>No vibes found</Text>
              <Text style={styles.emptySub}>Try a different description or play more music to build your library</Text>
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
  blob1: { position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130 },
  blob2: { position: 'absolute', top: 300, left: -80, width: 220, height: 220, borderRadius: 110 },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E1B4B' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  scroll: { paddingHorizontal: 24, paddingBottom: 20 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.25)', marginBottom: 12 },
  searchEmoji: { fontSize: 20 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E1B4B', fontWeight: '500' },
  searchBtn: { paddingVertical: 15, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  searchBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  suggestionsTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B', marginBottom: 14 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)' },
  suggestionEmoji: { fontSize: 16 },
  suggestionLabel: { fontSize: 13, fontWeight: '600', color: '#1E1B4B' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  resultsTitle: { fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  resultsSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  playAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' },
  playAllText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', overflow: 'hidden' },
  resultRowActive: { borderColor: 'rgba(167,139,250,0.4)' },
  resultThumbWrap: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  resultThumb: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(167,139,250,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  resultArtist: { fontSize: 12, color: '#6B7280' },
  resultMeta: { alignItems: 'flex-end', gap: 4 },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  matchText: { fontSize: 11, fontWeight: '700' },
  bpmText: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B' },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
