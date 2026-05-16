'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // 🌟 KHẮC PHỤC LỖI TRỐNG COOKIE: Linh hoạt bốc đúng Key xác thực từ Backend
      const activeToken = data.token || data.access_token || data.data?.token || data.data?.access_token;
      
      // Linh hoạt lấy thông tin user để tránh bị undefined
      const activeUser = data.user || data.data?.user || data.data || { full_name: "Lê Đình Duy", role: "barista" };

      // Nếu không bốc được token nào, chặn lại báo lỗi ngay để dễ debug
      if (!activeToken) {
        throw new Error('Đăng nhập thành công nhưng hệ thống không tìm thấy mã Token xác thực!');
      }

      // Lưu JWT Token và thông tin User vào Cookie trong 1 ngày
      Cookies.set('token', activeToken, { expires: 1 });
      Cookies.set('user', JSON.stringify(activeUser), { expires: 1 });

      alert(`Chào mừng ${activeUser.full_name || 'Nhân viên'} quay trở lại Sẫm Coffee!`);
      
      // Đăng nhập xong phi thẳng vào trang quản lý dashboard và ép reload cứng
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-zinc-800 p-8 shadow-xl border border-zinc-700">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-amber-500">Sẫm Coffee</h2>
          <p className="mt-2 text-sm text-zinc-400">Hệ thống quản lý vận hành nội bộ</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300">Email nhân viên</label>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2.5 text-white focus:border-amber-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">Mật khẩu</label>
            <input
              type="password"
              required
              className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2.5 text-white focus:border-amber-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 p-2.5 font-semibold text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Chưa có tài khoản?{' '}
          <button onClick={() => router.push('/register')} className="text-amber-500 hover:underline">
            Đăng ký tại đây
          </button>
        </p>
      </div>
    </div>
  );
}