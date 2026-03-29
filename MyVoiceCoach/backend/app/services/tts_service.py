"""
ElevenLabs TTS - AI 코치 음성 생성
한국어 지원: eleven_multilingual_v2 모델 사용
"""
from elevenlabs import ElevenLabs, VoiceSettings
from app.config import settings

_client: ElevenLabs | None = None


def get_client() -> ElevenLabs:
    global _client
    if _client is None:
        _client = ElevenLabs(api_key=settings.elevenlabs_api_key)
    return _client


# 권장 음성 ID (ElevenLabs 기본 제공)
# "Rachel" - 자연스럽고 따뜻한 여성 목소리, 다국어 지원 우수
COACH_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"


def generate_speech(text: str, voice_id: str = COACH_VOICE_ID) -> bytes:
    """텍스트 → MP3 bytes 변환 (한국어 지원)"""
    client = get_client()
    audio_generator = client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
        voice_settings=VoiceSettings(
            stability=0.55,
            similarity_boost=0.75,
            style=0.3,
            use_speaker_boost=True,
        ),
    )
    return b"".join(audio_generator)


def list_voices() -> list[dict]:
    """사용 가능한 음성 목록 반환"""
    client = get_client()
    voices = client.voices.get_all()
    return [{"id": v.voice_id, "name": v.name} for v in voices.voices]
