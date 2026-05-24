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
    ingredients: { 
      id: string; 
      name: string; 
      base_unit: string; 
      recipe_unit: string; 
      conversion_factor: number;
    } | null;
  }[];
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // State quản lý menu 3 chấm

  // Hàm click outside để tự động đóng menu 3 chấm khi bấm ra ngoài
  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null); 
        const res = await fetch('http://localhost:3001/products/all-with-recipes');
        
        if (res.ok) {
          const result = await res.json();
          setProducts(Array.isArray(result) ? result : (result.data || []));
        } else {
          setError(`Máy chủ phản hồi lỗi (Mã lỗi: ${res.status}). Vui lòng kiểm tra lại Backend.`);
        }
      } catch (e) {
        console.error('Lỗi kết nối API:', e);
        setError('Mất kết nối đến máy chủ Backend (Port 3001). Vui lòng đảm bảo NestJS đang hoạt động!');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn món "${name}" không?\nMọi dữ liệu công thức đi kèm cũng sẽ bị xóa!`);
    if (!isConfirm) return;

    try {
      const res = await fetch(`http://localhost:3001/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(products.filter(prod => prod.id !== id));
        alert('🗑️ Đã xóa món nước thành công!');
      } else {
        const errorData = await res.json();
        alert(`❌ Lỗi khi xóa: ${errorData.message || 'Hệ thống đang bận.'}`);
      }
    } catch (err) {
      console.error('Lỗi xóa sản phẩm:', err);
      alert('❌ Mất kết nối đến máy chủ Backend.');
    }
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
        ) 
        : error ? (
          <div className="p-12 text-center bg-red-50 rounded-xl border border-red-200 shadow-sm">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Không thể tải dữ liệu</h3>
            <p className="text-sm text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-bold transition"
            >
              🔄 Thử lại
            </button>
          </div>
        ) 
        : products.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 italic bg-white rounded-xl border border-gray-200 shadow-sm">
            Chưa có món nước nào trong thực đơn.
          </div>
        ) 
        : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header của Bảng */}
            <div className="grid grid-cols-12 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
              <div className="col-span-5">Tên món nước</div>
              <div className="col-span-3">Nhóm</div>
              <div className="col-span-3">Giá bán</div>
              <div className="col-span-1 text-center">Tùy chọn</div>
            </div>

            <div className="divide-y divide-gray-100">
              {products.map((prod) => {
                const isExpanded = expandedId === prod.id;
                const isMenuOpen = openMenuId === prod.id;

                return (
                  <div key={prod.id} className="transition-all duration-200">
                    <div className={`grid grid-cols-12 px-6 py-4 items-center text-sm transition-all ${isExpanded ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}>
                      
                      {/* Tên món */}
                      <div className="col-span-5 flex items-center gap-4">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm shadow-sm">☕</div>
                        )}
                        <span className="font-bold text-gray-900 text-base line-clamp-1">{prod.name}</span>
                      </div>
                      
                      {/* Nhóm */}
                      <div className="col-span-3">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                          {prod.categories?.name || 'Chưa phân loại'}
                        </span>
                      </div>
                      
                      {/* Giá */}
                      <div className="col-span-3 font-mono text-amber-700 font-bold text-base">
                        {prod.price.toLocaleString('vi-VN')} đ
                      </div>
                      
                      {/* Tùy chọn (Nút 3 chấm) */}
                      <div className="col-span-1 flex justify-center relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : prod.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                          </svg>
                        </button>

                        {/* Dropdown Menu nổi lên */}
                        {/* Dropdown Menu nổi lên (Đã tinh chỉnh UI đều tăm tắp) */}
                        {isMenuOpen && (
                          <div 
                            className="absolute right-8 top-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()} 
                          >
                            {/* Nút Xem chi tiết */}
                            <button
                              onClick={() => {
                                setExpandedId(isExpanded ? null : prod.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                              </svg>
                              {isExpanded ? 'Đóng chi tiết' : 'Xem công thức'}
                            </button>

                            {/* Nút Sửa */}
                            <Link 
                              href={`/products/edit/${prod.id}`}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              Chỉnh sửa
                            </Link>

                            {/* Đường kẻ ngang đã gỡ bỏ margin để chia đều không gian */}
                            <div className="h-px bg-gray-100 w-full"></div>

                            {/* Nút Xóa (Đã hạ xuống font-medium để đồng bộ thị giác) */}
                            <button
                              onClick={() => {
                                handleDelete(prod.id, prod.name);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                              Xóa món này
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vùng Chi tiết công thức (Mở ra khi chọn 'Xem công thức' trong menu) */}
                    {isExpanded && (
                      <div className="bg-gray-50/80 px-10 py-6 border-t border-b border-gray-100 shadow-inner">
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
                                  {rec.quantity} {rec.ingredients?.recipe_unit || ''}
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