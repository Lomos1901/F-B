'use client'; // Bắt buộc vì cần hook để kiểm tra route

import Sidebar from '@/src/components/Sidebar';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Nếu chưa loading xong và chưa có user, chuyển về trang login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Trong khi đang tải, có thể hiển thị một màn hình loading
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-bg">
        <p className="text-dark-text-secondary">Đang tải dữ liệu người dùng...</p>
      </div>
    );
  }

  // Nếu đã có user, hiển thị layout với sidebar
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-dark-bg">
        {children}
      </main>
    </div>
  );
}
