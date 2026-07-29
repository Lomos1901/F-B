'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/src/services/authService';
import { UserRole } from '@/src/enums/user-role.enum';
import { Coffee, User, Mail, Lock, Briefcase, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify'; // Import toast

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BARISTA);
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
      toast.success('Tạo tài khoản thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (err: any) {
      const errorMessage = err.message || 'Đăng ký thất bại.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 mb-4 shadow-sm">
            <Coffee className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Tạo tài khoản</h1>
          <p className="text-slate-500 text-sm mt-1">Thêm nhân viên mới vào hệ thống</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Họ và tên */}
            <div>
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700">Họ và tên</label>
              <div className="relative mt-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nhanvien@samcoffee.vn"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="•••••••• (ít nhất 6 ký tự)"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Vai trò */}
            <div>
              <label htmlFor="role" className="text-sm font-medium text-slate-700">Vai trò</label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value={UserRole.BARISTA}>Nhân viên Pha chế (Barista)</option>
                  <option value={UserRole.CASHIER}>Nhân viên Thu ngân (Cashier)</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
              {!loading && <UserPlus size={18} />}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}