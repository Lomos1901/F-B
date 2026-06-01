import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/src/context/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
