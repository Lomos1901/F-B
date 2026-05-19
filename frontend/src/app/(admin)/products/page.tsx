'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  categories: { id: string; name: string } | null;
  recipes: {
    id: string;
    quantity: number;
    ingredients: { id: string; name: string; unit: string } | null;
  }[];
}

const UNIT_CONVERSIONS: Record<string, { displayUnit: string; factor: number }> = {
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
        console.error('Lỗi kết nối API:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatQuantity = (rawQty: number, unit: string | undefined) => {
    if (!unit) return `${rawQty}`;
    const conv = UNIT_CONVERSIONS[unit.toLowerCase()];
    return conv ? `${rawQty * conv.factor} ${conv.displayUnit}` : `${rawQty} ${unit}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 p-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-200 pb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-amber-700 uppercase">DANH SÁCH THỰC ĐƠN</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Quản lý các món uống đang kinh doanh tại Sẫm Coffee.</p>
          </div>
          <Link
            href="/products/create"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs tracking-wider uppercase rounded-lg transition shadow-sm flex items-center gap-2"
          >
            <span>➕</span> THÊM MÓN MỚI
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500 font-mono animate-pulse bg-white rounded-xl border border-gray-200 shadow-sm">
            ☕ Đang tải dữ liệu thực đơn Sẫm Coffee...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 italic bg-white rounded-xl border border-gray-200 shadow-sm">
            Chưa có món nước nào trong thực đơn.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
              <div className="col-span-5">Tên món nước</div>
              <div className="col-span-3">Nhóm</div>
              <div className="col-span-3">Giá bán</div>
              <div className="col-span-1 text-center">Chi tiết</div>
            </div>

            <div className="divide-y divide-gray-100">
              {products.map((prod) => {
                const isExpanded = expandedId === prod.id;
                return (
                  <div key={prod.id} className="transition-all duration-200">
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : prod.id)}
                      className={`grid grid-cols-12 px-6 py-4 items-center text-sm cursor-pointer transition-all ${isExpanded ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}
                    >
                      <div className="col-span-5 flex items-center gap-4">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm shadow-sm">☕</div>
                        )}
                        <span className="font-bold text-gray-900 text-base">{prod.name}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                          {prod.categories?.name || 'Chưa phân loại'}
                        </span>
                      </div>
                      <div className="col-span-3 font-mono text-amber-700 font-bold text-base">
                        {prod.price.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transform transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180 text-amber-600' : ''}`}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50/80 px-10 py-6 border-t border-b border-gray-100">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-700 font-mono mb-3">
                          🥣 Định mức hao hụt kho:
                        </div>
                        {prod.recipes.length === 0 ? (
                          <div className="text-sm text-gray-500 italic">Món này chưa thiết lập công thức.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {prod.recipes.map((rec) => (
                              <div key={rec.id} className="flex justify-between items-center bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm text-sm">
                                <span className="text-gray-700 font-semibold">✨ {rec.ingredients?.name}</span>
                                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">
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