# Danh Sách Use Case - Hệ Thống F&B Smart Inventory (Lumos)

Dưới đây là danh sách các bong bóng Use Case (các tính năng) được bóc tách từ Source Code thực tế để bạn tiện vẽ vào sơ đồ (StarUML, draw.io, v.v.) vào tối nay.

## 1. Khách Hàng
* `Quét QR & Xem thực đơn`
* `Gọi món trực tuyến`

## 2. Nhân Viên (Tất cả nhân viên đều có các quyền này)
* `Đăng nhập / Đăng xuất`
* `Đổi mật khẩu`
## 3. Nhân Viên Thu Ngân
* `Quản lý bàn` *(Mở bàn, ghép bàn, xem trạng thái)*
* `Quản lý đơn hàng` *(Tạo đơn tại quầy, sửa đơn)*
* `Thanh toán hóa đơn`
* `Quản lý ca làm việc` *(Nhận ca / Giao ca)*

## 4. Nhân Viên Pha Chế
* `Xử lý pha chế` *(Xem món cần làm và bấm hoàn thành)*

## 5. Quản Lý 
*(Lưu ý: Quản lý kế thừa quyền của Thu ngân + Pha chế và có thêm các quyền sau)*
* `Quản lý thực đơn` *(Quản lý món ăn, đồ uống bán ra)*
* `Quản lý nguyên liệu gốc` *(Quản lý các loại đường, sữa, cafe...)*
* `Quản lý phiếu nhập kho` *(Ghi nhận hàng mới nhập về quán)*

## 6. Chủ Quán
*(Lưu ý: Chủ quán kế thừa quyền của Quản lý và có thêm các quyền sau)*
* `Quản lý nhân viên` *(Thêm tài khoản, phân quyền)*
* `Xem báo cáo thống kê` *(Doanh thu, mặt hàng bán chạy)*
* `Tương tác AI Chatbox` *(Hỏi đáp AI về tình hình kinh doanh)*
* `Cấu hình thông tin ngân hàng` *(Để tạo mã QR thanh toán)*

---
**💡 Mẹo nhỏ khi vẽ:**
- Phân quyền kế thừa (Mũi tên trắng chỉ lên): **Chủ quán ➔ Quản lý ➔ (Thu ngân, Pha chế) ➔ Nhân viên**.
- Từ khóa trong Use Case: Bắt đầu bằng Động từ / Cụm danh động từ (Quản lý, Thêm, Xem, Xử lý...)
