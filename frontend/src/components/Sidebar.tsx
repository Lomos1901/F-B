'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole } from '@/src/enums/user-role.enum';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isActive = (path: string) => pathname.startsWith(path);

  const handleLogout = () => {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 animate-pulse">Đang tải...</p>
      </aside>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
       window.location.href = '/login';
    }
    return null;
  }

  const isManagement = user.role === UserRole.OWNER || user.role === UserRole.MANAGER;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 shadow-sm">
          <span className="text-xl">☕</span>
        </div>
        <div>
          <h2 className="text-lg font-black tracking-wider text-amber-700">SẪM COFFEE</h2>
          <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-0.5">Premium Inventory</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
        <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3 pl-2">Chức năng</div>

        {/* Dành cho Quản lý & Chủ */}
        {isManagement && (
          <>
            <Link href="/dashboard" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/dashboard') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>📊</span> Tổng quan
            </Link>
            <Link href="/pos" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/pos') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>💰</span> Thu ngân (POS)
            </Link>
            <Link href="/kds" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/kds') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>🍳</span> Pha chế (KDS)
            </Link>
            <div className="pt-2">
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-2 pl-2 pt-2 border-t">Quản trị</div>
              <Link href="/ingredients" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/ingredients') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>📦</span> Kho nguyên liệu
              </Link>
              <Link href="/products" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/products') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>📋</span> Thực đơn
              </Link>
              <Link href="/categories" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/categories') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>📚</span> Danh mục
              </Link>
              <Link href="/inventory-log" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/inventory-log') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>🕒</span> Lịch sử kho
              </Link>
            </div>
          </>
        )}

        {/* Dành cho Barista */}
        {user.role === UserRole.BARISTA && (
           <Link href="/kds" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/kds') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span>🍳</span> Màn hình pha chế
          </Link>
        )}

        {/* Dành cho Thu ngân */}
        {user.role === UserRole.CASHIER && (
           <Link href="/pos" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/pos') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span>💰</span> Màn hình thu ngân
          </Link>
        )}

      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg"
        >
          <span>🚪</span> Đăng xuất
        </button>
        <div className="mt-4 flex items-center gap-3 bg-white p-3 rounded-xl border">
          <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
            {user.full_name?.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">{user.full_name}</div>
            <div className="text-[10px] font-medium text-amber-600">{user.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
