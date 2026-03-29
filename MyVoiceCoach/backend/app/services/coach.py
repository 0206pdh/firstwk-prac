import json
import anthropic
from app.config import settings
from app.models.analysis import AnalysisResult, CoachingFeedback, CoachingSegment
from app.models.song import Song

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


def generate_coaching(analysis: AnalysisResult, song: Song | None = None) -> CoachingFeedback:
    pitch = analysis.pitch
    rhythm = analysis.rhythm

    song_ctx = f"노래: {song.title} - {song.artist} (Key: {song.key}, BPM: {song.bpm})" if song else "선택된 노래 없음"

    pitch_probs = "\n".join(
        f"- {p.start}s~{p.end}s: {p.issue} (심각도: {p.severity})"
        for p in pitch.problem_sections[:8]
    ) or "없음"

    rhythm_probs = "\n".join(
        f"- {p.start}s~{p.end}s: {p.issue} (심각도: {p.severity})"
        for p in rhythm.problem_sections[:8]
    ) or "없음"

    section_summary = "\n".join(
        f"- {s.start}s~{s.end}s: 음정 {s.pitch_accuracy:.0f}% / 박자 {s.rhythm_accuracy:.0f}%"
        for s in analysis.sections
    )

    prompt = f"""당신은 전문 보컬 코치입니다. 아래 분석 결과를 바탕으로 코칭 피드백을 생성하세요.

{song_ctx}
녹음 길이: {analysis.duration_seconds}초

[음정 분석]
정확도: {pitch.pitch_accuracy_percent}% | 평균 편차: {pitch.average_cents_deviation:.1f}cents
문제 구간:
{pitch_probs}

[박자 분석]
정확도: {rhythm.rhythm_accuracy_percent}% | 측정 BPM: {rhythm.estimated_bpm}
문제 구간:
{rhythm_probs}

[구간별 요약]
{section_summary}

다음 JSON을 정확히 반환하세요 (JSON 외 텍스트 없이):
{{
  "overall_score": 0~100,
  "pitch_score": 0~100,
  "rhythm_score": 0~100,
  "summary": "전체 한 줄 평가 (한국어)",
  "pitch_issues": ["음정 문제 1", "음정 문제 2"],
  "rhythm_issues": ["박자 문제 1", "박자 문제 2"],
  "breathing_tips": ["호흡/자세 팁 1", "호흡/자세 팁 2"],
  "improvement_tips": ["연습 방법 1", "연습 방법 2", "연습 방법 3"],
  "encouragement": "격려 메시지 (1~2문장)",
  "coaching_segments": [
    {{
      "order": 0,
      "speech_text": "전반적인 코멘트 (이어폰으로 들을 내용, 2~3문장)",
      "section_start": null,
      "section_end": null,
      "demo_notes": [],
      "demo_durations": [],
      "issue_type": "summary"
    }},
    {{
      "order": 1,
      "speech_text": "첫 번째 문제 구간 코멘트 + 이렇게 불러보라는 구체적 안내",
      "section_start": 문제구간시작,
      "section_end": 문제구간끝,
      "demo_notes": ["목표노트1", "목표노트2"],
      "demo_durations": [0.6, 0.6],
      "issue_type": "pitch 또는 rhythm"
    }}
  ]
}}

coaching_segments 작성 규칙:
- order 0은 항상 전체 요약 (section_start/end null)
- 문제 구간마다 1개씩, 최대 4개 추가
- speech_text는 이어폰으로 들을 자연스러운 한국어
- demo_notes는 해당 구간에서 목표해야 할 음 (예: ["G4","A4","G4"]), 음정 문제가 있을 때만
- 호흡 문제는 coaching_segments에 포함하지 말고 breathing_tips에만"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    data = json.loads(message.content[0].text.strip())

    segments = [CoachingSegment(**s) for s in data.pop("coaching_segments", [])]
    return CoachingFeedback(**data, coaching_segments=segments)
