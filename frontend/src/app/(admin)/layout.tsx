'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/src/components/Sidebar';
// Xóa import ToastContainer vì đã có ở RootLayout
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

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
    <div className="flex min-h-screen bg-dark-bg text-dark-text-primary">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {children}
      </main>
      {/* Xóa ToastContainer khỏi đây */}
    </div>
  );
}