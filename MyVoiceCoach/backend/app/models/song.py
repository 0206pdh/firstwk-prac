from pydantic import BaseModel


class VocalRange(BaseModel):
    low: str
    high: str


class Song(BaseModel):
    id: str
    title: str
    artist: str
    bpm: float
    key: str
    difficulty: str   # easy / medium / hard
    genre: str
    vocal_range: VocalRange
    scale_notes: list[str]
