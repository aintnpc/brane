---
type: work
title: Share2DM DM 발송 큐 — 남의 rate limit 위에서 돌리기
description: Meta가 정한 한도 안에서 도는 멀티테넌트 DM 큐. 문서값을 하드코딩하지 않고 429로 실측하며, 브랜드별로 백프레셔를 걸어 한 테넌트가 막혀도 전체가 서지 않게 설계했다.
tags: [work, share2dm, 큐, 백프레셔, rate-limit, cloudflare-workers, 멀티테넌트, 비용설계]
timestamp: 2026-08-31
status: 개발 완료·온라인 운영 중. 유료 고객 확보 단계 미도달 — 부하를 받아본 적 없음.
---

제품 전체 맥락은 [Share2DM](../ventures/share2dm.md) 참조.

# 제약이 먼저 있었다

Cloudflare Workers는 요청당 CPU 10ms, 하루 10만 요청. Supabase 무료 티어는 500MB에
프로젝트 2개. Meta는 계정당 시간 200건. ^[archive/2026-02-22-share2dm-무료-티어-한도-분석.md] 이 안에서 도는 SaaS를 만드는 게 조건이었다.

그래서 DM을 요청 처리 중에 보내지 않고 큐에 넣고, 1분 cron이 꺼내 보낸다.

```
crons = ["*/1 * * * *", "0 0 * * *"]
# 매분: DM 큐 처리
# 매일 00:00 UTC: 빌링 + 토큰 만료 + 큐 정리
```

# 한도를 추측하지 않는다

문서의 200건/시간을 그대로 상한으로 박지 않았다. 실제 한도는 429가 알려준다.

브랜드별로 FIFO 20건씩 꺼내 보내다가 429가 오면 그 항목을 `pending`으로 되돌리고
해당 브랜드의 배치만 멈춘다. ^[archive/2026-04-14-share2dm-queue-processor.ts.md] 다른 브랜드는 계속 돈다. 한 테넌트가 한도를 때려도
전체가 서지 않는다. 재시도는 3회까지.

```
// Meta's actual rate limit is discovered via 429
// responses — no self-imposed cap
const BATCH_SIZE_PER_BRAND = 20;
const MAX_RETRIES = 3;
```

# 언제 돈이 나가는지 먼저 계산했다

무료로 돌리겠다고 정했으면 어디서 깨지는지도 알아야 한다. 병목을 순서대로 적어뒀다.

1. **Supabase 프로젝트 수 2개** — prod·staging으로 이미 도달
2. DB 500MB
3. 대역폭 5GB — MAU 1,000~5,000 구간에서 걸림
4. Workers 일 10만 요청 — 오히려 마지막 ^[archive/2026-02-22-share2dm-무료-티어-한도-분석.md]

# 검증되지 않은 것 (정직하게)

이 백프레셔는 **한 번도 발동한 적이 없을 가능성이 높다.** 유료 고객 확보 단계에
도달하지 못했으므로 실제 부하를 받아본 적이 없다. 설계는 했고 운영은 안 했다.

또한 429 이후 다음 cron(1분 뒤)에 같은 브랜드를 다시 시도한다. ^[archive/2026-04-14-share2dm-queue-processor.ts.md] 지수 백오프나
쿨다운이 없어서, 한도에 걸린 계정을 매분 다시 두드릴 수 있다. 실트래픽에서
계정 제재 위험이 있는 구간이다.

# 규모

8,308줄 · 68파일 · 커밋 78 (2026.02 — 2026.04).
TSX 3,676줄 · TS 3,533줄 · SQL 1,014줄.
