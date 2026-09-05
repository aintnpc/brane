# LYFE App vs CLOZET App 기능 비교 분석

> **목적**: LYFE App(React Native)이 CLOZET App(Flutter) 대비 부족한 기능을 파악하여 개발 우선순위 설정
>
> **작성일**: 2026-02-03

---

## 요약 (Executive Summary)

| 구분 | CLOZET (Flutter) | LYFE (React Native) | 완성도 |
|------|------------------|---------------------|--------|
| 인증 시스템 | Kakao/Google/Apple 완전 구현 | Google만 완전 구현 | 33% |
| 딥링크 | 5개 소스 지원 | 미구현 | 0% |
| AI 추천 | 완전 구현 | 미구현 | 0% |
| 어필리에이트 추적 | 7일 귀속 시스템 | 미구현 | 0% |
| 분석/Analytics | Firebase 완전 통합 | 미구현 | 0% |
| 판매자 기능 | 5개 모듈 | 미구현 | 0% |
| 버전 관리 | 강제 업데이트 지원 | 미구현 | 0% |
| 미디어 업로드 | Cloudflare R2 | 미구현 | 0% |
| 주소 관리 | 우편번호 검색/주소록 | 기본 수준 | 30% |
| 취소/교환/반품 | 완전 구현 | 미구현 | 0% |
| 에러 핸들링 | 중앙집중식 | 기본 수준 | 20% |

---

## 1. 인증 시스템 (Authentication)

### CLOZET 구현 현황
- **Kakao OAuth**: 네이티브 SDK 완전 통합 (iOS/Android/Web)
- **Google OAuth**: 플랫폼별 완전 구현
- **Apple Sign-In**: iOS 네이티브 구현
- **세션 관리**: SessionManager를 통한 완전한 로그아웃 처리
- **소셜 로그인 메타데이터 추출**: full_name, email, phone 자동 획득

### LYFE 현재 상태
- **Google OAuth**: ✅ 완전 구현
- **Kakao OAuth**: ❌ UI 플레이스홀더만 존재
- **Apple Sign-In**: ❌ UI 플레이스홀더만 존재
- **세션 관리**: 기본적인 수준

### 필요한 작업
```
□ Kakao OAuth 네이티브 SDK 통합
  - @react-native-seoul/kakao-login 패키지 설치
  - iOS/Android 네이티브 설정
  - 로그인 플로우 구현

□ Apple Sign-In 구현
  - @invertase/react-native-apple-authentication 패키지 설치
  - iOS Capabilities 설정
  - 로그인 플로우 구현

□ SessionManager 서비스 생성
  - 모든 OAuth 제공자 통합 로그아웃
  - 세션 상태 체크
  - 강제 세션 클리어
```

---

## 2. 딥링크 시스템 (Deep Linking)

### CLOZET 구현 현황
```
지원하는 딥링크 소스:
├── Universal Links (HTTPS URLs)
├── Custom URL Scheme (clozet://)
├── Kakao Link Scheme
├── iOS Share Extension
└── iOS App Groups (앱 간 데이터 공유)

라우팅 대상:
├── 특정 상품 (productId)
├── 특정 릴스 (short_code)
└── 공유 URL

추가 기능:
├── 중복 처리 방지 (타임스탬프 추적)
└── 처리된 링크 메모리 관리
```

### LYFE 현재 상태
- **딥링크 시스템**: ❌ 완전히 미구현

### 필요한 작업
```
□ React Navigation Deep Linking 설정
  - linking config 구성
  - URL 패턴 정의

□ Universal Links 설정
  - iOS: apple-app-site-association 파일
  - Android: assetlinks.json 파일

□ Custom URL Scheme 설정 (lyfe://)
  - iOS: Info.plist URL Types
  - Android: intent-filter 설정

□ 딥링크 핸들러 구현
  - src/services/DeepLinkService.js 생성
  - 상품/릴스 라우팅 로직
  - 중복 처리 방지 로직

□ Share Extension (iOS) - 선택사항
  - Xcode에서 Share Extension 타겟 추가
  - App Groups 설정
```

---

## 3. AI 추천 시스템 (Recommendation)

### CLOZET 구현 현황
```javascript
// EfficientRecommendationService
{
  "사용자 상호작용 로깅": true,
  "키워드 선호도 계산": {
    "좋아요 가중치": 1.0,
    "구매 가중치": 3.0,
    "초기 선호도 가중치": 2.0
  },
  "캐시 관리": "30분 캐시 지속",
  "실시간 선호도 업데이트": true
}

관련 DB 테이블:
- user_keyword_preferences (사용자별 키워드 선호도)
- temp_user_interactions (임시 상호작용 데이터)
```

### LYFE 현재 상태
- **AI 추천 시스템**: ❌ 완전히 미구현

### 필요한 작업
```
□ Supabase 테이블 생성
  - user_keyword_preferences
  - temp_user_interactions

□ RecommendationService.js 생성
  - 사용자 상호작용 로깅
  - 키워드 선호도 계산 알고리즘
  - 추천 랭킹 시스템
  - 캐시 관리 (AsyncStorage)

□ 홈 화면에 추천 시스템 통합
  - 개인화된 상품 피드
  - 추천 릴스 순서 정렬
```

---

## 4. 어필리에이트 추적 시스템 (Affiliate Tracking)

### CLOZET 구현 현황
```javascript
// AffiliateTracking 서비스
{
  "클릭 추적": {
    "모델": "StoredClick",
    "데이터": ["content_id", "product_id", "tag_id", "creator_id", "brand_id"]
  },
  "세션 관리": {
    "Web": "localStorage",
    "Mobile": "SharedPreferences"
  },
  "귀속 윈도우": "7일",
  "커미션 계산용 구매 귀속": true
}
```

### LYFE 현재 상태
- **어필리에이트 추적**: ❌ 완전히 미구현

### 필요한 작업
```
□ AffiliateService.js 생성
  - 클릭 데이터 모델 정의
  - 클릭 기록 함수
  - 7일 귀속 윈도우 로직

□ 릴스 페이지에 클릭 추적 통합
  - 상품 스티커 클릭 시 기록
  - 구매 시 귀속 확인

□ Supabase 테이블 생성
  - affiliate_clicks
  - affiliate_conversions
```

---

## 5. 분석 서비스 (Analytics)

### CLOZET 구현 현황
```javascript
// AnalyticsService (Firebase Analytics)
{
  "이벤트 추적": [
    "login", "signup", "search",
    "product_view", "add_to_cart", "purchase"
  ],
  "화면 추적": true,
  "커스텀 이벤트": true,
  "콘텐츠 공유 이벤트": true
}
```

### LYFE 현재 상태
- **Analytics 서비스**: ❌ 완전히 미구현

### 필요한 작업
```
□ Firebase 설정
  - @react-native-firebase/app 설치
  - @react-native-firebase/analytics 설치
  - iOS/Android 네이티브 설정

□ AnalyticsService.js 생성
  - 로그인/회원가입 이벤트
  - 검색 이벤트
  - 상품 조회 이벤트
  - 장바구니 추가 이벤트
  - 구매 이벤트
  - 화면 추적

□ 각 화면에 Analytics 통합
```

---

## 6. 판매자 기능 (Seller Features)

### CLOZET 구현 현황
```
archive/
├── add_content_page.dart      # 영상 콘텐츠 업로드 (상품 태깅)
├── add_product_page.dart      # 상품 등록
├── contents_list_page.dart    # 업로드된 콘텐츠 목록
├── delivery_status_page.dart  # 배송 추적 (판매자용)
└── seller_my_page.dart        # 판매자 대시보드
```

### LYFE 현재 상태
- **판매자 기능**: ❌ 완전히 미구현 (구매자 기능만 존재)

### 필요한 작업
```
□ 판매자 역할 시스템
  - 사용자 역할 구분 (buyer/seller)
  - 판매자 승인 프로세스

□ 판매자 화면 구현
  - SellerDashboard.js
  - AddContentScreen.js (영상 업로드 + 상품 태깅)
  - AddProductScreen.js (상품 등록)
  - SellerOrdersScreen.js (주문 관리)
  - DeliveryManagementScreen.js (배송 관리)

□ 콘텐츠 업로드 시스템
  - 영상 업로드
  - 상품 스티커 위치 지정
  - 썸네일 생성
```

---

## 7. 버전 관리 시스템 (Version Management)

### CLOZET 구현 현황
```javascript
// VersionChecker
{
  "앱 시작 시 버전 체크": true,
  "강제 업데이트 감지": true,
  "선택적 업데이트 프롬프트": true,
  "플랫폼별 버전 추적": ["iOS", "Android"],
  "원격 설정 업데이트 메시지": true
}

// DB 테이블: app_version
{
  platform, min_version, latest_version,
  force_update, update_message
}
```

### LYFE 현재 상태
- **버전 관리**: ❌ 완전히 미구현

### 필요한 작업
```
□ Supabase app_version 테이블 생성
  - platform, min_version, latest_version
  - force_update, update_message

□ VersionService.js 생성
  - 현재 앱 버전 가져오기 (react-native-device-info)
  - 최소/최신 버전 비교
  - 강제 업데이트 다이얼로그
  - 선택적 업데이트 프롬프트

□ SplashScreen에 버전 체크 통합
```

---

## 8. 미디어 업로드 서비스 (Media Upload)

### CLOZET 구현 현황
```javascript
// R2Upload (Cloudflare R2)
{
  "버킷": ["product", "contents", "support", "review"],
  "Presigned URL 생성": "Edge Functions 경유",
  "이미지 캐싱": "cached_network_image",
  "비디오 썸네일 생성": true
}
```

### LYFE 현재 상태
- **미디어 업로드**: ❌ 완전히 미구현 (로컬 비디오만 사용)

### 필요한 작업
```
□ 클라우드 스토리지 설정
  - Cloudflare R2 또는 AWS S3 또는 Supabase Storage

□ MediaUploadService.js 생성
  - Presigned URL 요청
  - 파일 업로드
  - 업로드 진행률 표시
  - 이미지 리사이징 (선택)

□ 이미지 캐싱 설정
  - react-native-fast-image 설치
```

---

## 9. 주소 관리 시스템 (Address Management)

### CLOZET 구현 현황
```javascript
{
  "우편번호 검색": "Kpostal API 통합",
  "주소록 관리": {
    "여러 주소 저장": true,
    "기본 주소 설정": true
  },
  "배송 요청사항": "사전 정의 옵션",
  "DB 테이블": "user_addresses"
}
```

### LYFE 현재 상태
- **주소 관리**: 기본적인 수준 (OrderStorage에 shipping_addresses 존재)
- **우편번호 검색**: ❌ 미구현

### 필요한 작업
```
□ 우편번호 검색 API 통합
  - Daum 우편번호 서비스 WebView 또는
  - Korea Post API 직접 연동

□ 주소 관리 화면 구현
  - AddressListScreen.js
  - AddAddressScreen.js
  - 기본 주소 설정 기능
```

---

## 10. 취소/교환/반품 시스템 (Cancel/Exchange/Return)

### CLOZET 구현 현황
```
cancel_exchange_return_page.dart
- 주문 취소 요청
- 교환 요청
- 반품 요청
- 요청 상태 추적
```

### LYFE 현재 상태
- **취소**: 기본 취소만 가능 (OrderStorage.cancelOrder)
- **교환/반품**: ❌ 완전히 미구현

### 필요한 작업
```
□ CancelExchangeReturnScreen.js 생성
  - 취소/교환/반품 사유 선택
  - 요청 폼
  - 요청 상태 추적

□ OrderStorage 확장
  - 교환 요청 함수
  - 반품 요청 함수
  - 요청 상태 관리
```

---

## 11. 에러 핸들링 (Error Handling)

### CLOZET 구현 현황
```javascript
// ErrorHandler
{
  "중앙집중식 에러 관리": true,
  "커스텀 에러 메시지": true,
  "심각도 수준": ["info", "warning", "error", "critical"],
  "컨텍스트 인식 에러 표시": true
}

// error_page.dart - 전용 에러 표시 화면
```

### LYFE 현재 상태
- **에러 핸들링**: 기본적인 try-catch와 Alert만 사용

### 필요한 작업
```
□ ErrorService.js 생성
  - 중앙집중식 에러 처리
  - 에러 심각도 분류
  - 사용자 친화적 메시지 변환
  - 에러 로깅 (선택: Sentry 등)

□ ErrorScreen.js 생성
  - 에러 표시 전용 화면
  - 재시도 버튼
  - 홈으로 이동 버튼
```

---

## 12. 기타 부족한 기능들

### 12.1 알림 설정 페이지
```
CLOZET: notification_settings_page.dart
- 푸시 알림 설정
- 마케팅 알림 설정

LYFE: ❌ 미구현
```

### 12.2 계정 삭제 기능
```
CLOZET: user_delete_page.dart
- 계정 삭제 요청
- 삭제 사유 수집
- 탈퇴 확인 프로세스

LYFE: ❌ 미구현 (GDPR/개인정보보호법 준수 필요)
```

### 12.3 이용약관 상세 보기
```
CLOZET: view_terms_page.dart, terms_detail_page
- 서비스 이용약관
- 개인정보처리방침
- 마케팅 동의

LYFE: OnboardingScreen에 기본적인 형태만 존재
```

### 12.4 프로필 상세 수정
```
CLOZET: personal_page.dart
- 상세 개인정보 수집
- 전화번호 인증
- 주소 등록

LYFE: ProfileEdit.js에 기본 기능만 존재
```

### 12.5 공유 기능
```
CLOZET: shared_product_page.dart + Kakao Share SDK
- 상품 공유
- 릴스 공유
- 딥링크 생성

LYFE: ❌ 미구현
```

---

## 개발 우선순위 제안

### 🔴 필수 (서비스 운영 필수)
1. **Kakao/Apple 인증** - 한국 시장에서 필수
2. **딥링크 시스템** - 마케팅/공유에 필수
3. **Analytics** - 사용자 행동 분석 필수
4. **에러 핸들링** - 서비스 안정성

### 🟠 중요 (비즈니스 핵심)
5. **어필리에이트 추적** - 크리에이터 수익화
6. **AI 추천** - 사용자 경험 향상
7. **미디어 업로드** - 콘텐츠 업로드 기능
8. **버전 관리** - 앱 업데이트 관리

### 🟡 필요 (서비스 완성도)
9. **판매자 기능** - 플랫폼 확장
10. **취소/교환/반품** - CS 운영
11. **주소 관리** - 사용자 편의
12. **계정 삭제** - 법적 요구사항

### 🟢 선택 (추후 개선)
13. **알림 설정**
14. **이용약관 상세**
15. **공유 기능**

---

## 예상 작업량

| 기능 | 예상 파일 수 | 복잡도 |
|------|-------------|--------|
| Kakao/Apple 인증 | 3-5개 | 중 |
| 딥링크 시스템 | 2-3개 | 중 |
| Analytics | 1-2개 | 하 |
| 에러 핸들링 | 2-3개 | 하 |
| 어필리에이트 추적 | 2-3개 | 중 |
| AI 추천 | 1-2개 | 상 |
| 미디어 업로드 | 2-3개 | 중 |
| 버전 관리 | 1-2개 | 하 |
| 판매자 기능 | 5-7개 | 상 |
| 취소/교환/반품 | 2-3개 | 중 |

---

## 결론

LYFE App은 기본적인 쇼핑 기능(상품 조회, 장바구니, 결제)과 릴스 뷰어는 갖추고 있지만, **서비스 운영에 필수적인 인프라 기능들이 대부분 미구현** 상태입니다.

특히 한국 시장을 목표로 한다면:
- **Kakao 로그인**은 반드시 필요
- **딥링크**는 마케팅 활동의 기반
- **어필리에이트 추적**은 크리에이터 경제의 핵심

이러한 기능들을 우선적으로 구현해야 CLOZET 수준의 서비스 제공이 가능합니다.
