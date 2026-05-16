'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="p-10 bg-black min-h-screen text-white flex flex-col justify-center items-center space-y-6">
      <h1 className="text-4xl font-bold text-yellow-500">SẪM COFFEE SYSTEM</h1>
      <p className="text-gray-400">Hệ thống quản lý vận hành tích hợp thông minh</p>
      
      <div className="flex gap-4">
        <Link href="/qr-order" className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl font-bold transition-all">
          Vào trang Gọi món (Khách tại bàn)
        </Link>
        {/* Middleware sẽ can thiệp ở nút này. Nếu chưa có token, bấm vào sẽ tự động văng ra /login */}
        <Link href="/dashboard" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-all border border-gray-700">
          Vào hệ thống Quản lý (Admin)
        </Link>
      </div>
    </main>
  );
}