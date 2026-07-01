'use client';

import { useState, useEffect } from 'react';
import { categoryService } from '@/src/services/categoryService';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface Category {
  id: string;
  name: string;
  description?: string;
}

const EditCategoryModal = ({ category, onClose, onSave }: { category: Category, onClose: () => void, onSave: (id: string, name: string, description: string) => void }) => {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || '');

  const handleSaveClick = () => {
    if (!name.trim()) {
      toast.error('Tên danh mục không được để trống.');
      return;
    }
    onSave(category.id, name, description);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-brand-amber">Chỉnh sửa Danh mục</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-category-name" className="block text-sm font-medium text-dark-text-secondary mb-1">Tên danh mục</label>
            <input
              id="edit-category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber"
            />
          </div>
          <div>
            <label htmlFor="edit-category-desc" className="block text-sm font-medium text-dark-text-secondary mb-1">Mô tả</label>
            <input
              id="edit-category-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-dark-border text-dark-text-secondary hover:bg-gray-600 font-semibold">Hủy</button>
          <button onClick={handleSaveClick} className="px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-500">Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await categoryService.create({ name: newCategoryName, description: newCategoryDesc });
      toast.success('Tạo danh mục thành công!');
      setNewCategoryName('');
      setNewCategoryDesc('');
      loadCategories();
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    }
  };

  const handleUpdate = async (id: string, name: string, description: string) => {
    try {
      await categoryService.update(id, { name, description });
      toast.success('Cập nhật danh mục thành công!');
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        await categoryService.remove(id);
        toast.success('Xóa danh mục thành công!');
        loadCategories();
      } catch (err: any) {
        toast.error(`Lỗi: ${err.message}`);
      }
    }
  };

  if (loading) return <div className="p-8 text-dark-text-secondary">Đang tải...</div>;
  if (error && categories.length === 0) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-dark-text-primary mb-8">Danh mục Thực đơn</h1>
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-dark-surface border border-dark-border rounded-lg space-y-4">
          <h2 className="text-lg font-semibold text-dark-text-primary mb-2">Thêm danh mục mới</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Tên danh mục (*)"
              className="p-2.5 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber"
              required
            />
            <input
              type="text"
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
              placeholder="Mô tả ngắn (tùy chọn)"
              className="p-2.5 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber"
            />
          </div>
          <div className="text-right">
            <button type="submit" className="px-6 py-2.5 bg-brand-amber text-black font-bold rounded-lg hover:bg-brand-amber-dark transition-colors">Thêm</button>
          </div>
        </form>
        <div className="bg-dark-surface border border-dark-border rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Tên Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-dark-bg">
                  <td className="px-6 py-4 font-medium text-dark-text-primary">{cat.name}</td>
                  <td className="px-6 py-4 text-dark-text-secondary">{cat.description}</td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => setEditingCategory(cat)} className="p-2 text-blue-400 hover:bg-dark-bg rounded-full" title="Sửa"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-dark-bg rounded-full" title="Xóa"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleUpdate}
        />
      )}
    </main>
  );
}