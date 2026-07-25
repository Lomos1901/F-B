'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/src/components/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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