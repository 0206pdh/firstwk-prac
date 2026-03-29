# 기여 가이드라인

MyVoiceCoach 모바일 앱에 기여해주셔서 감사합니다.
원활한 협업을 위해 아래 규칙을 꼭 읽어주세요.

---

## 목차

1. [브랜치 전략](#브랜치-전략)
2. [커밋 컨벤션](#커밋-컨벤션)
3. [Pull Request 규칙](#pull-request-규칙)
4. [코드 스타일](#코드-스타일)
5. [이슈 작성 규칙](#이슈-작성-규칙)
6. [로컬 개발 환경](#로컬-개발-환경)

---

## 브랜치 전략

```
main        배포용 브랜치 — 직접 push 금지, PR + 리뷰 1명 승인 필수
develop     기본 통합 브랜치 — 모든 작업은 여기서 분기
feature/*   새 기능 개발
fix/*       버그 수정
hotfix/*    프로덕션 긴급 수정 (main에서 분기 후 main·develop 양쪽에 머지)
docs/*      문서 작업만 포함할 때
refactor/*  기능 변경 없는 코드 개선
```

### 브랜치 생성 규칙

```bash
# 항상 최신 develop에서 분기
git checkout develop
git pull origin develop
git checkout -b feature/기능명

# 예시
git checkout -b feature/pitch-graph-zoom
git checkout -b fix/recording-permission-crash
git checkout -b style/feedback-screen-redesign
```

---

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따릅니다.

### 형식

```
<타입>(<범위>): <요약>

[본문 — 선택사항]

[푸터 — 선택사항]
```

### 타입

| 타입 | 설명 |
|---|---|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변경 없는 코드 개선 |
| `style` | UI·스타일 변경 (로직 변경 없음) |
| `perf` | 성능 개선 |
| `test` | 테스트 추가·수정 |
| `docs` | 문서 수정 |
| `chore` | 패키지·설정 변경 |

### 예시

```bash
# 좋은 예
git commit -m "feat(feedback): add section accuracy bar chart"
git commit -m "fix(recording): resolve audio permission crash on Android 14"
git commit -m "style(song-select): update difficulty badge colors"
git commit -m "refactor(store): migrate to useAppStore from useRecordingStore"

# 나쁜 예
git commit -m "수정"
git commit -m "fix"
git commit -m "작업중"
```

### 규칙

- 요약은 **50자 이내**, 마침표 없이 작성
- 본문이 필요하면 요약과 한 줄 띄운 후 작성
- 한국어·영어 모두 허용 (팀 내 통일 권장)

---

## Pull Request 규칙

### PR 방향

```
feature/* → develop    일반 기능 개발
fix/*      → develop    버그 수정
hotfix/*   → main       긴급 수정 (이후 develop에도 머지)
develop    → main       배포 (스프린트 완료 시)
```

### PR 전 체크리스트

- [ ] `develop` 최신 상태로 rebase 또는 merge 완료
- [ ] Android / iOS 에뮬레이터에서 정상 동작 확인
- [ ] 새로운 컴포넌트 추가 시 Props 타입 정의 완료
- [ ] 새로운 API 연동 시 `src/services/api.ts` 및 `src/types/index.ts` 업데이트

### PR 작성 규칙

- 제목: 커밋 컨벤션과 동일한 형식 (`feat: ...`)
- 본문: PR 템플릿 항목 모두 작성
- UI 변경이 있을 경우 **스크린샷 또는 영상 첨부 필수**
- 리뷰어 최소 1명 지정
- 작업 중인 PR은 제목 앞에 `[WIP]` 표시

### 리뷰 규칙

- 리뷰어는 PR 오픈 후 **24시간 이내** 1차 리뷰
- `Request changes` 후 수정 완료 시 리뷰어에게 Re-review 요청
- `Approve` 없이 셀프 머지 금지
- 논의가 필요한 경우 GitHub Comment 또는 팀 채널에서 소통

---

## 코드 스타일

### TypeScript / React Native

- **포매터**: Prettier (기본 설정)
- **린터**: ESLint
- **타입**: `any` 사용 금지 (불가피한 경우 주석으로 이유 명시)

### 컴포넌트 작성 규칙

```tsx
// 1. Props 인터페이스는 파일 상단에 정의
interface Props {
  score: number;
  label: string;
  color?: string;   // 선택값은 ? 표시
}

// 2. 함수형 컴포넌트 + default export
export default function ScoreCard({ score, label, color = '#fff' }: Props) {
  return (
    <View style={styles.container}>
      ...
    </View>
  );
}

// 3. StyleSheet는 컴포넌트 하단에 선언
const styles = StyleSheet.create({
  container: { ... },
});
```

### 네이밍 규칙

```ts
// 컴포넌트 — PascalCase
PitchGraph.tsx
CoachAudioPlayer.tsx

// 훅 — use 접두사
useAppStore.ts
useRecordingStore.ts

// 유틸 함수 — camelCase
formatDuration()
hzToNote()

// 상수 — UPPER_SNAKE_CASE
const SECTION_DURATION = 4.0;
const BASE_URL = 'http://...';

// 타입·인터페이스 — PascalCase
interface SectionAnalysis { ... }
type RecordingState = 'idle' | 'recording' | ...;
```

### 파일 구조 규칙

- 화면 컴포넌트 → `app/` 폴더 (Expo Router)
- 재사용 컴포넌트 → `src/components/`
- API 통신 → `src/services/`
- 전역 상태 → `src/store/`
- 타입 정의 → `src/types/index.ts`

### 패키지 추가

```bash
# Expo 관련 패키지는 반드시 expo install 사용
npx expo install expo-새패키지

# 일반 패키지
npm install 패키지명
```

---

## 이슈 작성 규칙

- 버그: `[BUG]` 템플릿 사용
- 기능 요청: `[FEAT]` 템플릿 사용
- 제목은 구체적으로 작성 (`오류남` ❌ → `Android 14에서 마이크 권한 요청 시 앱 크래시` ✅)
- 재현 단계를 최대한 상세히 작성
- 중복 이슈 확인 후 생성

---

## 로컬 개발 환경

```bash
# 1. 레포 클론
git clone https://github.com/KimnPark-Dev/MyVoiceCoach-mobile.git
cd MyVoiceCoach-mobile

# 2. 의존성 설치
npm install

# 3. 백엔드 서버 주소 설정
# src/services/api.ts 에서 BASE_URL 수정

# 4. 개발 서버 실행
npx expo start

# Android 에뮬레이터
npx expo start --android

# iOS 시뮬레이터
npx expo start --ios
```

### 에뮬레이터 주소 참고

| 환경 | BASE_URL |
|---|---|
| Android 에뮬레이터 | `http://10.0.2.2:8000` |
| iOS 시뮬레이터 | `http://localhost:8000` |
| 실제 기기 | `http://컴퓨터-LAN-IP:8000` |

---

## 문의

궁금한 점은 GitHub Issues 또는 팀 채널에서 자유롭게 질문해주세요.
