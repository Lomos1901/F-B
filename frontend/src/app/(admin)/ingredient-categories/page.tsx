'use client';

import { useState, useEffect } from 'react';
import { ingredientCategoryService } from '@/src/services/ingredientCategoryService';
import { Tag, Edit, Trash2 } from 'lucide-react';

interface IngredientCategory {
  id: string;
  name: string;
}

// --- COMPONENT MODAL CHỈNH SỬA ---
const EditCategoryModal = ({ category, onClose, onSave }: { category: IngredientCategory, onClose: () => void, onSave: (id: string, name: string) => void }) => {
  const [name, setName] = useState(category.name);

  const handleSaveClick = () => {
    if (!name.trim()) {
      alert('Tên danh mục không được để trống.');
      return;
    }
    onSave(category.id, name);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-brand-amber">Chỉnh sửa Danh mục</h2>
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
        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-dark-border text-dark-text-secondary hover:bg-gray-600 font-semibold">Hủy</button>
          <button onClick={handleSaveClick} className="px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-500">Lưu thay đổi</button>
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

  const loadCategories = async () => {
    try {
      const data = await ingredientCategoryService.getAll();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
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
      setNewCategoryName('');
      loadCategories();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleUpdate = async (id: string, name: string) => {
    try {
      await ingredientCategoryService.update(id, name);
      setEditingCategory(null); // Đóng modal sau khi lưu
      loadCategories();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        await ingredientCategoryService.remove(id);
        loadCategories();
      } catch (err: any) {
        alert(`Lỗi: ${err.message}`);
      }
    }
  };

  if (loading) return <div className="p-8 text-dark-text-secondary">Đang tải...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-dark-text-primary mb-8">Danh mục Nguyên liệu</h1>

        <form onSubmit={handleCreate} className="mb-8 p-6 bg-dark-surface border border-dark-border rounded-lg">
          <label htmlFor="new-category-name" className="text-lg font-semibold text-dark-text-primary mb-2 block">Thêm danh mục mới</label>
          <div className="flex gap-4">
            <input
              id="new-category-name"
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Tên danh mục (ví dụ: Sữa, Syrup...)"
              className="flex-grow p-2.5 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber"
              required
            />
            <button type="submit" className="px-6 py-2.5 bg-brand-amber text-black font-bold rounded-lg hover:bg-brand-amber-dark transition-colors">Thêm</button>
          </div>
        </form>

        <div className="bg-dark-surface border border-dark-border rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Tên Danh mục</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-dark-bg">
                  <td className="px-6 py-4 font-medium text-dark-text-primary">{cat.name}</td>
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
      {/* Render Modal khi có danh mục được chọn để sửa */}
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