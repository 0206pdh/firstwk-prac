import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SectionAnalysis, PitchPoint } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const GRAPH_H = 160;
const MIN_HZ = 80;
const MAX_HZ = 800;

interface Props {
  pitchPoints: PitchPoint[];
  sections: SectionAnalysis[];
  duration: number;
}

function hzToY(hz: number): number {
  if (hz <= 0) return GRAPH_H;
  const logMin = Math.log2(MIN_HZ);
  const logMax = Math.log2(MAX_HZ);
  const logHz = Math.log2(Math.max(MIN_HZ, Math.min(MAX_HZ, hz)));
  return GRAPH_H - ((logHz - logMin) / (logMax - logMin)) * GRAPH_H;
}

function issueColor(issue: SectionAnalysis['dominant_issue']): string {
  switch (issue) {
    case 'pitch_high': return '#ff6b6b';
    case 'pitch_low': return '#fd79a8';
    case 'rhythm_fast': return '#fdcb6e';
    case 'rhythm_slow': return '#e17055';
    default: return '#00b894';
  }
}

function issueLabel(issue: SectionAnalysis['dominant_issue']): string {
  switch (issue) {
    case 'pitch_high': return '↑ 음정 높음';
    case 'pitch_low': return '↓ 음정 낮음';
    case 'rhythm_fast': return '⚡ 박자 빠름';
    case 'rhythm_slow': return '🐢 박자 느림';
    default: return '✓ 양호';
  }
}

export default function PitchGraph({ pitchPoints, sections, duration }: Props) {
  const GRAPH_W = Math.max(SCREEN_W - 32, duration * 40);
  const PX_PER_SEC = GRAPH_W / duration;

  // SVG path 데이터 생성 (react-native-svg 없이 View로 표현)
  const dots = useMemo(() =>
    pitchPoints
      .filter((p) => p.frequency > 0)
      .map((p) => ({
        x: p.time * PX_PER_SEC,
        y: hzToY(p.frequency),
        inScale: p.in_scale,
        note: p.note,
      })),
    [pitchPoints, PX_PER_SEC]
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>피치 그래프</Text>

      {/* 음정 점 그래프 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.graphArea, { width: GRAPH_W, height: GRAPH_H }]}>
          {/* 음역대 가이드라인 */}
          {[100, 200, 400, 800].map((hz) => (
            <View
              key={hz}
              style={[styles.guideline, { top: hzToY(hz) }]}
            >
              <Text style={styles.guideLabel}>{hz}Hz</Text>
            </View>
          ))}

          {/* 피치 점들 */}
          {dots.map((d, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: d.x - 2,
                  top: d.y - 2,
                  backgroundColor: d.inScale ? '#74b9ff' : '#ff6b6b',
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#74b9ff' }]} />
          <Text style={styles.legendText}>음계 내 음정</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ff6b6b' }]} />
          <Text style={styles.legendText}>음정 이탈</Text>
        </View>
      </View>

      {/* 구간별 정확도 바 */}
      <Text style={styles.sectionTitle}>구간별 분석</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.sectionsRow}>
          {sections.map((sec) => {
            const color = issueColor(sec.dominant_issue);
            const avgAcc = (sec.pitch_accuracy + sec.rhythm_accuracy) / 2;
            return (
              <View key={sec.index} style={styles.sectionCard}>
                <View style={styles.sectionBarBg}>
                  <View
                    style={[
                      styles.sectionBarFill,
                      { height: `${avgAcc}%` as any, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={[styles.sectionAccText, { color }]}>
                  {Math.round(avgAcc)}%
                </Text>
                <Text style={styles.sectionTime}>
                  {sec.start}s
                </Text>
                <Text style={[styles.sectionIssue, { color }]}>
                  {issueLabel(sec.dominant_issue)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  graphArea: { position: 'relative', backgroundColor: '#0a0a1a', borderRadius: 10 },
  guideline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1a1a3a',
  },
  guideLabel: {
    position: 'absolute',
    right: 4,
    top: -8,
    color: '#333',
    fontSize: 8,
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: { flexDirection: 'row', gap: 16, paddingLeft: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#aaa', fontSize: 12 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 4 },
  sectionsRow: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  sectionCard: { alignItems: 'center', gap: 4, width: 64 },
  sectionBarBg: {
    width: 36,
    height: 80,
    backgroundColor: '#1a1a3a',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sectionBarFill: { width: '100%', borderRadius: 6 },
  sectionAccText: { fontSize: 13, fontWeight: 'bold' },
  sectionTime: { color: '#555', fontSize: 10 },
  sectionIssue: { fontSize: 9, textAlign: 'center', lineHeight: 12 },
});
