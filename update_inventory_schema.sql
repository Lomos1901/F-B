-- 0. Fix dữ liệu cũ đã bị sai đơn vị tính
-- a. Sửa stock_quantity của ingredients (vì lúc seed data đã nhân nhầm conversion_factor)
UPDATE ingredients
SET stock_quantity = stock_quantity / NULLIF(conversion_factor, 0)
WHERE stock_quantity > 1000; -- Chỉ sửa những thằng to bất thường do seed lỗi

-- b. Sửa quantity của receipt_details cho các phiếu SALE_DEDUCTION cũ
UPDATE receipt_details
SET quantity = quantity / (
    SELECT NULLIF(conversion_factor, 0) FROM ingredients WHERE ingredients.id = receipt_details.ingredient_id
)
WHERE receipt_id IN (
    SELECT id FROM inventory_receipts WHERE receipt_type = 'SALE_DEDUCTION'
) AND ABS(quantity) >= 1;

-- 1. Thêm cột order_id vào inventory_receipts
ALTER TABLE inventory_receipts 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- 2. Thêm cột product_id vào receipt_details
ALTER TABLE receipt_details 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- 3. Tạo View hoặc điều chỉnh RPC để ghi nhận order_id và product_id (KÈM FIX LỖI CONVERSION)
CREATE OR REPLACE FUNCTION handle_sale_deduction(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_receipt_id UUID;
    v_detail RECORD;
    v_recipe RECORD;
    v_creator UUID;
    v_shift_id UUID;
BEGIN
    -- Lấy thông tin người tạo từ đơn hàng để gán cho phiếu xuất
    SELECT created_by, shift_id INTO v_creator, v_shift_id
    FROM orders
    WHERE id = p_order_id;

    -- Tạo phiếu xuất kho (SALE_DEDUCTION)
    INSERT INTO inventory_receipts (receipt_type, order_id, created_by, created_at)
    VALUES ('SALE_DEDUCTION', p_order_id, v_creator, NOW())
    RETURNING id INTO v_receipt_id;

    -- Lặp qua từng món trong đơn hàng
    FOR v_detail IN
        SELECT od.product_id, od.quantity
        FROM order_detail od
        WHERE od.order_id = p_order_id
    LOOP
        -- Lặp qua công thức của món
        FOR v_recipe IN
            SELECT r.ingredient_id, r.quantity, i.conversion_factor
            FROM recipes r
            JOIN ingredients i ON i.id = r.ingredient_id
            WHERE r.product_id = v_detail.product_id
        LOOP
            -- Trừ tồn kho (phải chia cho conversion_factor để quy về base_unit)
            UPDATE ingredients
            SET stock_quantity = stock_quantity - ((v_recipe.quantity * v_detail.quantity) / NULLIF(v_recipe.conversion_factor, 1))
            WHERE id = v_recipe.ingredient_id;

            -- Lưu chi tiết phiếu xuất kho (lưu theo base_unit và số âm)
            INSERT INTO receipt_details (receipt_id, ingredient_id, product_id, quantity)
            VALUES (
                v_receipt_id, 
                v_recipe.ingredient_id, 
                v_detail.product_id, 
                -((v_recipe.quantity * v_detail.quantity) / NULLIF(v_recipe.conversion_factor, 1))
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
