'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ingredientService } from '@/src/services/ingredientService';
import { ingredientCategoryService } from '@/src/services/ingredientCategoryService';
import { ArrowLeft } from 'lucide-react';

interface IngredientCategory {
  id: string;
  name: string;
}

export default function EditIngredientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [baseUnit, setBaseUnit] = useState('');
  const [recipeUnit, setRecipeUnit] = useState('');
  const [conversionFactor, setConversionFactor] = useState<number | ''>('');
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, ingredient] = await Promise.all([
          ingredientCategoryService.getAll(),
          ingredientService.getById(id)
        ]);
        setCategories(cats);
        setName(ingredient.name);
        setCategoryId(ingredient.category_id || '');
        setBaseUnit(ingredient.base_unit);
        setRecipeUnit(ingredient.recipe_unit);
        setConversionFactor(ingredient.conversion_factor);
        setCostPerUnit(ingredient.cost_per_unit);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin nguyên liệu.');
      } finally {
        setFetching(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

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
      category_id: categoryId || null,
    };

    try {
      await ingredientService.update(id, payload);
      alert('Cập nhật nguyên liệu thành công!');
      router.push('/ingredients');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <main className="p-4 sm:p-6 md:p-8 flex justify-center items-center h-full">
        <p className="text-slate-500 font-medium">Đang tải...</p>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/ingredients" className="p-2 rounded-full hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">Chỉnh sửa Nguyên liệu</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          {error && <p className="text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl text-sm font-medium">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên nguyên liệu (*)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Danh mục</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                <option value="">-- Chọn danh mục --</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-6">
            <p className="text-lg font-semibold text-blue-600">Quy đổi Đơn vị</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Đơn vị Lưu kho (*)</label>
                <input type="text" value={baseUnit} onChange={e => setBaseUnit(e.target.value)} placeholder="kg, lít, chai" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Đơn vị Pha chế (*)</label>
                <input type="text" value={recipeUnit} onChange={e => setRecipeUnit(e.target.value)} placeholder="g, ml" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hệ số Quy đổi (*)</label>
                <input type="number" value={conversionFactor} onChange={e => setConversionFactor(e.target.value === '' ? '' : Number(e.target.value))} placeholder="1000" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400" required />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Giá vốn / Đơn vị Lưu kho (*)</label>
            <div className="relative">
              <input type="number" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pr-10" required />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">đ</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm">
              {loading ? 'Đang lưu...' : 'Cập nhật Nguyên liệu'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
