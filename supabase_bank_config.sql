-- Tạo bảng lưu cấu hình tài khoản ngân hàng của quán
CREATE TABLE IF NOT EXISTS store_bank_info (
  id INT PRIMARY KEY DEFAULT 1,
  bank_bin VARCHAR(50),
  account_number VARCHAR(100),
  account_name VARCHAR(100)
);

-- Xóa dữ liệu cũ nếu có
DELETE FROM store_bank_info WHERE id = 1;

-- Thêm cấu hình mặc định (có thể sửa trên giao diện sau)
INSERT INTO store_bank_info (id, bank_bin, account_number, account_name) 
VALUES (1, '970422', '123456789', 'SAM COFFEE');
