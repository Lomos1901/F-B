'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userService } from '@/src/services/userService';
import { UserRole } from '@/src/enums/user-role.enum';
import { toast } from 'react-toastify';
import { ArrowLeft, User, Mail, Lock, Briefcase, UserPlus } from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BARISTA);
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    setLoading(true);
    try {
      await userService.create({ email, password, fullName, role });
      toast.success('Tạo tài khoản nhân viên thành công!');
      router.push('/users');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/users" className="p-2 rounded-full text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Thêm nhân viên mới</h1>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700">Họ và tên (*)</label>
              <div className="relative mt-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nguyễn Văn A"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Email (*)</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nhanvien@samcoffee.vn"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-700">Mật khẩu (*)</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="•••••••• (ít nhất 6 ký tự)"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="text-sm font-medium text-slate-700">Vai trò (*)</label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 appearance-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                  <option value={UserRole.BARISTA}>Nhân viên Pha chế (Barista)</option>
                  <option value={UserRole.CASHIER}>Nhân viên Thu ngân (Cashier)</option>
                  <option value={UserRole.MANAGER}>Quản lý (Manager)</option>
                  <option value={UserRole.OWNER}>Chủ sở hữu (Owner)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={loading} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm">
                {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                {!loading && <UserPlus size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}