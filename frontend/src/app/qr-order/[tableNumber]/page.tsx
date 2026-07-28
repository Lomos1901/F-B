'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { productService } from '@/src/services/productService';
import { orderService } from '@/src/services/orderService';
import { Plus, Minus, X, CheckCircle2, ShoppingBag } from 'lucide-react';
import { toast } from 'react-toastify';

// --- Interfaces ---
interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  categories?: { name: string };
}

interface GroupedProducts {
  [categoryName: string]: Product[];
}

interface CartItem extends Product {
  quantity: number;
}

export default function QROrderPage() {
  const params = useParams();
  const tableNumber = params.tableNumber as string;

  const [productsByCategory, setProductsByCategory] = useState<GroupedProducts>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData: Product[] = await productService.getAll();
        const grouped = productsData.reduce((acc: GroupedProducts, product) => {
          const categoryName = product.categories?.name || 'Khác';
          if (!acc[categoryName]) acc[categoryName] = [];
          acc[categoryName].push(product);
          return acc;
        }, {});
        setProductsByCategory(grouped);
        const categories = Object.keys(grouped);
        if (categories.length > 0) {
          setActiveCategory(categories[0]);
        }
      } catch (err: any) {
        setError('Không thể tải thực đơn. Vui lòng thử lại sau.');
        toast.error('Không thể tải thực đơn. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    if (tableNumber) fetchProducts();
  }, [tableNumber]);

  const updateCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.id !== product.id);
      }
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity } : item);
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const getCartItemQuantity = (productId: string) => cart.find(item => item.id === productId)?.quantity || 0;
  const getTotalPrice = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const getTotalItems = () => cart.reduce((total, item) => total + item.quantity, 0);

  const handleOrder = async () => {
    if (cart.length === 0) {
      toast.warning('Vui lòng chọn món trước khi đặt hàng.');
      return;
    }
    setIsOrdering(true);
    setError('');
    try {
      const orderItems = cart.map(item => ({ product_id: item.id, quantity: item.quantity, price_at_order: item.price }));
      await orderService.createForCustomer(tableNumber, orderItems);
      setOrderSuccess(true);
      setCart([]);
      setIsCartOpen(false);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const el = document.getElementById(`category-${cat}`);
    if (el) {
      const offset = 140; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const renderCartContent = (isMobile: boolean) => (
    <div className={`flex flex-col h-full ${isMobile ? 'bg-white' : 'bg-white rounded-2xl shadow-sm border border-gray-100'}`}>
      <div className={`p-4 ${isMobile ? 'border-b border-gray-100 flex justify-between items-center' : 'border-b border-gray-100'}`}>
        <h3 className="text-xl font-bold text-[#1C1B1F]">Giỏ hàng của bạn</h3>
        {isMobile && (
          <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ShoppingBag size={48} className="mb-4 opacity-50" />
            <p>Chưa có món nào trong giỏ</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {cart.map(item => (
              <li key={item.id} className="flex items-center gap-3">
                <img src={item.image_url || '/placeholder.svg'} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-bold text-[#1C1B1F] text-sm">{item.name}</p>
                  <p className="text-[#4B2C20] font-medium text-sm">{item.price.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="flex items-center gap-2 bg-[#FCF9F8] rounded-full p-1 border border-gray-100">
                  <button onClick={() => updateCart(item, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm text-[#4B2C20]">
                    <Minus size={14} />
                  </button>
                  <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateCart(item, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#4B2C20] text-white shadow-sm">
                    <Plus size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cart.length > 0 && (
        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[#1C1B1F] font-medium">Tổng cộng:</span>
            <span className="text-xl font-bold text-[#4B2C20]">{getTotalPrice().toLocaleString('vi-VN')} đ</span>
          </div>
          <button
            onClick={handleOrder}
            disabled={isOrdering}
            className="w-full bg-[#4B2C20] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 disabled:bg-gray-400 hover:bg-[#3A2218] transition-colors"
          >
            {isOrdering ? 'Đang gửi...' : 'Gửi đơn hàng'}
          </button>
        </div>
      )}
    </div>
  );

  if (loading && Object.keys(productsByCategory).length === 0) {
    return <div className="flex justify-center items-center h-screen bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Đang tải thực đơn...</div>;
  }
  
  if (orderSuccess) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#FCF9F8] text-center p-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 animate-[bounce_1s_ease-in-out_infinite]">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-4xl font-bold text-[#1C1B1F] mb-4">Đặt hàng thành công!</h1>
        <p className="text-gray-600 mb-8 text-lg">Đơn hàng của bạn đang được chuẩn bị.</p>
        <button 
          onClick={() => setOrderSuccess(false)} 
          className="border-2 border-[#4B2C20] text-[#4B2C20] font-bold py-3 px-8 rounded-full hover:bg-black/5 transition-colors"
        >
          Đặt món mới
        </button>
      </div>
    );
  }

  const categories = Object.keys(productsByCategory);

  return (
    <div className="bg-[#FCF9F8] min-h-screen pb-24 lg:pb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Top App Bar */}
      <header className="bg-[#4B2C20] text-white p-4 sticky top-0 z-30 shadow-md flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold tracking-wider">SẪM COFFEE</h1>
        <p className="text-sm opacity-90 mt-1 bg-white/20 px-3 py-0.5 rounded-full">Bàn {tableNumber}</p>
      </header>

      {/* Category Chips (Sticky) */}
      <div className="flex gap-2 overflow-x-auto p-4 bg-[#FCF9F8]/95 backdrop-blur-sm sticky top-[72px] z-20 shadow-sm border-b border-gray-100 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => scrollToCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-colors border ${
              activeCategory === cat 
                ? 'bg-[#4B2C20] text-white border-[#4B2C20]' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-black/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="container mx-auto p-4 lg:flex lg:gap-6 lg:max-w-7xl mt-2">
        {/* Main Content (Menu) */}
        <main className="lg:w-[60%] xl:w-[65%]">
          {categories.map(categoryName => (
            <section key={categoryName} id={`category-${categoryName}`} className="mb-8 pt-2">
              <h2 className="text-xl font-bold text-[#1C1B1F] mb-4 pl-1">{categoryName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {productsByCategory[categoryName].map(product => {
                  const quantity = getCartItemQuantity(product.id);
                  return (
                    <div key={product.id} className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center gap-4">
                      <img 
                        src={product.image_url || '/placeholder.svg'} 
                        alt={product.name} 
                        className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl object-cover bg-gray-100"
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-[#1C1B1F] text-base leading-tight mb-1">{product.name}</h3>
                        <p className="text-sm font-semibold text-[#4B2C20]">{product.price.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div className="flex items-center justify-end pr-1">
                        {quantity > 0 ? (
                          <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#FCF9F8] rounded-full p-1 border border-gray-100">
                            <button onClick={() => updateCart(product, quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-[#4B2C20]">
                              <Minus size={16} />
                            </button>
                            <span className="font-semibold text-sm w-4 text-center">{quantity}</span>
                            <button onClick={() => updateCart(product, quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#4B2C20] text-white shadow-sm">
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => updateCart(product, 1)} 
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F3EDF7] text-[#4B2C20] hover:bg-black/5 transition-colors"
                          >
                            <Plus size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </main>

        {/* Cart Sidebar (Tablet & Desktop) */}
        <aside className="hidden lg:block lg:w-[40%] xl:w-[35%] sticky top-[140px] h-[calc(100vh-160px)]">
          {renderCartContent(false)}
        </aside>
      </div>

      {/* Cart Footer Bar (Mobile) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-[#4B2C20] rounded-3xl p-3 shadow-xl flex items-center justify-between z-40">
          <div className="flex flex-col text-white ml-3">
            <span className="text-xs opacity-80 font-medium">{getTotalItems()} món</span>
            <span className="font-bold text-lg">{getTotalPrice().toLocaleString('vi-VN')} đ</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="bg-[#FFB800] text-[#4B2C20] px-5 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-[#e6a600] transition-colors"
          >
            <ShoppingBag size={18} />
            Xem giỏ hàng
          </button>
        </div>
      )}

      {/* Cart Bottom Sheet (Mobile) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 lg:hidden">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
          <div className="bg-white h-[85vh] rounded-t-3xl overflow-hidden flex flex-col relative animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1"></div>
            {renderCartContent(true)}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}