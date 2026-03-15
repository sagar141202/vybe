import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const SECTIONS = [
  { name: 'Liked Songs', emoji: '❤️', count: '0 songs', colors: ['#FBCFE8', '#FCA5A5'] },
  { name: 'Downloaded', emoji: '⬇️', count: '0 tracks', colors: ['#86EFAC', '#6EE7B7'] },
  { name: 'Playlists', emoji: '🎵', count: '0 playlists', colors: ['#93C5FD', '#A5B4FC'] },
  { name: 'Recently Played', emoji: '🕐', count: '0 tracks', colors: ['#C4B5FD', '#A78BFA'] },
  { name: 'Artists', emoji: '🎤', count: '0 artists', colors: ['#FDE68A', '#FCA5A5'] },
  { name: 'Albums', emoji: '💿', count: '0 albums', colors: ['#A5F3FC', '#93C5FD'] },
];

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Library 📚</Text>
          <Text style={styles.sub}>Your personal music collection</Text>
        </View>
        {SECTIONS.map((s, i) => (
          <TouchableOpacity key={i} style={styles.card}>
            <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.cardBorder} />
            <LinearGradient colors={s.colors as [string,string]} style={styles.cardIcon}>
              <Text style={styles.cardEmoji}>{s.emoji}</Text>
            </LinearGradient>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{s.name}</Text>
              <Text style={styles.cardCount}>{s.count}</Text>
            </View>
            <Text style={styles.cardArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scroll: { paddingBottom: 160 },
  header: { paddingTop: 64, paddingHorizontal: 24, marginBottom: 32 },
  title: { fontSize: 36, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1 },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 24, marginBottom: 12, padding: 18, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  cardBorder: { position: 'absolute', inset: 0, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)' },
  cardIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1E1B4B', marginBottom: 3 },
  cardCount: { fontSize: 13, color: '#6B7280' },
  cardArrow: { fontSize: 26, color: '#A78BFA', fontWeight: '300' },
});
