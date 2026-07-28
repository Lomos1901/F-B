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
    <main className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-dark-surface rounded-full border border-dark-border mb-4">
            <Coffee className="text-brand-amber" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-dark-text-primary">Sẫm Coffee</h1>
          <p className="text-dark-text-secondary">Đăng nhập hệ thống quản trị</p>
        </div>

        <div className="bg-dark-surface p-8 rounded-lg border border-dark-border shadow-2xl shadow-black/20">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-dark-text-secondary">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@samcoffee.vn"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber focus:border-brand-amber"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password"  className="text-sm font-medium text-dark-text-secondary">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber focus:border-brand-amber"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-amber text-black font-bold rounded-md hover:bg-brand-amber-dark disabled:opacity-50 transition-colors">
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              {!loading && <LogIn size={18} />}
            </button>
          </form>
          {/* --- THÊM LIÊN KẾT ĐĂNG KÝ --- */}
          <div className="text-center mt-6">
            <p className="text-sm text-dark-text-secondary">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-semibold text-brand-amber hover:underline">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}