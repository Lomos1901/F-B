-- ================================================================
-- SIẾT RLS POLICIES CHO BẢNG PAYMENTS
-- Backend dùng service_role key (bypass RLS) nên không bị ảnh hưởng.
-- Các policy này chỉ chặn truy cập trực tiếp qua anon key.
-- ================================================================

-- 1. Xóa các policy cũ (quá lỏng — USING (true))
DROP POLICY IF EXISTS "Cho phép thêm payments" ON public.payments;
DROP POLICY IF EXISTS "Cho phép đọc payments" ON public.payments;
DROP POLICY IF EXISTS "Cho phép update payments" ON public.payments;

-- 2. Tạo policy mới — chỉ cho phép role 'authenticated' (đã đăng nhập qua Supabase Auth)
-- Nếu không có session Supabase Auth hợp lệ → bị chặn hoàn toàn.
CREATE POLICY "payments_insert_authenticated"
  ON public.payments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "payments_select_authenticated"
  ON public.payments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "payments_update_authenticated"
  ON public.payments FOR UPDATE
  USING (auth.role() = 'authenticated');
