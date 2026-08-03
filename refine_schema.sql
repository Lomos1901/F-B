-- ============================================
-- SAM POS - Schema Refinement Migration
-- Date: 2026-08-02
-- Purpose: Add missing timestamp and description columns
-- ============================================

-- 1. Bảng `products`: Thêm `updated_at` để theo dõi thời gian cập nhật sản phẩm (ví dụ: đổi giá)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Tự động cập nhật `updated_at` khi sửa sản phẩm
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();


-- 2. Bảng `store_bank_info`: Thêm `updated_at` để theo dõi thay đổi thông tin ngân hàng
ALTER TABLE public.store_bank_info
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_store_bank_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_store_bank_info_updated_at ON public.store_bank_info;
CREATE TRIGGER trg_store_bank_info_updated_at
  BEFORE UPDATE ON public.store_bank_info
  FOR EACH ROW
  EXECUTE FUNCTION update_store_bank_info_updated_at();


-- 3. Bảng `ingredient_categories`: Thêm `created_at` và `description` để đồng bộ với bảng `categories`
ALTER TABLE public.ingredient_categories
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.ingredient_categories
ADD COLUMN IF NOT EXISTS description TEXT;
