# TODOS

## TODO-1: Song Catalog Expansion
**What:** songs.json에 노래 추가 경로 만들기 (어드민 UI 또는 유저가 직접 Key/BPM 입력)
**Why:** 현재 8개 노래만 있음. 유저가 연습하려는 노래가 없을 경우 pitch accuracy가 무의미해짐 (song.key 없이 in_scale 피드백 불가).
**Context:** `reference_service.py`는 정적 JSON 로드. 노래 선택을 필수로 결정했으므로 카탈로그 확장이 바로 다음 단계. 최소: `songs.json`에 20-30개 K-pop 주요 곡 추가.
**Depends on:** 없음 (지금 바로 가능)
**Priority:** High (노래 선택 필수 결정 이후 즉시)

---

## TODO-2: ElevenLabs TTS 병렬화
**What:** `/api/coaching/generate`의 직렬 ElevenLabs 호출 → asyncio.gather로 병렬 실행
**Why:** 현재 5개 세그먼트 직렬 호출 ~10-20초. 병렬 실행 시 ~2-4초로 단축 가능.
**Context:** `backend/app/api/coaching.py` lines 64-84 확인. 각 ElevenLabs 호출을 `asyncio.to_thread`로 감싸고 `asyncio.gather(*calls)` 실행.
**Depends on:** Issue 1 (asyncio.to_thread) 적용 완료 후
**Priority:** Medium (UX 개선, 핵심 기능 아님)

---

## TODO-3: 진도 추적 (Progress Tracking)
**What:** 세션 간 분석 결과 저장 + "지난번보다 나아졌나요?" 시각화
**Why:** 현재 MVP는 세션 데이터 저장 없음. 장기 리텐션을 위한 핵심 동력 부재. Adaptive Coach(Approach B)의 핵심 기능.
**Context:** P4 검증(실제 사용자 10명) 완료 후 진행. 데이터 저장: 서버 측 SQLite 또는 간단한 JSONL 로그 + 모바일 AsyncStorage.
**Depends on:** P4 검증 완료, 유저 계정 시스템(또는 디바이스 ID)
**Priority:** Low (P4 검증 후)
