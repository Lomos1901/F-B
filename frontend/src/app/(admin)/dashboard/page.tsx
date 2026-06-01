'use client';

import Link from 'next/link';

const AdminCard = ({ href, title, description, icon }) => (
  <Link href={href}>
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-start gap-5 hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer h-full">
      <div className="bg-amber-100 text-amber-700 p-3 rounded-lg border border-amber-200 text-2xl">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-800 text-base mb-1">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  </Link>
);

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] text-gray-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-amber-700 tracking-wide uppercase">
            Bảng điều khiển
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Tổng quan các chức năng quản trị hệ thống Sẫm Coffee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard
            href="/ingredients"
            title="Quản lý Kho"
            description="Theo dõi, nhập xuất và kiểm kê nguyên liệu thô."
            icon="📦"
          />
          <AdminCard
            href="/products"
            title="Quản lý Thực đơn"
            description="Tạo, sửa, xóa các món nước và định lượng công thức."
            icon="🍹"
          />
          <AdminCard
            href="/categories"
            title="Quản lý Nhóm món"
            description="Phân loại các món nước vào từng danh mục cụ thể."
            icon="🏷️"
          />
          <AdminCard
            href="/inventory-log"
            title="Nhật ký Kho"
            description="Xem lại lịch sử tất cả các hoạt động nhập, xuất kho."
            icon="🕒"
          />
          {/* Thêm các card khác cho các chức năng tương lai ở đây */}
        </div>
      </div>
    </main>
  );
}
