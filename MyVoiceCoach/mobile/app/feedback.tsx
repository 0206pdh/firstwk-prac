/**
 * Screen 3: 분석 결과 & 코칭 피드백
 */
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import PitchGraph from '../src/components/PitchGraph';
import CoachAudioPlayer from '../src/components/CoachAudioPlayer';

const SEVERITY_COLOR = { mild: '#fdcb6e', moderate: '#e17055', severe: '#ff6b6b' };

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={[styles.ringScore, { color }]}>{score}</Text>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

function IssueList({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <View style={styles.issueSection}>
      <Text style={[styles.issueSectionTitle, { color }]}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.issueItem}>• {item}</Text>
      ))}
    </View>
  );
}

export default function FeedbackScreen() {
  const router = useRouter();
  const { result, selectedSong, reset } = useAppStore();

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>분석 결과가 없습니다</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
            <Text style={styles.backBtnText}>처음으로</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { analysis, coaching } = result;

  const handleAgain = () => {
    reset();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 노래 정보 */}
        {selectedSong && (
          <View style={styles.songBanner}>
            <Text style={styles.songTitle}>{selectedSong.title}</Text>
            <Text style={styles.songArtist}>{selectedSong.artist}</Text>
          </View>
        )}

        {/* 종합 점수 */}
        <View style={styles.card}>
          <Text style={styles.summary}>{coaching.summary}</Text>
          <View style={styles.scoresRow}>
            <ScoreRing score={coaching.overall_score} label="종합" color="#f9ca24" />
            <ScoreRing score={coaching.pitch_score} label="음정" color="#6c5ce7" />
            <ScoreRing score={coaching.rhythm_score} label="박자" color="#00b894" />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analysis.pitch.pitch_accuracy_percent}%</Text>
              <Text style={styles.statLabel}>음정 정확도</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analysis.rhythm.estimated_bpm}</Text>
              <Text style={styles.statLabel}>측정 BPM</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analysis.rhythm.rhythm_accuracy_percent}%</Text>
              <Text style={styles.statLabel}>박자 정확도</Text>
            </View>
          </View>
        </View>

        {/* 피치 그래프 */}
        <View style={styles.card}>
          <PitchGraph
            pitchPoints={analysis.pitch.points}
            sections={analysis.sections}
            duration={analysis.duration_seconds}
          />
        </View>

        {/* AI 음성 코칭 */}
        <View style={styles.card}>
          <CoachAudioPlayer segments={coaching.coaching_segments} />
        </View>

        {/* 음정/박자 문제 (화면 텍스트) */}
        <View style={styles.card}>
          <IssueList title="음정 피드백" items={coaching.pitch_issues} color="#6c5ce7" />
          <IssueList title="박자 피드백" items={coaching.rhythm_issues} color="#00b894" />

          {/* 호흡 & 자세 (화면 전용) */}
          {coaching.breathing_tips.length > 0 && (
            <View style={styles.breathingBox}>
              <Text style={styles.breathingTitle}>💨 호흡 & 발성 팁</Text>
              {coaching.breathing_tips.map((tip, i) => (
                <Text key={i} style={styles.breathingItem}>• {tip}</Text>
              ))}
            </View>
          )}

          {/* 문제 구간 타임라인 */}
          {(analysis.pitch.problem_sections.length > 0 || analysis.rhythm.problem_sections.length > 0) && (
            <View style={styles.timelineSection}>
              <Text style={styles.timelineTitle}>⚠ 문제 구간</Text>
              {[...analysis.pitch.problem_sections, ...analysis.rhythm.problem_sections]
                .sort((a, b) => a.start - b.start)
                .map((prob, i) => (
                  <View key={i} style={[
                    styles.timelineItem,
                    { borderLeftColor: SEVERITY_COLOR[prob.severity] },
                  ]}>
                    <Text style={styles.timelineTime}>{prob.start}s ~ {prob.end}s</Text>
                    <Text style={styles.timelineIssue}>{prob.issue}</Text>
                    {prob.target_note && (
                      <Text style={styles.timelineTarget}>목표: {prob.target_note}</Text>
                    )}
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* 연습 방법 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📝 연습 방법</Text>
          {coaching.improvement_tips.map((tip, i) => (
            <View key={i} style={styles.tipItem}>
              <Text style={styles.tipNum}>{i + 1}</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* 격려 메시지 */}
        <View style={styles.encourageCard}>
          <Text style={styles.encourageText}>{coaching.encouragement}</Text>
        </View>

        {/* 다시 도전 */}
        <TouchableOpacity style={styles.againBtn} onPress={handleAgain}>
          <Text style={styles.againText}>🎤 다시 도전하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { padding: 16, gap: 12, paddingBottom: 60 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  emptyText: { color: '#888', fontSize: 16 },
  backBtn: { backgroundColor: '#6c5ce7', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: '600' },

  songBanner: { alignItems: 'center', paddingVertical: 8, gap: 2 },
  songTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  songArtist: { color: '#aaa', fontSize: 13 },

  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, gap: 12 },
  summary: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  scoresRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ringWrap: { alignItems: 'center', gap: 6 },
  ring: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  ringScore: { fontSize: 24, fontWeight: 'bold' },
  ringLabel: { color: '#aaa', fontSize: 12 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', gap: 2 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11 },

  issueSection: { gap: 6 },
  issueSectionTitle: { fontSize: 14, fontWeight: '700' },
  issueItem: { color: '#ccc', fontSize: 13, lineHeight: 20 },

  breathingBox: {
    backgroundColor: '#0d1b35',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  breathingTitle: { color: '#74b9ff', fontSize: 14, fontWeight: '700' },
  breathingItem: { color: '#b2c3e8', fontSize: 13, lineHeight: 20 },

  timelineSection: { gap: 8 },
  timelineTitle: { color: '#fdcb6e', fontSize: 14, fontWeight: '700' },
  timelineItem: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    gap: 2,
  },
  timelineTime: { color: '#fdcb6e', fontSize: 11 },
  timelineIssue: { color: '#ddd', fontSize: 13 },
  timelineTarget: { color: '#74b9ff', fontSize: 11 },

  sectionHeader: { color: '#fff', fontSize: 15, fontWeight: '700' },
  tipItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipNum: { color: '#6c5ce7', fontWeight: 'bold', fontSize: 14, width: 18 },
  tipText: { flex: 1, color: '#ccc', fontSize: 13, lineHeight: 20 },

  encourageCard: {
    backgroundColor: '#0f3460',
    borderRadius: 14,
    padding: 16,
  },
  encourageText: { color: '#e2e2e2', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  againBtn: {
    backgroundColor: '#6c5ce7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  againText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
