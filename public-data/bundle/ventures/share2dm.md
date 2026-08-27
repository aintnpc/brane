---
type: Concept
title: Share2DM — 인스타 공유 기반 DM 자동화 솔루션
description: ManyChat의 댓글 기반 DM 자동화를 뒤집은 것 — 사람들은 자기 노출(댓글)을 싫어한다는 통찰에서, 릴스를 DM으로 공유하면 링크를 보내주는 자동화. Clozet의 유입 엔진이자 독립 SaaS.
tags: [venture, share2dm, dm-automation, instagram, saas, clozet-sibling]
timestamp: 2026-07-22
status: 개발 완료·온라인 · Cold Outreach 단계
---

# 핵심 통찰

경쟁 솔루션 ManyChat은 **"댓글"을 달아야 DM 자동화가 발동**한다. 그런데 관찰 결과: 사람들은 댓글을 잘 안 쓰고, 댓글 단 계정의 90%가 부계정 → **사람들은 자기를 노출하는 걸 싫어한다.** 그래서 댓글이 아니라 **릴스를 DM으로 공유하면 링크를 보내주는** 방식으로 뒤집어 개발. 이 프라이버시 통찰이 Share2DM의 존재 이유. ^[archive/2026-02-13-clozet-share2dm-pricing.md]

# 무엇인가

인스타그램 공유 감지 → DM 자동 발송 → 상품/콘텐츠 링크 연결 퍼널. [Clozet](clozet.md)의 유입 엔진(공유→이어보기 웹앱→구매)이자, 독립 판매 가능한 DM 자동화 SaaS. 기술 스택: Cloudflare Workers + Supabase (+ 콘텐츠는 R2). ^[archive/2026-02-13-clozet-share2dm-pricing.md] ^[archive/2026-05-25-project-list.md]

# 수익 모델

구독 티어(예: Starter ₩29,000/월 — DM 자동응답 1,000건·1계정, Growth ₩79,000/월 — 5,000건). Clozet과의 결합 BM 고민 = **플랫폼 수수료(무조건 Clozet로 연결) vs 솔루션 사용료(자사몰 연결 미들웨어)** 하이브리드 — 대형 브랜드(자사몰 고집·수수료 민감)는 구독료, 소형 판매자·크리에이터(자사몰 없음)는 플랫폼 수수료로 세그먼트 분리. ^[archive/2026-02-13-clozet-share2dm-pricing.md]

# 위치

[Clozet](clozet.md)의 형제 프로젝트 — Clozet=패션/뷰티 특화 커머스, Share2DM=범용 자동화 솔루션. [life-plan](../identity/life-plan.md) A/B 이분에서 B(라이프스타일 캐시카우) 계열.
