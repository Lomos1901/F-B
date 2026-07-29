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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-slate-800">Chỉnh sửa Danh mục</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-category-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tên danh mục</label>
            <input
              id="edit-category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label htmlFor="edit-category-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mô tả</label>
            <input
              id="edit-category-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-5 py-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors">Hủy</button>
          <button onClick={handleSaveClick} className="px-5 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm">Lưu thay đổi</button>
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

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 text-slate-500">Đang tải...</div>;
  if (error && categories.length === 0) return <div className="min-h-screen bg-slate-50 p-8 text-red-500">{error}</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-8">Danh mục Thực đơn</h1>
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider mb-2">Thêm danh mục mới</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Tên danh mục (*)"
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
            <input
              type="text"
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
              placeholder="Mô tả ngắn (tùy chọn)"
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="text-right">
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm">Thêm</button>
          </div>
        </form>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tên Danh mục</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{cat.name}</td>
                  <td className="px-6 py-4 text-slate-500">{cat.description}</td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => setEditingCategory(cat)} className="inline-flex items-center justify-center p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors" title="Sửa"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(cat.id)} className="inline-flex items-center justify-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors" title="Xóa"><Trash2 size={16}/></button>
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