'use client';

import { useState, useEffect } from 'react';
import { ingredientCategoryService } from '@/src/services/ingredientCategoryService';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmModal from '@/src/components/ConfirmModal';

interface IngredientCategory {
  id: string;
  name: string;
}

const EditCategoryModal = ({ category, onClose, onSave }: { category: IngredientCategory, onClose: () => void, onSave: (id: string, name: string) => void }) => {
  const [name, setName] = useState(category.name);

  const handleSaveClick = () => {
    if (!name.trim()) {
      toast.error('Tên danh mục không được để trống.');
      return;
    }
    onSave(category.id, name);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-slate-800">Chỉnh sửa Danh mục</h2>
        <div>
          <label htmlFor="edit-category-name" className="block text-sm font-medium text-slate-700 mb-1.5">Tên danh mục</label>
          <input
            id="edit-category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-sm transition-colors">Hủy</button>
          <button onClick={handleSaveClick} className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm">Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
};

export default function IngredientCategoriesPage() {
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const data = await ingredientCategoryService.getAll();
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
      await ingredientCategoryService.create(newCategoryName);
      toast.success('Tạo danh mục thành công!');
      setNewCategoryName('');
      loadCategories();
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    }
  };

  const handleUpdate = async (id: string, name: string) => {
    try {
      await ingredientCategoryService.update(id, name);
      toast.success('Cập nhật danh mục thành công!');
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    }
  };

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await ingredientCategoryService.remove(categoryToDelete);
      toast.success('Xóa danh mục thành công!');
      loadCategories();
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setCategoryToDelete(null);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 font-medium">Đang tải...</div>;
  if (error && categories.length === 0) return <div className="p-8 text-red-500 font-medium">{error}</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight">Danh mục Nguyên liệu</h1>
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <label htmlFor="new-category-name" className="text-lg font-semibold text-slate-800 mb-3 block">Thêm danh mục mới</label>
          <div className="flex gap-3">
            <input
              id="new-category-name"
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Tên danh mục (ví dụ: Sữa, Syrup...)"
              className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              required
            />
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-sm shrink-0">Thêm</button>
          </div>
        </form>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên Danh mục</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{cat.name}</td>
                  <td className="px-6 py-4 text-center space-x-1">
                    <button onClick={() => setEditingCategory(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Sửa"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Xóa"><Trash2 size={16}/></button>
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
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setCategoryToDelete(null)}
        type="danger"
      />
    </main>
  );
}