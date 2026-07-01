'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole } from '@/src/enums/user-role.enum';
import { LogOut, LayoutDashboard, ShoppingCart, Coffee, Box, Tag, ClipboardList, Book, History, Users } from 'lucide-react'; // Thêm icon Users
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isActive = (path: string) => pathname.startsWith(path);

  if (!user) return null;

  const isManagement = user.role === UserRole.OWNER || user.role === UserRole.MANAGER;

  const NavLink = ({ href, icon, children }: NavLinkProps) => (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(href) ? 'bg-brand-amber/10 text-brand-amber' : 'text-dark-text-secondary hover:bg-dark-surface hover:text-dark-text-primary'}`}>
      {icon}
      <span>{children}</span>
    </Link>
  );

  return (
    <aside className="w-64 bg-dark-surface flex flex-col border-r border-dark-border">
      <div className="p-6 border-b border-dark-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-amber/20 flex items-center justify-center">
          <Coffee className="text-brand-amber" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-dark-text-primary">SẪM COFFEE</h2>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {isManagement && (
          <>
            <NavLink href="/dashboard" icon={<LayoutDashboard size={18} />}>Tổng quan</NavLink>
            <NavLink href="/pos" icon={<ShoppingCart size={18} />}>Thu ngân (POS)</NavLink>
            <NavLink href="/kds" icon={<Coffee size={18} />}>Pha chế (KDS)</NavLink>

            <div className="pt-4 mt-4 border-t border-dark-border">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quản trị</h3>
              <div className="space-y-2">
                <NavLink href="/ingredients" icon={<Box size={18} />}>Kho nguyên liệu</NavLink>
                <NavLink href="/ingredient-categories" icon={<Tag size={18} />}>Danh mục Nguyên liệu</NavLink>
                <NavLink href="/products" icon={<ClipboardList size={18} />}>Thực đơn</NavLink>
                <NavLink href="/categories" icon={<Book size={18} />}>Danh mục Thực đơn</NavLink>
                <NavLink href="/inventory-receipts" icon={<History size={18} />}>Lịch sử Phiếu kho</NavLink>
                {/* THÊM LINK MỚI */}
                <NavLink href="/users" icon={<Users size={18} />}>Quản lý Nhân viên</NavLink>
              </div>
            </div>
          </>
        )}

        {user.role === UserRole.BARISTA && <NavLink href="/kds" icon={<Coffee size={18} />}>Màn hình pha chế</NavLink>}
        {user.role === UserRole.CASHIER && <NavLink href="/pos" icon={<ShoppingCart size={18} />}>Màn hình thu ngân</NavLink>}
      </nav>

      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center gap-3 bg-dark-bg p-3 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-brand-amber flex items-center justify-center text-dark-bg font-bold">
            {user.full_name?.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-dark-text-primary">{user.full_name}</div>
            <div className="text-xs text-brand-amber">{user.role}</div>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-dark-text-secondary hover:bg-dark-surface rounded-lg">
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}