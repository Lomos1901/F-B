-- =============================================
-- LUMOS COFFEE - LÀM SẠCH DỮ LIỆU TRƯỚC KHI DEMO
-- Chạy trong Supabase SQL Editor
-- =============================================
-- CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ dữ liệu giao dịch.
-- Dữ liệu danh mục (sản phẩm, nguyên liệu, công thức...) sẽ được GIỮ NGUYÊN.
-- =============================================

BEGIN;

-- ===== BƯỚC 1: Xóa dữ liệu giao dịch (thứ tự FK an toàn) =====

-- 1.1 Cảnh báo AI (không có bảng con phụ thuộc)
DELETE FROM public.ai_anomalies;

-- 1.2 Thanh toán (phụ thuộc orders)
DELETE FROM public.payments;

-- 1.3 Nhiệm vụ pha chế KDS (phụ thuộc orders, products)
DELETE FROM public.preparation_tasks;

-- 1.4 Chi tiết đơn hàng (phụ thuộc orders, products)
DELETE FROM public.order_detail;

-- 1.5 Chi tiết phiếu kho (phụ thuộc inventory_receipts, ingredients)
DELETE FROM public.receipt_details;

-- 1.6 Phiếu nhập/xuất/kiểm kho (phụ thuộc orders → phải xóa sau receipt_details, trước orders)
DELETE FROM public.inventory_receipts;

-- 1.7 Đơn hàng (phụ thuộc order_status, tables, shifts, users)
DELETE FROM public.orders;

-- 1.8 Giỏ hàng nhóm QR Order (Bỏ qua nếu chưa tạo bảng này)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'group_cart_items') THEN
    EXECUTE 'DELETE FROM public.group_cart_items';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'group_carts') THEN
    EXECUTE 'DELETE FROM public.group_carts';
  END IF;
END $$;

-- 1.9 Ca làm việc
DELETE FROM public.shifts;


-- ===== BƯỚC 2: Reset tồn kho nguyên liệu về giá trị gốc =====

UPDATE public.ingredients SET stock_quantity = 12.5  WHERE id = 'c2000001-0000-4000-8000-000000000001'; -- Cà phê Robusta xay
UPDATE public.ingredients SET stock_quantity = 8.0   WHERE id = 'c2000001-0000-4000-8000-000000000002'; -- Cà phê Arabica xay
UPDATE public.ingredients SET stock_quantity = 3.2   WHERE id = 'c2000001-0000-4000-8000-000000000003'; -- Bột matcha Nhật
UPDATE public.ingredients SET stock_quantity = 4.0   WHERE id = 'c2000001-0000-4000-8000-000000000004'; -- Bột cacao nguyên chất
UPDATE public.ingredients SET stock_quantity = 25.0  WHERE id = 'c2000001-0000-4000-8000-000000000005'; -- Sữa tươi không đường
UPDATE public.ingredients SET stock_quantity = 18.0  WHERE id = 'c2000001-0000-4000-8000-000000000006'; -- Sữa đặc Ông Thọ
UPDATE public.ingredients SET stock_quantity = 6.0   WHERE id = 'c2000001-0000-4000-8000-000000000007'; -- Kem whipping
UPDATE public.ingredients SET stock_quantity = 5.0   WHERE id = 'c2000001-0000-4000-8000-000000000008'; -- Syrup Caramel
UPDATE public.ingredients SET stock_quantity = 4.0   WHERE id = 'c2000001-0000-4000-8000-000000000009'; -- Syrup Vanilla
UPDATE public.ingredients SET stock_quantity = 3.0   WHERE id = 'c2000001-0000-4000-8000-000000000010'; -- Syrup Đào
UPDATE public.ingredients SET stock_quantity = 2.5   WHERE id = 'c2000001-0000-4000-8000-000000000011'; -- Trà Oolong
UPDATE public.ingredients SET stock_quantity = 10.0  WHERE id = 'c2000001-0000-4000-8000-000000000012'; -- Đào ngâm đóng hộp
UPDATE public.ingredients SET stock_quantity = 5.0   WHERE id = 'c2000001-0000-4000-8000-000000000013'; -- Vải thiều đông lạnh
UPDATE public.ingredients SET stock_quantity = 15.0  WHERE id = 'c2000001-0000-4000-8000-000000000014'; -- Đường trắng
UPDATE public.ingredients SET stock_quantity = 50.0  WHERE id = 'c2000001-0000-4000-8000-000000000015'; -- Đá viên

COMMIT;

-- ✅ HOÀN TẤT LÀM SẠCH!
-- Đã xóa: ai_anomalies, payments, preparation_tasks, order_detail,
--          receipt_details, inventory_receipts, orders, group_cart_items,
--          group_carts, shifts
-- Đã reset: stock_quantity cho 15 nguyên liệu
-- Giữ nguyên: categories, products, ingredients, recipes, order_status,
--             tables, users, bank_accounts, payment_methods, payment_status
