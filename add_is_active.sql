-- Thêm cột is_active vào bảng products để theo dõi trạng thái Ẩn/Hiện món ăn
ALTER TABLE public.products 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
