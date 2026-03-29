/**
 * Screen 2: 녹음 화면
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { analyzeRecording } from '../src/services/api';

type State = 'countdown' | 'recording' | 'stopping' | 'analyzing' | 'done';

const COUNTDOWN_SEC = 3;

export default function RecordingScreen() {
  const router = useRouter();
  const { selectedSong, setRecordingUri, setResult } = useAppStore();
  const [appState, setAppState] = useState<State>('countdown');
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);
  const [duration, setDuration] = useState(0);

  // 진폭 시각화 (8개 바)
  const [amplitudes, setAmplitudes] = useState<number[]>(Array(8).fill(4));
  const barAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(4))).current;

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ampTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 카운트다운 후 자동 녹음 시작
  useEffect(() => {
    let t = COUNTDOWN_SEC;
    const iv = setInterval(() => {
      t -= 1;
      setCountdown(t);
      if (t === 0) {
        clearInterval(iv);
        startRecording();
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const animateBars = () => {
    ampTimerRef.current = setInterval(() => {
      barAnims.forEach((anim) => {
        const h = 8 + Math.random() * 52;
        Animated.timing(anim, { toValue: h, duration: 120, useNativeDriver: false }).start();
      });
    }, 150);
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('권한 필요', '마이크 권한이 필요합니다.');
        router.back();
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setAppState('recording');
      startPulse();
      animateBars();

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      Alert.alert('오류', '녹음을 시작할 수 없습니다.');
      router.back();
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setAppState('stopping');
    pulseAnim.stopAnimation();
    if (timerRef.current) clearInterval(timerRef.current);
    if (ampTimerRef.current) clearInterval(ampTimerRef.current);
    barAnims.forEach((a) => Animated.timing(a, { toValue: 4, duration: 200, useNativeDriver: false }).start());

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI()!;
      recordingRef.current = null;
      setRecordingUri(uri);
      setAppState('analyzing');
      await uploadAndAnalyze(uri);
    } catch (e) {
      Alert.alert('오류', '녹음 처리 실패');
      setAppState('recording');
    }
  };

  const uploadAndAnalyze = async (uri: string) => {
    try {
      const data = await analyzeRecording(uri, selectedSong?.id ?? '');
      setResult(data);
      setAppState('done');
      router.replace('/feedback');
    } catch (e: any) {
      Alert.alert('분석 실패', e?.message ?? '서버와 연결할 수 없습니다.');
      setAppState('recording');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 노래 정보 */}
      {selectedSong && (
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{selectedSong.title}</Text>
          <Text style={styles.songArtist}>{selectedSong.artist}</Text>
          <Text style={styles.songMeta}>Key {selectedSong.key} · {selectedSong.bpm} BPM</Text>
        </View>
      )}

      <View style={styles.center}>
        {/* 카운트다운 */}
        {appState === 'countdown' && (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownNum}>{countdown}</Text>
            <Text style={styles.countdownText}>준비하세요!</Text>
          </View>
        )}

        {/* 녹음 중 */}
        {appState === 'recording' && (
          <>
            {/* 진폭 바 */}
            <View style={styles.waveform}>
              {barAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[styles.bar, { height: anim }]}
                />
              ))}
            </View>

            <Text style={styles.timer}>{formatTime(duration)}</Text>

            {/* 녹음 버튼 */}
            <TouchableOpacity onPress={stopRecording} activeOpacity={0.8}>
              <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.stopBtn}>
                  <View style={styles.stopSquare} />
                </View>
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.hint}>탭하여 녹음 중지</Text>
          </>
        )}

        {/* 분석 중 */}
        {(appState === 'stopping' || appState === 'analyzing') && (
          <View style={styles.analyzingBox}>
            <ActivityIndicator size="large" color="#6c5ce7" />
            <Text style={styles.analyzingText}>
              {appState === 'stopping' ? '녹음 저장 중...' : 'AI가 분석 중이에요...'}
            </Text>
            <Text style={styles.analyzingSubtext}>음정과 박자를 꼼꼼히 분석하고 있어요</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  songInfo: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 2,
  },
  songTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  songArtist: { color: '#aaa', fontSize: 14 },
  songMeta: { color: '#6c5ce7', fontSize: 12, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
  countdownBox: { alignItems: 'center', gap: 12 },
  countdownNum: { fontSize: 96, fontWeight: 'bold', color: '#6c5ce7' },
  countdownText: { color: '#aaa', fontSize: 18 },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 80,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#6c5ce7',
    minHeight: 4,
  },
  timer: { fontSize: 40, fontWeight: 'bold', color: '#ff6b6b', letterSpacing: 2 },
  outerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  hint: { color: '#555', fontSize: 13 },
  analyzingBox: { alignItems: 'center', gap: 16 },
  analyzingText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  analyzingSubtext: { color: '#888', fontSize: 13 },
});
