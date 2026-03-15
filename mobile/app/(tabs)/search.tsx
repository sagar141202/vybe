import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'Bollywood', emoji: '🎬', colors: ['#FCA5A5', '#F87171'] },
  { name: 'English Pop', emoji: '🎵', colors: ['#7DD3FC', '#93C5FD'] },
  { name: 'Lo-fi', emoji: '☕', colors: ['#C4B5FD', '#A78BFA'] },
  { name: 'Hip-Hop', emoji: '🎤', colors: ['#D8B4FE', '#C084FC'] },
  { name: 'Classical', emoji: '🎻', colors: ['#86EFAC', '#4ADE80'] },
  { name: 'Punjabi', emoji: '🥁', colors: ['#FDE68A', '#FCD34D'] },
  { name: 'Rock', emoji: '🎸', colors: ['#FCA5A5', '#FB923C'] },
  { name: 'Electronic', emoji: '🎛️', colors: ['#A5F3FC', '#7DD3FC'] },
  { name: 'K-Pop', emoji: '⭐', colors: ['#FBCFE8', '#F9A8D4'] },
  { name: 'Jazz', emoji: '🎷', colors: ['#FDE68A', '#FCA5A5'] },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Search 🔍</Text>
          <Text style={styles.sub}>Find any song, artist or album</Text>
        </View>
        <View style={styles.searchWrap}>
          <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Songs, artists, albums..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            selectionColor="#A78BFA"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.section}>Browse Categories</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity key={i} style={styles.catCard}>
              <LinearGradient colors={cat.colors as [string,string]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.catOverlay} />
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scroll: { paddingBottom: 120 },
  header: { paddingTop: 64, paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: 36, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1 },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 32,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.4)',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, color: '#1E1B4B', fontWeight: '500' },
  clear: { fontSize: 14, color: '#9CA3AF' },
  section: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', paddingHorizontal: 24, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12 },
  catCard: {
    width: (width - 60) / 2, height: 95, borderRadius: 20,
    overflow: 'hidden', justifyContent: 'flex-end', padding: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.15)' },
  catEmoji: { fontSize: 26, marginBottom: 4 },
  catName: { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
});
