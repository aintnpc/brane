---
type: Concept
title: Clozet — 인스타그램 커머스 플랫폼
description: 인스타그램 공유를 자동 DM 스토어프론트로 전환하는 풀 커머스 플랫폼. 크리에이터 협찬을 실거래 커미션 구조로 바꾸는 것이 성장 엔진. 현재 도메인 만료로 링크 제공 불가 상태.
tags: [venture, clozet, commerce, instagram, creator-economy, gmv, domain-expired]
timestamp: 2026-07-21
status: 구축 완료 · 도메인 만료 · 링크 없이 서사로만 존재하는 단계
---

# 무엇인가

Clozet은 풀 커머스 플랫폼 — Flutter 앱, React 백오피스, Supabase, 결제, 그리고 **공식 승인된 Meta Graph API 연동**으로 구성. 핵심 동작: 인스타그램 공유를 **자동 DM 스토어프론트**로 전환한다. ^[archive/2026-07-22-belief-reconciliation-session.md]

[founder](../identity/founder.md)의 "속도 있는 솔로 빌더" 정체성을 증명하는 완결형 제품 중 하나.

# 제품 메커니즘 & 경쟁 좌표

3가지 유입 동선: ① 릴스를 Clozet 앱으로 공유 ② Clozet IG 계정으로 공유 → 이어보기 웹앱 링크 ③ [Share2DM](share2dm.md) 솔루션 사용 브랜드의 IG 계정으로 공유. 공통 UX: 이어보기 중 화면 tab → 미리 태깅된 상품 → 구매(플랫폼 or 자사몰). 기술 스택: Cloudflare Workers + Supabase + R2. ^[archive/2026-02-13-clozet-share2dm-pricing.md]

- **경쟁/포지셔닝**: 직접 경쟁자 **두어스(zvzo, MAU 70만·시리즈A 100억)** — 영상 커머스지만 "탭 구매 X". 2×2 좌표(발견↔구매 × 영상↔이미지): 무신사·에이블리·지그재그=사러 가는 앱, 인스타·틱톡=보지만 못 사는 앱. Clozet 차별점 = 인스타 DM/공유 유입 동선 + 영상 끊김 없는 탭 구매 + 중소 셀프브랜드 직접 연결. 엑싯 내러티브 = **"아시아의 LTK"**. ^[archive/2026-06-11-clozet-fable5.md]
- **BM 가설**: 거래액(GMV)의 10~15% 수수료, 그중 크리에이터에 5~7% 배분 → 크리에이터가 자발적으로 Clozet을 홍보하는 인센티브 구조(BM이 곧 GTM). ^[archive/2026-06-11-clozet-fable5.md]

# 성장 엔진 (플레이북)

크리에이터 경제를 실거래 데이터로 전환하는 것이 전략의 핵심: ^[archive/2026-06-14-project-playbook-26.md]

1. Twee·난닝구 등과 커넥션을 만들어 **레퍼런스**를 확보한다.
2. 실제 구매 전환 데이터를 기업 협력으로 확보하고, 브랜드의 크리에이터/인플루언서 **협찬 구조를 실거래 기반 커미션 구조로 전환** → 자연스러운 Clozet 유입(GMV + 크리에이터 풀).
3. 확보한 데이터·레퍼런스로 고객사를 늘린다(네트워킹).
4. 협찬→커미션 전환으로 크리에이터 수입이 얼마나 늘었는지 데이터로 증명 → 크리에이터 풀 확장.
5. 시장점유율 확보, 업계 3위 이내 목표 후 Exit.

# 현황: 도메인 만료

Thiel Fellowship 지원서 작성 시점(2026-07-21) 기준, Clozet의 도메인이 만료되어 실사용 가능한 링크를 제공할 수 없는 상태임이 확인됨. ^[archive/2026-07-21-thiel-fellowship-지원서-작성.md] 같은 시점에 자매 프로젝트 Green Apple 역시 Apple 개발자 프로그램이 종료되어 앱스토어에서 내려간 상태 — 지원서 문구도 "live on the App Store"에서 "shipped to the App Store"로 시제를 수정함(현재 사실과 불일치 방지). ^[archive/2026-07-21-thiel-fellowship-지원서-작성.md] 지원서 전략상 죽은 링크를 숨기지 않고 Links 필드 최상단에서 도메인 만료 사실을 먼저 밝히고 설명으로 연결하는 방식을 택함 — brane(살아있는 유일한 링크)을 유일한 검증 가능 증거로 남기고, Clozet·Green Apple은 텍스트 서사(Meta Graph API 공식 승인, 솔로 풀스택 구축 등 지어낼 수 없는 디테일)로 신뢰를 확보하는 구조. ^[archive/2026-07-21-thiel-fellowship-지원서-작성.md]

# 계보 & 형제

[life-plan](../identity/life-plan.md)의 초기 IT 벤처 아이디어 "360 AI 쇼핑몰"(신체 3D 스캔 + MR 가상 피팅)에서 진화한 커머스 라인. 형제 프로젝트 = [Share2DM](share2dm.md)(범용 DM 자동화 솔루션, Clozet의 유입 엔진). brane과는 무관한 별도 벤처, [life-plan](../identity/life-plan.md) A/B 이분의 B(캐시카우) — 단, 도메인 만료 이후 현재는 활성 캐시카우가 아니라 과거 실적(포트폴리오 증거)으로서의 위상에 가까움(추정). ^[archive/2026-07-21-thiel-fellowship-지원서-작성.md]
