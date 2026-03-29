from pydantic import BaseModel
from typing import Optional


class PitchPoint(BaseModel):
    time: float       # seconds
    frequency: float  # Hz (0 = unvoiced)
    note: str         # e.g. "C4"
    cents_off: float  # deviation from nearest semitone
    in_scale: bool    # whether note is in the song's scale


class BeatPoint(BaseModel):
    time: float
    strength: float


class SectionAnalysis(BaseModel):
    index: int
    start: float
    end: float
    pitch_accuracy: float     # 0~100
    rhythm_accuracy: float    # 0~100
    dominant_issue: Optional[str]   # "pitch_low" | "pitch_high" | "rhythm_fast" | "rhythm_slow" | None
    avg_cents_off: float


class ProblemSection(BaseModel):
    start: float
    end: float
    issue: str
    severity: str   # "mild" | "moderate" | "severe"
    target_note: Optional[str]    # correct note to aim for


class PitchAnalysis(BaseModel):
    points: list[PitchPoint]
    average_cents_deviation: float
    pitch_accuracy_percent: float
    problem_sections: list[ProblemSection]


class RhythmAnalysis(BaseModel):
    beats: list[BeatPoint]
    estimated_bpm: float
    rhythm_accuracy_percent: float
    problem_sections: list[ProblemSection]


class AnalysisResult(BaseModel):
    pitch: PitchAnalysis
    rhythm: RhythmAnalysis
    sections: list[SectionAnalysis]
    duration_seconds: float
    song_id: Optional[str] = None


class CoachingSegment(BaseModel):
    """코칭 오디오 세그먼트: 음성 코멘트 + 시연음"""
    order: int
    speech_text: str           # ElevenLabs로 읽을 텍스트
    section_start: Optional[float]   # 해당하는 녹음 구간 시작
    section_end: Optional[float]
    demo_notes: list[str]      # 시연할 음 목록 (예: ["G4", "A4", "G4"])
    demo_durations: list[float]  # 각 음의 길이(초)
    issue_type: str   # "pitch" | "rhythm" | "breathing" | "summary"


class CoachingFeedback(BaseModel):
    overall_score: int
    pitch_score: int
    rhythm_score: int
    summary: str
    pitch_issues: list[str]
    rhythm_issues: list[str]
    breathing_tips: list[str]   # 호흡/자세 관련 (화면에만 표시)
    improvement_tips: list[str]
    encouragement: str
    coaching_segments: list[CoachingSegment]  # 순서대로 재생할 코칭 세그먼트


class AnalyzeResponse(BaseModel):
    analysis: AnalysisResult
    coaching: CoachingFeedback
