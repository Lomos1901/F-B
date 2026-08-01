'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { categoryService } from '@/src/services/categoryService';
import { ingredientService } from '@/src/services/ingredientService';
import { productService } from '@/src/services/productService';
import { toast } from 'react-toastify';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Loader2, Save } from 'lucide-react';

// --- Định nghĩa Interface ---
interface Category { id: string; name: string; }
interface Ingredient { id: string; name: string; recipe_unit: string; }
interface RecipeInput { ingredient_id: string; ui_quantity: number; }

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // --- States ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [recipeRows, setRecipeRows] = useState<RecipeInput[]>([{ ingredient_id: '', ui_quantity: 0 }]);

  const [fetchingData, setFetchingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- Data Loading ---
  useEffect(() => {
    if (!id) return;
    const initData = async () => {
      try {
        const [categoriesData, ingredientsData, productData] = await Promise.all([
          categoryService.getAll(),
          ingredientService.getAll(),
          productService.getById(id),
        ]);

        setCategories(categoriesData);
        setIngredients(ingredientsData.data || []);

        setCategoryId(productData.category_id || '');
        setProductName(productData.name || '');
        setProductPrice(productData.price || '');
        setDescription(productData.description || '');
        setImageUrl(productData.image_url || '');

        if (productData.recipes && productData.recipes.length > 0) {
          const loadedRecipes = productData.recipes.map((rec: any) => ({
            ingredient_id: rec.ingredient_id,
            ui_quantity: rec.quantity,
          }));
          setRecipeRows(loadedRecipes);
        }
      } catch (e: any) {
        toast.error('Lỗi tải dữ liệu sản phẩm: ' + e.message);
      } finally {
        setFetchingData(false);
      }
    };
    initData();
  }, [id]);

  // --- Handlers ---
  const addRow = () => setRecipeRows([...recipeRows, { ingredient_id: '', ui_quantity: 0 }]);
  const removeRow = (index: number) => setRecipeRows(recipeRows.filter((_, i) => i !== index));

  const handleRowChange = (index: number, field: keyof RecipeInput, value: string | number) => {
    const updatedRows = recipeRows.map((row, i) => i === index ? { ...row, [field]: value } : row);
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
      toast.error('Vui lòng điền đầy đủ Tên, Danh mục và Giá bán.');
      return;
    }
    setLoading(true);

    const validRows = recipeRows.filter(row => row.ingredient_id && Number(row.ui_quantity) > 0);
    const ingredientsPayload = validRows.map(row => ({
      ingredient_id: row.ingredient_id,
      quantity_required: Number(row.ui_quantity),
    }));

    const productPayload = {
      category_id: categoryId,
      name: productName,
      price: Number(productPrice),
      description: description.trim(),
      image_url: imageUrl,
      ingredients: ingredientsPayload,
    };

    try {
      await productService.update(id, productPayload);
      toast.success('Cập nhật món thành công!');
      router.push('/products');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) return <div className="p-8 text-slate-500">Đang tải dữ liệu sản phẩm...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/products" className="p-2 rounded-full text-slate-600 hover:bg-slate-200/60 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Chỉnh sửa Món nước</h1>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
          <div>
            <h3 className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider mb-4 pb-2 border-b border-slate-100">1. Thông tin thương mại</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên món (*)</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục (*)</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all"
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán (*)</label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả / Ghi chú cho khách</label>
                <textarea
                  placeholder="VD: Thành phần: Trà ô long cao cấp... Món bán chạy nhất quán..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh</label>
                <div className="mt-1 flex items-center gap-4">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200"/>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <ImageIcon className="text-slate-400"/>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {uploading && <Loader2 className="animate-spin text-blue-600" />}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider mb-4 pb-2 border-b border-slate-100">2. Định lượng pha chế</h3>
            <div className="space-y-3">
              {recipeRows.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr,120px,auto,auto] gap-3 items-center">
                  <select
                    value={row.ingredient_id}
                    onChange={(e) => handleRowChange(index, 'ingredient_id', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all"
                  >
                    <option value="">-- Chọn nguyên liệu --</option>
                    {ingredients.map((ing) => (<option key={ing.id} value={ing.id}>{ing.name}</option>))}
                  </select>
                  <input
                    type="number"
                    value={row.ui_quantity || ''}
                    onChange={(e) => handleRowChange(index, 'ui_quantity', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400"
                  />
                  <span className="text-sm text-slate-500">{getDisplayUnit(row.ingredient_id)}</span>
                  <button type="button" onClick={() => removeRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full font-medium text-sm transition-colors"
            >
              <Plus size={16} /> Thêm nguyên liệu
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || uploading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu Thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}