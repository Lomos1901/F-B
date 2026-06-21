'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { categoryService } from '@/src/services/categoryService';
import { ingredientService } from '@/src/services/ingredientService';
import { productService } from '@/src/services/productService';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';

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
  const [imageUrl, setImageUrl] = useState('');
  const [recipeRows, setRecipeRows] = useState<RecipeInput[]>([{ ingredient_id: '', ui_quantity: 0 }]);

  const [fetchingData, setFetchingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setImageUrl(productData.image_url || '');

        if (productData.recipes && productData.recipes.length > 0) {
          const loadedRecipes = productData.recipes.map((rec: any) => ({
            ingredient_id: rec.ingredient_id,
            ui_quantity: rec.quantity,
          }));
          setRecipeRows(loadedRecipes);
        }
      } catch (e: any) {
        setError('Lỗi tải dữ liệu sản phẩm: ' + e.message);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !productName.trim() || !productPrice) {
      setError('Vui lòng điền đầy đủ Tên, Danh mục và Giá bán.');
      return;
    }
    setLoading(true);
    setError(null);

    const validRows = recipeRows.filter(row => row.ingredient_id && Number(row.ui_quantity) > 0);
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
      await productService.update(id, productPayload);
      alert('Cập nhật món nước thành công!');
      router.push('/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) return <div className="p-8 text-dark-text-secondary">Đang tải dữ liệu sản phẩm...</div>;

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/products" className="p-2 rounded-full hover:bg-dark-surface mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-dark-text-primary">Chỉnh sửa Món nước</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-border shadow-lg rounded-lg">
          <div className="p-8 space-y-8">
            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md text-sm">{error}</p>}

            {/* --- PHẦN FORM ĐÃ BỊ THIẾU --- */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-dark-text-secondary border-b border-dark-border pb-2 uppercase tracking-wider">1. Thông tin thương mại</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1">Tên món (*)</label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1">Danh mục (*)</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md" required>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1">Giá bán (*)</label>
                  <input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1">Hình ảnh</label>
                  <div className="mt-1 flex items-center gap-4">
                    {imageUrl ? <img src={imageUrl} alt="Preview" className="w-16 h-16 rounded-md object-cover"/> : <div className="w-16 h-16 rounded-md bg-dark-bg flex items-center justify-center"><ImageIcon className="text-dark-text-secondary"/></div>}
                    <input type="file" onChange={handleFileChange} disabled={uploading} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-amber/10 file:text-brand-amber hover:file:bg-brand-amber/20"/>
                    {uploading && <Loader2 className="animate-spin" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 pt-4 border-t border-dark-border">
              <h3 className="text-sm font-bold text-dark-text-secondary border-b border-dark-border pb-2 uppercase tracking-wider">2. Định lượng pha chế</h3>
              <div className="space-y-3">
                {recipeRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[1fr,120px,auto,auto] gap-3 items-center">
                    <select value={row.ingredient_id} onChange={(e) => handleRowChange(index, 'ingredient_id', e.target.value)} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md">
                      <option value="">-- Chọn nguyên liệu --</option>
                      {ingredients.map((ing) => (<option key={ing.id} value={ing.id}>{ing.name}</option>))}
                    </select>
                    <input type="number" value={row.ui_quantity || ''} onChange={(e) => handleRowChange(index, 'ui_quantity', e.target.value)} className="w-full p-2.5 bg-dark-bg border-dark-border rounded-md" />
                    <span className="text-sm text-dark-text-secondary">{getDisplayUnit(row.ingredient_id)}</span>
                    <button type="button" onClick={() => removeRow(index)} className="p-2 text-red-500 hover:bg-dark-bg rounded-full"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addRow} className="flex items-center gap-2 text-sm font-semibold text-brand-amber hover:text-brand-amber-dark">
                <Plus size={16} /> Thêm nguyên liệu
              </button>
            </div>
          </div>

          <div className="bg-dark-bg border-t border-dark-border px-8 py-4 flex justify-end">
            <button type="submit" disabled={loading || uploading} className="px-6 py-3 bg-brand-amber text-black font-bold rounded-lg hover:bg-brand-amber-dark disabled:opacity-50 transition-all">
              {loading ? 'Đang lưu...' : 'Lưu Thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
