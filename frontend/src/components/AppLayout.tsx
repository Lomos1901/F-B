'use client'; // ĐÁNH DẤU ĐÂY LÀ CLIENT COMPONENT

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Các route không hiển thị Sidebar
  const noSidebarRoutes = ['/login', '/register', '/qr-order'];

  // Kiểm tra xem route hiện tại có nằm trong danh sách không
  const showSidebar = !noSidebarRoutes.some(path => pathname.startsWith(path));

  return (
    <div className="flex h-screen">
      {showSidebar && <Sidebar />}
      <main className="flex-1 overflow-y-auto bg-dark-bg">
        {children}
      </main>
    </div>
  );
}
