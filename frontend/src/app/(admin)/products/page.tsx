'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productService } from '@/src/services/productService';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
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
  categories?: { name: string };
  recipes?: Recipe[];
}

// --- COMPONENT MODAL ---
const RecipeModal = ({ product, onClose }: { product: Product | null, onClose: () => void }) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-surface border border-dark-border p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-brand-amber">Công thức: {product.name}</h2>
        {product.recipes && product.recipes.length > 0 ? (
          <ul className="space-y-3">
            {product.recipes.map((recipe, index) => (
              <li key={index} className="flex justify-between items-center border-b border-dark-border pb-2">
                <span className="text-dark-text-primary">{recipe.ingredients?.name || 'N/A'}</span>
                <span className="font-semibold text-dark-text-secondary font-mono">
                  {recipe.quantity} {recipe.ingredients?.recipe_unit || ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-dark-text-secondary">Sản phẩm này chưa có công thức.</p>
        )}
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-dark-border text-dark-text-secondary hover:bg-gray-600 font-semibold">Đóng</button>
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

  useEffect(() => {
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
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await productService.remove(id);
        toast.success('Xóa sản phẩm thành công!');
        setProducts(products.filter(p => p.id !== id));
      } catch (err: any) {
        toast.error(`Lỗi: ${err.message}`);
      }
    }
  };

  if (loading) return <div className="p-8 text-dark-text-secondary">Đang tải thực đơn...</div>;
  if (error && products.length === 0) return <div className="p-8 text-red-500">Lỗi: {error}</div>;

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-text-primary">Quản lý Thực đơn</h1>
        <Link href="/products/create" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-brand-amber text-black hover:bg-brand-amber-dark transition-all">
          <Plus size={16} />
          Thêm món mới
        </Link>
      </div>
      <div className="bg-dark-surface border border-dark-border shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Tên món</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Giá bán</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-dark-bg transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img className="h-10 w-10 rounded-md object-cover bg-dark-bg" src={product.image_url || '/placeholder.svg'} alt={product.name} />
                    <div className="ml-4 font-medium text-dark-text-primary">{product.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/10 text-green-300">
                    {product.categories?.name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-dark-text-secondary font-mono">{product.price.toLocaleString('vi-VN')} đ</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button onClick={() => setSelectedProduct(product)} className="p-2 text-dark-text-secondary hover:text-white rounded-full" title="Xem công thức"><Eye size={16}/></button>
                    <Link href={`/products/edit/${product.id}`} className="p-2 text-blue-400 hover:text-white rounded-full inline-block" title="Sửa"><Edit size={16}/></Link>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:text-white rounded-full" title="Xóa"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedProduct && <RecipeModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </main>
  );
}