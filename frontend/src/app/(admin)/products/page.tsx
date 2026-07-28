'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productService } from '@/src/services/productService';
import { Plus, Edit, Trash2, Eye, Coffee, Loader2, Power, PowerOff } from 'lucide-react';
import { toast } from 'react-toastify';

// --- Định nghĩa Interface ---
interface Recipe {
  quantity: number;
  ingredients?: { name: string; recipe_unit: string };
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  categories?: { name: string };
  recipes?: Recipe[];
}

// --- COMPONENT MODAL ---
const RecipeModal = ({ product, onClose }: { product: Product | null, onClose: () => void }) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-[#4B2C20] flex items-center gap-2">
          <Coffee className="text-[#FFB800]" size={24} />
          Công thức pha chế
        </h2>
        <div className="p-4 bg-gray-50 rounded-xl mb-4 border border-gray-100">
          <p className="font-bold text-[#4B2C20]">{product.name}</p>
        </div>
        
        {product.recipes && product.recipes.length > 0 ? (
          <ul className="space-y-3">
            {product.recipes.map((recipe, index) => (
              <li key={index} className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]"></div>
                  {recipe.ingredients?.name || 'N/A'}
                </span>
                <span className="font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
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
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold transition-colors">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      <div className="flex h-full items-center justify-center bg-[#FCF9F8]">
        <Loader2 className="animate-spin text-[#FFB800]" size={48} />
      </div>
    );
  }

  return (
    <main className="flex flex-col h-full bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <div className="px-6 py-6 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coffee className="text-[#FFB800]" size={28} />
            Quản lý Thực đơn
          </h1>
          <p className="text-gray-500 mt-1">Thiết lập menu, công thức pha chế và ẩn/hiện món.</p>
        </div>
        <Link href="/products/create" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#FFB800] text-white hover:bg-[#F0AD00] transition-colors shadow-sm shadow-amber-200">
          <Plus size={18} />
          Thêm món mới
        </Link>
      </div>

      <div className="p-6 overflow-y-auto">
        {error && products.length === 0 ? (
          <div className="p-8 text-red-500 font-bold text-center bg-red-50 border border-red-100 rounded-2xl">{error}</div>
        ) : (
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-bold">Món nước</th>
                    <th className="px-6 py-4 font-bold">Danh mục</th>
                    <th className="px-6 py-4 font-bold">Trạng thái</th>
                    <th className="px-6 py-4 font-bold text-right">Giá bán</th>
                    <th className="px-6 py-4 font-bold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${!product.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img 
                            className="h-12 w-12 rounded-xl object-cover bg-gray-100 border border-gray-200" 
                            src={product.image_url || '/placeholder.svg'} 
                            alt={product.name} 
                          />
                          <div>
                            <div className={`font-bold ${!product.is_active ? 'text-gray-500 line-through decoration-gray-400' : 'text-[#4B2C20]'}`}>
                              {product.name}
                            </div>
                            {(!product.recipes || product.recipes.length === 0) && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                Thiếu định lượng
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-600 border border-green-100">
                          {product.categories?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors border ${
                            product.is_active 
                              ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' 
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {product.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                          {product.is_active ? 'Đang bán' : 'Tạm ẩn'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-gray-600 text-base">
                          {product.price.toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setSelectedProduct(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="Xem công thức">
                            <Eye size={18} />
                          </button>
                          <Link href={`/products/edit/${product.id}`} className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors inline-block" title="Sửa">
                            <Edit size={18} />
                          </Link>
                          <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Xóa">
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