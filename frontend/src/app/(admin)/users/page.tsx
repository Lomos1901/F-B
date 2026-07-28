'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { userService } from '@/src/services/userService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Users, Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole } from '@/src/enums/user-role.enum';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const RoleBadge = ({ role }: { role: string }) => {
  const styles = {
    OWNER: 'bg-red-900/50 text-red-300',
    MANAGER: 'bg-purple-900/50 text-purple-300',
    BARISTA: 'bg-green-900/50 text-green-300',
    CASHIER: 'bg-blue-900/50 text-blue-300',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role as keyof typeof styles] || 'bg-gray-700'}`}>{role}</span>;
};

// --- COMPONENT MODAL CHỈNH SỬA ---
const EditUserModal = ({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: (id: string, fullName: string, role: UserRole) => void }) => {
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState(user.role as UserRole);

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống.");
      return;
    }
    onSave(user.id, fullName, role);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 text-brand-amber">Chỉnh sửa thông tin nhân viên</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Họ và tên</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Email (Không thể thay đổi)</label>
            <input type="email" value={user.email} disabled className="w-full p-2.5 bg-dark-bg/50 border-dark-border rounded-md text-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Vai trò</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" size={18} />
              <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border-dark-border rounded-md appearance-none">
                <option value={UserRole.BARISTA}>Nhân viên Pha chế</option>
                <option value={UserRole.CASHIER}>Nhân viên Thu ngân</option>
                <option value={UserRole.MANAGER}>Quản lý</option>
                <option value={UserRole.OWNER}>Chủ sở hữu</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-dark-border text-dark-text-secondary hover:bg-gray-600 font-semibold">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-500">Lưu thay đổi</button>
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
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (currentUser?.id === userId) {
      toast.error("Bạn không thể tự xóa chính mình.");
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn người dùng "${userName}"? Hành động này không thể hoàn tác.`)) {
      try {
        await userService.remove(userId);
        toast.success(`Đã xóa người dùng ${userName}.`);
        fetchUsers();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  if (loading) return <div className="p-8 text-dark-text-secondary">Đang tải danh sách nhân viên...</div>;

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-text-primary flex items-center gap-3">
          <Users size={28} />
          Quản lý Nhân viên
        </h1>
        <Link href="/users/create" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-brand-amber text-black hover:bg-brand-amber-dark transition-all">
          <Plus size={16} />
          Thêm nhân viên
        </Link>
      </div>

      <div className="bg-dark-surface border border-dark-border shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Họ và tên</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Vai trò</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Ngày tham gia</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-dark-bg transition-colors">
                <td className="px-6 py-4 font-medium text-dark-text-primary">{user.full_name}</td>
                <td className="px-6 py-4 text-dark-text-secondary">{user.email}</td>
                <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                <td className="px-6 py-4 text-dark-text-secondary">{format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}</td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button onClick={() => setEditingUser(user)} className="p-2 text-blue-400 hover:bg-dark-bg rounded-full" title="Sửa"><Edit size={16}/></button>
                  {currentUser?.role === UserRole.OWNER && (
                    <button onClick={() => handleDelete(user.id, user.full_name)} className="p-2 text-red-500 hover:bg-dark-bg rounded-full" title="Xóa"><Trash2 size={16}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdate} />}
    </main>
  );
}