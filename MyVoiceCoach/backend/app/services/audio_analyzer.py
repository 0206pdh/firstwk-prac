import numpy as np
import librosa
from app.models.analysis import (
    PitchPoint, BeatPoint, PitchAnalysis, RhythmAnalysis,
    AnalysisResult, ProblemSection, SectionAnalysis,
)
from app.models.song import Song

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
SECTION_DURATION = 4.0  # 4초 단위로 구간 분할


def hz_to_note(freq: float) -> tuple[str, float]:
    if freq <= 0:
        return "—", 0.0
    midi = 69 + 12 * np.log2(freq / 440.0)
    nearest_midi = round(midi)
    cents_off = (midi - nearest_midi) * 100
    octave = (nearest_midi // 12) - 1
    note_name = f"{NOTE_NAMES[nearest_midi % 12]}{octave}"
    return note_name, float(cents_off)


def note_in_scale(note_name: str, scale_notes: list[str]) -> bool:
    """노트명(예: 'G#4')에서 음이름만 추출해 스케일 포함 여부 확인"""
    pitch_class = note_name.rstrip("0123456789").rstrip("-")
    return pitch_class in scale_notes


def analyze_pitch(y: np.ndarray, sr: int, song: Song | None = None) -> PitchAnalysis:
    f0, voiced_flag, _ = librosa.pyin(
        y,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sr,
    )
    times = librosa.times_like(f0, sr=sr)
    scale_notes = song.scale_notes if song else []

    points: list[PitchPoint] = []
    cents_list: list[float] = []

    for t, freq, voiced in zip(times, f0, voiced_flag):
        if voiced and freq and not np.isnan(freq):
            note, cents_off = hz_to_note(float(freq))
            in_scale = note_in_scale(note, scale_notes) if scale_notes else True
            points.append(PitchPoint(
                time=float(t),
                frequency=float(freq),
                note=note,
                cents_off=cents_off,
                in_scale=in_scale,
            ))
            cents_list.append(abs(cents_off))

    avg_cents = float(np.mean(cents_list)) if cents_list else 0.0
    accurate = sum(1 for c in cents_list if c <= 50)
    accuracy = (accurate / len(cents_list) * 100) if cents_list else 0.0
    problem_sections = _find_pitch_problems(points)

    return PitchAnalysis(
        points=points,
        average_cents_deviation=avg_cents,
        pitch_accuracy_percent=round(accuracy, 1),
        problem_sections=problem_sections,
    )


def _find_pitch_problems(points: list[PitchPoint]) -> list[ProblemSection]:
    problems: list[ProblemSection] = []
    if not points:
        return problems

    in_problem = False
    start_time = 0.0
    problem_cents: list[float] = []

    for p in points:
        if abs(p.cents_off) > 50 and not in_problem:
            in_problem = True
            start_time = p.time
            problem_cents = [p.cents_off]
        elif abs(p.cents_off) > 50 and in_problem:
            problem_cents.append(p.cents_off)
        elif abs(p.cents_off) <= 50 and in_problem:
            in_problem = False
            duration = p.time - start_time
            if duration > 0.3:
                avg = float(np.mean(problem_cents))
                direction = "높게" if avg > 0 else "낮게"
                severity = "severe" if abs(avg) > 100 else ("moderate" if abs(avg) > 70 else "mild")
                problems.append(ProblemSection(
                    start=round(start_time, 2),
                    end=round(p.time, 2),
                    issue=f"음정이 {direction} 이탈 ({abs(avg):.0f}cents)",
                    severity=severity,
                    target_note=p.note,
                ))
            problem_cents = []

    return problems


def analyze_rhythm(y: np.ndarray, sr: int) -> RhythmAnalysis:
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_norm = onset_env / (onset_env.max() + 1e-6)

    beats: list[BeatPoint] = []
    for bt in beat_times:
        frame = librosa.time_to_frames(bt, sr=sr)
        strength = float(onset_norm[min(frame, len(onset_norm) - 1)])
        beats.append(BeatPoint(time=float(bt), strength=strength))

    if len(beat_times) > 2:
        intervals = np.diff(beat_times)
        expected = 60.0 / float(tempo)
        deviations = np.abs(intervals - expected) / expected
        rhythm_accuracy = max(0.0, (1.0 - float(np.mean(deviations))) * 100)
    else:
        rhythm_accuracy = 0.0

    problem_sections = _find_rhythm_problems(beats, float(tempo))
    return RhythmAnalysis(
        beats=beats,
        estimated_bpm=round(float(tempo), 1),
        rhythm_accuracy_percent=round(rhythm_accuracy, 1),
        problem_sections=problem_sections,
    )


def _find_rhythm_problems(beats: list[BeatPoint], bpm: float) -> list[ProblemSection]:
    if len(beats) < 3:
        return []
    expected = 60.0 / bpm
    problems: list[ProblemSection] = []
    for i in range(1, len(beats)):
        interval = beats[i].time - beats[i - 1].time
        deviation = abs(interval - expected) / expected
        if deviation > 0.2:
            issue = "박자가 빨라요" if interval < expected else "박자가 느려요"
            severity = "severe" if deviation > 0.4 else ("moderate" if deviation > 0.3 else "mild")
            problems.append(ProblemSection(
                start=round(beats[i - 1].time, 2),
                end=round(beats[i].time, 2),
                issue=issue,
                severity=severity,
                target_note=None,
            ))
    return problems


def build_sections(
    pitch: PitchAnalysis,
    rhythm: RhythmAnalysis,
    duration: float,
) -> list[SectionAnalysis]:
    """전체 녹음을 SECTION_DURATION초 단위로 나눠 구간별 정확도 계산"""
    sections: list[SectionAnalysis] = []
    n_sections = max(1, int(np.ceil(duration / SECTION_DURATION)))

    for i in range(n_sections):
        start = i * SECTION_DURATION
        end = min((i + 1) * SECTION_DURATION, duration)

        # 구간 내 피치 포인트
        section_pts = [p for p in pitch.points if start <= p.time < end]
        if section_pts:
            cents = [abs(p.cents_off) for p in section_pts]
            avg_cents = float(np.mean(cents))
            pitch_acc = float(np.mean([1 for c in cents if c <= 50])) / len(cents) * 100
        else:
            avg_cents = 0.0
            pitch_acc = 100.0

        # 구간 내 리듬 문제
        rhythm_probs = [p for p in rhythm.problem_sections if start <= p.start < end]
        if rhythm_probs:
            rhythm_acc = max(0.0, 100.0 - len(rhythm_probs) * 15.0)
        else:
            rhythm_acc = 100.0

        # 주요 문제 판단
        pitch_probs = [p for p in pitch.problem_sections if start <= p.start < end]
        dominant_issue = None
        if pitch_probs:
            avg_c = np.mean([float(p.issue.split("(")[1].replace("cents)", "")) for p in pitch_probs if "cents)" in p.issue] or [0])
            if avg_c > 0:
                dominant_issue = "pitch_high"
            else:
                dominant_issue = "pitch_low"
        elif rhythm_probs:
            dominant_issue = "rhythm_fast" if "빨라" in rhythm_probs[0].issue else "rhythm_slow"

        sections.append(SectionAnalysis(
            index=i,
            start=round(start, 2),
            end=round(end, 2),
            pitch_accuracy=round(pitch_acc, 1),
            rhythm_accuracy=round(rhythm_acc, 1),
            dominant_issue=dominant_issue,
            avg_cents_off=round(avg_cents, 1),
        ))

    return sections


def analyze_audio(audio_path: str, song: Song | None = None) -> AnalysisResult:
    y, sr = librosa.load(audio_path, sr=22050, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    pitch = analyze_pitch(y, sr, song)
    rhythm = analyze_rhythm(y, sr)
    sections = build_sections(pitch, rhythm, duration)

    return AnalysisResult(
        pitch=pitch,
        rhythm=rhythm,
        sections=sections,
        duration_seconds=round(duration, 2),
        song_id=song.id if song else None,
    )
