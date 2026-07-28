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
        relative flex items-center px-3 py-3 mx-2 my-1 rounded-xl font-medium transition-all duration-200 group
        ${isActive(href)
          ? 'bg-brand-amber/10 text-brand-amber'
          : 'text-dark-text-secondary hover:bg-dark-bg hover:text-dark-text-primary'
        }
      `}
    >
      {isActive(href) && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-amber rounded-r-full" />
      )}
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
        relative flex flex-col transition-all duration-300 ease-in-out bg-dark-surface border-r border-dark-border z-20 shadow-sm
        ${isExpanded ? 'w-64' : 'w-20'}
      `}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-dark-border relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-tr from-brand-amber to-yellow-400 flex items-center justify-center shadow-md">
            <Coffee className="text-white" size={22} strokeWidth={2.5} />
          </div>
          {isExpanded && (
            <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight whitespace-nowrap">
              SẪM COFFEE
            </h2>
          )}
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3.5 top-7 bg-white border border-dark-border rounded-full p-1 shadow-sm hover:shadow-md hover:bg-gray-50 text-dark-text-secondary transition-all z-30 focus:outline-none"
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide flex flex-col gap-1">
        {isManagement && (
          <>
            <div className="px-3 mb-2 mt-2">
              {isExpanded ? (
                <p className="text-xs font-bold text-dark-text-secondary/60 uppercase tracking-widest pl-2">Hoạt động</p>
              ) : (
                <div className="w-6 h-px bg-dark-border mx-auto" />
              )}
            </div>
            
            <NavLink href="/dashboard" icon={<LayoutDashboard size={20} />} isExpanded={isExpanded}>Tổng quan</NavLink>
            <NavLink href="/pos" icon={<ShoppingCart size={20} />} isExpanded={isExpanded}>Thu ngân (POS)</NavLink>
            <NavLink href="/kds" icon={<Coffee size={20} />} isExpanded={isExpanded}>Pha chế (KDS)</NavLink>
            <NavLink href="/receipts" icon={<ReceiptText size={20} />} isExpanded={isExpanded}>Hóa đơn (Lịch sử)</NavLink>

            <div className="px-3 mb-2 mt-6">
              {isExpanded ? (
                <p className="text-xs font-bold text-dark-text-secondary/60 uppercase tracking-widest pl-2">Quản trị</p>
              ) : (
                <div className="w-6 h-px bg-dark-border mx-auto" />
              )}
            </div>
            <NavLink href="/shift-history" icon={<History size={20} />} isExpanded={isExpanded}>Lịch sử Ca</NavLink>
            <NavLink href="/products" icon={<ClipboardList size={20} />} isExpanded={isExpanded}>Thực đơn</NavLink>
            <NavLink href="/categories" icon={<Book size={20} />} isExpanded={isExpanded}>Danh mục Thực đơn</NavLink>
            <NavLink href="/ingredients" icon={<Box size={20} />} isExpanded={isExpanded}>Kho nguyên liệu</NavLink>
            <NavLink href="/ingredient-categories" icon={<Tag size={20} />} isExpanded={isExpanded}>Loại nguyên liệu</NavLink>
            <NavLink href="/inventory-receipts" icon={<History size={20} />} isExpanded={isExpanded}>Lịch sử Nhập/Xuất</NavLink>
            <NavLink href="/users" icon={<Users size={20} />} isExpanded={isExpanded}>Nhân sự</NavLink>
            <NavLink href="/alerts" icon={<Bell size={20} />} isExpanded={isExpanded}>Cảnh báo</NavLink>
            <NavLink href="/settings" icon={<Settings size={20} />} isExpanded={isExpanded}>Cài đặt quán</NavLink>
          </>
        )}
        
        {(!isManagement) && (
          <>
            <div className="px-3 mb-2 mt-2">
              {isExpanded ? (
                <p className="text-xs font-bold text-dark-text-secondary/60 uppercase tracking-widest pl-2">Hoạt động</p>
              ) : (
                <div className="w-6 h-px bg-dark-border mx-auto" />
              )}
            </div>

            {user.role === UserRole.CASHIER && (
              <NavLink href="/pos" icon={<ShoppingCart size={20} />} isExpanded={isExpanded}>Màn hình thu ngân</NavLink>
            )}

            {user.role === UserRole.BARISTA && (
              <NavLink href="/kds" icon={<Coffee size={20} />} isExpanded={isExpanded}>Màn hình pha chế</NavLink>
            )}

            {user.role === UserRole.CASHIER && (
              <NavLink href="/receipts" icon={<ReceiptText size={20} />} isExpanded={isExpanded}>Hóa đơn</NavLink>
            )}

            {(user.role === UserRole.CASHIER || user.role === UserRole.OWNER || user.role === UserRole.MANAGER) && (
              <NavLink href="/shifts" icon={<Briefcase size={20} />} isExpanded={isExpanded}>Ca làm việc</NavLink>
            )}
          </>
        )}
        
        <div className="px-3 mb-2 mt-6">
          {isExpanded ? (
            <p className="text-xs font-bold text-dark-text-secondary/60 uppercase tracking-widest pl-2">Cá nhân</p>
          ) : (
            <div className="w-6 h-px bg-dark-border mx-auto" />
          )}
        </div>
        <NavLink href="/profile" icon={<UserCircle size={20} />} isExpanded={isExpanded}>Thông tin tài khoản</NavLink>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-dark-border bg-dark-bg/50">
        <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'} mb-4`}>
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-dark-text-primary font-bold shadow-inner">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-dark-text-primary truncate">{user.full_name}</p>
              <p className="text-xs font-medium text-brand-amber capitalize truncate">{user.role.toLowerCase()}</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={logout} 
          title={isExpanded ? undefined : 'Đăng xuất'}
          className={`w-full flex items-center justify-center py-2.5 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-colors group ${isExpanded ? 'gap-2' : ''}`}
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          {isExpanded && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}