import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import SearchBar from '../../components/SearchBar';
import SearchResultsList from '../../components/SearchResultsList';
import BrowseCategories from '../../components/BrowseCategories';
import AddToPlaylistSheet from '../../components/AddToPlaylistSheet';
import { useSearch } from '../../hooks/useSearch';
import { usePlayTrack } from '../../hooks/usePlayTrack';
import type { Track } from '../../components/TrackListItem';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const { data: tracks = [], isLoading } = useSearch(query);
  const { playTrack } = usePlayTrack();

  const handleMorePress = (track: Track) => {
    setSelectedTrack(track);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FAFBFF', '#F0F4FF', '#F8FAFF']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <Text style={styles.sub}>Find any song, artist or album</Text>
        </View>

        <SearchBar value={query} onChangeText={setQuery} placeholder="Songs, artists, albums..." />

        {query.length === 0 && <BrowseCategories onCategoryPress={setQuery} />}

        {query.length === 1 && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>Keep typing...</Text>
          </View>
        )}

        {query.length >= 2 && (
          <SearchResultsList
            tracks={tracks}
            isLoading={isLoading}
            query={query}
            onTrackPress={(track: Track) => playTrack(track, tracks)}
            onMorePress={handleMorePress}
            onClearSearch={() => setQuery('')}
          />
        )}
      </ScrollView>

      {selectedTrack && (
        <AddToPlaylistSheet
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scroll: { paddingBottom: 160 },
  header: { paddingTop: 64, paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 36, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1 },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  hintBox: { marginHorizontal: 24, marginTop: 32, padding: 24, borderRadius: 20, backgroundColor: 'rgba(167,139,250,0.1)', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.2)', alignItems: 'center' },
  hintText: { fontSize: 16, color: '#7C3AED', fontWeight: '600' },
});
