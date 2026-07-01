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
    <main className="min-h-screen bg-dark-bg p-4 sm:p-6 md:p-8 font-sans text-dark-text-primary">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-brand-amber">Thêm món mới</h1>
          <Link href="/products" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-dark-surface text-dark-text-secondary border border-dark-border hover:bg-dark-border transition-all">
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thông tin chung */}
          <div className="p-6 bg-dark-surface border border-dark-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Thông tin chung</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Tên món (*)" value={productName} onChange={e => setProductName(e.target.value)} className="p-2.5 bg-dark-bg border-dark-border rounded-md" required />
              <input type="number" placeholder="Giá bán (*)" value={productPrice} onChange={e => setProductPrice(Number(e.target.value))} className="p-2.5 bg-dark-bg border-dark-border rounded-md" required />
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="p-2.5 bg-dark-bg border-dark-border rounded-md" required>
                <option value="">Chọn danh mục (*)</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex items-center gap-4">
                <input type="file" id="image-upload" onChange={handleFileChange} className="hidden" />
                <label htmlFor="image-upload" className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md font-semibold">
                  <Upload size={16} /> {uploading ? 'Đang tải...' : 'Tải ảnh'}
                </label>
                {imageUrl && <img src={imageUrl} alt="Preview" className="w-12 h-12 rounded-md object-cover" />}
              </div>
            </div>
          </div>

          {/* Công thức */}
          <div className="p-6 bg-dark-surface border border-dark-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Công thức pha chế</h2>
            <div className="space-y-4">
              {recipeRows.map((row, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                  <select value={row.ingredient_id} onChange={e => handleRowChange(index, 'ingredient_id', e.target.value)} className="col-span-6 p-2.5 bg-dark-bg border-dark-border rounded-md">
                    <option value="">Chọn nguyên liệu</option>
                    {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <input type="number" placeholder="Lượng" value={row.ui_quantity} onChange={e => handleRowChange(index, 'ui_quantity', Number(e.target.value))} className="col-span-3 p-2.5 bg-dark-bg border-dark-border rounded-md" />
                  <span className="col-span-2 text-dark-text-secondary">{getDisplayUnit(row.ingredient_id)}</span>
                  <button type="button" onClick={() => removeRow(index)} className="col-span-1 p-2 text-red-500 hover:bg-dark-bg rounded-full"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addRow} className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-amber hover:bg-dark-border rounded-lg">
              <Plus size={16} /> Thêm dòng
            </button>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading || uploading} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-500">
              <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}