import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { CoachingSegment } from '../types';
import { generateCoachingAudio } from '../services/api';

interface Props {
  segments: CoachingSegment[];
}

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'done' | 'error';

export default function CoachAudioPlayer({ segments }: Props) {
  const [state, setState] = useState<PlayerState>('idle');
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioUriRef = useRef<string | null>(null);

  const loadAndPlay = async () => {
    setState('loading');
    try {
      // 코칭 오디오 생성 요청
      const res = await generateCoachingAudio(segments);

      // base64 WAV → 로컬 파일로 저장
      const fileUri = FileSystem.cacheDirectory + 'coaching_audio.wav';
      await FileSystem.writeAsStringAsync(fileUri, res.audio_base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      audioUriRef.current = fileUri;

      // 이어폰/스피커 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;
      setState('playing');

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setState('done');
        }
      });
    } catch (err: any) {
      console.error(err);
      Alert.alert('오류', '코칭 오디오를 불러오지 못했습니다.');
      setState('error');
    }
  };

  const togglePause = async () => {
    if (!soundRef.current) return;
    if (state === 'playing') {
      await soundRef.current.pauseAsync();
      setState('paused');
    } else if (state === 'paused') {
      await soundRef.current.playAsync();
      setState('playing');
    }
  };

  const replay = async () => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
      setState('playing');
    } else {
      loadAndPlay();
    }
  };

  const stop = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setState('idle');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎧 AI 코치 음성 피드백</Text>
        <Text style={styles.subtitle}>이어폰을 끼고 들어보세요</Text>
      </View>

      {state === 'idle' && (
        <TouchableOpacity style={styles.playBtn} onPress={loadAndPlay}>
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.playText}>코칭 듣기</Text>
        </TouchableOpacity>
      )}

      {state === 'loading' && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#6c5ce7" />
          <Text style={styles.loadingText}>코칭 음성 생성 중...</Text>
        </View>
      )}

      {(state === 'playing' || state === 'paused') && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={togglePause}>
            <Text style={styles.controlIcon}>{state === 'playing' ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={stop}>
            <Text style={styles.controlIcon}>■</Text>
          </TouchableOpacity>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {state === 'playing' ? '재생 중' : '일시정지'}
          </Text>
        </View>
      )}

      {state === 'done' && (
        <View style={styles.doneRow}>
          <Text style={styles.doneText}>✓ 코칭 완료</Text>
          <TouchableOpacity style={styles.replayBtn} onPress={replay}>
            <Text style={styles.replayText}>다시 듣기</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === 'error' && (
        <TouchableOpacity style={[styles.playBtn, styles.errorBtn]} onPress={loadAndPlay}>
          <Text style={styles.playText}>다시 시도</Text>
        </TouchableOpacity>
      )}

      {/* 코칭 항목 미리보기 */}
      <View style={styles.segmentList}>
        {segments.map((seg, i) => (
          <View key={i} style={styles.segmentItem}>
            <Text style={styles.segmentNum}>{i + 1}</Text>
            <View style={styles.segmentContent}>
              {seg.section_start !== null && (
                <Text style={styles.segmentTime}>
                  {seg.section_start}s ~ {seg.section_end}s
                </Text>
              )}
              <Text style={styles.segmentText} numberOfLines={2}>
                {seg.speech_text}
              </Text>
              {seg.demo_notes.length > 0 && (
                <Text style={styles.demoNotes}>
                  🎵 시연: {seg.demo_notes.join(' → ')}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  header: { gap: 2 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#6c5ce7', fontSize: 12 },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6c5ce7',
    borderRadius: 14,
    paddingVertical: 16,
  },
  playIcon: { fontSize: 20, color: '#fff' },
  playText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  loadingText: { color: '#aaa', fontSize: 14 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6c5ce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: { backgroundColor: '#2d3436' },
  controlIcon: { fontSize: 18, color: '#fff' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00b894' },
  statusText: { color: '#aaa', fontSize: 13 },
  doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doneText: { color: '#00b894', fontSize: 14, fontWeight: '600' },
  replayBtn: {
    backgroundColor: '#2d3436',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  replayText: { color: '#fff', fontSize: 13 },
  errorBtn: { backgroundColor: '#e17055' },
  segmentList: { gap: 8, marginTop: 4 },
  segmentItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 12,
  },
  segmentNum: {
    color: '#6c5ce7',
    fontWeight: 'bold',
    fontSize: 14,
    width: 20,
  },
  segmentContent: { flex: 1, gap: 3 },
  segmentTime: { color: '#fdcb6e', fontSize: 11 },
  segmentText: { color: '#ccc', fontSize: 13, lineHeight: 18 },
  demoNotes: { color: '#74b9ff', fontSize: 11, marginTop: 2 },
});
