'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/src/services/authService';
import { UserRole } from '@/src/enums/user-role.enum';
import { Coffee, User, Mail, Lock, Briefcase, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BARISTA); // Mặc định là Barista
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.register(email, password, fullName, role);
      alert('Tạo tài khoản thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-dark-surface rounded-full border border-dark-border mb-4">
            <Coffee className="text-brand-amber" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-dark-text-primary">Tạo tài khoản</h1>
          <p className="text-dark-text-secondary">Thêm nhân viên mới vào hệ thống</p>
        </div>

        <div className="bg-dark-surface p-8 rounded-lg border border-dark-border shadow-2xl shadow-black/20">
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Họ và tên */}
            <div>
              <label htmlFor="fullName" className="text-sm font-medium text-dark-text-secondary">Họ và tên</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-dark-text-secondary">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nhanvien@samcoffee.vn"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="password"  className="text-sm font-medium text-dark-text-secondary">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="•••••••• (ít nhất 6 ký tự)"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>

            {/* Vai trò */}
            <div>
              <label htmlFor="role" className="text-sm font-medium text-dark-text-secondary">Vai trò</label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md appearance-none focus:ring-2 focus:ring-brand-amber">
                  {/* CHỈ HIỂN THỊ CÁC VAI TRÒ CẤP THẤP */}
                  <option value={UserRole.BARISTA}>Nhân viên Pha chế (Barista)</option>
                  <option value={UserRole.CASHIER}>Nhân viên Thu ngân (Cashier)</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-amber text-black font-bold rounded-md hover:bg-brand-amber-dark disabled:opacity-50 transition-colors">
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
              {!loading && <UserPlus size={18} />}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-dark-text-secondary">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-semibold text-brand-amber hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}