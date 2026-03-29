import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CoachingFeedback } from '../types';

interface ScoreCardProps {
  coaching: CoachingFeedback;
}

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <View style={styles.scoreCircleWrap}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.scoreNum, { color }]}>{score}</Text>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

export default function ScoreCard({ coaching }: ScoreCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.summary}>{coaching.summary}</Text>

      <View style={styles.scoresRow}>
        <ScoreCircle score={coaching.overall_score} label="종합" color="#f9ca24" />
        <ScoreCircle score={coaching.pitch_score} label="음정" color="#6c5ce7" />
        <ScoreCircle score={coaching.rhythm_score} label="박자" color="#00b894" />
      </View>

      {coaching.pitch_issues.length > 0 && (
        <Section title="음정 피드백" items={coaching.pitch_issues} color="#6c5ce7" />
      )}
      {coaching.rhythm_issues.length > 0 && (
        <Section title="박자 피드백" items={coaching.rhythm_issues} color="#00b894" />
      )}
      {coaching.improvement_tips.length > 0 && (
        <Section title="연습 방법" items={coaching.improvement_tips} color="#fdcb6e" />
      )}

      <View style={styles.encourageBox}>
        <Text style={styles.encourageText}>{coaching.encouragement}</Text>
      </View>
    </View>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.item}>• {item}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  summary: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  scoresRow: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreCircleWrap: { alignItems: 'center', gap: 6 },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { fontSize: 24, fontWeight: 'bold' },
  scoreLabel: { color: '#aaa', fontSize: 12 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  item: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  encourageBox: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 14,
  },
  encourageText: { color: '#e2e2e2', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
