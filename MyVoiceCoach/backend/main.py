from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.analyze import router as analyze_router
from app.api.songs import router as songs_router
from app.api.coaching import router as coaching_router

app = FastAPI(
    title="MyVoiceCoach API",
    description="노래 음정/박자 분석 + AI 코칭 음성 생성",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(songs_router)
app.include_router(coaching_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.2.0"}
