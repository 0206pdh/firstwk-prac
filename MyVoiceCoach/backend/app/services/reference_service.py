"""노래 카탈로그 관리"""
import json
import os
from app.models.song import Song

_songs: list[Song] | None = None
_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "songs.json")


def _load() -> list[Song]:
    global _songs
    if _songs is None:
        with open(_DATA_PATH, encoding="utf-8") as f:
            _songs = [Song(**s) for s in json.load(f)]
    return _songs


def get_all_songs() -> list[Song]:
    return _load()


def search_songs(query: str) -> list[Song]:
    q = query.lower()
    return [
        s for s in _load()
        if q in s.title.lower() or q in s.artist.lower() or q in s.genre.lower()
    ]


def get_song_by_id(song_id: str) -> Song | None:
    return next((s for s in _load() if s.id == song_id), None)
