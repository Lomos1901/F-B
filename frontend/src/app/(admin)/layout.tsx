'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/src/components/Sidebar';
import { UserRole } from '@/src/enums/user-role.enum';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        const isBarista = user.role === UserRole.BARISTA;
        const isCashier = user.role === UserRole.CASHIER;

        const managementRoutes = ['/dashboard', '/users', '/receipts', '/products', '/categories', '/ingredients', '/ingredient-categories', '/inventory-receipts'];

        if (isBarista && !pathname.startsWith('/kds')) {
          router.replace('/kds');
        } else if (isCashier && managementRoutes.some(route => pathname.startsWith(route))) {
          router.replace('/pos');
        }
      }
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg text-dark-text-primary">
        Đang tải dữ liệu người dùng...
      </div>
    );
  }

  return (
    // SỬA LỖI LAYOUT:
    // 1. Đổi min-h-screen thành h-screen để chiều cao không vượt quá màn hình.
    // 2. Thêm overflow-hidden để ngăn cuộn ở cấp độ cao nhất.
    <div className="flex h-screen bg-dark-bg text-dark-text-primary overflow-hidden">
      <Sidebar />
      {/* 3. Cho phép chỉ khu vực main được cuộn */}
      <main className="flex-1 overflow-y-auto">
        {/* 4. Thêm một div con để chứa padding, đảm bảo thanh cuộn không bị ảnh hưởng bởi padding */}
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}