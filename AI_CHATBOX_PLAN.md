# KẾ HOẠCH NÂNG CẤP AI CHATBOX (VERSION 2.0)

## Ý tưởng cốt lõi
Chuyển đổi/Bổ sung thêm mô hình **Pull-based AI (Chatbot Trợ lý ảo)** bên cạnh hệ thống Cảnh báo tự động hiện tại.
Thay vì thụ động chờ cảnh báo, Chủ quán có thể chủ động đặt câu hỏi qua một khung chat (Ví dụ: "Hôm nay món nào bán chạy?", "Còn thiếu nguyên liệu nào không?").

## Phương pháp thực hiện (Technical Approach)
1. **Function Calling (Gọi hàm):**
   - Không hardcode câu trả lời. AI sẽ được cung cấp một "Hộp công cụ" (Tools/Functions) như `get_top_sales()`, `get_low_inventory()`.
   - AI tự phân tích câu hỏi của Chủ quán và quyết định gọi hàm nào. Backend chạy SQL, trả Data thô (JSON) cho AI. AI xào nấu Data đó thành câu văn tự nhiên.

2. **Huấn luyện Từ khóa & Bối cảnh (System Prompting / Prompt Engineering):**
   - **Bắt từ khóa (Few-shot learning):** Dạy AI hiểu các thuật ngữ đặc thù của quán (VD: "đắt hàng" = bán chạy, "cạn kho" = tồn kho thấp).
   - **Khuôn mẫu trả lời:** Ép AI luôn xưng hô "Em/Sếp", trả lời ngắn gọn, có gạch đầu dòng, tô đậm các con số quan trọng, không bịa đặt số liệu (Zero-hallucination).

## Ưu điểm
- Tạo trải nghiệm người dùng (UX) cực kỳ hiện đại, đẳng cấp.
- Cho phép chủ quán Drill-down (đào sâu) vào số liệu linh hoạt mà không cần phải chờ lập trình viên code thêm các bảng biểu báo cáo mới.
