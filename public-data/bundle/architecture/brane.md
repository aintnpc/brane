---
type: Concept
title: Brane
description: 개인 작업 연속성을 푸는 agent-native workspace — 읽고 고칠 수 있는, 스스로 소화하는(self-writing) 파일 두뇌. 기억은 상품이 아니라 부품.
tags: [brane, memory-engine, thin-waist, okf, sovereign-brain, workspace, work-continuity, self-writing, mcp, write-path, brane-sync, multi-agent, telegram, human-in-the-loop, parked]
timestamp: 2026-07-25
status: "컨셉 확정 · 이름 확정 · 문제 재정의(2026-07-05: 상품=워크스페이스, 기억=부품) · 도그푸딩 중 · 코드 착수는 Green Apple 게이트 + 편입(2026-12) 이후 · 논문/학회 플레이북 확정(2026-07-06) · read-path UI(app/) 오버라이드로 착수·배포(2026-07-22~23) · 프로덕션 write 경로 설계 중(2026-07-24) · Brane Sync 확장 중복 동기화 방지(ID/제목 기반 스킵) 기존 구현 확인·문서화(2026-07-24) · Brane Sync 확장에 Gemini 단일 대화 캡처 기능 추가(2026-07-24) · Gemini 캡처 비동기 확증 대기·pause 토글 및 자동 수집 훅 백로그 제한(3개 초과 시 알림만) 비용 안전장치 도입(2026-07-24) · 수집(확장)과 인제스트(비용) 분리 및 확장 직행 ingest 체이닝 제거(2026-07-24) · 텔레그램 기반 멀티에이전트 오케스트레이터 및 실세계 액션 승인 안전장치(HITL) 설계 착수(2026-07-25)"
codename: brane
---

# 이름: brane

발음은 brain과 100% 동일 — 구두 전파에서 설명 비용 0.
철자는 끈이론의 막(brane)에서. 소문자 표기. CLI: `brane ingest` / `brane load` / `brane status`
도메인: 제품 웹은 **mybrane.io**, brane.ai whois도 확인함(2026-07). 계정=뇌 예시 kimjaewon.brane.io. ^[archive/2026-07-21-mybrane-io-prd-hyre.md] ^[archive/2026-07-21-brane-ai-도메인-whois.md]

카피 라인:
- "It's your brane. Literally your files."
- "Your AIs, synchronized."
- "Obsidian, but self-writing."
- "A brain you can read." / "읽을 수 있는 두뇌."

# 문제 정의 — 무엇을 푸는가 (2026-07-05 재정의)

- **원래 문제 = 개인 작업 연속성**: "어떤 작업을 하든 내 뇌에 접속하듯 시작하는 것."
  이기는 기준은 매일의 체감 — *월요일 아침, AI가 이미 내 맥락 위에 있는가.*
  기억은 목적이 아니라 이 문제의 하위 부품(엔진룸)이다.
- **재정의**: 경쟁자들은 기억을 *상품*으로 만들고, 우리는 기억을 *부품*으로 쓴다.
  상품은 워크스페이스 — "**내 뇌가 이미 켜져 있는 작업 공간.**"
- 경쟁자별로 푸는 문제가 다르다: 이사 문제(PAM·Claude 임포트, 이벤트성) /
  개발자 부품 문제(Mem0류 B2D) / 조직 기억 문제(XTrace, 거버넌스).
  **"개인 작업 연속성"을 정면으로 푸는 팀은 여전히 0.**
- 이기는 기준도 다르다: 그들 = export 충실도·벤치마크·컴플라이언스, 우리 = 매일의 체감.
  → 도그푸딩은 검증 *수단*이 아니라 문제 *그 자체*다. 벤치마크 불참은 필연.
- 화이트스페이스 이동: "소유"는 이제 공용 구호(6개월 만에 붐빔) → **"소화 + 가독성".**
  남은 0팀 조합: ① 사람이 읽고 고치는 마크다운 번들 ② 상시 소화 엔진(스냅샷 export 아님)
  ③ git 네이티브 + 개인 wedge + 커리어 원장([Hyre](../ventures/hyre.md)) 접합. (근거는 하단 이력.)

# 물리학의 brane ↔ 우리의 brane

끈이론(M-theory)에서 brane은 고차원 시공간(bulk) 속에 떠 있는 막이다.
이 우주의 핵심 규칙들이 우리 아키텍처와 구조적으로 겹친다:

1. **끈은 brane 위에서 끝난다.**
   물리학에서 열린 끈(open string)의 양 끝은 반드시 brane에 붙어야 한다.
   우리 세계에서 끈 = 세션이다. ChatGPT, Claude, Cursor의 대화는 진동하다
   사라지는 끈이지만, 그 끝은 brane(번들)에 앵커링된다 — 세션은 죽어도
   흔적은 막 위에 남는다.

2. **brane 위의 존재는 brane을 떠날 수 없고, bulk는 그저 배경이다.**
   braneworld 가설에서 물질과 빛은 막 위에 갇혀 있고, 막 밖의 고차원
   bulk는 중력만 통과하는 교체 가능한 배경이다.
   우리 세계에서 사용자의 기억·맥락·정체성은 brane 위에 산다.
   bulk = 모델들(GPT, Claude, Gemini, 로컬 LLM)이며, 그저 스쳐 지나가는
   배경 — 어떤 bulk 속에 있든 막 위의 세계는 동일하다. 모델 중립성의
   물리학적 표현.

3. **끈은 순간이고, brane은 지속한다.**
   끈의 진동은 찰나지만 막은 남는다. 세션(휘발) vs 번들(영속)의 대비 그 자체.

4. **막이 곧 인터페이스다.**
   D-brane은 수학적으로 '경계 조건'이다 — 무엇이 어디서 끝나고 시작하는지를
   정의하는 면. 우리의 brane도 정확히 그 역할: 모든 도구(위)와 모든 모델(아래)
   사이의 thin waist, 생태계의 경계면이자 불변점.

한 줄 요약: **"당신의 우주는 막 위에 있다. 모델은 bulk일 뿐이다."**

# 스택 다이어그램 — thin waist

```
┌─────────────────────────────────────────────────────┐
│  SURFACES (위 가지 = 늘릴수록 해자)                    │
│  ChatGPT · Claude · Cursor · Claude Code · Notion    │
│  Obsidian · VS Code · Slack · Hyre · Nabi · Telegram │
└──────────────────────┬──────────────────────────────┘
                       │  읽기/쓰기 = 그냥 파일
              ┌────────▼────────┐
              │      brane      │  ← 사용자 소유 · 로컬
              │  엔진 + OKF 번들 │     git 버전 관리
              └────────┬────────┘     유일한 불변점
                       │  호출 = 교체 가능한 부품
┌──────────────────────▼──────────────────────────────┐
│  BULK / MODELS (아래 가지 = 경쟁시키는 대상)           │
│  GPT · Claude · Gemini · Llama · DALL·E · Seedance   │
└──────────────────────┴──────────────────────────────┘
```

- 모델 = CPU (무상태 연산, 교체). brane = 디스크의 두뇌 (세션이 꺼져도 남는 것).
- 유일한 진짜 위협: 모델사가 허리를 자기 쪽으로 끌어내리는 것(ChatGPT 메모리).
  그들의 구조적 약점 = 생태계 밖으로 기억을 내보낼 인센티브 없음.
  중립국만이 허리를 가질 수 있다.
- 의존 방향 불변 규칙: Nabi → brane ✓ / Hyre → brane ✓ / Obsidian → 번들 ✓
  역방향 전부 ✗. 엔진 스펙에 특정 소비자 이름이 등장하면 설계 오류.

# Phase 로드맵 — 제품이 단계마다 무엇인가

## Phase 0 — 캡처 & 도그푸딩 (지금 · 비용 0 · 코드 0)
- 제품: 없음. jaewon-ventures 번들을 수동 유지하는 것 자체가 프로토타입.
- 고객: 나 하나.
- 목적: wedge 실재 검증 + Build in Public 글감 축적.
- 졸업 조건: **편입 시험 완료(2026-12) 후에도 매일 쓰고 있음** → Phase 1 착수 자격.
  (구 3개월(2026-07-03) → 6~8주(2026-07-05) → 편입 완료 후

# Brane Sync — 크롬 확장 캡처 기능 & 백로그 안전장치

- 확장은 각 AI 서비스(ChatGPT, Claude, Gemini 등) 팝업에서 동작하며, 전체 사이드바 동기화 버튼 외에 개별 대화 단위 캡처 흐름을 갖는다. ^[archive/2026-07-24-claude-code-30082785-2161.md]
- **Gemini 대화 캡처 확증 및 일시정지**: Gemini 대화 캡처 시 낙관적 성공 표시 대신 실제 다운로드/저장이 끝날 때까지 `captureCurrentPage()`에서 비동기 확증을 대기하도록 고쳐 수집 신뢰성을 확보했으며, 과도한 과거 히스토리 수집을 막기 위한 일시정지(pause) 토글을 지원한다. ^[archive/2026-07-24-claude-code-30082785-2281.md]
- **수집(Capture)과 인제스트(Ingest)의 분리**: 확장의 `postToLocalBrane()`가 캡처 성공 시 `/api/ingest`를 무제한 직행 호출하던 체이닝을 제거하고, 확장은 순수하게 `inbox`에 파일만 적재하도록 역할을 격리했다. ^[archive/2026-07-24-claude-code-30082785-2391.md]
- **백로그 수량 제한 및 비용 안전장치**: 수집 훅이 `inbox` 대기열을 제한 없이 자동 소화할 경우 대량의 API 콜과 토큰 비용이 무단 소비될 수 있다. ^[archive/2026-07-24-claude-code-30082785-2281.md] 따라서 비용이 드는 인제스트 처리는 Claude Code hook(inbox가 3개를 초과하면 자동 처리를 중단하고 사용자 알림만 발생) 또는 사용자가 직접 실행하는 `node .claude/hooks/ingest-all.js` 수동 배치 경로로만 제한된다. ^[archive/2026-07-24-claude-code-30082785-2281.md] ^[archive/2026-07-24-claude-code-30082785-2391.md]

# 멀티에이전트 오케스트레이터 및 실세계 액션 원칙

- **확장 불가능한 일을 에이전트에게 시킨다 (Make agents do things that don't scale)**: 창업자가 인지하면서도 회피하기 쉬운 아웃리치, UGC 크리에이터 컨택 등의 반복적 실무를 에이전트가 대신하도록 설계한다. ^[archive/2026-07-25-claude-code-30082785-2511.md]
- **3-에이전트 구조 (Telegram 인터페이스)**:
  1. **중간관리자 (오케스트레이터)**: 텔레그램으로 지시 수신 → brane 번들 로드로 맥락 파악 → [Clozet](../ventures/clozet.md) 또는 [Green Apple](../ventures/green-apple.md) 실무자에게 태스크 분배 → 결과 취합 보고 및 에스컬레이션. ^[archive/2026-07-25-claude-code-30082785-2511.md]
  2. **Clozet 실무자**: 플레이북 기반 브랜드/크리에이터 아웃리치 초안 작성 및 팔로우업. ^[archive/2026-07-25-claude-code-30082785-2511.md]
  3. **Green Apple 실무자**: 플레이북 기반 UGC 컨택, 커뮤니티 관여, 결제자 팔로우업, 계측 분석 모니터링 초안 작성. ^[archive/2026-07-25-claude-code-30082785-2511.md]
- **실세계 액션 승인 안전장치 (HITL — Human in the Loop)**:
  - 이메일/DM 발송과 같은 외부 영향이 발생하는 실세계 액션은 되돌릴 수 없으므로, 에이전트는 **초안 작성까지만** 수행하고 텔레그램을 통해 사용자에게 보여준 뒤 승인을 기다린다. ^[archive/2026-07-25-claude-code-30082785-2511.md]
  - 사용자 승인 없는 단독 MCP 발송 실행은 엄격히 금지되며, 충분한 승인율과 품질이 검증된 후에만 좁은 범위에서 자동화를 확대한다. ^[archive/2026-07-25-claude-code-30082785-2511.md]
