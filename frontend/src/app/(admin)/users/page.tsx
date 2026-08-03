'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { userService } from '@/src/services/userService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Users, Plus, Edit, Trash2, Briefcase, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole } from '@/src/enums/user-role.enum';
import ConfirmModal from '@/src/components/ConfirmModal';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const ROLE_PRIORITY: Record<string, number> = {
  OWNER: 1,
  MANAGER: 2,
  CASHIER: 3,
  BARISTA: 4,
};

const RoleBadge = ({ role }: { role: string }) => {
  const roleConfig: Record<string, { label: string; style: string }> = {
    OWNER: { label: 'Chủ cửa hàng', style: 'bg-amber-100 text-amber-700 border border-amber-200' },
    MANAGER: { label: 'Quản lý', style: 'bg-blue-100 text-blue-700 border border-blue-200' },
    CASHIER: { label: 'Thu ngân', style: 'bg-green-100 text-green-700 border border-green-200' },
    BARISTA: { label: 'Pha chế', style: 'bg-purple-100 text-purple-700 border border-purple-200' },
  };

  const config = roleConfig[role] || { label: role, style: 'bg-slate-100 text-slate-700 border border-slate-200' };

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.style}`}>
      {config.label}
    </span>
  );
};

// --- COMPONENT MODAL CHỈNH SỬA ---
const EditUserModal = ({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: (id: string, fullName: string, role: UserRole) => Promise<void> }) => {
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState(user.role as UserRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống.");
      return;
    }
    setIsSubmitting(true);
    await onSave(user.id, fullName, role);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <Briefcase className="text-blue-600" size={24} />
          Chỉnh sửa thông tin
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-800" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email (Tài khoản đăng nhập)</label>
            <input 
              type="email" 
              value={user.email} 
              disabled 
              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium cursor-not-allowed" 
            />
            <p className="text-xs text-slate-500 mt-1">Email không thể thay đổi sau khi tạo.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò hệ thống</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={role} 
                onChange={e => setRole(e.target.value as UserRole)} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 cursor-pointer"
              >
                <option value={UserRole.OWNER}>Chủ cửa hàng (Toàn quyền)</option>
                <option value={UserRole.MANAGER}>Quản lý (Quản trị vận hành)</option>
                <option value={UserRole.CASHIER}>Thu ngân (Màn hình POS)</option>
                <option value={UserRole.BARISTA}>Pha chế (Màn hình KDS)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-8 space-x-3">
          <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors">Hủy bỏ</button>
          <button onClick={handleSave} disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};


export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async (id: string, fullName: string, role: UserRole) => {
    try {
      await userService.update(id, { fullName, role });
      toast.success("Cập nhật thông tin thành công!");
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    if (currentUser?.id === userId) {
      toast.error("Bạn không thể tự xóa chính mình.");
      return;
    }
    setUserToDelete({id: userId, name: userName});
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await userService.remove(userToDelete.id);
      toast.success(`Đã xóa người dùng ${userToDelete.name}.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUserToDelete(null);
    }
  };

  // Lọc và Sắp xếp nhân sự
  const displayUsers = useMemo(() => {
    let filtered = users;
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.full_name.toLowerCase().includes(lowerSearch) || 
        u.email.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered.sort((a, b) => {
      const pA = ROLE_PRIORITY[a.role] || 99;
      const pB = ROLE_PRIORITY[b.role] || 99;
      if (pA !== pB) return pA - pB;
      // Nếu cùng role, xếp theo thời gian mới nhất
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <main className="flex flex-col h-full bg-slate-50 text-slate-800">
      <div className="px-6 py-6 border-b border-slate-200 bg-white flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Users className="text-blue-600" size={28} />
            Quản lý Nhân sự
          </h1>
          <p className="text-slate-500 text-sm mt-1">Thiết lập tài khoản, phân quyền và chức vụ nhân viên.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-semibold text-slate-700 w-64 transition-all"
            />
          </div>

          <Link href="/users/create" className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={18} />
            Thêm nhân sự
          </Link>
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-medium">Họ và tên</th>
                  <th className="px-6 py-4 font-medium">Email đăng nhập</th>
                  <th className="px-6 py-4 font-medium">Phân quyền</th>
                  <th className="px-6 py-4 font-medium">Ngày tham gia</th>
                  <th className="px-6 py-4 font-medium text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Không tìm thấy nhân viên nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  displayUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-base border border-blue-100">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingUser(user)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Sửa thông tin">
                            <Edit size={18} />
                          </button>
                          {currentUser?.role === UserRole.OWNER && currentUser.id !== user.id && (
                            <button onClick={() => handleDelete(user.id, user.full_name)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Xóa nhân viên">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdate} />}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Xóa nhân sự"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn người dùng "${userToDelete?.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={confirmDelete}
        onCancel={() => setUserToDelete(null)}
        type="danger"
      />
    </main>
  );
}