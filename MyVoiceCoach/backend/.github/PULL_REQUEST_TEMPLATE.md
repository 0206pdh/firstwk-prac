## 개요

> 이 PR에서 무엇을 변경했나요? 한 문장으로 요약해주세요.

---

## 변경 사항

-
-

---

## 변경 유형

- [ ] 새 기능 (`feat`)
- [ ] 버그 수정 (`fix`)
- [ ] 리팩토링 (`refactor`)
- [ ] 성능 개선 (`perf`)
- [ ] 문서 수정 (`docs`)
- [ ] 설정·빌드 변경 (`chore`)

---

## 관련 이슈

> 관련 이슈 번호를 적어주세요. (없으면 삭제)

- Closes #
- Related to #

---

## 테스트 방법

> 리뷰어가 직접 테스트할 수 있도록 재현 방법을 작성해주세요.

```bash
# 예시
uvicorn main:app --reload
curl -X POST http://localhost:8000/api/analyze ...
```

---

## 체크리스트

- [ ] `develop` 최신 상태로 rebase / merge 완료
- [ ] 로컬 서버 정상 실행 확인 (`uvicorn main:app --reload`)
- [ ] 새 엔드포인트 추가 시 README API 명세 업데이트
- [ ] 환경 변수 추가 시 `.env.example` 업데이트
- [ ] 커밋 메시지 컨벤션 준수 (`feat:`, `fix:` 등)

---

## 기타 참고사항

> 리뷰어에게 전달할 내용이 있으면 적어주세요. (없으면 삭제)
