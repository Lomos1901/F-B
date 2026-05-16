'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (path: string) => pathname === path;

  // Khởi tạo state lưu thông tin user đăng nhập động
  const [currentUser, setCurrentUser] = useState<{ full_name: string; role: string } | null>(null);

  // Đọc thông tin user từ Cookie ngay khi layout được dựng lên
  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        setCurrentUser(JSON.parse(userCookie));
      } catch (e) {
        console.error("Lỗi parse thông tin user từ Cookie", e);
      }
    }
  }, []);

  // Xử lý logic Đăng xuất tài khoản
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();

    // Xóa sạch Cookie trình duyệt
    Cookies.remove('access_token');
    Cookies.remove('user');

    // Chuyển hướng về trang đăng nhập
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#120c0a] text-[#f4f1ea] font-sans antialiased">
      
      {/* SIDEBAR - Thiết kế tone Cà phê thượng hạng */}
      <aside className="w-72 border-r border-[#2d221e] bg-[#1c1412]/95 backdrop-blur-md p-6 flex flex-col justify-between sticky top-0 h-screen z-50">
        <div className="space-y-8">
          
          {/* Logo Thương Hiệu Sẫm Coffee */}
          <div className="border-b border-[#2d221e] pb-6 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
                <span className="text-xl">☕</span>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-widest text-amber-500 font-serif">
                  SẪM COFFEE
                </h1>
                <p className="text-[10px] text-amber-600/70 uppercase font-mono tracking-widest mt-0.5">
                  Premium Inventory
                </p>
              </div>
            </div>
          </div>

          
          {/* Menu Điều hướng phân cấp nghệ thuật */}
          <nav className="flex flex-col space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-[#705a52] tracking-wider px-3 mb-2">
              Quản trị cốt lõi
            </div>
            
            {/* 1. KHO NGUYÊN LIỆU THÔ */}
            <Link
              href="/dashboard"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                isActive('/dashboard')
                  ? 'bg-amber-600/15 text-amber-500 border border-amber-500/20 shadow-inner'
                  : 'text-[#a3968e] hover:bg-[#231917] hover:text-[#f4f1ea]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 group-hover:scale-110 ${isActive('/dashboard') ? 'text-amber-500' : 'text-[#705a52]'}`}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              <span>Kho nguyên liệu thô</span>
            </Link>

            {/* 2. QUAN LÝ DANH MỤC (MENU MỚI THÊM) */}
            <Link
              href="/categories"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                isActive('/categories')
                  ? 'bg-amber-600/15 text-amber-500 border border-amber-500/20 shadow-inner'
                  : 'text-[#a3968e] hover:bg-[#231917] hover:text-[#f4f1ea]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 group-hover:scale-110 ${isActive('/categories') ? 'text-amber-500' : 'text-[#705a52]'}`}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <span>Quản lý danh mục</span>
            </Link>

            {/* 3. THÊM MÓN MỚI (CẬP NHẬT ICON HỢP LÝ) */}
<Link
  href="/recipes"
  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
    isActive('/recipes')
      ? 'bg-amber-600/15 text-amber-500 border border-amber-500/20 shadow-inner'
      : 'text-[#a3968e] hover:bg-[#231917] hover:text-[#f4f1ea]'
  }`}
>
  {/* Icon Dấu cộng tròn đại diện cho hành động THÊM MÓN MỚI */}
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 group-hover:scale-110 ${isActive('/recipes') ? 'text-amber-500' : 'text-[#705a52]'}`}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
  <span>Thêm món mới</span>
</Link>
{/* 3. DANH SÁCH THỰC ĐƠN (MENU MỚI THÊM) */}
<Link
  href="/products"
  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
    isActive('/products')
      ? 'bg-amber-600/15 text-amber-500 border border-amber-500/20 shadow-inner'
      : 'text-[#a3968e] hover:bg-[#231917] hover:text-[#f4f1ea]'
  }`}
>
  {/* Icon Menu Thẻ Thực Đơn */}
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 group-hover:scale-110 ${isActive('/products') ? 'text-amber-500' : 'text-[#705a52]'}`}>
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
  <span>Danh sách thực đơn</span>
</Link>
            {/* 4. PHÂN TÍCH BIẾN ĐỘNG AI */}
            <Link
              href="/history"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                isActive('/history')
                  ? 'bg-amber-600/15 text-amber-500 border border-amber-500/20 shadow-inner'
                  : 'text-[#a3968e] hover:bg-[#231917] hover:text-[#f4f1ea]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 group-hover:scale-110 ${isActive('/history') ? 'text-amber-500' : 'text-[#705a52]'}`}><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
              <span>Phân tích biến động AI</span>
            </Link>
          </nav>
        </div>

        {/* Khối Thông tin tài khoản & Nút Đăng xuất */}
        <div className="border-t border-[#2d221e] pt-4 space-y-4">
          
          {/* Nút Log out đồng bộ phong cách tinh tế */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500 hover:text-white hover:border-transparent transition-all duration-300 group"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Đăng xuất hệ thống</span>
          </button>

          {/* Avatar hiển thị chữ cái đầu tiên của Tên User */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#3d2d28] to-[#59423b] flex items-center justify-center font-bold text-amber-500 text-sm shadow-md border border-[#4a3933]">
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#1c1412]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-[#e6e1d5] truncate">
                {currentUser?.full_name || 'Chủ quán Sẫm'}
              </p>
              <p className="text-xs text-amber-600/70 font-mono capitalize">
                {currentUser?.role ? `${currentUser.role} Barista` : 'Head Barista'}
              </p>
            </div>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT - Vùng hiển thị các ô nguyên liệu */}
      <div className="flex-1 min-h-screen bg-gradient-to-b from-[#0f0908] to-[#140e0c] overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}