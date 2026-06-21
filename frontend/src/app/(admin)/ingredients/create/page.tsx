'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ingredientService } from '@/src/services/ingredientService';
import { ingredientCategoryService } from '@/src/services/ingredientCategoryService';
import { ArrowLeft } from 'lucide-react';

interface IngredientCategory {
  id: string;
  name: string;
}

export default function CreateIngredientPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [baseUnit, setBaseUnit] = useState('');
  const [recipeUnit, setRecipeUnit] = useState('');
  const [conversionFactor, setConversionFactor] = useState<number | ''>('');
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await ingredientCategoryService.getAll();
        setCategories(data);
      } catch (err) {
        setError('Không thể tải danh mục nguyên liệu.');
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !baseUnit || !recipeUnit || !conversionFactor || !costPerUnit) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    setLoading(true);
    setError('');

    const payload: any = {
      name,
      base_unit: baseUnit,
      recipe_unit: recipeUnit,
      conversion_factor: Number(conversionFactor),
      cost_per_unit: Number(costPerUnit),
    };
    if (categoryId) payload.category_id = categoryId;

    try {
      await ingredientService.create(payload);
      alert('Tạo nguyên liệu mới thành công!');
      router.push('/ingredients');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/ingredients" className="p-2 rounded-full hover:bg-dark-surface mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-dark-text-primary">Thêm Nguyên liệu mới</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-border shadow-lg rounded-lg p-8 space-y-6">
          {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md text-sm">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Tên nguyên liệu (*)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Danh mục</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber">
                <option value="">-- Chọn danh mục --</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-dark-border pt-6 space-y-6">
            <p className="text-lg font-semibold text-brand-amber">Quy đổi Đơn vị</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Đơn vị Lưu kho (*)</label>
                <input type="text" value={baseUnit} onChange={e => setBaseUnit(e.target.value)} placeholder="kg, lít, chai" className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Đơn vị Pha chế (*)</label>
                <input type="text" value={recipeUnit} onChange={e => setRecipeUnit(e.target.value)} placeholder="g, ml" className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Hệ số Quy đổi (*)</label>
                <input type="number" value={conversionFactor} onChange={e => setConversionFactor(e.target.value === '' ? '' : Number(e.target.value))} placeholder="1000" className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md" required />
              </div>
            </div>
          </div>

          <div className="border-t border-dark-border pt-6">
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Giá vốn / Đơn vị Lưu kho (*)</label>
            <div className="relative">
              <input type="number" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md pr-10" required />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-dark-text-secondary">đ</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="px-6 py-3 bg-brand-amber text-black font-bold rounded-lg hover:bg-brand-amber-dark disabled:opacity-50 transition-all">
              {loading ? 'Đang lưu...' : 'Lưu Nguyên liệu'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
