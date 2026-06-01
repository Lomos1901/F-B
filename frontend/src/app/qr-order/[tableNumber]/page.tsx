'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { productService } from '@/src/services/productService';
import { categoryService } from '@/src/services/categoryService';
import { orderService } from '@/src/services/orderService'; // Sẽ tạo sau

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  categories: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function TableOrderPage() {
  const params = useParams();
  const tableNumber = params.tableNumber as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          productService.getAllWithRecipes(),
          categoryService.getAll(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categories?.id === selectedCategory)
    : products;

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn món trước khi gọi!');
      return;
    }

    setIsOrdering(true);
    try {
      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_order: item.price, // Lưu giá tại thời điểm đặt hàng
      }));

      await orderService.placeOrder(tableNumber, orderItems);
      alert('Gọi món thành công! Nhân viên sẽ phục vụ bạn ngay.');
      setCart([]); // Xóa giỏ hàng sau khi đặt
    } catch (e: any) {
      alert(`Lỗi khi gọi món: ${e.message}`);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Main Content - Menu */}
      <div className="flex-1 p-4">
        <header className="bg-white shadow-md p-4 rounded-lg mb-4">
          <h1 className="text-2xl font-bold text-center text-amber-700">Sẫm Coffee Menu</h1>
          <p className="text-center text-gray-600 mt-1">Bàn số: <span className="font-bold">{tableNumber}</span></p>
        </header>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!selectedCategory ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat.id ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <p className="text-center text-gray-500">Đang tải menu...</p>
        ) : error ? (
          <p className="text-center text-red-500">Lỗi: {error}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-between transform hover:scale-105 transition-all duration-200">
                <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-32 object-cover rounded-md mb-4" />
                <h2 className="text-lg font-semibold text-center text-gray-800 line-clamp-2">{product.name}</h2>
                <p className="text-amber-600 font-bold text-xl mt-2">{product.price.toLocaleString('vi-VN')} đ</p>
                <button
                  onClick={() => addToCart(product)}
                  className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg w-full font-semibold hover:bg-amber-700 transition-colors shadow-sm"
                >
                  Thêm vào giỏ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="lg:w-96 bg-white shadow-lg p-4 flex flex-col">
        <h2 className="text-xl font-bold text-amber-700 mb-4 border-b pb-2">Giỏ hàng của bạn</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center mt-4">Giỏ hàng trống.</p>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <img src={item.image_url || '/placeholder.svg'} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-amber-600 text-sm">{item.price.toLocaleString('vi-VN')} đ</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="font-medium text-gray-800">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-gray-300"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-bold text-gray-800">Tổng cộng:</span>
            <span className="text-2xl font-extrabold text-amber-700">{calculateTotal().toLocaleString('vi-VN')} đ</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isOrdering}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isOrdering ? 'Đang gọi món...' : '🍽️ GỌI MÓN'}
          </button>
        </div>
      </div>
    </div>
  );
}
