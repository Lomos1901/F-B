# Hướng Dẫn Triển Khai Hệ Thống Sẫm Coffee Lên Internet

Chào bạn, để đưa hệ thống POS này lên Internet giúp bạn có thể truy cập từ điện thoại bằng 4G hoặc bất cứ đâu trên thế giới, chúng ta sẽ cần làm 3 bước chính. Hệ thống được chia làm 3 phần:
1. **Database (Dữ liệu):** Đang nằm trên Supabase (Đã xong, online sẵn).
2. **Backend (Xử lý logic):** Sẽ triển khai lên **Render.com** (Miễn phí, dễ dùng).
3. **Frontend (Giao diện):** Sẽ triển khai lên **Vercel.com** (Nhanh nhất, tối ưu cho Next.js).

Dưới đây là từng bước cụ thể, cực kỳ đơn giản:

---

## BƯỚC 1: ĐƯA MÃ NGUỒN (SOURCE CODE) LÊN GITHUB
Cả Render và Vercel đều lấy mã nguồn trực tiếp từ GitHub để tự động chạy.
1. Bạn hãy đăng ký một tài khoản tại [GitHub.com](https://github.com/) (nếu chưa có).
2. Tải và cài đặt **GitHub Desktop** để thao tác cho dễ.
3. Trong GitHub Desktop, chọn **File ➔ Add Local Repository** và chọn thư mục `D:\SAMCAFFEE`.
4. Điền tên Commit (VD: "Ready for deployment") và bấm **Commit to main**.
5. Bấm **Publish repository** để đẩy toàn bộ code của bạn lên GitHub (Nhớ chọn *Private* nếu bạn không muốn ai xem code của mình).

---

## BƯỚC 2: DEPLOY BACKEND LÊN RENDER
Backend cần được chạy trước để Frontend có cái mà kết nối vào.
1. Truy cập [Render.com](https://render.com/) và đăng nhập bằng tài khoản GitHub vừa tạo.
2. Bấm nút **New +** ở góc phải trên cùng ➔ Chọn **Web Service**.
3. Chọn **Build and deploy from a Git repository**, sau đó kết nối với kho chứa `SAMCAFFEE` của bạn.
4. Điền các cấu hình sau:
   - **Name:** `samcaffee-backend`
   - **Root Directory:** `backend` *(Cực kỳ quan trọng, không được gõ sai)*
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
5. Cuộn xuống phần **Environment Variables** (Biến môi trường) và thêm 3 dòng sau (lấy từ file `.env` cũ của bạn):
   - `SUPABASE_URL` = (Đường dẫn Supabase của bạn)
   - `SUPABASE_KEY` = (Khóa Anon Key của Supabase)
       - `JWT_SECRET` = (Mật khẩu bí mật JWT của bạn, VD: *samcaffee-super-secret-key-2024*)
6. Bấm **Create Web Service**. Chờ khoảng 2-3 phút, Render sẽ cung cấp cho bạn một đường link màu xanh lá cây (Ví dụ: `https://samcaffee-backend.onrender.com`).
**➔ Lưu lại đường link này để dùng cho Bước 3.**

---

## BƯỚC 3: DEPLOY FRONTEND LÊN VERCEL
1. Truy cập [Vercel.com](https://vercel.com/) và đăng nhập bằng GitHub.
2. Bấm **Add New ➔ Project**.
3. Vercel sẽ hiện ra danh sách các kho code GitHub của bạn. Bấm **Import** kho `SAMCAFFEE`.
4. Trong phần **Configure Project**:
   - **Root Directory:** Bấm nút *Edit* và chọn thư mục `frontend`.
   - **Framework Preset:** Vercel sẽ tự nhận diện là `Next.js` (cứ để nguyên).
5. Mở phần **Environment Variables** và thêm đúng 1 dòng:
       - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://samcaffee-backend.onrender.com` *(Thay bằng đường link màu xanh lá bạn lấy được ở Bước 2).*
6. Bấm **Deploy** và chờ Vercel tung pháo hoa 🎉.

---

### HOÀN TẤT!
Khi Vercel chạy xong, bạn sẽ được cấp một tên miền (Ví dụ: `https://samcaffee-frontend.vercel.app`).
Bây giờ, bạn có thể:
1. Gửi link này cho nhân viên đăng nhập.
2. Dùng điện thoại 4G quét mã QR (Chỉ cần tạo mã QR trỏ về link `https://...vercel.app/qr-order/1`).
3. Quản lý quán cafe từ xa bất kể bạn đang ở đâu!

*(Lưu ý: Tôi đã lập trình sẵn để hệ thống tự động nhận diện và chuyển đổi giữa Localhost và Cloud, nên bạn cứ việc Deploy theo hướng dẫn này, code hiện tại đã hoàn toàn sẵn sàng!)*
