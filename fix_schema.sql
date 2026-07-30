-- ==============================
-- PHA 1 + 2A: SỬA SQL SCHEMA
-- Chạy trong Supabase SQL Editor
-- ==============================

BEGIN;

-- 1. Xóa FK trùng lặp trên orders.created_by
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS fk_orders_created_by;

-- 2. Thêm CHECK cho shifts.status
ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS shifts_status_check;
ALTER TABLE public.shifts ADD CONSTRAINT shifts_status_check
  CHECK (status IN ('OPEN', 'CLOSED'));

-- 3. Đổi quantity từ bigint → integer
ALTER TABLE public.order_detail ALTER COLUMN quantity TYPE integer;

-- 4. Sửa FK payments.cashier_id → public.users
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_cashier_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_cashier_id_fkey
  FOREIGN KEY (cashier_id) REFERENCES public.users(id);

-- 5. Thêm unit_price vào order_detail
ALTER TABLE public.order_detail ADD COLUMN IF NOT EXISTS unit_price numeric;

COMMIT;

-- ✅ Hoàn tất! 5 thay đổi đã áp dụng.
