'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { userService } from '@/src/services/userService';
import { UserCircle, Save, Loader2, Mail, Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    if (password && password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (password && password !== confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp');
      return;
    }

    setSaving(true);
    try {
      const payload: any = { fullName };
      if (password) {
        payload.password = password;
      }
      
      await userService.update(user.id, payload);
      
      // Update local cookie data so AuthContext picks it up on next reload
      const cookieUser = Cookies.get('user');
      if (cookieUser) {
        const parsed = JSON.parse(cookieUser);
        parsed.full_name = fullName;
        Cookies.set('user', JSON.stringify(parsed));
      }
      
      toast.success('Cập nhật thông tin thành công! Tải lại trang để thấy thay đổi.', { autoClose: 3000 });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-800 flex items-center gap-3">
        <UserCircle size={32} className="text-blue-600" />
        Thông tin Tài khoản
      </h1>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Avatar / Header Section */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold border border-blue-200 shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user.full_name || user.email}</h2>
              <span className="inline-block px-2.5 py-0.5 mt-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider border border-blue-100">
                {user.role}
              </span>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Mail size={18} className="text-blue-600" />
              Email đăng nhập
            </label>
            <input 
              type="text" 
              value={user.email} 
              disabled 
              className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed font-medium outline-none"
            />
            <p className="text-xs text-slate-500 mt-2">Email được dùng để đăng nhập và không thể thay đổi.</p>
          </div>

          {/* Vai trò (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Briefcase size={18} className="text-blue-600" />
              Vai trò / Chức vụ
            </label>
            <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold rounded-full uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Chỉ Chủ quán (Owner) mới có quyền thay đổi vai trò của nhân viên.</p>
          </div>

          {/* Họ và tên (Editable) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <UserCircle size={18} className="text-blue-600" />
              Họ và tên hiển thị
            </label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên của bạn..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 transition-all outline-none"
            />
          </div>

          {/* Mật khẩu */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <h3 className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider mb-4">Đổi mật khẩu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Để trống nếu không muốn đổi..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nhập lại mật khẩu mới</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 transition-all outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || (fullName === user.full_name && !password)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
