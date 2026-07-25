'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole } from '@/src/enums/user-role.enum';
import { LogOut, LayoutDashboard, ShoppingCart, Coffee, Box, Tag, ClipboardList, Book, History, Users, Bell } from 'lucide-react';
import { ReactNode, useState } from 'react';

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
      className={`
        flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors duration-200
        ${isExpanded ? 'gap-4' : 'gap-0 justify-center'}
        ${isActive(href)
          ? 'bg-brand-amber text-white shadow-md'
          : 'text-slate-700 hover:bg-slate-200'
        }
      `}
    >
      {/* SỬA LỖI: Thêm flex-shrink-0 để icon không bị co lại */}
      <div className="flex-shrink-0">{icon}</div>
      <span className={`whitespace-nowrap transition-all duration-200 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{children}</span>
    </Link>
  );
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user) return null;

  const isManagement = user.role === UserRole.OWNER || user.role === UserRole.MANAGER;

  return (
    <aside
      className={`
        relative transition-all duration-300 ease-in-out bg-slate-50/80 backdrop-blur-lg border-r border-slate-200
        ${isExpanded ? 'w-64' : 'w-20'}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4 overflow-hidden">
          <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-brand-amber/20 flex items-center justify-center">
            <Coffee className="text-brand-amber" size={24} />
          </div>
          <div className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-lg font-bold text-slate-800 whitespace-nowrap">SẪM COFFEE</h2>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 scrollbar-hide">
          {isManagement && (
            <>
              <NavLink href="/dashboard" icon={<LayoutDashboard size={20} />} isExpanded={isExpanded}>Tổng quan</NavLink>
              <NavLink href="/pos" icon={<ShoppingCart size={20} />} isExpanded={isExpanded}>Thu ngân (POS)</NavLink>
              <NavLink href="/kds" icon={<Coffee size={20} />} isExpanded={isExpanded}>Pha chế (KDS)</NavLink>

              <div className="pt-4 mt-4 border-t border-slate-200">
                <div className={`transition-all duration-300 ${isExpanded ? 'h-auto opacity-100' : 'h-0 opacity-0'}`}>
                  <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Quản trị
                  </h3>
                </div>
                <div className="space-y-2">
                  <NavLink href="/ingredients" icon={<Box size={20} />} isExpanded={isExpanded}>Kho nguyên liệu</NavLink>
                  {/* SỬA LỖI: Dùng đúng icon <Tag /> */}
                  <NavLink href="/ingredient-categories" icon={<Tag size={20} />} isExpanded={isExpanded}>Danh mục Nguyên liệu</NavLink>
                  <NavLink href="/products" icon={<ClipboardList size={20} />} isExpanded={isExpanded}>Thực đơn</NavLink>
                  <NavLink href="/categories" icon={<Book size={20} />} isExpanded={isExpanded}>Danh mục Thực đơn</NavLink>
                  <NavLink href="/inventory-receipts" icon={<History size={20} />} isExpanded={isExpanded}>Lịch sử Phiếu kho</NavLink>
                  <NavLink href="/users" icon={<Users size={20} />} isExpanded={isExpanded}>Quản lý Nhân viên</NavLink>
                  <NavLink href="/alerts" icon={<Bell size={20} />} isExpanded={isExpanded}>Trung tâm Cảnh báo</NavLink>
                </div>
              </div>
            </>
          )}

          {user.role === UserRole.BARISTA && <NavLink href="/kds" icon={<Coffee size={20} />} isExpanded={isExpanded}>Màn hình pha chế</NavLink>}
          {user.role === UserRole.CASHIER && <NavLink href="/pos" icon={<ShoppingCart size={20} />} isExpanded={isExpanded}>Màn hình thu ngân</NavLink>}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-brand-amber flex items-center justify-center text-white font-bold">
              {user.full_name?.substring(0, 1).toUpperCase()}
            </div>
            <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
              <div className="text-sm font-bold text-slate-800 whitespace-nowrap">{user.full_name}</div>
              <div className="text-xs text-brand-amber font-semibold whitespace-nowrap">{user.role}</div>
            </div>
          </div>
          <button onClick={logout} className={`w-full flex items-center mt-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg ${isExpanded ? 'gap-4' : 'gap-0 justify-center'}`}>
            <LogOut size={18} />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
}