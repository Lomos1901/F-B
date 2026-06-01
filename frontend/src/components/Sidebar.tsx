'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();

    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    window.location.href = '/login';
  };

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
        <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3 pl-2">Quản trị cốt lõi</div>

        <Link href="/dashboard" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/dashboard') ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-amber-600'}`}>
          <span>📊</span> Tổng quan
        </Link>
        <Link href="/ingredients" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/ingredients') ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-amber-600'}`}>
          <span>📦</span> Kho nguyên liệu
        </Link>
        <Link href="/categories" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/categories') ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-amber-600'}`}>
          <span>📚</span> Quản lý danh mục
        </Link>
        <Link href="/products" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/products') ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-amber-600'}`}>
          <span>📋</span> Quản lý thực đơn
        </Link>
        <Link href="/inventory-log" className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/inventory-log') ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-amber-600'}`}>
          <span>🕒</span> Lịch sử xuất nhập kho
        </Link>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 mb-4"
        >
          <span>🚪</span> Đăng xuất
        </button>
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-inner relative">
            L
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Lê Đình Duy</div>
            <div className="text-[10px] font-medium text-amber-600">Admin Barista</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
