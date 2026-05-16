import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// Font chữ cho nội dung, thông số kho (Hiện đại, dễ đọc)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

// Font chữ có chân cho Tiêu đề, Tên quán (Đậm chất nghệ thuật, không gian Coffee)
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Sẫm Coffee - Hệ Thống Quản Trị Kho",
  description: "Hệ thống kiểm soát vận hành, định mức nguyên liệu thông minh tích hợp AI cho Sẫm Coffee.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0f0908] text-[#f4f1ea] selection:bg-amber-500/30 selection:text-amber-200">
        {/* - Đặt nền mặc định là màu nâu đen đậm (#0f0908) để giao diện đồng bộ ngay từ khi load trang.
          - Thêm hiệu ứng bôi đen văn bản (selection) mang màu vàng hổ phách tinh tế.
        */}
        {children}
      </body>
    </html>
  );
}