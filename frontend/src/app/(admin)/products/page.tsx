'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { productService } from '@/src/services/productService';
import { categoryService } from '@/src/services/categoryService';
import { Plus, Edit, Trash2, Eye, Coffee, Loader2, Power, PowerOff, LayoutGrid } from 'lucide-react';
import { toast } from 'react-toastify';

// --- Định nghĩa Interface ---
interface Recipe {
  quantity: number;
  ingredients?: { name: string; recipe_unit: string };
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  category_id?: string;
  categories?: { name: string };
  recipes?: Recipe[];
}

// --- COMPONENT MODAL ---
const RecipeModal = ({ product, onClose }: { product: Product | null, onClose: () => void }) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
          <Coffee className="text-blue-600" size={24} />
          Công thức pha chế
        </h2>
        <div className="p-4 bg-slate-50 rounded-xl mb-4 border border-slate-200">
          <p className="font-bold text-slate-800">{product.name}</p>
        </div>
        
        {product.recipes && product.recipes.length > 0 ? (
          <ul className="space-y-3">
            {product.recipes.map((recipe, index) => (
              <li key={index} className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  {recipe.ingredients?.name || 'N/A'}
                </span>
                <span className="font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                  {recipe.quantity} {recipe.ingredients?.recipe_unit || ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 bg-red-50 text-red-600 font-medium rounded-xl border border-red-100">
            Sản phẩm này chưa được thiết lập công thức.
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors">
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT TRANG CHÍNH ---
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchData = async () => {
    try {
      const [productData, categoryData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);
      setProducts(productData);
      setCategories(categoryData);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter(p => p.category_id === selectedCategoryId);
  }, [products, selectedCategoryId]);

  // Đếm số sản phẩm theo từng danh mục
  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => {
      if (p.category_id) {
        map[p.category_id] = (map[p.category_id] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Lịch sử bán hàng liên quan có thể bị ảnh hưởng.')) {
      try {
        await productService.remove(id);
        toast.success('Xóa sản phẩm thành công!');
        setProducts(products.filter(p => p.id !== id));
      } catch (err: any) {
        toast.error(`Lỗi: ${err.message}`);
      }
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const newStatus = !product.is_active;
      await productService.toggleActive(product.id, newStatus);
      toast.success(`Đã ${newStatus ? 'hiện' : 'ẩn'} món ${product.name}!`);
      // Update local state
      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <main className="flex flex-col h-full bg-slate-50 text-slate-800">
      <div className="px-6 py-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Coffee className="text-blue-600" size={28} />
            Quản lý Thực đơn
          </h1>
          <p className="text-slate-500 mt-1">Thiết lập menu, công thức pha chế và ẩn/hiện món.</p>
        </div>
        <Link href="/products/create" className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={18} />
          Thêm món mới
        </Link>
      </div>

      {/* === THANH LỌC DANH MỤC === */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
              selectedCategoryId === null
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <LayoutGrid size={15} />
            Tất cả
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
              selectedCategoryId === null ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {products.length}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {cat.name}
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                selectedCategoryId === cat.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {countByCategory[cat.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 pt-3 overflow-y-auto">
        {error && products.length === 0 ? (
          <div className="p-8 text-red-500 font-bold text-center bg-red-50 border border-red-100 rounded-2xl">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-slate-400 font-medium text-center bg-white border border-slate-200 rounded-2xl">
            Không có sản phẩm nào trong danh mục này.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-medium">Món nước</th>
                    <th className="px-6 py-4 font-medium">Danh mục</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium text-right">Giá bán</th>
                    <th className="px-6 py-4 font-medium text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${!product.is_active ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img 
                            className="h-12 w-12 rounded-xl object-cover bg-slate-100 border border-slate-200" 
                            src={product.image_url || '/placeholder.svg'} 
                            alt={product.name} 
                          />
                          <div>
                            <div className={`font-bold ${!product.is_active ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-800'}`}>
                              {product.name}
                            </div>
                            {(!product.recipes || product.recipes.length === 0) && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block border border-red-100">
                                Thiếu định lượng
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex justify-center min-w-[90px] max-w-[160px] w-fit px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 truncate" title={product.categories?.name || 'N/A'}>
                          {product.categories?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors border ${
                            product.is_active 
                              ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' 
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {product.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                          {product.is_active ? 'Đang bán' : 'Tạm ẩn'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-slate-700 text-base">
                          {product.price.toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setSelectedProduct(product)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors" title="Xem công thức">
                            <Eye size={18} />
                          </button>
                          <Link href={`/products/edit/${product.id}`} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors inline-block" title="Sửa">
                            <Edit size={18} />
                          </Link>
                          <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors" title="Xóa">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {selectedProduct && <RecipeModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </main>
  );
}