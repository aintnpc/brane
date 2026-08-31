// The default view: a plain résumé of what each project is and what was done on
// it, in the same shape for every entry.
//
// The deep case studies (lib/cases.ts) answer "how does this person think".
// They're the wrong first thing to hand someone who doesn't yet know what the
// projects *are* — you can't judge a settlement postmortem without knowing
// Clozet was a commerce platform. So this comes first and the case studies sit
// behind a toggle.
//
// Same underlying facts as lib/portfolio.ts and lib/cases.ts. Nothing here is
// tailored to a reader; it's the constant record stated flatly.

export interface CVEntry {
  name: string;
  period: string;
  /** one line a stranger can understand without context */
  summary: string;
  /** scope of ownership */
  role: string;
  /** concrete work items */
  work: string[];
  stack: string[];
  /** honest end state */
  outcome: string;
  scale?: string;
  /** authored lines, for the total stated in the header */
  lines?: number;
  /** bundle relPath for the ledger link */
  source?: string;
  links?: { label: string; href?: string; kind: "live" | "repo" | "gone"; note?: string }[];
  shots?: { src: string; alt: string; caption: string }[];
}

export const CV: CVEntry[] = [
  {
    name: "Clozet — 인스타그램 커머스 플랫폼",
    period: "2025.07 — 2026.07",
    summary:
      "인스타그램에서 옷 입은 영상을 보다가 화면을 탭하면 그 상품 구매로 바로 이어지는 커머스 플랫폼. " +
      "브랜드는 백오피스에서 상품 태깅부터 주문·정산·크리에이터 커미션까지 관리한다.",
    role: "단독 개발 — 앱, 백오피스, DB, 인프라, 결제, 외부 연동 전체",
    work: [
      "Flutter 앱: 영상 시청 중 탭 → 태깅 상품 → 구매로 이어지는 동선 구현",
      "React 백오피스: 상품·주문·배송·정산·어필리에이트 5개 모듈",
      "Supabase(Postgres) 스키마 설계 및 DB 트리거 기반 주문 상태 전이",
      "Cloudflare Workers + R2 기반 미디어 파이프라인",
      "Meta Graph API 공식 승인 취득 및 연동 (인스타 공유 → DM 자동화)",
      "정산 시스템: 주차별 판매·어필리에이트 정산 자동 생성, SQL 통합 테스트 작성",
      "정산 로직 결함 발견 후 상태 소유권 재설계 및 25주치 재생성·대조",
    ],
    stack: ["Flutter", "React", "TypeScript", "Supabase", "Cloudflare Workers", "R2", "Meta Graph API"],
    outcome:
      "구축 완료. 실사용자 확보 단계에는 도달하지 못했고 시드 데이터로 운영을 검증했다. 현재 도메인 만료.",
    scale: "93,840줄 · 252파일 · 커밋 198",
    lines: 93840,    source: "ventures/clozet.md",
    links: [{ label: "clozet.my", kind: "gone", note: "도메인 만료" }],
    shots: [
      { src: "/portfolio/clozet-tagging.jpg", alt: "Clozet 상품 태깅", caption: "영상 위 상품 태깅" },
      { src: "/portfolio/clozet-marketplace.jpg", alt: "Clozet 마켓플레이스", caption: "브랜드 마켓플레이스" },
      { src: "/portfolio/clozet-dashboard.png", alt: "Clozet 대시보드", caption: "백오피스 대시보드" },
      { src: "/portfolio/clozet-settlement.png", alt: "Clozet 정산", caption: "주차별 정산" },
      { src: "/portfolio/clozet-creators.jpg", alt: "Clozet 크리에이터", caption: "크리에이터 커미션" },
    ],
  },
  {
    name: "Green Apple / Red Apple — AI 헬스 코치",
    period: "2026.05 — 2026.07",
    summary:
      "칼로리를 세는 데서 멈추지 않고 '그래서 오늘 얼마나 움직여야 하는지'를 지시하는 앱. " +
      "Green은 감량, Red는 증량용이고 두 앱이 공용 패키지 위에 올라간 모노레포다.",
    role: "단독 개발 — 모노레포 설계, 앱 2종, 공용 패키지 3종, 결제 연동",
    work: [
      "온보딩 5단계로 기본정보·목표·기간·활동량을 받아 BMR/TDEE 산출 (Harris-Benedict)",
      "목표 체중·기간에서 하루 필요 적자를 역산하고, 식단 기록마다 당일 운동량 재계산",
      "식단 적자에 TDEE 25% 상한을 두고 초과분을 운동으로 넘기는 안전선 설계",
      "식단 사진 → Gemini API 칼로리·영양 분석",
      "Red Apple: 분할 루틴(전신/상하체/PPL), 단백질 목표, 점진적 과부하, 신체 치수 추적",
      "RevenueCat 크레딧 패스 결제, Apple/Google 소셜 로그인",
      "앱 2종이 공유하는 shared·theme·ui 패키지 분리",
    ],
    stack: ["React Native", "Expo", "TypeScript", "Supabase", "RevenueCat", "Gemini API"],
    outcome:
      "Green은 App Store 출시까지 도달했고 낯선 사용자의 결제가 1건 발생했으나 유입 경로를 추적하지 못했다. " +
      "현재 리스팅 만료. Red는 MVP 완성 후 대기.",
    scale: "42,668줄 · 170파일 · 앱 3 + 패키지 3",
    lines: 42668,    source: "ventures/green-apple.md",
    links: [
      { label: "onfit.run", href: "https://onfit.run", kind: "live", note: "랜딩" },
      {
        label: "github.com/aintnpc/React-brix-Green-RedApple",
        href: "https://github.com/aintnpc/React-brix-Green-RedApple",
        kind: "repo",
      },
    ],
  },
  {
    name: "Share2DM — 인스타그램 DM 자동화 SaaS",
    period: "2026.02 — 2026.04",
    summary:
      "인스타그램 릴스에는 링크를 걸 수 없다. 사용자가 릴스를 DM으로 공유하면 자동으로 상품 링크를 보내주는 " +
      "자동화 솔루션. 브랜드는 계정에 연결만 하면 된다.",
    role: "단독 개발 — 엣지 워커, DB 스키마, 대시보드, 결제, 빌링",
    work: [
      "Cloudflare Workers 기반 인스타 웹훅 수신 및 공유 이벤트 감지",
      "브랜드별 FIFO DM 발송 큐 설계 (1분 주기 cron, 배치 20건)",
      "Meta rate limit을 하드코딩하지 않고 429 응답으로 실측하는 백프레셔 구조",
      "테넌트 격리: 한 브랜드가 한도에 걸려도 다른 브랜드 발송은 계속 진행",
      "재시도 3회 + 실패 항목 상태 관리, rate limit 도달 시 운영자 알림 메일",
      "Toss Payments 연동 및 일 1회 빌링 cron",
      "무료 티어 병목을 순서대로 산정 (Supabase 프로젝트 수 → DB 용량 → 대역폭 → Workers 요청)",
    ],
    stack: ["Cloudflare Workers", "TypeScript", "React", "Supabase", "R2", "Toss Payments"],
    outcome: "개발 완료 및 온라인 운영 중. 유료 고객 확보 단계에는 도달하지 못했다.",
    scale: "8,308줄 · 68파일 · 커밋 78",
    lines: 8308,    source: "ventures/share2dm.md",
    links: [
      { label: "share2dm.xyz", href: "https://share2dm.xyz", kind: "live" },
      { label: "github.com/aintnpc/React-share2DM", href: "https://github.com/aintnpc/React-share2DM", kind: "repo" },
    ],
  },
  {
    name: "brane — AI 대화 기록 원장",
    period: "2026.07 — 진행 중",
    summary:
      "ChatGPT·Claude·IDE 어시스턴트에 흩어진 대화가 쌓이기만 하고 다시 찾을 수 없는 문제를 푼다. " +
      "로그를 넣으면 개념 문서로 압축하고 모든 문장에 원본 인용을 붙여, 나중에 질문하면 근거와 함께 답한다.",
    role: "단독 설계·개발 — 읽기/쓰기 경로, 그래프 시각화, 공개 경계",
    work: [
      "쓰기 경로: 신규 대화를 기존 문서와 대조해 NEW/UPDATE/REFINE/QUESTION 판정하는 LLM 캐스케이드",
      "판정 오류로 기존 문서를 덮어쓰지 않도록 안전 검사 추가",
      "읽기 경로: 인덱스로 문서 선택 후, 필요할 때만 인용 원본까지 따라가는 2단 구조 (최대 3홉)",
      "개념 간 상호 링크를 파싱해 force-directed 그래프로 시각화 (2D/3D)",
      "공개 경계: 허용 목록에 없으면 비공개인 fail-closed 게이트, 공개분만 배포",
      "공개 API에 IP당 분당 6회 rate limit 및 입력 길이 제한",
    ],
    stack: ["Next.js", "TypeScript", "Anthropic SDK", "Vercel", "react-force-graph"],
    outcome: "brane.my에서 운영 중. 대화 로그 1,082개가 개념 문서 25개로 소화돼 있다.",
    scale: "4,156줄 · 37파일 · 커밋 29",
    lines: 4156,    source: "architecture/brane.md",
    links: [
      { label: "brane.my", href: "/web", kind: "live", note: "지금 이 사이트" },
      { label: "github.com/aintnpc/brane", href: "https://github.com/aintnpc/brane", kind: "repo" },
    ],
  },
  {
    name: "운동의정석 — 첫 피트니스 앱",
    period: "2022",
    summary:
      "다이어트를 하려면 기초대사량을 구하고, 목표까지 필요한 열량을 계산하고, 먹은 것을 세고, " +
      "그래서 운동을 얼마나 해야 하는지까지 직접 따져야 한다. 그 과정을 앱으로 옮긴 첫 시도.",
    role: "팀 리드 (3인)",
    work: [
      "기본 정보와 목표를 받아 필요 운동량을 산출하고 기록을 추적하는 앱 기획·개발",
      "광고 집행 및 초기 사용자 확보",
    ],
    stack: ["모바일", "3인 팀"],
    outcome:
      "광고비 약 30만원으로 1주일 만에 약 1,000명(759명 언급)을 확보했고 피드백은 긍정적이었으나, " +
      "수익화를 풀지 못한 상태에서 병역으로 중단됐다. 4년 뒤 Green/Red Apple의 출발점이 됐다.",
    source: "ventures/green-apple.md",
    links: [{ label: "서비스 종료", kind: "gone", note: "2022년 중단" }],
  },
];
