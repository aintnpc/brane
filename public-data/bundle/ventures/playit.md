---
type: Concept
title: PlayIT — LED 피아노 학습 시스템
description: "LED가 악보가 되는 피아노 튜터 — 실물 피아노에 LED를 달아 악보 없이 리듬게임처럼 연주하게 하는 하드웨어+소프트웨어 제품. 크라우드펀딩 기반."
tags: [venture, playit, hardware, edtech, music, crowdfunding, parked]
timestamp: 2026-07-22
status: 프로토타입 설계 완료 · park 상태 (brane/Green Apple에 밀림)
---

# 한 줄 정의

**LED가 악보가 되는 피아노 학습 시스템.** 문제: 피아노를 치고 싶어도 악보 읽기·단계 학습 때문에 시작 자체가 어렵다. 해결: 실물 피아노에 LED를 달아 악보 없이 LED 가이드로 연주. Synthesia류 화면 가상 건반은 있지만 **실물 피아노용 LED 하드웨어 제품은 부재** = whitespace. 확장성: 기타·드럼·바이올린 등 타 악기. ^[archive/2026-03-11-playit-overview.md]

# 제품 구조

3단계 게이미피케이션 학습: Learn(따라치기, 템포 없음) → Rhythm(박자, Perfect/Good/Miss + 콤보) → Performance(풀스피드 + 별점 + 랭킹). 곡 소스: MP3/YouTube → WAV → MIDI(basic-pitch) → LED 매핑. 하드웨어: 라즈베리파이(입력 감지) + 아두이노(WS2812B LED 제어) + 맥북(중앙 제어). ^[archive/2026-03-11-playit-product.md]

# 사업화 전략

- **BYOP(Bring Your Own Piano)** 모델: MIDI 전자피아노 보유자 타겟, "PlayIt Kit" 박스(라즈베리파이 Zero 2W + LED 스트립 + 어댑터) $79–99 일회성 + 앱 구독 $4.99/월 + 곡팩. ^[archive/2026-03-13-playit-productization.md]
- **크라우드펀딩 우선**: Kickstarter(글로벌) + 텀블벅/와디즈(국내) 동시 런칭, Early Bird 할인, 목표 ~$50K(약 500개). 1차 펀딩으로 자금 확보 → 개발자 채용 → SW 개선. ^[archive/2026-03-23-playit-business-ir.md] ^[archive/2026-03-13-playit-productization.md]
- **저작권 전략**: MVP는 공공도메인 클래식(Bach·Beethoven·Chopin)만 제공, Beta는 사용자 업로드 + 약관 책임 분리(서버 미저장, 분석 후 즉시 삭제, LED 데이터만 유지), 정식 출시 시 KOMCA 계약. ^[archive/2026-03-23-playit-business-ir.md]

# 위치

[life-plan](../identity/life-plan.md) 벤처 계보의 초기 프로젝트 중 하나. 현재 brane/[Green Apple](green-apple.md)에 우선순위가 밀려 park 상태.
