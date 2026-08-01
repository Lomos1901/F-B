'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { Coffee, Lock, Mail, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'BARISTA') {
        router.push('/kds');
      } else if (user.role === 'CASHIER') {
        router.push('/pos');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    await login(email, password);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 mb-4 shadow-sm">
            <Coffee className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Lumos Coffee</h1>
          <p className="text-slate-500 mt-1 text-sm">Đăng nhập hệ thống quản trị</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@samcoffee.vn"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              {!loading && <LogIn size={18} />}
            </button>
          </form>
          {/* --- THÊM LIÊN KẾT ĐĂNG KÝ --- */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}