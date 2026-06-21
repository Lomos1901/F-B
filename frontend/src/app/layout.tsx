import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Sẫm Coffee", // Tiêu đề chung
  description: "Hệ thống quản lý và gọi món Sẫm Coffee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.className} dark`}>
      <body className="bg-dark-bg text-dark-text-primary">
        <AuthProvider>
          {/* Bây giờ RootLayout chỉ cung cấp Auth và không chứa layout cụ thể */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
