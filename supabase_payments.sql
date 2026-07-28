-- TẠO CÁC BẢNG THANH TOÁN CHO SẪM COFFEE --

-- 1. Bảng phương thức thanh toán (payment_methods)
CREATE TABLE public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- Tên hiển thị (Tiền mặt, Chuyển khoản, MoMo)
    code VARCHAR(20) NOT NULL UNIQUE, -- Mã code (CASH, BANK_TRANSFER, MOMO)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm dữ liệu mặc định cho phương thức thanh toán
INSERT INTO public.payment_methods (name, code) VALUES 
('Tiền mặt', 'CASH'), 
('Chuyển khoản / QR', 'BANK_TRANSFER'),
('Ví MoMo', 'MOMO')
ON CONFLICT (code) DO NOTHING;


-- 2. Bảng trạng thái thanh toán (payment_status)
CREATE TABLE public.payment_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- Tên hiển thị
    code VARCHAR(20) NOT NULL UNIQUE, -- Mã code (PENDING, COMPLETED, FAILED, REFUNDED)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm dữ liệu mặc định cho trạng thái thanh toán
INSERT INTO public.payment_status (name, code) VALUES 
('Chờ thanh toán', 'PENDING'),
('Đã thanh toán', 'COMPLETED'),
('Thất bại', 'FAILED'),
('Đã hoàn tiền', 'REFUNDED')
ON CONFLICT (code) DO NOTHING;


-- 3. Bảng lịch sử thanh toán (payments)
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL, -- Số tiền thanh toán
    payment_method_id UUID REFERENCES public.payment_methods(id),
    payment_status_id UUID REFERENCES public.payment_status(id),
    transaction_id VARCHAR(100), -- Mã giao dịch (nếu có, từ ngân hàng/MoMo)
    cashier_id UUID REFERENCES auth.users(id), -- Thu ngân thực hiện (nếu có)
    note TEXT, -- Ghi chú thêm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm trigger tự động cập nhật thời gian updated_at (nếu chưa có hàm trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- 4. Bật Row Level Security (RLS) để bảo mật
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Cho phép đọc/ghi công khai (tạm thời) hoặc chỉ cho authenticated
-- Tùy theo bảo mật của dự án, ở đây mở quyền cho Authenticated users
CREATE POLICY "Cho phép mọi người đọc payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Cho phép mọi người đọc payment_status" ON public.payment_status FOR SELECT USING (true);

-- Cho phép thu ngân (hoặc khách hàng) thêm payments
CREATE POLICY "Cho phép thêm payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép đọc payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Cho phép update payments" ON public.payments FOR UPDATE USING (true);

-- Hoàn tất!
