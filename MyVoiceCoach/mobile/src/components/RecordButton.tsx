import React, { useRef, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Audio } from 'expo-av';

interface RecordButtonProps {
  onRecordingComplete: (uri: string) => void;
}

export default function RecordButton({ onRecordingComplete }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);
      startPulse();

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('녹음 시작 실패', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      stopPulse();
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      if (uri) onRecordingComplete(uri);
    } catch (err) {
      console.error('녹음 중지 실패', err);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <Text style={styles.timer}>{formatDuration(duration)}</Text>
      )}
      <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} activeOpacity={0.8}>
        <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.button, isRecording && styles.buttonRecording]}>
            <Text style={styles.icon}>{isRecording ? '■' : '●'}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.label}>{isRecording ? '탭하여 중지' : '탭하여 녹음'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  timer: { fontSize: 28, fontWeight: 'bold', color: '#ff6b6b', letterSpacing: 2 },
  outerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRecording: { backgroundColor: '#ff4444' },
  icon: { fontSize: 32, color: '#fff' },
  label: { color: '#aaa', fontSize: 14 },
});
