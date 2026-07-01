'use client'; // Thêm dòng này để biến thành Client Component

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import CSS

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

// Metadata không thể export từ client component, nên sẽ bỏ qua ở đây hoặc cần xử lý riêng
// export const metadata: Metadata = {
//   title: "Sẫm Coffee",
//   description: "Hệ thống quản lý và gọi món Sẫm Coffee",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.className} dark`}>
      <body className="bg-dark-bg text-dark-text-primary">
        <AuthProvider>
          {children}
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </AuthProvider>
      </body>
    </html>
  );
}