export interface VocalRange {
  low: string;
  high: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  difficulty: 'easy' | 'medium' | 'hard';
  genre: string;
  vocal_range: VocalRange;
  scale_notes: string[];
}

export interface PitchPoint {
  time: number;
  frequency: number;
  note: string;
  cents_off: number;
  in_scale: boolean;
}

export interface BeatPoint {
  time: number;
  strength: number;
}

export interface ProblemSection {
  start: number;
  end: number;
  issue: string;
  severity: 'mild' | 'moderate' | 'severe';
  target_note: string | null;
}

export interface SectionAnalysis {
  index: number;
  start: number;
  end: number;
  pitch_accuracy: number;
  rhythm_accuracy: number;
  dominant_issue: 'pitch_low' | 'pitch_high' | 'rhythm_fast' | 'rhythm_slow' | null;
  avg_cents_off: number;
}

export interface PitchAnalysis {
  points: PitchPoint[];
  average_cents_deviation: number;
  pitch_accuracy_percent: number;
  problem_sections: ProblemSection[];
}

export interface RhythmAnalysis {
  beats: BeatPoint[];
  estimated_bpm: number;
  rhythm_accuracy_percent: number;
  problem_sections: ProblemSection[];
}

export interface AnalysisResult {
  pitch: PitchAnalysis;
  rhythm: RhythmAnalysis;
  sections: SectionAnalysis[];
  duration_seconds: number;
  song_id: string | null;
}

export interface CoachingSegment {
  order: number;
  speech_text: string;
  section_start: number | null;
  section_end: number | null;
  demo_notes: string[];
  demo_durations: number[];
  issue_type: string;
}

export interface CoachingFeedback {
  overall_score: number;
  pitch_score: number;
  rhythm_score: number;
  summary: string;
  pitch_issues: string[];
  rhythm_issues: string[];
  breathing_tips: string[];
  improvement_tips: string[];
  encouragement: string;
  coaching_segments: CoachingSegment[];
}

export interface AnalyzeResponse {
  analysis: AnalysisResult;
  coaching: CoachingFeedback;
}
