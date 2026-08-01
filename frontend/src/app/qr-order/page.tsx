'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, QrCode, ArrowRight, Utensils, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function QROrderLandingPage() {
  const router = useRouter();
  const [tableInput, setTableInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tableInput.trim();
    if (!trimmed) {
      setError('Vui lòng nhập số bàn của bạn');
      return;
    }
    router.push(`/qr-order/${encodeURIComponent(trimmed)}`);
  };

  const quickTables = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-800">
      {/* Top App Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
              <Coffee size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">LUMOS COFFEE</h1>
              <p className="text-xs text-slate-500 font-medium">Đặt món tại bàn thông minh</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-3.5 py-1.5 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200"
          >
            Trang chủ
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center">
        {/* Hero Banner */}
        <div className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden mb-8">
          <div className="absolute -right-10 -bottom-10 opacity-10 text-white pointer-events-none">
            <Coffee size={300} />
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-4 border border-white/20">
              <Sparkles size={14} className="text-blue-200" />
              <span>Gọi món trực tuyến nhanh chóng</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
              Chào mừng bạn đến với Lumos Coffee
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Vui lòng chọn hoặc nhập số bàn hiển thị trên thẻ QR tại bàn của bạn để bắt đầu chọn món.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Nhập số bàn của bạn</h3>
              <p className="text-xs text-slate-500">Xem menu & đặt món ngay lập tức</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tableNumber" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Số bàn
              </label>
              <input
                id="tableNumber"
                type="text"
                value={tableInput}
                onChange={(e) => {
                  setTableInput(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ví dụ: 1, 2, B3..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-base"
              />
              {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <span>Vào Thực Đơn Đặt Món</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Select Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Hoặc chọn nhanh số bàn
            </span>
            <div className="grid grid-cols-5 gap-2">
              {quickTables.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => router.push(`/qr-order/${num}`)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 rounded-xl text-sm border border-blue-100 transition-colors flex items-center justify-center"
                >
                  Bàn {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Utensils size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Menu đa dạng</p>
              <p className="text-[11px] text-slate-500">Cập nhật liên tục</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Phục vụ tận bàn</p>
              <p className="text-[11px] text-slate-500">Nhanh chóng & tiện lợi</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Thanh toán linh hoạt</p>
              <p className="text-[11px] text-slate-500">Tiền mặt hoặc VietQR</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © {new Date().getFullYear()} LUMOS COFFEE. All rights reserved.
      </footer>
    </div>
  );
}