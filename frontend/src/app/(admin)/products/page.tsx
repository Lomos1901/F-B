'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  categories: { id: string; name: string } | null;
  recipes: {
    id: string;
    quantity: number;
    ingredients: { id: string; name: string; unit: string } | null;
  }[];
}

// Bộ quy đổi hiển thị ngược lại cho trực quan với Barista (kg -> g, lít -> ml)
const UNIT_DISPLAY_CONVERSIONS: Record<string, { displayUnit: string; factor: number }> = {
  'kg': { displayUnit: 'g', factor: 1000 },
  'lít': { displayUnit: 'ml', factor: 1000 },
  'lon': { displayUnit: 'ml', factor: 380 },
  'chai': { displayUnit: 'ml', factor: 750 },
  'hộp': { displayUnit: 'g', factor: 500 },
};

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:3001/products/all-with-recipes');
        if (res.ok) {
          const result = await res.json();
          setProducts(Array.isArray(result) ? result : (result.data || []));
        }
      } catch (e) {
        console.error('Lỗi kết nối API lấy thực đơn:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatQuantity = (rawQty: number, unit: string | undefined) => {
    if (!unit) return `${rawQty}`;
    const conv = UNIT_DISPLAY_CONVERSIONS[unit.toLowerCase()];
    if (conv) {
      return `${rawQty * conv.factor} ${conv.displayUnit}`;
    }
    return `${rawQty} ${unit}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white p-8 font-sans antialiased">
      <div className="max-w-5xl mx-auto">
        
        {/* TIÊU ĐỀ BẢNG PHẲNG HIỆN ĐẠI */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#ff9f1c] tracking-wide">Danh sách thực đơn</h1>
          <p className="text-gray-400 text-sm mt-1">Xem thông tin giá bán và chi tiết cấu hình định mức pha chế của Sẫm Coffee.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-gray-400 font-mono animate-pulse">
            ☕ Đang tải dữ liệu thực đơn Sẫm Coffee...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-[#141923] rounded-xl border border-gray-800 text-xs text-gray-400">
            Chưa có món nước nào trong thực đơn. Vui lòng qua mục "Thêm món mới".
          </div>
        ) : (
          /* CONTAINER KHUNG CHÍNH - MÀU XANH ĐEN CHUẨN */
          <div className="bg-[#141923] rounded-xl border border-gray-800 shadow-xl overflow-hidden">
            
            {/* TIÊU ĐỀ CÁC CỘT TRÊN BẢNG */}
            <div className="grid grid-cols-12 bg-[#1c2431] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#ff9f1c] border-b border-gray-800">
              <div className="col-span-4">Tên món nước</div>
              <div className="col-span-4">Danh mục nhóm</div>
              <div className="col-span-3">Giá niêm yết</div>
              <div className="col-span-1 text-center">Công thức</div>
            </div>

            {/* DANH SÁCH CÁC MÓN UỐNG */}
            <div className="divide-y divide-gray-800/60">
              {products.map((product) => {
                const isExpanded = expandedId === product.id;
                return (
                  <div key={product.id} className="transition-all">
                    
                    {/* HÀNG THÔNG TIN CỐT LÕI */}
                    <div 
                      onClick={() => toggleExpand(product.id)}
                      className={`grid grid-cols-12 px-6 py-4 items-center text-sm text-gray-200 cursor-pointer transition-all duration-150 ${
                        isExpanded ? 'bg-[#ff9f1c]/5' : 'hover:bg-[#1c2431]/40'
                      }`}
                    >
                      <div className="col-span-4 font-bold text-white">{product.name}</div>
                      <div className="col-span-4">
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#1c2431] text-[#ff9f1c]/90 border border-gray-700">
                          {product.categories?.name || 'Chưa phân loại'}
                        </span>
                      </div>
                      <div className="col-span-3 font-mono text-[#ff9f1c] font-bold">
                        {product.price.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button className="text-gray-500 hover:text-[#ff9f1c] transition">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#ff9f1c]' : ''}`}
                          >
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* VÙNG CHI TIẾT CÔNG THỨC TRƯỢT XỔ XUỐNG */}
                    {isExpanded && (
                      <div className="bg-[#0b0f17]/50 px-8 py-4 border-t border-b border-gray-800/80 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                          🥣 Thành phần cấu hao định mức một ly tiêu chuẩn:
                        </div>
                        {product.recipes.length === 0 ? (
                          <div className="text-xs text-gray-500 italic pl-2">Món này chưa được thiết lập nguyên liệu pha chế.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                            {product.recipes.map((rec) => (
                              <div 
                                key={rec.id} 
                                className="flex justify-between items-center bg-[#1c2431] px-4 py-2.5 rounded-lg border border-gray-800 text-xs"
                              >
                                <span className="text-gray-300 font-medium">✨ {rec.ingredients?.name}</span>
                                <span className="font-mono font-bold text-[#ff9f1c] bg-[#141923] px-2 py-0.5 rounded border border-gray-700">
                                  {formatQuantity(rec.quantity, rec.ingredients?.unit)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}