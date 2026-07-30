-- 1. Xóa toàn bộ các cảnh báo và báo cáo AI cũ
DELETE FROM ai_anomalies;

-- 2. Xóa các tác vụ pha chế trong màn hình KDS (Kitchen Display System)
DELETE FROM preparation_tasks;

-- 3. Xóa chi tiết các đơn hàng cũ
DELETE FROM order_detail;

-- 4. Xóa dữ liệu thanh toán cũ
DELETE FROM payments;

-- 5. Xóa toàn bộ các đơn hàng cũ
DELETE FROM orders;
