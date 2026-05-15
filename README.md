# Hệ thống Quản lý F&B Smart Inventory (Sẫm Coffee)

Dự án quản lý vận hành và kiểm soát định mức nguyên liệu thông minh dành cho quán F&B, tích hợp QR Order và Trí tuệ nhân tạo (AI).

## 🚀 Công nghệ sử dụng
- **Backend:** NestJS, Supabase (PostgreSQL)
- **Frontend:** Next.js (App Router), Tailwind CSS
- **Database:** Supabase Real-time

## 🛠 Cấu trúc thư mục
- `/backend`: Mã nguồn xử lý logic server và kết nối Database.
- `/frontend`: Giao diện người dùng và quản lý kho hàng.

## ✨ Tính năng chính (Đang phát triển)
- [x] Quản lý danh mục nguyên liệu thực tế.
- [x] Cảnh báo tồn kho dưới ngưỡng tối thiểu (min_threshold).
- [ ] Tích hợp QR Code gọi món tự động trừ kho.
- [ ] AI phát hiện bất thường trong việc tiêu thụ nguyên liệu.

## 📦 Hướng dẫn cài đặt
1. `git clone https://github.com/Lomos1901/F-B.git`
2. Tại `/backend`: `npm install` -> `npm run start:dev`
3. Tại `/frontend`: `npm install` -> `npm run dev`
