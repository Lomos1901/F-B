-- ==============================
-- ADD NOTE COLUMN TO ORDER_DETAIL
-- ==============================
ALTER TABLE public.order_detail ADD COLUMN IF NOT EXISTS note text;
