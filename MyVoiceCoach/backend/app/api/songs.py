from fastapi import APIRouter, HTTPException
from app.services.reference_service import get_all_songs, search_songs, get_song_by_id
from app.models.song import Song

router = APIRouter(prefix="/api/songs", tags=["songs"])


@router.get("", response_model=list[Song])
def list_songs():
    return get_all_songs()


@router.get("/search", response_model=list[Song])
def search(q: str):
    return search_songs(q)


@router.get("/{song_id}", response_model=Song)
def get_song(song_id: str):
    song = get_song_by_id(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="노래를 찾을 수 없습니다.")
    return song
