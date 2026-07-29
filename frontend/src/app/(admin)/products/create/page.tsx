'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { categoryService } from '@/src/services/categoryService';
import { ingredientService } from '@/src/services/ingredientService';
import { productService } from '@/src/services/productService';
import { toast } from 'react-toastify';
import { Plus, Trash2, Upload, Save, ArrowLeft } from 'lucide-react';

interface Category { id: string; name: string; }
interface Ingredient { id: string; name: string; recipe_unit: string; }
interface RecipeInput { ingredient_id: string; ui_quantity: number; }

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [recipeRows, setRecipeRows] = useState<RecipeInput[]>([{ ingredient_id: '', ui_quantity: 0 }]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [categoriesData, ingredientsData] = await Promise.all([
          categoryService.getAll(),
          ingredientService.getAll(),
        ]);
        setCategories(categoriesData);
        setIngredients(ingredientsData.data || []);
      } catch (e: any) {
        toast.error('Lỗi tải dữ liệu cần thiết: ' + e.message);
      }
    };
    loadInitialData();
  }, []);

  const addRow = () => setRecipeRows([...recipeRows, { ingredient_id: '', ui_quantity: 0 }]);
  const removeRow = (index: number) => setRecipeRows(recipeRows.filter((_, i) => i !== index));

  const handleRowChange = (index: number, field: keyof RecipeInput, value: string | number) => {
    const updatedRows = recipeRows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setRecipeRows(updatedRows);
  };

  const getDisplayUnit = (ingId: string) => ingredients.find(i => i.id === ingId)?.recipe_unit || 'đơn vị';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await productService.uploadImage(formData);
      setImageUrl(data.imageUrl);
      toast.success('Tải ảnh lên thành công!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !productName.trim() || !productPrice) {
      toast.error('Vui lòng điền đầy đủ thông tin sản phẩm.');
      return;
    }
    setLoading(true);

    const validRows = recipeRows.filter(row => row.ingredient_id && row.ui_quantity > 0);
    const ingredientsPayload = validRows.map(row => ({
      ingredient_id: row.ingredient_id,
      quantity_required: Number(row.ui_quantity),
    }));

    const productPayload = {
      category_id: categoryId,
      name: productName,
      price: Number(productPrice),
      image_url: imageUrl,
      ingredients: ingredientsPayload,
    };

    try {
      await productService.create(productPayload);
      toast.success('Tạo món mới thành công!');
      router.push('/products');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/products" className="p-2 rounded-full text-slate-600 hover:bg-slate-200/60 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Thêm món mới</h1>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
          {/* Thông tin chung */}
          <div>
            <h2 className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider mb-4 pb-2 border-b border-slate-100">Thông tin chung</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên món (*)</label>
                <input
                  type="text"
                  placeholder="Tên món (*)"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán (*)</label>
                <input
                  type="number"
                  placeholder="Giá bán (*)"
                  value={productPrice}
                  onChange={e => setProductPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục (*)</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all"
                  required
                >
                  <option value="">Chọn danh mục (*)</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh</label>
                <div className="flex items-center gap-4">
                  <input type="file" id="image-upload" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="image-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-xl font-medium text-sm transition-colors">
                    <Upload size={16} /> {uploading ? 'Đang tải...' : 'Tải ảnh'}
                  </label>
                  {imageUrl && <img src={imageUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />}
                </div>
              </div>
            </div>
          </div>

          {/* Công thức */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider mb-4 pb-2 border-b border-slate-100">Công thức pha chế</h2>
            <div className="space-y-4">
              {recipeRows.map((row, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <select
                      value={row.ingredient_id}
                      onChange={e => handleRowChange(index, 'ingredient_id', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all"
                    >
                      <option value="">Chọn nguyên liệu</option>
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Lượng"
                      value={row.ui_quantity || ''}
                      onChange={e => handleRowChange(index, 'ui_quantity', Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <span className="col-span-2 text-sm text-slate-500">{getDisplayUnit(row.ingredient_id)}</span>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full font-medium text-sm transition-colors"
            >
              <Plus size={16} /> Thêm dòng
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading || uploading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}