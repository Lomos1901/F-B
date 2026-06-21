import Link from 'next/link';
import { ReactNode } from 'react';
import { ShoppingCart, Coffee, ClipboardList, Box, History, Book } from 'lucide-react';

interface AdminCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}

const AdminCard = ({ href, title, description, icon }: AdminCardProps) => (
  <Link href={href} className="bg-dark-surface p-6 rounded-lg border border-dark-border hover:border-brand-amber hover:-translate-y-1 transition-all duration-300 flex items-start gap-5 group">
    <div className="bg-brand-amber/10 text-brand-amber p-3 rounded-lg border border-brand-amber/20">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-lg text-dark-text-primary group-hover:text-brand-amber transition-colors">{title}</h3>
      <p className="text-sm text-dark-text-secondary mt-1">{description}</p>
    </div>
  </Link>
);

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold text-dark-text-primary mb-2">Chào mừng trở lại!</h1>
      <p className="text-dark-text-secondary mb-8">Đây là trung tâm điều hành của Sẫm Coffee. Bạn muốn làm gì hôm nay?</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminCard
          href="/pos"
          title="Bán hàng (POS)"
          description="Mở giao diện thu ngân để tạo đơn và thanh toán cho khách."
          icon={<ShoppingCart size={24} />}
        />
        <AdminCard
          href="/kds"
          title="Pha chế (KDS)"
          description="Hiển thị các đơn hàng đang chờ và đang thực hiện cho Barista."
          icon={<Coffee size={24} />}
        />
        <AdminCard
          href="/products"
          title="Quản lý Thực đơn"
          description="Thêm, sửa, xóa các món nước và công thức định lượng."
          icon={<ClipboardList size={24} />}
        />
        <AdminCard
          href="/ingredients"
          title="Quản lý Kho"
          description="Theo dõi tồn kho, nhập hàng và thực hiện kiểm kho."
          icon={<Box size={24} />}
        />
        <AdminCard
          href="/inventory-receipts"
          title="Lịch sử Phiếu kho"
          description="Xem lại tất cả các giao dịch nhập, xuất, và kiểm kho."
          icon={<History size={24} />}
        />
        <AdminCard
          href="/categories"
          title="Danh mục"
          description="Quản lý các danh mục cho thực đơn và nguyên liệu."
          icon={<Book size={24} />}
        />
      </div>
    </div>
  );
}
