// The deep half of the portfolio.
//
// The first version of this page listed nine projects at identical altitude and
// identical length. Reading it left you with "he's built a lot" and no answer to
// "so what can he actually do". Breadth was doing all the work and none of it
// was evidence.
//
// These three are written from the engineering records inside the repos — an
// incident report, a derivation, a queue processor — because judgment is the
// thing being shown, and judgment only exists in specifics.

export interface CaseSection {
  h: string;
  p: string;
  /** verbatim from the repo: code, SQL, a derived expression */
  code?: string;
}

export interface CaseStudy {
  project: string;
  mark?: string;
  /** the problem, not the project */
  title: string;
  period: string;
  stakes: string;
  sections: CaseSection[];
  /** what this demonstrates — the answer to "so what can he do" */
  capability: string;
  source: string;
  /** same shape as Project.code — the totals on the page sum across both lists */
  code: { lines: number; files: number; commits?: number; period: string; breakdown: string };
  links?: { label: string; href?: string; kind: "live" | "repo" | "gone"; note?: string }[];
  shots?: { src: string; alt: string; caption: string }[];
}

export const CASES: CaseStudy[] = [
  {
    project: "Clozet",
    mark: "/portfolio/marks/clozet.png",
    title: "정산이 195만원 더 나갔다",
    period: "2025.06 — 2025.12 · 브랜드 4곳 · 25주치 정산",
    stakes: "실제 돈이 오가는 시스템. 틀리면 브랜드에 더 주거나 덜 준다.",
    sections: [
      {
        h: "증상",
        p:
          "37주차 Loar 정산에 이미 취소된 21만원 주문이 들어가 있었다. 한 건이면 입력 실수지만, " +
          "전체를 훑으니 취소·반품된 주문 20건이 전부 결제완료 상태로 남아 있었다. 불일치율은 " +
          "48주차 이전 25.8%, 이후 85.7%. 줄어드는 게 아니라 벌어지고 있었다.",
      },
      {
        h: "추적",
        p:
          "관리자가 환불을 승인하면 order_items는 cancelled로 바뀌는데 orders.payment_status는 " +
          "paid에 머물렀다. DB에는 이미 이 연쇄를 담당하는 트리거가 있었다. 환불 화면이 " +
          "order_items를 직접 UPDATE하면서 같은 행을 두고 트리거와 부딪쳤고, 트리거의 갱신이 " +
          "중간에 끊겼다. 매출 집계는 payment_status='paid'만 세고 있었으니 취소분이 그대로 매출에 " +
          "남았고, 정산 함수도 같은 조건만 봤다.",
        code:
          "// 환불 승인 화면이 직접 쓰던 코드\n" +
          "await supabase.from('order_items')\n" +
          "  .update({ item_delivery_status: 'cancelled' })\n" +
          "  .eq('id', request.order_item_id);\n" +
          "// DB 트리거 update_order_status_on_cancel() 가\n" +
          "// 이미 같은 일을 하고 있었다",
      },
      {
        h: "판단",
        p:
          "쓰기를 한 곳으로 몰았다. 프론트의 직접 UPDATE 45줄을 지우고, 상태 전이 전체를 트리거가 " +
          "소유하게 했다. cancel_exchange_requests가 approved로 바뀌면 트리거가 order_items → " +
          "orders.payment_status → affiliate_earnings까지 연쇄로 처리한다. 정산 함수에는 취소·반품 " +
          "필터를 세 군데 넣는 마이그레이션을 붙였다. 그리고 25주치를 재생성해 대조했다.",
      },
      {
        h: "남은 것",
        p:
          "같은 상태를 두 계층이 쓰면 언젠가 어긋난다. 어긋난 걸 발견하는 건 보통 숫자가 이상할 " +
          "때고, 그때는 이미 25주가 지나 있다. 정산처럼 되돌리기 비싼 값은 소유자를 하나로 정하고 " +
          "시작해야 한다는 걸 이 건으로 배웠다.",
      },
      {
        h: "프레임워크를 바꿔 다시 만들어봤다",
        p:
          "Clozet은 Flutter 앱에 React 백오피스다. 같은 제품을 React Native 한 스택으로 " +
          "모으려고 Lyfe라는 이름으로 다시 만들었다. 36,211줄까지 갔다. 그러고 나서 기능 " +
          "패리티를 서브시스템별로 재봤는데, 인증 33%, 주소 관리 30%, 에러 핸들링 20%였고 " +
          "딥링크·AI 추천·어필리에이트 추적·판매자 기능·취소/교환/반품은 전부 0%였다. " +
          "백오피스 화면은 실제로 돌아갔지만 Clozet을 대체할 수 있는 상태와는 거리가 멀었다. " +
          "이관은 그 지점에서 더 진행되지 않았다.",
        code: `인증 33%  주소 30%  에러 핸들링 20%
딥링크 · AI 추천 · 어필리에이트 · 판매자 · 취소/교환  ...  0%
36,211줄`,
      },
      {
        h: "그래서 줄 수는 진척이 아니다",
        p:
          "3만 6천 줄을 쓰고도 대부분의 기능이 0%였다. 남은 일은 이미 만든 것의 몇 배였고, " +
          "코드량은 그걸 전혀 알려주지 않았다. 이 페이지 맨 위에 적힌 라인 수도 마찬가지다. " +
          "그 숫자는 얼마나 썼는지만 말하고 무엇이 동작하는지는 말하지 않는다. 아래 케이스들을 " +
          "쓴 이유가 그것이다.",
      },
    ],
    capability: "운영 중인 금전 시스템에서 무결성 사고를 역추적하고, 상태 소유권을 다시 설계해 막을 수 있다.",
    source: "ventures/clozet.md",
    code: {
      lines: 92207,
      files: 249,
      commits: 198,
      period: "2025.07 — 2026.07",
      breakdown: "Flutter 앱 33,702줄 · 백오피스 56,304줄(SQL 83파일) · 랜딩 2,201줄",
    },
    links: [{ label: "clozet.my", kind: "gone", note: "도메인 만료" }],
    shots: [
      { src: "/portfolio/clozet-settlement.png", alt: "Clozet 정산 화면", caption: "정산 화면 — 재생성·대조 대상" },
      { src: "/portfolio/clozet-dashboard.png", alt: "Clozet 대시보드", caption: "매출 집계 — 취소분이 섞여 있던 곳" },
      { src: "/portfolio/clozet-tagging.jpg", alt: "Clozet 상품 태깅", caption: "제품 본체: 영상 위 상품 태깅" },
    ],
  },
  {
    project: "PEGASUS",
    title: "날개 안에 날개보다 큰 것을 넣을 수는 없다",
    period: "2026.08 · Python 3,196줄 · 유도·시장분석 문서 1,416줄",
    stakes: "1년 넘게 끌고 온 항공 벤처의 형상이 물리적으로 가능한지 판정하는 일.",
    sections: [
      {
        h: "왜 직접 유도했나",
        p:
          "Fan-in-Wing은 리프트 팬을 날개 안에 매립하는 형상이다. 성능 한계를 정리한 자료를 " +
          "찾지 못해 지배 방정식을 직접 세웠다. 목표는 예쁜 모델이 아니라 '이 형상이 어디서 " +
          "막히는가'를 숫자로 아는 것이었다.",
      },
      {
        h: "중량이 소거된다",
        p:
          "팬이 차지할 면적 비율은 익면하중과 디스크 로딩의 비로만 결정된다. 중량이 양변에서 " +
          "사라진다. 구조와 도어를 빼면 팬은 날개 평면적의 35%를 넘을 수 없다. 실기에 대보면 " +
          "Joby S4의 디스크 면적은 날개 면적의 1.6배다. 매립이 성립하지 않는다.",
        code: "A/S = (W/S) / DL        ← 중량 W 가 소거된다\nW/S ≤ 0.35 × DL\n\nJoby S4      A/S = 1.60   매립 불가\nArcher       A/S = 1.45   불가\nPEGASUS 최선안 A/S = 0.60   매우 빡빡",
      },
      {
        h: "속도가 호버 출력에 묶인다",
        p:
          "매립 조건, 최적 순항 속도, 호버 동력 세 식을 연립하면 공기밀도와 디스크 로딩이 " +
          "소거되고 순항 상한이 호버 비출력 하나로 정리된다. Joby급 89 m/s를 매립으로 내려면 " +
          "전기 추진계 출력밀도가 5.2배 올라야 한다. 설계를 잘해서 넘을 수 있는 벽이 아니다.",
        code: "V_max ≈ 0.62 × (P/W)",
      },
      {
        h: "그리고 스스로 기각했다",
        p:
          "형상 쪽은 답을 찾았다. 팬 수납을 막는 건 시위가 아니라 두께였고, 안쪽을 두껍게 " +
          "바깥을 얇게 가는 크랭크드 윙으로 52mm를 84mm까지 벌렸다. L/D 손실은 1.7%. " +
          "그런데 시장 가설 5개는 전부 같은 자리에서 무너졌다. 물리적으로 나는가, 미션을 " +
          "수행하는가까지는 매번 통과하고 '경쟁자보다 나은가'에서 매번 탈락했다. 미션이 " +
          "요구하는 방향과 매립이 요구하는 방향이 반대였다. 규제 쪽도 확인하려고 FAA Part 108 " +
          "원문 647쪽을 파싱했다. 결론은 이 형상으로는 안 된다는 것이고, 그 결론을 지웠으면 " +
          "여기 없었을 프로젝트다.",
      },
    ],
    capability: "공개된 답이 없는 영역에서 지배 방정식을 세우고, 그 결과가 자기 아이디어를 죽여도 그대로 기록한다.",
    source: "ventures/pegasus.md",
    code: {
      lines: 3196,
      files: 22,
      commits: 4,
      period: "2026.08",
      breakdown: "Python 3,196줄(src) + 문서 1,416줄 · OpenVSP 툴체인 88k줄 제외",
    },
    links: [{ label: "비공개 저장소", kind: "gone", note: "로컬 전용 · 요청 시 열람" }],
    shots: [
      { src: "/portfolio/pegasus-threeview.png", alt: "PEGASUS S0 삼면도", caption: "S0 삼면도" },
      { src: "/portfolio/pegasus-shape.png", alt: "PEGASUS 형상 검토", caption: "팬 매립 두께 병목 검토" },
    ],
  },
  {
    project: "Share2DM",
    mark: "/portfolio/marks/share2dm.png",
    title: "남의 rate limit 위에서 큐를 돌리기",
    period: "2026.02 — 2026.04 · TypeScript 8,363줄",
    stakes: "DM 발송량은 Meta가 정한다. 우리가 정하는 건 그 한도에 어떻게 부딪히느냐뿐이다.",
    sections: [
      {
        h: "제약이 먼저 있었다",
        p:
          "Cloudflare Workers는 요청당 CPU 10ms, 하루 10만 요청. Supabase 무료 티어는 500MB에 " +
          "프로젝트 2개. Meta는 계정당 시간 200건. 이 안에서 도는 SaaS를 만드는 게 조건이었다. " +
          "그래서 DM을 요청 처리 중에 보내지 않고 큐에 넣고, 1분 cron이 꺼내 보낸다.",
        code: 'crons = ["*/1 * * * *", "0 0 * * *"]\n# 매분: DM 큐 처리\n# 매일 00:00 UTC: 빌링 + 토큰 만료 + 큐 정리',
      },
      {
        h: "한도를 추측하지 않는다",
        p:
          "문서의 200건/시간을 그대로 상한으로 박지 않았다. 실제 한도는 429가 알려준다. " +
          "브랜드별로 FIFO 20건씩 꺼내 보내다가 429가 오면 그 항목을 pending으로 되돌리고 " +
          "해당 브랜드의 배치만 멈춘다. 다른 브랜드는 계속 돈다. 한 테넌트가 한도를 " +
          "때려도 전체가 서지 않는다.",
        code:
          "// Meta's actual rate limit is discovered via 429\n" +
          "// responses — no self-imposed cap\n" +
          "const BATCH_SIZE_PER_BRAND = 20;\n" +
          "const MAX_RETRIES = 3;",
      },
      {
        h: "언제 돈이 나가는지 먼저 계산했다",
        p:
          "무료로 돌리겠다고 정했으면 어디서 깨지는지도 알아야 한다. 병목을 순서대로 적어뒀다. " +
          "1순위는 Supabase 프로젝트 수 2개인데 prod·staging으로 이미 도달했다. 다음이 " +
          "DB 500MB, 그다음이 대역폭 5GB로 MAU 1,000~5,000 구간에서 걸린다. Workers 10만 " +
          "요청은 오히려 마지막이다.",
      },
    ],
    capability: "외부 rate limit과 무료 티어라는 제약을 설계 입력으로 두고, 멀티테넌트 큐와 비용 임계를 미리 계산한다.",
    source: "ventures/share2dm.md",
    code: {
      lines: 8363,
      files: 70,
      commits: 78,
      period: "2026.02 — 2026.04",
      breakdown: "TSX 3,676줄 · TS 3,533줄 · SQL 1,016줄",
    },
    links: [
      { label: "share2dm.xyz", href: "https://share2dm.xyz", kind: "live" },
      { label: "github.com/aintnpc/React-share2DM", href: "https://github.com/aintnpc/React-share2DM", kind: "repo" },
    ],
  },
  {
    project: "Green Apple / Red Apple",
    mark: "/portfolio/marks/green-apple.png",
    title: "잘 만들었고, 팔지 않았다",
    period: "2026.05 — 2026.07 · TypeScript 42,691줄 · 앱 3 + 공용 패키지 3",
    stakes: "App Store까지 갔고 낯선 사람의 결제가 1건 났다. 그게 전부다. 왜 1건인지가 이 글의 내용이다.",
    sections: [
      {
        h: "만든 것",
        p:
          "칼로리를 세는 앱은 많다. 세고 나서 뭘 해야 하는지 말해주는 앱이 없었다. 지방 1kg을 " +
          "7,700kcal로 놓고 목표 체중과 기간에서 하루 필요 적자를 역산한 뒤, 식단을 기록할 때마다 " +
          "오늘 태워야 할 양을 다시 계산한다. 치킨을 먹으면 그날 운동 처방이 바뀐다.",
        code: `하루 필요 적자 = (현재 − 목표) × 7,700 ÷ 목표기간
식단 적자 한도 = TDEE × 25%      ← 근손실 방지 안전선
최소 운동 소모 = 하루 적자 − 식단 한도

// 식단 기록마다 재계산
운동 필요량 = 하루 적자 − 식단 적자 − 오늘 운동 소모`,
      },
      {
        h: "그 전에 한 번 만들었다",
        p:
          "같은 앱을 Flutter로 먼저 만들었다. re:fine, 37,282줄. 버려진 습작이 아니라 " +
          "TDEE·목표 적자 계산이 이미 들어 있었고, AI 플랜 생성과 트레이너 챗까지 붙어 있었다. " +
          "구독 티어에 따라 Gemini Flash와 Pro를 갈라 쓰는 원가 설계도 그때 했다. 그런데 " +
          "React Native로 처음부터 다시 만들었다. 포팅이 아니라 재작성이다. 플랫폼을 바꾸고, " +
          "시장을 한국에서 영어권으로 돌리고, 결제를 자체 구독에서 RevenueCat으로 넘기는 " +
          "결정이 한꺼번에 걸려 있어서 기존 코드를 고치는 쪽이 더 비쌌다.",
        code: `re:fine (Flutter)     37,282줄   구독 티어별 Gemini Flash/Pro
   ↓ 재작성
Green/Red Apple (RN)  42,691줄   RevenueCat · 영어권 우선`,
      },
      {
        h: "한 줄이 제품을 정의했다",
        p:
          "식단만으로 적자를 다 만들면 안 된다. 그래서 식단 적자에 TDEE의 25%라는 상한을 두고 " +
          "나머지를 운동으로 넘긴다. 이 한 줄이 없으면 굶으라고 말하는 앱이 되고, 있으면 " +
          "'그래서 오늘 628kcal 더 태우세요'라고 말하는 앱이 된다. 기술적으로는 사칙연산이지만 " +
          "제품의 성격을 정하는 건 이 지점이다.",
      },
      {
        h: "그리고 결제가 1건 났다",
        p:
          "모르는 사람이 결제했다. 첫 반응이 '엥? 왜 결제하지?'였다. 유입 경로도 결제 이유도 " +
          "추적되지 않았다. 메일을 보냈지만 답은 없었다. 계측이 하나도 없었기 때문에, 이 결제는 " +
          "학습 신호가 되지 못하고 그냥 우연으로 남았다. 재현할 수 없는 매출은 매출이 아니다.",
      },
      {
        h: "진단",
        p:
          "이건 운이 나빴던 게 아니라 구조였다. 문제를 정의하고 해결책을 만드는 데까지는 강점이 " +
          "통하고, 유통은 강점 밖이라 자연스럽게 회피됐다. 만들기가 도피처였다. Cal AI를 다시 " +
          "보면서 정리한 문장이 이거다. 앱이 본체가 아니라 유통 머신이 본체이고, 제품은 " +
          "입장권일 뿐이라는 것.",
      },
      {
        h: "그래서 바꾼 것",
        p:
          "의지로 밀면 며칠 가고 끝난다는 걸 알아서 시스템 쪽을 건드렸다. 반복 단위를 '제품 하나 " +
          "완성'에서 '판매 시도 하나'로 내렸다. 아웃리치 1건, 콘텐츠 1개. 점수판에는 결제 건수가 " +
          "아니라 전송 건수만 적는다. 통제 가능한 것만 세야 이기는 게임이 된다. 코딩은 보상으로 " +
          "강등했다. 다음 결제를 설명 가능하게 만드는 계측도 붙인다. 랜딩 UTM과 결제 직후 " +
          "'어디서 알고 오셨어요?' 한 문항. 지금 채널은 UGC다.",
        code: `만들기 2 : 팔기 8      ← 시간 배분 역전
아웃리치 N개 전에는 코드 못 만짐
점수판 = 전송 건수 (결제 건수 아님)
목표: '결제 1건' → '출처를 아는 결제 1건'`,
      },
    ],
    capability:
      "자기 실패 양식을 구조로 진단하고, 의지가 아니라 시스템으로 고친다. 지금 고치고 있는 건 유통이다.",
    source: "ventures/green-apple.md",
    code: {
      lines: 42691,
      files: 171,
      commits: 3,
      period: "2026.05 — 2026.07",
      breakdown: "TSX 26,665줄 · TS 13,711줄 · SQL 1,432줄 · 앱 3 + 패키지 3",
    },
    links: [
      { label: "onfit.run", href: "https://onfit.run", kind: "live", note: "랜딩" },
      {
        label: "github.com/aintnpc/React-brix-Green-RedApple",
        href: "https://github.com/aintnpc/React-brix-Green-RedApple",
        kind: "repo",
      },
    ],
  },
];
