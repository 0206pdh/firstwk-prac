"""
정확한 음정 시연용 오디오 생성 (scipy 기반, ffmpeg 불필요)
ElevenLabs 코칭 음성 사이에 삽입될 '이렇게 불러보세요' 음정 데모
"""
import io
import numpy as np
from scipy.io import wavfile

SAMPLE_RATE = 44100

NOTE_TO_MIDI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11,
}


def note_to_hz(note_name: str) -> float:
    """'G4' → Hz 변환"""
    pitch_class = note_name.rstrip("0123456789")
    octave = int(note_name[len(pitch_class):])
    semitone = NOTE_TO_MIDI.get(pitch_class, 0)
    midi = (octave + 1) * 12 + semitone
    return 440.0 * (2 ** ((midi - 69) / 12))


def _sine_with_envelope(freq: float, duration: float, volume: float = 0.6) -> np.ndarray:
    """부드러운 envelope를 가진 사인파 생성"""
    n_samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)

    # 기본 사인파 + 배음 추가 (더 자연스러운 소리)
    wave = (
        np.sin(2 * np.pi * freq * t) * 0.6
        + np.sin(2 * np.pi * freq * 2 * t) * 0.25
        + np.sin(2 * np.pi * freq * 3 * t) * 0.1
        + np.sin(2 * np.pi * freq * 4 * t) * 0.05
    )

    # Attack-Sustain-Release envelope
    attack = int(0.05 * SAMPLE_RATE)
    release = int(0.1 * SAMPLE_RATE)
    envelope = np.ones(n_samples)
    if attack > 0:
        envelope[:attack] = np.linspace(0, 1, attack)
    if release > 0 and release < n_samples:
        envelope[-release:] = np.linspace(1, 0, release)

    return wave * envelope * volume


def _silence(duration: float) -> np.ndarray:
    return np.zeros(int(SAMPLE_RATE * duration))


def generate_note_sequence(
    notes: list[str],
    durations: list[float],
    gap: float = 0.1,
) -> bytes:
    """
    노트 시퀀스를 WAV bytes로 생성
    notes: ["G4", "A4", "G4"]
    durations: [0.5, 0.5, 0.5]
    """
    segments: list[np.ndarray] = []
    for note, dur in zip(notes, durations):
        hz = note_to_hz(note)
        segments.append(_sine_with_envelope(hz, dur))
        if gap > 0:
            segments.append(_silence(gap))

    if not segments:
        return b""

    combined = np.concatenate(segments)
    combined = np.clip(combined, -1.0, 1.0)
    pcm = (combined * 32767).astype(np.int16)

    buf = io.BytesIO()
    wavfile.write(buf, SAMPLE_RATE, pcm)
    return buf.getvalue()


def generate_scale_demo(root_note: str, scale_notes: list[str], octave: int = 4) -> bytes:
    """스케일 전체 시연 (올라갔다 내려오기)"""
    notes_up = [f"{n}{octave}" for n in scale_notes]
    notes_up.append(f"{scale_notes[0]}{octave + 1}")
    notes_down = list(reversed(notes_up[:-1]))
    all_notes = notes_up + notes_down
    durations = [0.4] * len(all_notes)
    return generate_note_sequence(all_notes, durations, gap=0.05)
