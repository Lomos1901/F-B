-- ================================================================
-- RPC FUNCTION: NHẬP KHO ATOMIC (TRÁNH RACE CONDITION)
-- Thay thế pattern read-then-write bằng SQL increment trực tiếp.
-- Sử dụng: supabase.rpc('atomic_increment_stock', { p_id, p_amount })
-- ================================================================

CREATE OR REPLACE FUNCTION public.atomic_increment_stock(
  p_id UUID,
  p_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_stock NUMERIC;
BEGIN
  -- Kiểm tra đầu vào
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Số lượng nhập phải lớn hơn 0';
  END IF;

  -- Cập nhật atomic: tăng stock_quantity trực tiếp bằng SQL
  -- Không cần SELECT trước → không có race condition
  UPDATE public.ingredients
  SET stock_quantity = COALESCE(stock_quantity, 0) + p_amount
  WHERE id = p_id
  RETURNING stock_quantity INTO v_new_stock;

  -- Nếu không tìm thấy nguyên liệu
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy nguyên liệu với id: %', p_id;
  END IF;

  RETURN v_new_stock;
END;
$$;
