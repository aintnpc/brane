# 🚨 중대한 이슈: 취소/환불 후 payment_status 문제

## ⚠️ 현재 시스템의 중대한 결함

### 문제 상황

```
1. 사용자가 주문 (payment_status = 'pending')
2. 결제 완료 (payment_status = 'paid') ✅
3. 사용자가 취소/환불 요청
4. 관리자가 승인 (cancel_exchange_requests.status = 'approved')

❌ 문제: payment_status는 여전히 'paid'로 남아있음!
```

### 실제 데이터베이스 상태

```sql
-- 취소/환불 승인 후에도...

SELECT * FROM orders WHERE id = '...';
-- payment_status = 'paid'  ← 여전히 paid! 🚨

SELECT * FROM order_items WHERE order_id = '...';
-- item_delivery_status = 'cancelled' 또는 그대로

SELECT * FROM cancel_exchange_requests WHERE order_item_id = '...';
-- status = 'approved', type = 'cancel' or 'refund'  ← 승인됨
```

---

## 🔥 이로 인한 문제점

### 1. Dashboard.tsx - 총 매출이 부정확함

```typescript
// LINE 89-94
const { data: ordersData } = await supabase
  .from('orders')
  .select('payment_amount')
  .eq('payment_status', 'paid');  // ← 취소된 주문도 포함됨! 🚨

const totalSales = ordersData?.reduce(
  (sum, order) => sum + (order.payment_amount || 0),
  0
);

// 결과: 취소/환불된 주문도 매출에 포함되어 있음!
```

**예시:**
```
실제 상황:
- 주문 A: 100,000원 (정상)
- 주문 B: 50,000원 (취소됨 - cancel_exchange_requests에 approved 상태)
- 주문 C: 30,000원 (환불됨 - cancel_exchange_requests에 approved 상태)

현재 Dashboard 표시: 180,000원 (100,000 + 50,000 + 30,000) ❌
실제 매출: 100,000원 ✅
```

---

### 2. Settlement.tsx - 취소/환불 필터링이 복잡함

```typescript
// LINE 253-300
// order_items + cancel_exchange_requests JOIN으로 필터링
const validItems = orderItemsData.filter(item => {
  if (item.item_delivery_status === 'cancelled') return false;
  if (item.cancel_exchange_request?.status === 'approved' &&
      (item.cancel_exchange_request.type === 'cancel' ||
       item.cancel_exchange_request.type === 'refund')) {
    return false;
  }
  return true;
});

// ✅ 일단 필터링은 되지만...
// ❌ 매번 복잡한 JOIN과 필터링 필요
// ❌ 성능 이슈 가능성
```

---

### 3. generate_monthly_settlements() - 정산 생성 시에도 필터링 필요

```sql
-- LINE 52-72
SELECT ... FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
LEFT JOIN cancel_exchange_requests cer ON cer.order_item_id = oi.id
WHERE o.payment_status = 'paid'  -- ← paid만 확인
  AND oi.item_delivery_status != 'cancelled'
  AND (
    cer.id IS NULL
    OR NOT (cer.status = 'approved' AND cer.type IN ('cancel', 'refund'))
  );

-- ✅ 필터링은 되지만 복잡함
```

---

### 4. affiliate_earnings - 크리에이터 수익이 자동 취소 안 됨

```
결제 완료 → affiliate_earnings 생성 (status = 'pending')
취소/환불 승인 → affiliate_earnings.status는 그대로 'pending'! 🚨

❌ 크리에이터는 취소된 주문에 대한 수익을 계속 볼 수 있음
❌ 정산 시 수동으로 제외해야 함
```

---

## 🎯 해결 방안

### 방안 1: payment_status를 'refunded' 또는 'cancelled'로 변경 (권장 ✅)

#### 장점
- ✅ 단순하고 명확함
- ✅ 모든 쿼리에서 `WHERE payment_status = 'paid'`만으로 정확한 매출 조회
- ✅ 성능 향상 (복잡한 JOIN 불필요)
- ✅ 일반적인 e-commerce 패턴

#### 구현 방법

**1. orders 테이블에 상태 추가**
```sql
-- db_schema.sql에 이미 payment_status가 TEXT로 정의되어 있음
-- CHECK 제약 추가 필요

ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded', 'failed'));
```

**2. 취소/환불 승인 시 자동으로 payment_status 업데이트 (트리거)**
```sql
CREATE OR REPLACE FUNCTION update_order_status_on_cancel()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_all_items_cancelled BOOLEAN;
BEGIN
  -- 취소/환불 승인 시에만 실행
  IF NEW.status = 'approved' AND NEW.type IN ('cancel', 'refund') THEN

    -- 해당 order_item의 order_id 가져오기
    SELECT order_id INTO v_order_id
    FROM order_items
    WHERE id = NEW.order_item_id;

    -- order_items의 item_delivery_status를 'cancelled'로 업데이트
    UPDATE order_items
    SET item_delivery_status = 'cancelled',
        updated_at = NOW()
    WHERE id = NEW.order_item_id;

    -- 해당 주문의 모든 아이템이 취소되었는지 확인
    SELECT NOT EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = v_order_id
        AND item_delivery_status != 'cancelled'
    ) INTO v_all_items_cancelled;

    -- 모든 아이템이 취소되었으면 주문 상태를 변경
    IF v_all_items_cancelled THEN
      UPDATE orders
      SET payment_status = CASE
        WHEN NEW.type = 'cancel' THEN 'cancelled'
        WHEN NEW.type = 'refund' THEN 'refunded'
        ELSE payment_status
      END
      WHERE id = v_order_id;

      RAISE NOTICE '주문 % 상태 변경: %', v_order_id, NEW.type;
    ELSE
      -- 부분 취소인 경우 payment_status는 'paid' 유지
      -- (일부 아이템만 취소된 경우)
      RAISE NOTICE '주문 % 부분 취소: 아이템 %', v_order_id, NEW.order_item_id;
    END IF;

    -- affiliate_earnings 자동 취소
    UPDATE affiliate_earnings
    SET status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = '주문 취소/환불'
    WHERE order_item_id = NEW.order_item_id
      AND status NOT IN ('paid', 'cancelled');

    RAISE NOTICE 'affiliate_earnings 취소 완료: order_item_id = %', NEW.order_item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_cancel_approved ON cancel_exchange_requests;
CREATE TRIGGER on_cancel_approved
  AFTER UPDATE ON cancel_exchange_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_cancel();
```

**3. Dashboard.tsx - 간단해짐**
```typescript
// 변경 전
const { data: ordersData } = await supabase
  .from('orders')
  .select('payment_amount')
  .eq('payment_status', 'paid');

// 변경 후 (동일함!)
const { data: ordersData } = await supabase
  .from('orders')
  .select('payment_amount')
  .eq('payment_status', 'paid');  // ← 취소/환불된 주문은 자동으로 제외됨! ✅
```

**4. Settlement.tsx - 간단해짐**
```typescript
// 변경 전 (복잡한 필터링)
const validItems = orderItemsData.filter(item => {
  if (item.item_delivery_status === 'cancelled') return false;
  if (item.cancel_exchange_request?.status === 'approved' &&
      (item.cancel_exchange_request.type === 'cancel' ||
       item.cancel_exchange_request.type === 'refund')) {
    return false;
  }
  return true;
});

// 변경 후 (간단함!)
const { data: orderItemsData } = await supabase
  .from('order_items')
  .select('...')
  .eq('orders.payment_status', 'paid')  // ← 이것만으로 충분! ✅
  .neq('item_delivery_status', 'cancelled');  // ← 추가 안전장치
```

**5. generate_monthly_settlements() - 간단해짐**
```sql
-- 변경 전 (복잡한 JOIN)
SELECT ...
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
LEFT JOIN cancel_exchange_requests cer ON cer.order_item_id = oi.id
WHERE o.payment_status = 'paid'
  AND oi.item_delivery_status != 'cancelled'
  AND (cer.id IS NULL OR NOT (cer.status = 'approved' AND cer.type IN ('cancel', 'refund')));

-- 변경 후 (간단함!)
SELECT ...
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid'  -- ← 이것만으로 충분! ✅
  AND oi.item_delivery_status != 'cancelled';  -- ← 추가 안전장치
```

---

### 방안 2: 현재 구조 유지 + 필터링 강화 (비권장 ⚠️)

#### 단점
- ❌ 모든 쿼리에서 복잡한 JOIN 필요
- ❌ 성능 저하 가능성
- ❌ 유지보수 어려움
- ❌ 실수 가능성 높음

#### 구현 방법
모든 쿼리에서 다음 패턴을 반복:
```sql
LEFT JOIN cancel_exchange_requests cer ON cer.order_item_id = oi.id
WHERE o.payment_status = 'paid'
  AND (
    cer.id IS NULL
    OR NOT (cer.status = 'approved' AND cer.type IN ('cancel', 'refund'))
  )
```

---

## 📊 현재 시스템 vs 개선 후 비교

### Dashboard 총 매출 조회

| 구분 | 현재 시스템 | 개선 후 (방안 1) |
|-----|-----------|---------------|
| **쿼리 복잡도** | ⚠️ 간단하지만 부정확 | ✅ 간단하고 정확 |
| **정확도** | ❌ 취소/환불 포함 | ✅ 정확함 |
| **성능** | ✅ 빠름 | ✅ 빠름 |
| **쿼리 예시** | `payment_status = 'paid'` | `payment_status = 'paid'` |

### Settlement 정산 조회

| 구분 | 현재 시스템 | 개선 후 (방안 1) |
|-----|-----------|---------------|
| **쿼리 복잡도** | ❌ 매우 복잡 (3개 테이블 JOIN + 필터링) | ✅ 간단 (2개 테이블 JOIN) |
| **정확도** | ✅ 정확함 | ✅ 정확함 |
| **성능** | ⚠️ 느림 (복잡한 JOIN) | ✅ 빠름 |
| **유지보수** | ❌ 어려움 | ✅ 쉬움 |

### 어필리에이트 수익 처리

| 구분 | 현재 시스템 | 개선 후 (방안 1) |
|-----|-----------|---------------|
| **취소 처리** | ❌ 수동 | ✅ 자동 (트리거) |
| **정확도** | ⚠️ 수동 처리 필요 | ✅ 자동 처리 |
| **크리에이터 경험** | ❌ 혼란스러움 | ✅ 명확함 |

---

## 🎯 권장 사항

### ✅ 방안 1 (payment_status 변경) 채택 권장

#### 이유
1. **단순성**: 모든 쿼리가 간단해짐
2. **정확성**: 매출/정산이 정확함
3. **성능**: 복잡한 JOIN 불필요
4. **표준**: 일반적인 e-commerce 패턴
5. **유지보수**: 실수 가능성 낮음

#### 구현 순서
1. ✅ 트리거 생성 (`update_order_status_on_cancel`)
2. ✅ 기존 취소/환불된 주문 상태 업데이트 (마이그레이션)
3. ✅ Dashboard.tsx - 변경 불필요 (이미 정확함)
4. ✅ Settlement.tsx - 간단하게 수정
5. ✅ generate_monthly_settlements() - 간단하게 수정
6. ✅ 테스트

---

## 🔧 즉시 구현 파일

### 1. 마이그레이션 파일 생성
`supabase/migrations/20250113_fix_payment_status_on_cancel.sql`

### 2. 기존 데이터 수정 스크립트
```sql
-- 이미 취소/환불 승인된 주문 상태 업데이트
UPDATE orders o
SET payment_status = CASE
  WHEN EXISTS (
    SELECT 1 FROM order_items oi
    INNER JOIN cancel_exchange_requests cer ON cer.order_item_id = oi.id
    WHERE oi.order_id = o.id
      AND cer.status = 'approved'
      AND cer.type = 'cancel'
  ) THEN 'cancelled'
  WHEN EXISTS (
    SELECT 1 FROM order_items oi
    INNER JOIN cancel_exchange_requests cer ON cer.order_item_id = oi.id
    WHERE oi.order_id = o.id
      AND cer.status = 'approved'
      AND cer.type = 'refund'
  ) THEN 'refunded'
  ELSE payment_status
END
WHERE payment_status = 'paid';
```

---

## 📝 요약

### 현재 문제점
- ❌ 취소/환불 후에도 `payment_status = 'paid'` 유지
- ❌ Dashboard 총 매출이 부정확 (취소/환불 포함)
- ❌ Settlement 정산 쿼리가 복잡함
- ❌ 어필리에이트 수익 자동 취소 안 됨

### 해결 방법
- ✅ 취소/환불 승인 시 `payment_status` 자동 변경 (트리거)
- ✅ `affiliate_earnings` 자동 취소 (트리거)
- ✅ 모든 쿼리 간소화
- ✅ 성능 향상

### 다음 단계
1. 트리거 생성 마이그레이션 파일 작성
2. 기존 데이터 수정
3. 테스트
4. 배포
