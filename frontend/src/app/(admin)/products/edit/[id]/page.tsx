'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  base_unit: string;
  recipe_unit: string;
  conversion_factor: number;
}

interface RecipeInput {
  ingredient_id: string;
  ui_quantity: number;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // States quản lý dữ liệu gốc
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  // States quản lý Form
  const [categoryId, setCategoryId] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState(''); 
  const [recipeRows, setRecipeRows] = useState<RecipeInput[]>([]);
  
  // States trạng thái
  const [fetchingData, setFetchingData] = useState(true); // Đang tải dữ liệu cũ
  const [loading, setLoading] = useState(false); // Đang lưu dữ liệu
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Tự động tải dữ liệu khi vào trang
  // 1. Tự động tải dữ liệu khi vào trang (Đã Tối Ưu Tốc Độ)
  useEffect(() => {
    const initData = async () => {
      try {
        // 🚀 BÍ QUYẾT Ở ĐÂY: Dùng Promise.all để gọi 3 API CÙNG LÚC
        const [resCat, resIng, resProd] = await Promise.all([
          fetch('http://localhost:3001/categories'),
          fetch('http://localhost:3001/ingredients'),
          fetch(`http://localhost:3001/products/${id}`)
        ]);

        // Xử lý dữ liệu Danh mục
        if (resCat.ok) {
          const dataCat = await resCat.json();
          setCategories(Array.isArray(dataCat) ? dataCat : (dataCat.data || []));
        }
        
        // Xử lý dữ liệu Nguyên liệu
        if (resIng.ok) {
          const dataIng = await resIng.json();
          setIngredients(Array.isArray(dataIng) ? dataIng : (dataIng.data || []));
        }

        // Xử lý dữ liệu Món nước
        if (resProd.ok) {
          const prodData = await resProd.json();
          const product = prodData.data || prodData; 

          setCategoryId(product.category_id || '');
          setProductName(product.name || '');
          setProductPrice(product.price || '');
          setImageUrl(product.image_url || '');

          if (product.recipes && product.recipes.length > 0) {
            const loadedRecipes = product.recipes.map((rec: any) => ({
              ingredient_id: rec.ingredient_id,
              ui_quantity: rec.quantity
            }));
            setRecipeRows(loadedRecipes);
          } else {
            setRecipeRows([{ ingredient_id: '', ui_quantity: 0 }]); 
          }
        } else {
          setMessage({ type: 'error', text: 'Không tìm thấy dữ liệu món nước này!' });
        }
      } catch (e) {
        console.error('Lỗi tải dữ liệu:', e);
        setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
      } finally {
        setFetchingData(false);
      }
    };
    
    if (id) initData();
  }, [id]);

  const addRow = () => setRecipeRows([...recipeRows, { ingredient_id: '', ui_quantity: 0 }]);
  const removeRow = (index: number) => setRecipeRows(recipeRows.filter((_, i) => i !== index));

  const handleRowChange = (index: number, field: keyof RecipeInput, value: string | number) => {
    const updated = [...recipeRows];
    if (field === 'ui_quantity') {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value as string;
    }
    setRecipeRows(updated);
  };

  const getDisplayUnit = (ingId: string) => {
    const ing = ingredients.find(i => i.id === ingId);
    return ing ? ing.recipe_unit : 'đơn vị';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3001/products/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.imageUrl);
      } else {
        setMessage({ type: 'error', text: 'Tải ảnh thất bại.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi API upload ảnh.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !productName.trim() || !productPrice) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin!' });
      return;
    }
    const validRows = recipeRows.filter(row => row.ingredient_id !== '');

    setLoading(true);
    setMessage(null);

    const processedIngredients = validRows.map(row => ({
      ingredient_id: row.ingredient_id,
      quantity_required: row.ui_quantity, 
    }));

    try {
      // 2. GỌI API ĐỂ CẬP NHẬT (Lưu ý: method PUT)
      const response = await fetch(`http://localhost:3001/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          name: productName,
          price: Number(productPrice),
          image_url: imageUrl, 
          ingredients: processedIngredients
        }),
      });

      if (response.ok) {
        alert('Cập nhật món nước thành công!');
        router.push('/products'); 
      } else {
        const result = await response.json();
        setMessage({ type: 'error', text: result.message || 'Lỗi xử lý hệ thống.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể kết nối đến Backend.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="animate-pulse text-gray-500 font-mono text-sm">☕ Đang kéo dữ liệu từ kho...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-amber-700 uppercase">Chỉnh sửa món nước</h1>
          </div>
          <Link href="/products" className="text-amber-600 font-bold text-xs uppercase hover:underline">
            ← Quay về danh sách
          </Link>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium border shadow-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          
          <div className="p-8 space-y-8">
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 uppercase">1. Thông tin thương mại</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-600 font-bold uppercase mb-2">Nhóm món nước (*):</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 shadow-sm transition"
                    required
                  >
                    <option value="" className="text-gray-500">-- Chọn phân hệ nhóm --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 font-bold uppercase mb-2">Giá bán niêm yết (*):</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-amber-500 shadow-sm transition pr-10"
                      required
                    />
                    <span className="absolute right-4 top-3 text-sm font-bold text-gray-400">đ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 font-bold uppercase mb-2">Tên món uống (*):</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 shadow-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 font-bold uppercase mb-2">Hình ảnh minh họa:</label>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-300 shadow-sm">
                    <div className="w-12 h-12 rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden text-gray-400 shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : uploading ? (
                        <span className="text-[10px] animate-pulse font-bold text-amber-600">Up...</span>
                      ) : (
                        <span className="text-xl">📷</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 uppercase">2. Định lượng pha chế</h3>

              <div className="space-y-3">
                {recipeRows.map((row, index) => {
                  const displayUnit = getDisplayUnit(row.ingredient_id);
                  return (
                    <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl border border-gray-200 transition">
                      <div className="flex-1">
                        <select
                          value={row.ingredient_id}
                          onChange={(e) => handleRowChange(index, 'ingredient_id', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">-- Chọn nguyên liệu thô --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} (Nhập: {ing.base_unit} ➜ Pha: {ing.recipe_unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-48 relative">
                        <input
                          type="number"
                          step="0.1"
                          value={row.ui_quantity || ''}
                          onChange={(e) => handleRowChange(index, 'ui_quantity', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-mono pr-14 text-right focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute right-3 top-2.5 text-[11px] font-bold text-gray-500 uppercase">
                          {displayUnit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="px-3 py-2 text-red-500 bg-white border border-red-200 hover:bg-red-50 rounded-lg text-sm font-semibold transition"
                      >
                        Xóa
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addRow}
                className="px-4 py-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-bold transition shadow-sm"
              >
                ➕ THÊM NGUYÊN LIỆU
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex justify-end">
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition shadow-md"
            >
              {loading ? 'ĐANG LƯU...' : '💾 LƯU THAY ĐỔI'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}