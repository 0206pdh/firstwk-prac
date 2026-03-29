import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.audio_analyzer import analyze_audio
from app.services.coach import generate_coaching
from app.services.reference_service import get_song_by_id
from app.models.analysis import AnalyzeResponse

router = APIRouter(prefix="/api", tags=["analyze"])

ALLOWED_TYPES = {
    "audio/wav", "audio/mpeg", "audio/mp4",
    "audio/m4a", "audio/x-m4a", "audio/aac",
}
MAX_SIZE_MB = 50


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_singing(
    audio: UploadFile = File(...),
    song_id: str = Form(default=""),
):
    if audio.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다. (wav, mp3, m4a, aac)")

    content = await audio.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"파일이 {MAX_SIZE_MB}MB를 초과합니다.")

    song = get_song_by_id(song_id) if song_id else None

    suffix = os.path.splitext(audio.filename or "audio.m4a")[1] or ".m4a"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        analysis = analyze_audio(tmp_path, song)
        coaching = generate_coaching(analysis, song)
        return AnalyzeResponse(analysis=analysis, coaching=coaching)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류: {str(e)}")
    finally:
        os.unlink(tmp_path)
