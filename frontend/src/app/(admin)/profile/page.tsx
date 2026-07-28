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

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-dark-text-primary flex items-center gap-3">
        <UserCircle size={32} className="text-brand-amber" />
        Thông tin Tài khoản
      </h1>

      <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-bold text-dark-text-secondary mb-2 flex items-center gap-2">
              <Mail size={18} />
              Email đăng nhập
            </label>
            <input 
              type="text" 
              value={user.email} 
              disabled 
              className="w-full px-4 py-3 rounded-xl bg-dark-bg/50 border border-dark-border text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-dark-text-secondary/60 mt-2">Email được dùng để đăng nhập và không thể thay đổi.</p>
          </div>

          {/* Vai trò (Read-only) */}
          <div>
            <label className="block text-sm font-bold text-dark-text-secondary mb-2 flex items-center gap-2">
              <Briefcase size={18} />
              Vai trò / Chức vụ
            </label>
            <div className="px-4 py-3 rounded-xl bg-dark-bg/50 border border-dark-border">
              <span className="inline-block px-3 py-1 bg-brand-amber/20 text-brand-amber text-sm font-bold rounded-lg uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-dark-text-secondary/60 mt-2">Chỉ Chủ quán (Owner) mới có quyền thay đổi vai trò của nhân viên.</p>
          </div>

          {/* Họ và tên (Editable) */}
          <div>
            <label className="block text-sm font-bold text-dark-text-secondary mb-2 flex items-center gap-2">
              <UserCircle size={18} />
              Họ và tên hiển thị
            </label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên của bạn..."
              className="w-full px-4 py-3 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-amber focus:ring-1 focus:ring-brand-amber text-dark-text-primary transition-all"
            />
          </div>

          <div className="border-t border-dark-border pt-6 mt-6">
            <h3 className="text-lg font-bold text-dark-text-primary mb-4">Đổi mật khẩu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-dark-text-secondary mb-2">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Để trống nếu không muốn đổi..."
                  className="w-full px-4 py-3 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-amber focus:ring-1 focus:ring-brand-amber text-dark-text-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark-text-secondary mb-2">Nhập lại mật khẩu mới</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-4 py-3 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-amber focus:ring-1 focus:ring-brand-amber text-dark-text-primary transition-all"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 bg-dark-bg/50 border-t border-dark-border flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || (fullName === user.full_name && !password)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-amber hover:bg-brand-amber-dark text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
