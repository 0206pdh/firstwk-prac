/**
 * Screen 1: 노래 선택
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchSongs, searchSongs } from '../src/services/api';
import { useAppStore } from '../src/store/useAppStore';
import { Song } from '../src/types';

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#00b894',
  medium: '#fdcb6e',
  hard: '#ff6b6b',
};
const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export default function SongSelectScreen() {
  const router = useRouter();
  const { setSelectedSong, reset } = useAppStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    reset();
    fetchSongs()
      .then(setSongs)
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setSearching(true);
      const all = await fetchSongs().catch(() => []);
      setSongs(all);
      setSearching(false);
      return;
    }
    setSearching(true);
    const result = await searchSongs(text).catch(() => []);
    setSongs(result);
    setSearching(false);
  };

  const selectSong = (song: Song) => {
    setSelectedSong(song);
    router.push('/recording');
  };

  const renderSong = ({ item }: { item: Song }) => (
    <TouchableOpacity style={styles.songCard} onPress={() => selectSong(item)} activeOpacity={0.7}>
      <View style={styles.songLeft}>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
        <View style={styles.songMeta}>
          <Text style={styles.metaTag}>{item.genre}</Text>
          <Text style={styles.metaTag}>♩ {item.bpm} BPM</Text>
          <Text style={styles.metaTag}>Key {item.key}</Text>
        </View>
      </View>
      <View style={styles.songRight}>
        <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[item.difficulty] + '33', borderColor: DIFFICULTY_COLOR[item.difficulty] }]}>
          <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[item.difficulty] }]}>
            {DIFFICULTY_LABEL[item.difficulty]}
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>🎤 MyVoiceCoach</Text>
        <Text style={styles.appSubtitle}>부를 노래를 선택하세요</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="노래 제목 또는 아티스트"
          placeholderTextColor="#555"
          value={query}
          onChangeText={handleSearch}
        />
        {searching && <ActivityIndicator size="small" color="#6c5ce7" style={styles.searchSpinner} />}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6c5ce7" />
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderSong}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>검색 결과가 없습니다</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { padding: 24, paddingBottom: 8, gap: 4 },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  appSubtitle: { color: '#888', fontSize: 14 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#2d3456',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 15,
  },
  searchSpinner: { marginLeft: 10 },
  list: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#555', textAlign: 'center', marginTop: 40 },
  songCard: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3456',
  },
  songLeft: { flex: 1, gap: 4 },
  songTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  songArtist: { color: '#aaa', fontSize: 13 },
  songMeta: { flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  metaTag: {
    backgroundColor: '#0f0f2e',
    color: '#777',
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  songRight: { alignItems: 'center', gap: 8, marginLeft: 12 },
  diffBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffText: { fontSize: 11, fontWeight: '600' },
  arrow: { color: '#444', fontSize: 22 },
});
