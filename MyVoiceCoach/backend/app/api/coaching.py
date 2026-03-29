"""
코칭 오디오 생성 엔드포인트
- ElevenLabs로 코칭 음성 생성
- 음정 시연음(사인파)과 합성해서 단일 WAV 반환
"""
import io
import base64
import numpy as np
from scipy.io import wavfile
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.tts_service import generate_speech
from app.services.tone_service import generate_note_sequence, SAMPLE_RATE
from app.models.analysis import CoachingSegment

router = APIRouter(prefix="/api/coaching", tags=["coaching"])

SEGMENT_GAP_SEC = 0.6  # 음성 → 시연음 사이 간격


class GenerateAudioRequest(BaseModel):
    segments: list[CoachingSegment]


class GenerateAudioResponse(BaseModel):
    audio_base64: str   # WAV base64
    duration_seconds: float


@router.post("/generate", response_model=GenerateAudioResponse)
def generate_coaching_audio(req: GenerateAudioRequest):
    """
    코칭 세그먼트 목록을 받아 전체 코칭 오디오를 하나의 WAV로 반환
    순서: 음성 코멘트 → (간격) → 시연음 → (간격) → 다음 세그먼트...
    """
    if not req.segments:
        raise HTTPException(status_code=400, detail="세그먼트가 없습니다.")

    all_samples: list[np.ndarray] = []

    def silence(sec: float) -> np.ndarray:
        return np.zeros(int(SAMPLE_RATE * sec), dtype=np.float32)

    def mp3_to_float(mp3_bytes: bytes) -> np.ndarray:
        """MP3 bytes → float32 numpy array (간단한 변환)"""
        # ElevenLabs는 MP3 반환 → WAV로 재해석 필요
        # scipy는 MP3 미지원이므로 간단히 soundfile 사용
        import soundfile as sf
        buf = io.BytesIO(mp3_bytes)
        try:
            data, sr = sf.read(buf, dtype="float32")
            if data.ndim > 1:
                data = data.mean(axis=1)
            # SAMPLE_RATE(44100)와 다를 경우 resampling
            if sr != SAMPLE_RATE:
                import librosa
                data = librosa.resample(data, orig_sr=sr, target_sr=SAMPLE_RATE)
            return data
        except Exception:
            return np.array([], dtype=np.float32)

    for seg in sorted(req.segments, key=lambda s: s.order):
        # 1) 음성 코멘트
        try:
            speech_mp3 = generate_speech(seg.speech_text)
            speech_arr = mp3_to_float(speech_mp3)
            if len(speech_arr):
                all_samples.append(speech_arr)
                all_samples.append(silence(SEGMENT_GAP_SEC))
        except Exception as e:
            # TTS 실패 시 건너뜀 (개발 중 API 키 없을 때 대비)
            pass

        # 2) 음정 시연음 (있을 때만)
        if seg.demo_notes and seg.demo_durations:
            tone_wav = generate_note_sequence(seg.demo_notes, seg.demo_durations)
            if tone_wav:
                buf = io.BytesIO(tone_wav)
                _, tone_data = wavfile.read(buf)
                tone_float = tone_data.astype(np.float32) / 32767.0
                all_samples.append(tone_float)
                all_samples.append(silence(SEGMENT_GAP_SEC))

    if not all_samples:
        raise HTTPException(status_code=500, detail="오디오 생성 실패")

    combined = np.concatenate(all_samples)
    combined = np.clip(combined, -1.0, 1.0)
    pcm = (combined * 32767).astype(np.int16)

    out_buf = io.BytesIO()
    wavfile.write(out_buf, SAMPLE_RATE, pcm)
    wav_bytes = out_buf.getvalue()

    duration = len(combined) / SAMPLE_RATE
    return GenerateAudioResponse(
        audio_base64=base64.b64encode(wav_bytes).decode(),
        duration_seconds=round(duration, 2),
    )


@router.post("/tone")
def get_tone_only(notes: list[str], durations: list[float]):
    """단일 음정 시연음 반환 (테스트용)"""
    wav_bytes = generate_note_sequence(notes, durations)
    return Response(content=wav_bytes, media_type="audio/wav")
