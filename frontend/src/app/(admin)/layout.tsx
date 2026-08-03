'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/src/components/Sidebar';
import { UserRole } from '@/src/enums/user-role.enum';
import ChatWidget from '@/src/components/chat/ChatWidget';

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

        const managementRoutes = ['/dashboard', '/users', '/receipts', '/products', '/categories', '/ingredients', '/ingredient-categories', '/inventory-receipts', '/tables-config', '/settings'];

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  const isFullScreenApp = pathname.startsWith('/pos') || pathname.startsWith('/kds');

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className={isFullScreenApp ? "h-full" : "p-4 sm:p-6"}>
          {children}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}