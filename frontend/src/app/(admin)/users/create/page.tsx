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
    <main className="p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/users" className="p-2 rounded-full hover:bg-dark-surface mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-dark-text-primary">Thêm nhân viên mới</h1>
        </div>

        <div className="bg-dark-surface p-8 rounded-lg border border-dark-border shadow-lg">
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="text-sm font-medium text-dark-text-secondary">Họ và tên (*)</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-dark-text-secondary">Email (*)</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nhanvien@samcoffee.vn"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>

            <div>
              <label htmlFor="password"  className="text-sm font-medium text-dark-text-secondary">Mật khẩu (*)</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="•••••••• (ít nhất 6 ký tự)"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="text-sm font-medium text-dark-text-secondary">Vai trò (*)</label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
                <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-md appearance-none focus:ring-2 focus:ring-brand-amber">
                  <option value={UserRole.BARISTA}>Nhân viên Pha chế (Barista)</option>
                  <option value={UserRole.CASHIER}>Nhân viên Thu ngân (Cashier)</option>
                  <option value={UserRole.MANAGER}>Quản lý (Manager)</option>
                  <option value={UserRole.OWNER}>Chủ sở hữu (Owner)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={loading} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-brand-amber text-black font-bold rounded-md hover:bg-brand-amber-dark disabled:opacity-50 transition-colors">
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