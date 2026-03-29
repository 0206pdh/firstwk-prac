# MyVoiceCoach — 모바일

> AI 보컬 코칭 모바일 앱 (iOS / Android). 노래를 녹음하면 음정·박자를 분석하고, AI 코치가 이어폰으로 직접 피드백을 들려줍니다.

---

## 개요

**MyVoiceCoach**는 노래 실력 향상을 돕는 AI 코칭 앱입니다.

**사용 흐름:**
```
노래 선택 → 3초 카운트다운 → 녹음 → 서버 분석 → 결과 화면
                                              ├── 피치 그래프 (구간별 시각화)
                                              ├── AI 코치 음성 재생 (이어폰)
                                              └── 호흡·발성 텍스트 팁
```

---

## 스크린샷

> _(개발 중 — 추후 추가 예정)_

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | React Native 0.74 + Expo 51 |
| 내비게이션 | Expo Router (파일 기반 라우팅) |
| 오디오 녹음 | `expo-av` |
| 오디오 재생 | `expo-av` (코칭 WAV 재생) |
| 상태 관리 | Zustand |
| HTTP 통신 | Axios |
| 시각화 | 커스텀 피치 점 그래프 |
| 언어 | TypeScript |

---

## 시작하기

### 사전 준비

- Node.js 20 이상
- 기기에 **Expo Go** 앱 설치 또는 Android / iOS 에뮬레이터
- 백엔드 서버 실행 중 (→ [MyVoiceCoach-backend](https://github.com/KimnPark-Dev/MyVoiceCoach-backend))

### 설치

```bash
git clone https://github.com/KimnPark-Dev/MyVoiceCoach-mobile.git
cd MyVoiceCoach-mobile

npm install
```

### 서버 주소 설정

`src/services/api.ts`에서 `BASE_URL`을 백엔드 서버 주소로 변경합니다:

```ts
// Android 에뮬레이터
export const BASE_URL = 'http://10.0.2.2:8000';

// 실제 기기 (컴퓨터의 LAN IP로 변경)
export const BASE_URL = 'http://192.168.x.x:8000';

// 프로덕션
export const BASE_URL = 'https://api.myvoicecoach.com';
```

### 실행

```bash
# Expo 개발 서버 시작
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

---

## 화면 구성

### 1. 노래 선택 (`app/index.tsx`)
- 전체 노래 목록 조회 및 검색
- 제목, 아티스트, BPM, 키, 난이도, 장르 표시
- 노래 선택 시 녹음 화면으로 이동

### 2. 녹음 (`app/recording.tsx`)
- 3초 카운트다운 후 자동 녹음 시작
- 실시간 진폭 파형 시각화 (8개 애니메이션 바)
- 정지 버튼 탭 → 자동 업로드 및 서버 분석 요청
- 분석 중 "AI가 분석 중이에요..." 로딩 표시

### 3. 피드백 (`app/feedback.tsx`)
- **점수 카드** — 종합 / 음정 / 박자 점수 (0~100)
- **피치 그래프** — 검출된 주파수를 음계 포함 여부에 따라 색상 구분해 표시
- **구간 정확도 바** — 4초 단위 구간별 정확도와 문제 유형 레이블
- **AI 음성 코칭** — 버튼 탭 시 ElevenLabs 코칭 음성 + 목표 음정 시연음 재생
- **문제 구간 타임라인** — 타임스탬프 + 심각도 색상으로 표시
- **호흡·발성 팁** — 화면 텍스트 전용 (음성 코칭에는 미포함)
- **연습 방법** — 번호 목록 형태의 구체적 연습법
- 다시 도전 버튼으로 노래 선택 화면으로 복귀

---

## 프로젝트 구조

```
MyVoiceCoach-mobile/
├── app/
│   ├── _layout.tsx          # 루트 레이아웃 (Stack 내비게이터)
│   ├── index.tsx            # 화면 1: 노래 선택
│   ├── recording.tsx        # 화면 2: 녹음
│   └── feedback.tsx         # 화면 3: 피드백 및 코칭
├── src/
│   ├── components/
│   │   ├── PitchGraph.tsx           # 피치 점 그래프 + 구간별 정확도 바
│   │   └── CoachAudioPlayer.tsx     # AI 코칭 오디오 플레이어
│   ├── services/
│   │   └── api.ts           # API 클라이언트 (노래 조회, 분석, 코칭 오디오)
│   ├── store/
│   │   └── useAppStore.ts   # 전역 상태 (선택된 노래, 분석 결과)
│   └── types/
│       └── index.ts         # 공유 TypeScript 타입 정의
├── app.json                 # Expo 설정 (권한, 스킴)
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 주요 타입

앱 전체에서 사용하는 핵심 TypeScript 인터페이스:

```ts
// 노래 카탈로그 항목
interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  difficulty: 'easy' | 'medium' | 'hard';
  genre: string;
  vocal_range: { low: string; high: string };
  scale_notes: string[];
}

// 구간별 분석 결과
interface SectionAnalysis {
  index: number;
  start: number;             // 초 단위
  end: number;
  pitch_accuracy: number;    // 0~100
  rhythm_accuracy: number;
  dominant_issue: 'pitch_low' | 'pitch_high' | 'rhythm_fast' | 'rhythm_slow' | null;
  avg_cents_off: number;
}

// 코칭 세그먼트 (음성 코멘트 + 음정 시연)
interface CoachingSegment {
  order: number;
  speech_text: string;          // ElevenLabs가 읽을 텍스트
  section_start: number | null;
  section_end: number | null;
  demo_notes: string[];         // 예: ["G4", "A4", "G4"]
  demo_durations: number[];
  issue_type: string;
}
```

---

## 권한

| 플랫폼 | 권한 | 용도 |
|---|---|---|
| iOS | `NSMicrophoneUsageDescription` | 노래 녹음 |
| Android | `RECORD_AUDIO` | 노래 녹음 |

---

## 백엔드 연동

이 앱은 [MyVoiceCoach-backend](https://github.com/KimnPark-Dev/MyVoiceCoach-backend) 서버가 필요합니다.

| 엔드포인트 | 사용 화면 |
|---|---|
| `GET /api/songs` | 노래 선택 화면 |
| `GET /api/songs/search?q=` | 노래 검색 |
| `POST /api/analyze` | 녹음 완료 후 자동 호출 |
| `POST /api/coaching/generate` | 코칭 듣기 버튼 탭 시 |

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
style:    UI · 스타일 변경
docs:     문서 수정
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
