import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const SETTINGS = [
  { name: 'Audio Quality', value: 'High (160kbps)', emoji: '🎧', colors: ['#C4B5FD', '#A78BFA'] },
  { name: 'Crossfade', value: '3 seconds', emoji: '🔀', colors: ['#93C5FD', '#7DD3FC'] },
  { name: 'Sleep Timer', value: 'Off', emoji: '⏱️', colors: ['#86EFAC', '#6EE7B7'] },
  { name: 'Last.fm', value: 'Not connected', emoji: '📊', colors: ['#FBCFE8', '#F9A8D4'] },
  { name: 'Discord RPC', value: 'Off', emoji: '🎮', colors: ['#A5B4FC', '#818CF8'] },
  { name: 'Equalizer', value: 'Flat', emoji: '🎚️', colors: ['#FDE68A', '#FCD34D'] },
  { name: 'Offline Mode', value: '0 MB used', emoji: '📦', colors: ['#A5F3FC', '#67E8F9'] },
];

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#A78BFA', '#7DD3FC', '#86EFAC']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.avatarText}>S</Text>
          </View>
          <Text style={styles.name}>Sagar</Text>
          <Text style={styles.sub}>Personal · SoundFree v1.0.0</Text>
          <View style={styles.proTag}>
            <LinearGradient colors={['#C4B5FD', '#93C5FD']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.proText}>✦ FREE FOREVER</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { v: '0', l: 'Played', colors: ['#C4B5FD', '#A78BFA'] },
            { v: '0', l: 'Liked', colors: ['#FBCFE8', '#F9A8D4'] },
            { v: '0', l: 'Downloads', colors: ['#86EFAC', '#6EE7B7'] },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFillObject} />
              <LinearGradient colors={s.colors as [string,string]} style={styles.statDot} />
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Settings ⚙️</Text>
        <View style={styles.settingsList}>
          {SETTINGS.map((s, i) => (
            <TouchableOpacity key={i} style={[styles.settingRow, i === SETTINGS.length - 1 && { borderBottomWidth: 0 }]}>
              <LinearGradient colors={s.colors as [string,string]} style={styles.settingIcon}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
              </LinearGradient>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{s.name}</Text>
                <Text style={styles.settingVal}>{s.value}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
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
  header: { paddingTop: 64, alignItems: 'center', marginBottom: 32, paddingHorizontal: 24 },
  avatarWrap: {
    width: 96, height: 96, borderRadius: 48,
    overflow: 'hidden', alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 40, fontWeight: '900', color: '#FFFFFF' },
  name: { fontSize: 28, fontWeight: '900', color: '#1E1B4B', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  proTag: {
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7,
    overflow: 'hidden', borderWidth: 0,
  },
  proText: { fontSize: 11, color: '#1E1B4B', fontWeight: '800', letterSpacing: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 32 },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 18,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  statVal: { fontSize: 26, fontWeight: '900', color: '#1E1B4B', marginBottom: 4 },
  statLbl: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
  section: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', paddingHorizontal: 24, marginBottom: 16 },
  settingsList: {
    marginHorizontal: 24, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderBottomWidth: 1,
    borderBottomColor: 'rgba(167,139,250,0.1)',
  },
  settingIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingName: { fontSize: 15, fontWeight: '600', color: '#1E1B4B', marginBottom: 2 },
  settingVal: { fontSize: 12, color: '#6B7280' },
  arrow: { fontSize: 24, color: '#A78BFA', fontWeight: '300' },
});
