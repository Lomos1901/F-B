-- =============================================
-- LUMOS COFFEE - SEED DỮ LIỆU DEMO CHO CẢNH BÁO AI
-- Chạy trong Supabase SQL Editor (SAU KHI chạy cleanup_for_demo.sql)
-- HỖ TRỢ CẢ DỮ LIỆU TỪ SQL LẪN JAVASCRIPT (Tự động map ID)
-- =============================================

-- =============================================
-- FIX LỖI: HÀM THỐNG KÊ DOANH SỐ SẢN PHẨM (RPC)
-- Sửa lỗi hàm trả về trung bình 0 khiến cảnh báo bị sai
-- =============================================
CREATE OR REPLACE FUNCTION get_products_sales_stats(p_product_ids uuid[], p_days integer)
RETURNS TABLE (
  product_id uuid,
  mean_daily_sales numeric,
  stddev_daily_sales numeric
) AS $func$
BEGIN
  RETURN QUERY
  WITH daily_sales AS (
    SELECT
      od.product_id,
      DATE(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS sale_date,
      SUM(od.quantity) AS daily_quantity
    FROM order_detail od
    JOIN orders o ON o.id = od.order_id
    JOIN order_status os ON os.id = o.status_id
    WHERE od.product_id = ANY(p_product_ids)
      AND os.status_name IN ('COMPLETED', 'PREPARING')
      AND o.created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh' - (p_days || ' days')::interval)
      AND DATE(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') < CURRENT_DATE
    GROUP BY od.product_id, DATE(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ),
  product_stats AS (
    SELECT
      ds.product_id,
      ROUND(AVG(ds.daily_quantity)::numeric, 2) AS mean_daily_sales,
      ROUND(COALESCE(STDDEV_POP(ds.daily_quantity), 0)::numeric, 2) AS stddev_daily_sales
    FROM daily_sales ds
    GROUP BY ds.product_id
  )
  SELECT
    p.id AS product_id,
    COALESCE(ps.mean_daily_sales, 0) AS mean_daily_sales,
    COALESCE(ps.stddev_daily_sales, 0) AS stddev_daily_sales
  FROM unnest(p_product_ids) p(id)
  LEFT JOIN product_stats ps ON ps.product_id = p.id;
END;
$func$ LANGUAGE plpgsql;


DO $$
DECLARE
  v_completed_id UUID;
  v_table_id     UUID;
  v_order_id     UUID;
  v_receipt_id   UUID;
  v_day          INT;
  v_ts           TIMESTAMPTZ;
  v_base_ts      TIMESTAMPTZ;
  v_qty          INT;
  v_i            INT;

  P_ESPRESSO     UUID;
  P_AMERICANO    UUID;
  P_CA_PHE_DEN   UUID;
  P_CA_PHE_SUA   UUID;
  P_BAC_XIU      UUID;
  P_CAPPUCCINO   UUID;
  P_LATTE        UUID;
  P_CARAMEL      UUID;
  P_MOCHA        UUID;
  P_TRA_DAO      UUID;
  P_TRA_VAI      UUID;
  P_TRA_OOLONG   UUID;
  P_MATCHA_LATTE UUID;

  I_MATCHA       UUID;
  I_SYRUP_DAO    UUID;
  I_SUA_TUOI     UUID;
  I_ROBUSTA      UUID;
  I_WHIPPING     UUID;

BEGIN
  -- Lấy status COMPLETED
  SELECT id INTO v_completed_id FROM public.order_status WHERE status_name = 'COMPLETED';
  IF v_completed_id IS NULL THEN RAISE EXCEPTION 'Không tìm thấy status COMPLETED!'; END IF;

  -- Lấy hoặc tạo bàn
  SELECT id INTO v_table_id FROM public.tables LIMIT 1;
  IF v_table_id IS NULL THEN
    INSERT INTO public.tables (id, name) VALUES (gen_random_uuid(), 'Bàn 1') RETURNING id INTO v_table_id;
  END IF;

  -- ============================================
  -- TỰ ĐỘNG TÌM ID SẢN PHẨM & NGUYÊN LIỆU (Tránh lỗi FK)
  -- ============================================
  SELECT id INTO P_ESPRESSO     FROM products WHERE name ILIKE '%Espresso%' OR name ILIKE '%Cà Phê Đen%' LIMIT 1;
  SELECT id INTO P_AMERICANO    FROM products WHERE name ILIKE '%Americano%' OR name ILIKE '%Cà Phê Đen%' LIMIT 1;
  SELECT id INTO P_CA_PHE_DEN   FROM products WHERE name ILIKE '%Cà Phê Đen%' LIMIT 1;
  SELECT id INTO P_CA_PHE_SUA   FROM products WHERE name ILIKE '%Cà Phê Sữa%' OR name ILIKE '%Bạc Xỉu%' LIMIT 1;
  SELECT id INTO P_BAC_XIU      FROM products WHERE name ILIKE '%Bạc Xỉu%' OR name ILIKE '%Cà Phê Sữa%' LIMIT 1;
  SELECT id INTO P_CAPPUCCINO   FROM products WHERE name ILIKE '%Cappuccino%' OR name ILIKE '%Latte%' LIMIT 1;
  SELECT id INTO P_LATTE        FROM products WHERE name ILIKE '%Latte%' LIMIT 1;
  SELECT id INTO P_CARAMEL      FROM products WHERE name ILIKE '%Caramel%' OR name ILIKE '%Trà Sữa%' LIMIT 1;
  SELECT id INTO P_MOCHA        FROM products WHERE name ILIKE '%Mocha%' OR name ILIKE '%Trà Sữa%' LIMIT 1;
  SELECT id INTO P_TRA_DAO      FROM products WHERE name ILIKE '%Trà Đào%' LIMIT 1;
  SELECT id INTO P_TRA_VAI      FROM products WHERE name ILIKE '%Trà Vải%' OR name ILIKE '%Trà Oolong%' LIMIT 1;
  SELECT id INTO P_TRA_OOLONG   FROM products WHERE name ILIKE '%Oolong%' OR name ILIKE '%Trà Đen%' LIMIT 1;
  SELECT id INTO P_MATCHA_LATTE FROM products WHERE name ILIKE '%Matcha%' OR name ILIKE '%Đá Xay%' LIMIT 1;

  SELECT id INTO I_MATCHA       FROM ingredients WHERE name ILIKE '%Matcha%' OR name ILIKE '%Trà Đen%' LIMIT 1;
  SELECT id INTO I_SYRUP_DAO    FROM ingredients WHERE name ILIKE '%Syrup Đào%' LIMIT 1;
  SELECT id INTO I_SUA_TUOI     FROM ingredients WHERE name ILIKE '%Sữa tươi%' LIMIT 1;
  SELECT id INTO I_ROBUSTA      FROM ingredients WHERE name ILIKE '%Robusta%' LIMIT 1;
  SELECT id INTO I_WHIPPING     FROM ingredients WHERE name ILIKE '%Whipping%' LIMIT 1;

  -- ============================================
  -- VÒNG LẶP 30 NGÀY LỊCH SỬ (ngày -30 đến -1)
  -- ============================================
  FOR v_day IN 1..30 LOOP
    v_base_ts := (((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE - v_day) || ' 08:30:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';

    -- Đơn 1
    v_qty := 6 + (v_day % 4); v_ts := v_base_ts + INTERVAL '10 minutes';
    IF P_CA_PHE_SUA IS NOT NULL THEN
      INSERT INTO orders (id, status_id, table_id, table_number, total_price, created_at, updated_at) VALUES (gen_random_uuid(), v_completed_id, v_table_id, 'Bàn 1', v_qty * 35000, v_ts, v_ts) RETURNING id INTO v_order_id;
      INSERT INTO order_detail (order_id, product_id, quantity, unit_price) VALUES (v_order_id, P_CA_PHE_SUA, v_qty, 35000);
    END IF;

    -- Đơn 2 (Trà Đào -> SALES_SPIKE)
    v_qty := 3 + (v_day % 5); v_ts := v_base_ts + INTERVAL '45 minutes';
    IF P_TRA_DAO IS NOT NULL THEN
      INSERT INTO orders (id, status_id, table_id, table_number, total_price, created_at, updated_at) VALUES (gen_random_uuid(), v_completed_id, v_table_id, 'Bàn 1', v_qty * 45000, v_ts, v_ts) RETURNING id INTO v_order_id;
      INSERT INTO order_detail (order_id, product_id, quantity, unit_price) VALUES (v_order_id, P_TRA_DAO, v_qty, 45000);
    END IF;

    -- Đơn 3 (Cappuccino -> GHOST_PRODUCT)
    v_qty := 3 + ((v_day + 2) % 5); v_ts := v_base_ts + INTERVAL '1 hour 15 minutes';
    IF P_CAPPUCCINO IS NOT NULL THEN
      INSERT INTO orders (id, status_id, table_id, table_number, total_price, created_at, updated_at) VALUES (gen_random_uuid(), v_completed_id, v_table_id, 'Bàn 1', v_qty * 49000, v_ts, v_ts) RETURNING id INTO v_order_id;
      INSERT INTO order_detail (order_id, product_id, quantity, unit_price) VALUES (v_order_id, P_CAPPUCCINO, v_qty, 49000);
    END IF;

    -- Đơn 4
    v_qty := 3 + (v_day % 3); v_ts := v_base_ts + INTERVAL '2 hours';
    IF P_BAC_XIU IS NOT NULL THEN
      INSERT INTO orders (id, status_id, table_id, table_number, total_price, created_at, updated_at) VALUES (gen_random_uuid(), v_completed_id, v_table_id, 'Bàn 1', v_qty * 39000, v_ts, v_ts) RETURNING id INTO v_order_id;
      INSERT INTO order_detail (order_id, product_id, quantity, unit_price) VALUES (v_order_id, P_BAC_XIU, v_qty, 39000);
    END IF;
  END LOOP;
  RAISE NOTICE '✅ Đã tạo lịch sử đơn hàng 30 ngày';

  -- ============================================
  -- ĐƠN HÀNG HÔM NAY (BẤT THƯỜNG)
  -- ============================================
  v_base_ts := ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE || ' 08:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';

  -- SALES_SPIKE: Trà Đào Cam Sả × 35 ly
  IF P_TRA_DAO IS NOT NULL THEN
    FOR v_i IN 1..5 LOOP
      v_ts := v_base_ts + (INTERVAL '1 hour' * v_i);
      INSERT INTO orders (id, status_id, table_id, table_number, total_price, created_at, updated_at) VALUES (gen_random_uuid(), v_completed_id, v_table_id, 'Bàn 1', 7 * 45000, v_ts, v_ts) RETURNING id INTO v_order_id;
      INSERT INTO order_detail (order_id, product_id, quantity, unit_price) VALUES (v_order_id, P_TRA_DAO, 7, 45000);
    END LOOP;
    RAISE NOTICE '✅ SALES_SPIKE: Trà Đào = 35 ly hôm nay';
  END IF;

  -- GHOST_PRODUCT: Cappuccino = 0 ly hôm nay (Không tạo đơn nào)
  RAISE NOTICE '✅ GHOST_PRODUCT: Cappuccino = 0 ly hôm nay';

  -- Các món khác bình thường
  v_ts := v_base_ts + INTERVAL '30 minutes';
  IF P_CA_PHE_SUA IS NOT NULL THEN
    INSERT INTO orders (id, status_id, table_id, table_number, total_price, created_at, updated_at) VALUES (gen_random_uuid(), v_completed_id, v_table_id, 'Bàn 1', 8 * 35000, v_ts, v_ts) RETURNING id INTO v_order_id;
    INSERT INTO order_detail (order_id, product_id, quantity, unit_price) VALUES (v_order_id, P_CA_PHE_SUA, 8, 35000);
  END IF;

  -- ============================================
  -- INVENTORY_FORECAST: Giảm tồn kho (Bột matcha, Syrup Đào, Sữa tươi)
  -- ============================================
  IF I_MATCHA IS NOT NULL THEN UPDATE ingredients SET stock_quantity = 0.3 WHERE id = I_MATCHA; END IF;
  IF I_SYRUP_DAO IS NOT NULL THEN UPDATE ingredients SET stock_quantity = 0.4 WHERE id = I_SYRUP_DAO; END IF;
  IF I_SUA_TUOI IS NOT NULL THEN UPDATE ingredients SET stock_quantity = 4.0 WHERE id = I_SUA_TUOI; END IF;
  RAISE NOTICE '✅ INVENTORY_FORECAST: Đã set stock thấp cho Matcha, Syrup Đào, Sữa Tươi';

  -- ============================================
  -- INVENTORY_DISCREPANCY: Tạo phiếu kiểm kho hụt
  -- ============================================
  v_receipt_id := gen_random_uuid();
  INSERT INTO public.inventory_receipts (id, receipt_type, created_at)
  VALUES (v_receipt_id, 'STOCKTAKE_ADJUSTMENT', NOW() - INTERVAL '1 day');

  IF I_ROBUSTA IS NOT NULL THEN
    INSERT INTO public.receipt_details (receipt_id, ingredient_id, quantity) VALUES (v_receipt_id, I_ROBUSTA, -2);
  END IF;

  IF I_WHIPPING IS NOT NULL THEN
    INSERT INTO public.receipt_details (receipt_id, ingredient_id, quantity) VALUES (v_receipt_id, I_WHIPPING, -1);
  END IF;
  RAISE NOTICE '✅ INVENTORY_DISCREPANCY: Đã tạo phiếu hụt kho cho Robusta và Whipping';

END;
$$;
