# MyVoiceCoach — 백엔드

> AI 보컬 코칭 API 서버. 녹음된 노래를 분석해 음정·박자 피드백을 생성하고, ElevenLabs 음성으로 코칭 오디오를 합성합니다.

---

## 개요

**MyVoiceCoach 백엔드**는 Python/FastAPI 기반 서버입니다.

**처리 흐름:**
1. 모바일 앱에서 녹음 파일(m4a / wav / mp3) 수신
2. `librosa pYIN`으로 음정 검출, `beat_track`으로 박자 분석
3. 분석 결과를 Claude API로 전송 → 구간별 코칭 텍스트 생성
4. ElevenLabs 코칭 음성 + 음정 시연음(사인파)을 단일 WAV로 합성
5. 전체 결과를 JSON으로 반환

---

## 아키텍처

```
모바일 앱
    │  POST /api/analyze  (multipart: 오디오 파일 + song_id)
    ▼
FastAPI
    ├── audio_analyzer.py   ← librosa: 음정(pYIN) + 박자 + 구간별 분석
    ├── coach.py            ← Claude API: CoachingSegment[] JSON 생성
    ├── tts_service.py      ← ElevenLabs: 한국어 코칭 음성 (eleven_multilingual_v2)
    ├── tone_service.py     ← scipy: 사인파 음정 시연 오디오
    └── /api/coaching/generate  ← 음성 + 시연음 → 단일 WAV 합성
```

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | FastAPI 0.115 |
| 음정 검출 | librosa `pyin()` (probabilistic YIN) |
| 박자 분석 | librosa `beat.beat_track()` |
| 구간 분석 | 4초 단위 윈도우 방식 |
| AI 코칭 텍스트 | Anthropic Claude (`claude-sonnet-4-6`) |
| 코칭 음성 | ElevenLabs `eleven_multilingual_v2` |
| 음정 시연음 | scipy + numpy (ffmpeg 불필요) |
| 데이터 검증 | Pydantic v2 |

---

## 시작하기

### 사전 준비

- Python 3.11 이상
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `ELEVENLABS_API_KEY` — [elevenlabs.io](https://elevenlabs.io) (무료 플랜 있음)

### 설치

```bash
git clone https://github.com/KimnPark-Dev/MyVoiceCoach-backend.git
cd MyVoiceCoach-backend

python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=sk_...
```

### 실행

```bash
uvicorn main:app --reload --port 8000
```

API 문서: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API 명세

### `GET /api/songs`
전체 노래 목록 반환

```json
[
  {
    "id": "iu_celebrity",
    "title": "Celebrity",
    "artist": "아이유 (IU)",
    "bpm": 110,
    "key": "G",
    "difficulty": "easy",
    "genre": "pop",
    "vocal_range": { "low": "G3", "high": "D5" },
    "scale_notes": ["G", "A", "B", "C", "D", "E", "F#"]
  }
]
```

### `GET /api/songs/search?q={검색어}`
노래 제목, 아티스트, 장르로 검색

### `POST /api/analyze`
녹음된 노래를 분석합니다.

**요청:** `multipart/form-data`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `audio` | File | ✅ | 오디오 파일 (wav, mp3, m4a, aac) — 최대 50MB |
| `song_id` | string | ❌ | 노래 카탈로그 ID (스케일 기반 분석에 사용) |

**응답:**
```json
{
  "analysis": {
    "pitch": {
      "points": [{ "time": 0.1, "frequency": 261.6, "note": "C4", "cents_off": -12.3, "in_scale": true }],
      "average_cents_deviation": 34.2,
      "pitch_accuracy_percent": 78.5,
      "problem_sections": [
        { "start": 3.2, "end": 5.8, "issue": "음정이 낮게 이탈 (72cents)", "severity": "moderate", "target_note": "G4" }
      ]
    },
    "rhythm": {
      "beats": [{ "time": 0.55, "strength": 0.9 }],
      "estimated_bpm": 112.4,
      "rhythm_accuracy_percent": 85.0,
      "problem_sections": []
    },
    "sections": [
      { "index": 0, "start": 0.0, "end": 4.0, "pitch_accuracy": 82.0, "rhythm_accuracy": 91.0, "dominant_issue": null, "avg_cents_off": 21.3 }
    ],
    "duration_seconds": 24.5,
    "song_id": "iu_celebrity"
  },
  "coaching": {
    "overall_score": 74,
    "pitch_score": 70,
    "rhythm_score": 85,
    "summary": "박자는 안정적이나 일부 구간에서 음정이 낮게 이탈했어요.",
    "pitch_issues": ["3~5초 구간 음정이 낮음"],
    "rhythm_issues": [],
    "breathing_tips": ["고음 전 복식호흡으로 준비하세요"],
    "improvement_tips": ["계이름으로 천천히 음정 확인 후 다시 불러보세요"],
    "encouragement": "박자 감각이 좋아요! 음정만 조금 더 신경쓰면 금방 좋아질 거예요.",
    "coaching_segments": [
      {
        "order": 0,
        "speech_text": "전반적으로 박자는 좋았어요. 3초에서 5초 구간에서 음정이 살짝 낮았어요.",
        "section_start": null,
        "section_end": null,
        "demo_notes": [],
        "demo_durations": [],
        "issue_type": "summary"
      }
    ]
  }
}
```

### `POST /api/coaching/generate`
ElevenLabs 코칭 음성과 음정 시연음을 합성해 단일 WAV로 반환합니다.

**요청:**
```json
{
  "segments": [
    {
      "order": 0,
      "speech_text": "이 구간에서 G4 음을 목표로 해보세요.",
      "section_start": 3.0,
      "section_end": 5.5,
      "demo_notes": ["G4", "A4", "G4"],
      "demo_durations": [0.6, 0.6, 0.6],
      "issue_type": "pitch"
    }
  ]
}
```

**응답:**
```json
{
  "audio_base64": "UklGRiQAAABXQVZFZm10...",
  "duration_seconds": 12.4
}
```

---

## 노래 카탈로그

노래 데이터는 `app/data/songs.json`에서 관리합니다. 새 곡을 추가하려면:

```json
{
  "id": "고유_snake_case_id",
  "title": "노래 제목",
  "artist": "아티스트명",
  "bpm": 100,
  "key": "Am",
  "difficulty": "easy | medium | hard",
  "genre": "ballad | pop | kpop | rnb | rock",
  "vocal_range": { "low": "A3", "high": "E5" },
  "scale_notes": ["A", "B", "C", "D", "E", "F", "G"]
}
```

---

## 프로젝트 구조

```
MyVoiceCoach-backend/
├── main.py                      # FastAPI 앱 진입점
├── requirements.txt
├── .env.example
└── app/
    ├── config.py                # 환경 변수 설정 (pydantic-settings)
    ├── data/
    │   └── songs.json           # 노래 카탈로그
    ├── models/
    │   ├── song.py              # Song Pydantic 모델
    │   └── analysis.py          # 분석·코칭 모델
    ├── api/
    │   ├── analyze.py           # POST /api/analyze
    │   ├── songs.py             # GET /api/songs
    │   └── coaching.py          # POST /api/coaching/generate
    └── services/
        ├── audio_analyzer.py    # librosa 음정·박자 분석
        ├── coach.py             # Claude API 코칭 텍스트 생성
        ├── tts_service.py       # ElevenLabs TTS
        ├── tone_service.py      # 사인파 음정 시연음 합성
        └── reference_service.py # 노래 카탈로그 로더
```

---

## 브랜치 전략

```
main      ← 배포용 (PR + 리뷰 1명 필수)
develop   ← 기본 브랜치 (팀 통합)
feature/  ← 기능 개발
fix/      ← 버그 수정
```

## 커밋 컨벤션

```
feat:     새로운 기능
fix:      버그 수정
refactor: 코드 리팩토링
docs:     문서 수정
test:     테스트 추가·수정
chore:    빌드·설정 변경
```

---

## 기여 방법

1. 이 레포지토리를 Fork합니다
2. `develop` 기반으로 브랜치를 생성합니다: `git checkout -b feature/기능명`
3. 변경사항을 커밋합니다: `git commit -m "feat: 기능 설명"`
4. Push 후 `feature → develop` 방향으로 PR을 생성합니다

---

## 라이선스

MIT
