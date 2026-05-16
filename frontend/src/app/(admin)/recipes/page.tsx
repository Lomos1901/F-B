'use client';

import { useState, useEffect } from 'react';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [recipeRows, setRecipeRows] = useState<RecipeInput[]>([
    { ingredient_id: '', ui_quantity: 0 }
  ]);
  const [loading, setLoading] = useState(false);
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
          ingredients: processedIngredients
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Thêm món mới và gán công thức thành công!' });
        setCategoryId('');
        setProductName('');
        setProductPrice('');
        setRecipeRows([{ ingredient_id: '', ui_quantity: 0 }]);
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
    <div className="min-h-screen bg-[#0b0f17] text-white p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto">
        
        {/* TIÊU ĐỀ TRANG CHUẨN HIỆN ĐẠI */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#ff9f1c] tracking-wide">Thêm món nước mới</h1>
          <p className="text-gray-400 text-sm mt-1">Khởi tạo thực đơn thương mại & định mức khấu hao kho thô cho Sẫm Coffee.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-xs font-medium border ${
            message.type === 'success' 
              ? 'bg-green-950/40 text-green-400 border-green-900/60' 
              : 'bg-red-950/40 text-red-400 border-red-900/60'
          }`}>
            {message.text}
          </div>
        )}

        {/* CONTAINER FORM CHÍNH - MÀU KHUNG CHUẨN TRANH DANH MỤC */}
        <form onSubmit={handleSubmit} className="bg-[#141923] rounded-xl border border-gray-800 shadow-xl overflow-hidden">
          
          <div className="p-6 space-y-6">
            {/* BƯỚC 1: THÔNG TIN THƯƠNG MẠI */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#ff9f1c]/90">
                1. Thông tin thương mại thực đơn
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-2">Nhóm món nước (*):</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#1c2431] border border-gray-700 rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-[#ff9f1c] transition"
                    required
                  >
                    <option value="" className="text-gray-500">-- Chọn phân hệ nhóm --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-2">Tên món uống (*):</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cà Phê Muối Sẫm..."
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-[#1c2431] border border-gray-700 rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-[#ff9f1c] placeholder:text-gray-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-2">Giá bán niêm yết (*):</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Ví dụ: 35000"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full bg-[#1c2431] border border-gray-700 rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-[#ff9f1c] placeholder:text-gray-500 font-mono transition pr-10"
                      required
                    />
                    <span className="absolute right-3 top-3 text-xs font-bold text-gray-500">Đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BƯỚC 2: ĐỊNH LƯỢNG PHA CHẾ */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#ff9f1c]/90">
                2. Định lượng pha chế thực tế (Khấu hao kho thô)
              </div>

              <div className="space-y-3">
                {recipeRows.map((row, index) => {
                  const { displayUnit } = getUnitInfo(row.ingredient_id);
                  return (
                    <div key={index} className="flex items-center space-x-3 bg-[#1c2431]/40 p-3 rounded-lg border border-gray-800/80 hover:border-gray-700 transition">
                      
                      <div className="flex-1">
                        <select
                          value={row.ingredient_id}
                          onChange={(e) => handleRowChange(index, 'ingredient_id', e.target.value)}
                          className="w-full bg-[#1c2431] border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-[#ff9f1c] text-xs transition"
                        >
                          <option value="">-- Chọn nguyên liệu thô trong kho --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>{ing.name} (Kho gốc: {ing.unit})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-44 relative">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Số lượng pha"
                          value={row.ui_quantity || ''}
                          onChange={(e) => handleRowChange(index, 'ui_quantity', e.target.value)}
                          className="w-full bg-[#1c2431] border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-[#ff9f1c] text-xs font-mono pr-14 text-right"
                        />
                        <span className="absolute left-2.5 top-2.5 text-[10px] font-bold text-gray-500 uppercase">NHẬP:</span>
                        <span className="absolute right-2 top-1.5 text-xs font-bold text-[#ff9f1c] bg-[#141923] px-1.5 py-0.5 rounded border border-gray-700">
                          {displayUnit}
                        </span>
                      </div>

                      {recipeRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md text-xs border border-transparent hover:border-red-900/40 transition"
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
                className="px-3 py-1.5 bg-[#1c2431] text-[#ff9f1c] border border-gray-700 hover:border-[#ff9f1c]/40 hover:bg-[#ff9f1c]/5 rounded-md text-xs font-semibold transition"
              >
                + Thêm nguyên liệu thành phần
              </button>
            </div>
          </div>

          {/* CHÂN FORM CHỨA NÚT SUBMIT CHUẨN TÔNG CAM TƯƠNG PHẢN CAO */}
          <div className="bg-[#1c2431] border-t border-gray-800 px-6 py-4 flex justify-between items-center">
            <p className="text-[11px] text-gray-500 font-mono hidden sm:block">
              * Hệ thống tự động quy đổi ngược và lưu trữ an toàn.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-[#ff9f1c] hover:bg-[#e08a10] disabled:bg-gray-700 text-[#0c0f14] font-bold text-xs tracking-wider uppercase rounded-md transition shadow"
            >
              {loading ? 'ĐANG THIẾT LẬP...' : 'HOÀN TẤT THÊM MÓN & CÔNG THỨC'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}