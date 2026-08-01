'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole } from '@/src/enums/user-role.enum';
import { LogOut, LayoutDashboard, ShoppingCart, Coffee, Box, Tag, ClipboardList, Book, History, Users, Bell, ChevronLeft, ChevronRight, Settings, UserCircle, ReceiptText, Briefcase } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  isExpanded: boolean;
}

const NavLink = ({ href, icon, children, isExpanded }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <Link
      href={href}
      title={isExpanded ? undefined : children as string}
      className={`
        relative flex items-center px-3 py-2.5 mx-3 my-0.5 rounded-full font-medium transition-all duration-200 group text-[14px]
        ${isActive(href)
          ? 'bg-blue-100 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }
      `}
    >
      <div className={`flex items-center justify-center flex-shrink-0 ${isExpanded ? 'mr-3' : 'mx-auto'}`}>
        {icon}
      </div>
      {isExpanded && (
        <span className="whitespace-nowrap flex-1 truncate transition-opacity duration-300">
          {children}
        </span>
      )}
    </Link>
  );
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  }, []);

  if (!user || !isMounted) return null;

  const isManagement = user.role === UserRole.OWNER || user.role === UserRole.MANAGER;

  return (
    <aside
      className={`
        print:hidden relative flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-slate-200 z-20
        ${isExpanded ? 'w-[260px]' : 'w-[72px]'}
      `}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-blue-600 flex items-center justify-center">
            <Coffee className="text-white" size={20} strokeWidth={2.5} />
          </div>
          {isExpanded && (
            <h2 className="text-[17px] font-extrabold text-slate-800 tracking-tight whitespace-nowrap">
              LUMOS COFFEE
            </h2>
          )}
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:shadow-md hover:bg-slate-50 text-slate-400 transition-all z-30 focus:outline-none"
        >
          {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-hide flex flex-col">
        {isManagement && (
          <>
            {/* 1. BÁN HÀNG & PHỤC VỤ */}
            <div className="px-5 mb-1.5 mt-1">
              {isExpanded ? (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bán hàng & Phục vụ</p>
              ) : (
                <div className="w-6 h-px bg-slate-200 mx-auto my-2" />
              )}
            </div>
            <NavLink href="/dashboard" icon={<LayoutDashboard size={20} />} isExpanded={isExpanded}>Tổng quan</NavLink>
            <NavLink href="/pos" icon={<ShoppingCart size={20} />} isExpanded={isExpanded}>Thu ngân (POS)</NavLink>
            <NavLink href="/kds" icon={<Coffee size={20} />} isExpanded={isExpanded}>Pha chế (KDS)</NavLink>
            <NavLink href="/receipts" icon={<ReceiptText size={20} />} isExpanded={isExpanded}>Hóa đơn</NavLink>

            {/* 2. QUẢN LÝ THỰC ĐƠN */}
            <div className="px-5 mb-1.5 mt-5">
              {isExpanded ? (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thực đơn</p>
              ) : (
                <div className="w-6 h-px bg-slate-200 mx-auto my-2" />
              )}
            </div>
            <NavLink href="/products" icon={<ClipboardList size={20} />} isExpanded={isExpanded}>Món ăn & Đồ uống</NavLink>
            <NavLink href="/categories" icon={<Book size={20} />} isExpanded={isExpanded}>Danh mục Thực đơn</NavLink>

            {/* 3. QUẢN LÝ KHO BÃI */}
            <div className="px-5 mb-1.5 mt-5">
              {isExpanded ? (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kho bãi</p>
              ) : (
                <div className="w-6 h-px bg-slate-200 mx-auto my-2" />
              )}
            </div>
            <NavLink href="/ingredients" icon={<Box size={20} />} isExpanded={isExpanded}>Kho nguyên liệu</NavLink>
            <NavLink href="/ingredient-categories" icon={<Tag size={20} />} isExpanded={isExpanded}>Loại nguyên liệu</NavLink>
            <NavLink href="/inventory-receipts" icon={<History size={20} />} isExpanded={isExpanded}>Lịch sử Phiếu kho</NavLink>

            {/* 4. VẬN HÀNH & NHÂN SỰ */}
            <div className="px-5 mb-1.5 mt-5">
              {isExpanded ? (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Vận hành & Nhân sự</p>
              ) : (
                <div className="w-6 h-px bg-slate-200 mx-auto my-2" />
              )}
            </div>
            <NavLink href="/users" icon={<Users size={20} />} isExpanded={isExpanded}>Quản lý Nhân sự</NavLink>
            <NavLink href="/shifts" icon={<Briefcase size={20} />} isExpanded={isExpanded}>Ca làm việc</NavLink>
            <NavLink href="/shift-history" icon={<Briefcase size={20} />} isExpanded={isExpanded}>Lịch sử Ca</NavLink>
            <NavLink href="/alerts" icon={<Bell size={20} />} isExpanded={isExpanded}>Cảnh báo</NavLink>

            {/* 5. HỆ THỐNG */}
            <div className="px-5 mb-1.5 mt-5">
              {isExpanded ? (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hệ thống</p>
              ) : (
                <div className="w-6 h-px bg-slate-200 mx-auto my-2" />
              )}
            </div>
            <NavLink href="/settings" icon={<Settings size={20} />} isExpanded={isExpanded}>Cài đặt quán</NavLink>
          </>
        )}
        
        {(!isManagement) && (
          <>
            <div className="px-5 mb-1.5 mt-1">
              {isExpanded ? (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bán hàng & Phục vụ</p>
              ) : (
                <div className="w-6 h-px bg-slate-200 mx-auto my-2" />
              )}
            </div>

            {user.role === UserRole.CASHIER && (
              <NavLink href="/pos" icon={<ShoppingCart size={20} />} isExpanded={isExpanded}>Thu ngân (POS)</NavLink>
            )}

            {user.role === UserRole.BARISTA && (
              <NavLink href="/kds" icon={<Coffee size={20} />} isExpanded={isExpanded}>Pha chế (KDS)</NavLink>
            )}

            {user.role === UserRole.CASHIER && (
              <NavLink href="/receipts" icon={<ReceiptText size={20} />} isExpanded={isExpanded}>Hóa đơn</NavLink>
            )}

            {user.role === UserRole.CASHIER && (
              <NavLink href="/shifts" icon={<Briefcase size={20} />} isExpanded={isExpanded}>Ca làm việc</NavLink>
            )}
          </>
        )}
        
        <div className="px-5 mb-1.5 mt-5">
          {isExpanded ? (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cá nhân</p>
          ) : (
            <div className="w-6 h-px bg-slate-200 mx-auto my-2" />
          )}
        </div>
        <NavLink href="/profile" icon={<UserCircle size={20} />} isExpanded={isExpanded}>Thông tin tài khoản</NavLink>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-slate-100">
        <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'} mb-3 px-1`}>
          <div className="w-9 h-9 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</p>
              <p className="text-xs font-medium text-blue-600 capitalize truncate">{user.role.toLowerCase()}</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={logout} 
          title={isExpanded ? undefined : 'Đăng xuất'}
          className={`w-full flex items-center justify-center py-2 rounded-full font-medium text-red-500 hover:bg-red-50 transition-colors group text-sm ${isExpanded ? 'gap-2' : ''}`}
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          {isExpanded && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}