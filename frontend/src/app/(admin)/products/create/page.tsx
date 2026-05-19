'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface RecipeInput {
  ingredient_id: string;
  ui_quantity: number;
}

const UNIT_CONVERSIONS: Record<string, { displayUnit: string; factor: number }> = {
  'kg': { displayUnit: 'g', factor: 1000 },
  'lít': { displayUnit: 'ml', factor: 1000 },
  'lon': { displayUnit: 'ml', factor: 380 },
  'chai': { displayUnit: 'ml', factor: 750 },
  'hộp': { displayUnit: 'g', factor: 500 },
};

export default function AddProductWithRecipePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState(''); 
  const [recipeRows, setRecipeRows] = useState<RecipeInput[]>([
    { ingredient_id: '', ui_quantity: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const resCat = await fetch('http://localhost:3001/categories');
        if (resCat.ok) {
          const dataCat = await resCat.json();
          setCategories(Array.isArray(dataCat) ? dataCat : (dataCat.data || []));
        }
        const resIng = await fetch('http://localhost:3001/ingredients');
        if (resIng.ok) {
          const dataIng = await resIng.json();
          setIngredients(Array.isArray(dataIng) ? dataIng : (dataIng.data || []));
        }
      } catch (e) {
        console.error('Lỗi tải dữ liệu:', e);
      }
    };
    initData();
  }, []);

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

  const getUnitInfo = (id: string) => {
    const ing = ingredients.find(i => i.id === id);
    if (!ing) return { displayUnit: 'đơn vị', factor: 1 };
    return UNIT_CONVERSIONS[ing.unit.toLowerCase()] || { displayUnit: ing.unit, factor: 1 };
  };

  // Hàm xử lý khi người dùng chọn file ảnh từ máy tính
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
        setImageUrl(data.imageUrl); // Lưu link public trả về từ Backend
      } else {
        setMessage({ type: 'error', text: 'Tải ảnh thất bại. Vui lòng thử lại.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối API upload ảnh.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !productName.trim() || !productPrice) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin nhóm, tên món và giá bán!' });
      return;
    }
    const validRows = recipeRows.filter(row => row.ingredient_id !== '');
    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'Vui lòng cấu hình ít nhất một nguyên liệu pha chế!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const processedIngredients = validRows.map(row => {
      const { factor } = getUnitInfo(row.ingredient_id);
      return {
        ingredient_id: row.ingredient_id,
        quantity_required: row.ui_quantity / factor,
      };
    });

    try {
      const response = await fetch('http://localhost:3001/products/create-with-recipe', {
        method: 'POST',
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
        alert('Thêm món mới và gán công thức thành công!');
        router.push('/products'); // Điều hướng về trang danh sách
      } else {
        const result = await response.json();
        setMessage({ type: 'error', text: result.message || 'Lỗi xử lý hệ thống.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ Backend.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto">
        
        {/* TIÊU ĐỀ TRANG CHUẨN SÁNG */}
        <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-amber-700 uppercase">Thêm món nước mới</h1>
            <p className="text-sm text-gray-500 mt-1">Khởi tạo thực đơn thương mại & định mức khấu hao kho thô cho Sẫm Coffee.</p>
          </div>
          <Link href="/products" className="text-amber-600 font-bold text-xs uppercase hover:underline">
            ← Quay về danh sách
          </Link>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium border shadow-sm ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* CONTAINER FORM CHÍNH */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          
          <div className="p-8 space-y-8">
            {/* BƯỚC 1: THÔNG TIN THƯƠNG MẠI */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 uppercase">1. Thông tin thương mại thực đơn</h3>
              
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
                      placeholder="Ví dụ: 35000"
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
                    placeholder="Ví dụ: Cà Phê Muối Sẫm..."
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 shadow-sm transition"
                    required
                  />
                </div>

                {/* THÀNH PHẦN FILE UPLOAD ĐÃ ĐƯỢC TÍCH HỢP HOÀN HẢO */}
                <div>
                  <label className="block text-xs text-gray-600 font-bold uppercase mb-2">Hình ảnh minh họa món:</label>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-300 shadow-sm">
                    
                    {/* Khung xem trước hình ảnh */}
                    <div className="w-12 h-12 rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden text-gray-400 shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : uploading ? (
                        <span className="text-[10px] animate-pulse font-bold text-amber-600">Up...</span>
                      ) : (
                        <span className="text-xl">📷</span>
                      )}
                    </div>

                    {/* Nút chọn ảnh thật từ máy */}
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

            {/* BƯỚC 2: ĐỊNH LƯỢNG PHA CHẾ */}
            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 uppercase">2. Định lượng pha chế thực tế (Khấu hao kho thô)</h3>

              <div className="space-y-3">
                {recipeRows.map((row, index) => {
                  const { displayUnit } = getUnitInfo(row.ingredient_id);
                  return (
                    <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl border border-gray-200 transition">
                      
                      <div className="flex-1">
                        <select
                          value={row.ingredient_id}
                          onChange={(e) => handleRowChange(index, 'ingredient_id', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">-- Chọn nguyên liệu thô trong kho --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>{ing.name} (Kho gốc: {ing.unit})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-48 relative">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Số lượng"
                          value={row.ui_quantity || ''}
                          onChange={(e) => handleRowChange(index, 'ui_quantity', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-mono pr-14 text-right focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute right-3 top-2.5 text-[11px] font-bold text-gray-500 uppercase">
                          {displayUnit}
                        </span>
                      </div>

                      {recipeRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="px-3 py-2 text-red-500 bg-white border border-red-200 hover:bg-red-50 rounded-lg text-sm font-semibold transition"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addRow}
                className="px-4 py-2 bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 rounded-lg text-xs font-bold transition shadow-sm"
              >
                ➕ THÊM NGUYÊN LIỆU
              </button>
            </div>
          </div>

          {/* CHÂN FORM CHỨA NÚT SUBMIT */}
          <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex justify-between items-center">
            <p className="text-[11px] text-gray-500 font-mono hidden sm:block">
              * Hệ thống tự động quy đổi ngược và lưu trữ an toàn.
            </p>
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition shadow-md"
            >
              {loading ? 'ĐANG THIẾT LẬP...' : '🚀 HOÀN TẤT THÊM MÓN & CÔNG THỨC'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}