---
type: Concept
title: AI-네이티브 작업 방식 — 개발 세션의 행동 궤적
description: 96개 IDE 코딩 어시스턴트 세션(2025-04~2026-07)에서 추출한 "코드"가 아니라 "일하는 패턴" — 프롬프트·검증·에이전트 지휘 습관과 그 성장 궤적. Hyre "AI 활용도" 축의 구체적 증거 트레일.
tags: [identity, ai-native, workflow, swe, hyre-evidence, brane-surface, process-record]
timestamp: 2026-07-22
status: 행동 패턴 개념 · 96개 원자료에서 1차 합성 · 함축(implementation) 사실은 의도적으로 제외
---

# 무엇인가

archive 안의 **96개 IDE 코딩 어시스턴트 세션**(VS Code Copilot Chat 67 + Cursor 12 + Claude Code 17)은 특정 버그·특정 수정 같은 함축 사실로 보면 "durable하지 않아" 이전 소화 패스에서 정당하게 제외됐다. 그러나 같은 파일에는 **다른 신호**가 있다 — 이 사람이 기술 작업에서 *어떻게 AI와 협업하는가*(프롬프트 방식·검증 습관·에이전트 지휘력)와 그 **시간에 따른 변화**. 이 문서는 그 행동 패턴만 뽑아 합성한다. 코드는 여기 없다.

이것이 중요한 이유: [Hyre](../ventures/hyre.md)의 핵심 명제는 "AI가 산출물을 대신 만드는 시대엔 산출물의 신호 가치가 죽고 과정만 남는다"이고, brane은 그 "과정의 기록계"다. **이 96개 파일이 바로 그 과정 기록의 원형(原型) 샘플** — 한 사람의 실제 AI 협업 습관이 1년 3개월에 걸쳐 침전된 궤적이다. 동시에 이 사람의 SWE 역량을 뒷받침하는 유일한 행동 증거 트레일이기도 하다.

# 복잡도 궤적 — 실제로 상승한다 (지어낸 서사 아님)

기술 난이도가 시간에 따라 명확히 올라간다. 이건 지어낸 서사가 아니라 파일 자체가 증언한다:

- **2025-04**: Java 자료구조 — 스택 조작, 그래프 인접, 무한 루프/도달불가 코드 디버깅. 학부 과제 수준. ^[archive/2025-04-08-unreachable-code-and-stack-manipulation-fix.md]
- **2025-09 ~ 2025-12**: 집중적 C 프로그래밍 코스워크 — 구조체(`struct student`), 포인터 전환, 연결 리스트(next/prev pointer), 재귀, e^x 무한급수 근사, "memory address out of bounds". 컴파일러 오류 제목이 그대로 파일명이 된 초단문 세션이 다수. ^[archive/2025-10-02-struct-student-family-name-30-char-first-initial-int-age.md] ^[archive/2025-10-16-우린-next-pointer-밖에-업는데-prev-어떻게-구현.md] ^[archive/2025-11-04-memory-address-out-of-bounds-라고-떳어-왜지.md]
- **2025-07 / 2026-01**: 실제 앱 개발로 넘어감 — Flutter LoginPage(StatelessWidget→StatefulWidget, Supabase 인증), Cursor에서 식단 검색·캘린더 탭 기능, `npm run dev`. 코스워크에서 프로덕트로의 전환점. ^[archive/2025-07-15-issues-with-flutter-loginpage-implementation.md] ^[archive/2026-01-10-캘린더-탭-운동-기록-없음-너비.md]
- **2026-06 ~ 2026-07**: 완전한 에이전트 기반 개발. Claude Code로 `brix` 모노레포(red/green apple 헬스 앱)를 프로덕션 수준까지, notion-work MCP·Maestro QA 오케스트레이션, 다중 에이전트 위임. 세션 하나가 수천 줄 규모. ^[archive/2026-06-28-users-jw-jw-projects-ide-opened-file-the-user-opened-the-fil.md] ^[archive/2026-06-27-users-jw-jw-projects-brix-ide-selection-the-user-selected-th.md]
- **2026-07-21**: 마침내 **brane 자체를 Claude Code로 설계·구축** — 로그 스크레이퍼의 아키텍처(브라우저 확장 vs 로컬 CLI 에이전트, 어댑터 리버스엔지니어링의 유지보수 부담)를 에이전트와 함께 트레이드오프 저울질. ^[archive/2026-07-21-users-jw-jw-projects-brane-ide-opened-file-the-user-opened-t.md]

**규모 대비도 그 자체로 정량 신호**: 2025년 코스워크 파일은 대개 7~11줄(오류 한 줄 붙여넣기)인데, 2026년 에이전트 세션은 1,800~5,300줄에 이른다. 붙여넣는 사람에서 지휘하는 사람으로.

# 프롬프트 스타일의 진화

- **초기(2025 코스워크)**: 맥락 없이 컴파일러 오류를 날것으로 붙여넣거나 한 줄 명령. "`/fix use of undeclared identifier 'studentsfamily_name'`", "이거 포인터 쓰는걸로 바꿔줘", "Memory address out of bounds 라고 떳어 왜지?" — 목표·의도 설명은 거의 없음. ^[archive/2025-10-02-fix-use-of-undeclared-identifier-studentsfamily-name.md] ^[archive/2025-09-25-이거-포인터-쓰는걸로-바꿔줘.md]
- **후기(2026 에이전트)**: 목표·제약·비즈니스 프레이밍·재사용 지침을 한 프롬프트에 담아 지휘. 예: red 앱을 "green 수준(production)으로, 바로 라이브 가능하게, 코드 재사용 가능한 건 복붙, 목표는 월 3000~5000만원 / cal ai 벤치마크"처럼 스코프·KPI·레퍼런스를 동시에 지정. ^[archive/2026-06-27-users-jw-jw-projects-brix-ide-selection-the-user-selected-th.md] ^[archive/2026-07-14-현재-brix-폴더를-분석한-결과-앱-코드-apps-packages-는-이미-모노레포.md]

# 검증·이해 습관 — 초기부터 존재하는 안정적 성향 (가장 흥미로운 발견)

가장 놀라운 점은 "AI 출력을 그냥 받지 않는" 습관이 **후기에 획득된 세련미가 아니라 코스워크 시절부터 이미 있던 안정적 기질**이라는 것이다:

- **"고치지 말고 설명해"** — 답을 받기보다 이해를 먼저 요구. 코스워크 중에도 "어디가 문제야? 코드 고치지 말고 말로 설명해", "코드 편집하지말고, 대화로 알려줘"라고 두 번 연속 밀어붙임. 패턴 매칭이 아니라 원인을 파악하려는 신호. ^[archive/2025-10-16-어디가-문제-야-코드-고치지-말고-말로-설명해.md]
- **정답 여부를 되묻기** — "이거 맞아?", "이거 valid한 문법이야?", "이거 말이되나?", "이 함수 맞게 했어?" 류의 확인 프롬프트가 반복. AI 첫 답을 수용하지 않고 검토를 요청하는 습관. ^[archive/2025-10-16-이-함수-맞게-했어-create-a-new-song-node-with-the-provided-inform.md] ^[archive/2025-09-25-이거-맞아.md]
- **스코프 통제** — "최소한으로 수정한다면, 내 코드 스타일 건들이지 않고, 뭐가 추가 되어야해?" — AI가 코드를 재작성해버리는 걸 막고 변경 범위를 좁히는 지휘. (좋은 에이전트 사용자의 핵심 행동.) ^[archive/2025-10-16-최소한으로-수정한다면-내-코드-스타일-건들이지-않고-뭐가-추가-되어야해.md]
- **"왜?"를 물음** — 오류를 고치는 데 그치지 않고 원인을 캐는 "왜지?" 반복. ^[archive/2025-11-04-memory-address-out-of-bounds-라고-떳어-왜지.md] ^[archive/2025-11-03-왜-오류-발생.md]
- **후기 검증은 프로덕트 수준으로 승격**: "실제 프로덕션 수준까지 준비가 된거야?", "우리 경쟁상대 제품이랑 비슷해?", 그리고 직접 dogfooding하며 재현 맥락(구버전 사용 중이나 이 문제가 코드에도 반영됐는지 확인 요청)을 붙인 버그 리포트. AI 산출물을 실사용으로 스트레스 테스트. ^[archive/2026-06-27-users-jw-jw-projects-brix-ide-selection-the-user-selected-th.md]

# 도구 사용 정교화(후기)

- **다중 에이전트 오케스트레이션**: "이런 작업을 새로운 여러 에이전트로 해줄 수 있어? JW_Projects 안의 모든 프로젝트를?" → "응 다 해줘." 병렬 에이전트 위임을 스스로 발의. ^[archive/2026-07-14-현재-brix-폴더를-분석한-결과-앱-코드-apps-packages-는-이미-모노레포.md]
- **MCP·QA 툴 체이닝**: notion-work MCP로 문서 생성, Maestro로 디바이스 QA("green apple이랑 clozet 그걸로 했음") — 이전 프로젝트에서 검증된 도구를 새 프로젝트로 이식. ^[archive/2026-06-27-users-jw-jw-projects-brix-ide-selection-the-user-selected-th.md]
- **에이전트에 역할 페르소나 부여**: "MBB 애널리스트가 조언해주는 입장으로 한 줄 정리해줘", "타겟 페르소나 적용해서 에이전트로 프로덕트 피드백 생성해봐" — LLM을 관점 생성기로 명시적으로 지휘. ^[archive/2026-06-27-users-jw-jw-projects-brix-ide-selection-the-user-selected-th.md]

# 인간적 결

기계처럼 매끈하지만은 않다 — "왜 게속 오류는 발생하는건지 너무 짜증난다." 좌절도 기록에 남아 있다. 이 원장이 정직한 과정 기록계라는 방증. ^[archive/2025-11-21-왜-게속-오류는-발생하는건지-너무-짜증난다.md]

# 정직한 한계 (지어내지 않기)

- **명시적 "SWE가 되고 싶다" 선언은 이 96개 파일 안에 없다.** 이 파일들은 야망을 *선언*하는 곳이 아니라 궤적을 *행동으로 증언*하는 곳이다.
- **가장 이른 C 코스워크 세션(7~11줄)에서 "이해 vs 패턴매칭"을 판정하기엔 표본이 너무 짧다** — 그 시기의 붙여넣기식 프롬프트만으로는 이해 깊이를 단정할 수 없다(추정). 검증 행동이 뚜렷이 관찰되는 건 2025-10 중반 이후부터다.
- 성장 궤적(복잡도·규모·지휘력)은 실재하나, 그 사이 학습 곡선이 매끄러운 단조 상승이었다고 볼 근거는 없다 — 코스워크와 실전 앱 개발이 시기적으로 겹쳐 있었다(추정).

# 메타 관찰

가장 상징적인 사실: 이 사람은 **AI 코딩 에이전트(Claude Code)를 써서, 자신이 AI 코딩 에이전트를 어떻게 쓰는지 기록하는 도구(brane)를 만들고 있다.** 과정 기록계를 과정으로 만드는 재귀 — 이것이 [Hyre](../ventures/hyre.md)의 "AI 활용도" 축이 측정하려는 바로 그 신호의 살아있는 표본이다. ^[archive/2026-07-21-users-jw-jw-projects-brane-ide-opened-file-the-user-opened-t.md]

# 관련 문서

- [Hyre](../ventures/hyre.md) — "신규 측정 축: AI 활용도"의 구체적 증거 트레일이 이 문서다.
- [창업자 정체성](founder.md) — SWE 스레드의 행동 증거.
- [brane 아키텍처](../architecture/brane.md) — 이 과정을 기록하는 엔진.
