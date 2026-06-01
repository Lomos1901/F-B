'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/src/services/authService';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await register(email, password, fullName);
      setSuccess('Tạo tài khoản thành công! Đang chuyển hướng sang đăng nhập...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
          <h2 className="text-3xl font-bold tracking-tight text-amber-500">Đăng ký thành viên</h2>
          <p className="mt-2 text-sm text-zinc-400">Khởi tạo tài khoản nhân viên Sẫm Coffee</p>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-500 border border-green-500/20">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300">Họ và Tên</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nguyễn Văn Pha Chế"
              className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2.5 text-white focus:border-amber-500 focus:outline-none"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">Email công việc</label>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2.5 text-white focus:border-amber-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">Mật khẩu (Tối thiểu 6 ký tự)</label>
            <input
              type="password"
              required
              minLength={6}
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
            {loading ? 'Đang khởi tạo...' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Đã có tài khoản rồi?{' '}
          <button onClick={() => router.push('/login')} className="text-amber-500 hover:underline">
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
}
