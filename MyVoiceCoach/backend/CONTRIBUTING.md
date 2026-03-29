# 기여 가이드라인

MyVoiceCoach 백엔드에 기여해주셔서 감사합니다.
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
git checkout -b feature/add-vibrato-detection
git checkout -b fix/pitch-analysis-nan-error
git checkout -b docs/update-api-reference
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
| `perf` | 성능 개선 |
| `test` | 테스트 추가·수정 |
| `docs` | 문서 수정 |
| `chore` | 빌드·패키지·설정 변경 |
| `style` | 포매팅, 세미콜론 등 (로직 변경 없음) |

### 예시

```bash
# 좋은 예
git commit -m "feat(analyzer): add vibrato detection using frequency variance"
git commit -m "fix(tts): handle ElevenLabs API timeout with retry logic"
git commit -m "refactor(coach): extract problem section builder to separate function"
git commit -m "docs: update /api/analyze response schema in README"

# 나쁜 예
git commit -m "수정"
git commit -m "fix bug"
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
- [ ] 로컬에서 서버 정상 실행 확인 (`uvicorn main:app --reload`)
- [ ] 새로운 엔드포인트 추가 시 API 명세 문서 업데이트
- [ ] 환경 변수 추가 시 `.env.example` 업데이트

### PR 작성 규칙

- 제목: 커밋 컨벤션과 동일한 형식 (`feat: ...`)
- 본문: PR 템플릿 항목 모두 작성
- 리뷰어 최소 1명 지정
- 작업 중인 PR은 제목 앞에 `[WIP]` 표시

### 리뷰 규칙

- 리뷰어는 PR 오픈 후 **24시간 이내** 1차 리뷰
- `Request changes` 후 수정 완료 시 리뷰어에게 Re-review 요청
- `Approve` 없이 셀프 머지 금지
- 논의가 필요한 경우 GitHub Comment 또는 팀 채널에서 소통

---

## 코드 스타일

### Python

- **포매터**: `black` (줄 길이 100)
- **린터**: `ruff`
- **타입 힌트**: 모든 함수에 필수

```bash
# 포매팅
black app/ main.py

# 린트
ruff check app/ main.py
```

### 규칙

```python
# 함수 타입 힌트 필수
def analyze_pitch(y: np.ndarray, sr: int, song: Song | None = None) -> PitchAnalysis:
    ...

# 상수는 대문자 스네이크케이스
SECTION_DURATION = 4.0
MAX_SIZE_MB = 50

# 클래스·함수명
class AudioAnalyzer:       # PascalCase
def analyze_audio():       # snake_case

# 불필요한 주석 금지 — 코드로 의도를 표현
# Bad
# 음정 분석 함수
def analyze_pitch(...):

# Good
def analyze_pitch(...):
    """pYIN 알고리즘으로 음정 검출 후 구간별 이탈 구간 반환"""
```

### 의존성 추가

```bash
# 패키지 추가 후 반드시 requirements.txt 업데이트
pip install new-package
pip freeze | grep new-package >> requirements.txt
```

---

## 이슈 작성 규칙

- 버그: `[BUG]` 템플릿 사용
- 기능 요청: `[FEAT]` 템플릿 사용
- 제목은 구체적으로 작성 (`오류남` ❌ → `pyin() 분석 시 NaN 반환 오류` ✅)
- 중복 이슈 확인 후 생성

---

## 로컬 개발 환경

```bash
# 1. 레포 클론
git clone https://github.com/KimnPark-Dev/MyVoiceCoach-backend.git
cd MyVoiceCoach-backend

# 2. 가상환경 설정
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경 변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 5. 서버 실행
uvicorn main:app --reload --port 8000

# API 문서 확인
# http://localhost:8000/docs
```

---

## 문의

궁금한 점은 GitHub Issues 또는 팀 채널에서 자유롭게 질문해주세요.
