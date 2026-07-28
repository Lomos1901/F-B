'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { productService } from '@/src/services/productService';
import { orderService } from '@/src/services/orderService';
import { Plus, Minus, X, CheckCircle2, ShoppingBag, Coffee } from 'lucide-react';
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
      {/* Top App Bar - Refined for Material 3 */}
      <header className="bg-[#4B2C20] text-white p-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFB800] rounded-full flex items-center justify-center text-[#4B2C20]">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider leading-tight">SẪM COFFEE</h1>
            <p className="text-xs font-medium opacity-90">Bàn {tableNumber}</p>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors lg:hidden" onClick={() => setIsCartOpen(true)}>
          <div className="relative">
            <ShoppingBag size={24} />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FFB800] text-[#4B2C20] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </div>
        </button>
      </header>

      {/* Hero Image Section with Brand Intro */}
      <section className="relative w-full h-48 sm:h-64 lg:h-72 bg-[#4B2C20] overflow-hidden">
        {/* Placeholder for real hero image - using a nice gradient/pattern for now */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4B2C20] to-[#7B4D36] opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559925393-8be0a33e7a14?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white bg-black/20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 shadow-sm">Thưởng thức hương vị</h2>
          <p className="text-sm sm:text-base font-medium opacity-90 max-w-md shadow-sm">Khám phá menu đa dạng của Sẫm Coffee. Chạm để chọn món, chúng tôi sẽ phục vụ ngay tại bàn {tableNumber}.</p>
        </div>
      </section>

      {/* Category Chips (Sticky) - Material 3 Filter Chips */}
      <div className="flex gap-3 overflow-x-auto px-4 py-3 bg-[#FCF9F8]/95 backdrop-blur-md sticky top-[72px] z-20 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border-b border-gray-200 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => scrollToCategory(cat)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-[16px] text-sm font-bold transition-all duration-300 ease-in-out border-2 ${
              activeCategory === cat 
                ? 'bg-[#4B2C20] text-white border-[#4B2C20] shadow-md transform scale-[1.02]' 
                : 'bg-white text-gray-700 border-transparent hover:border-gray-300 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="container mx-auto p-4 lg:p-6 lg:flex lg:gap-8 lg:max-w-[1440px]">
        {/* Main Content (Menu) */}
        <main className="lg:w-[65%] xl:w-[70%]">
          {categories.map(categoryName => (
            <section key={categoryName} id={`category-${categoryName}`} className="mb-10 pt-4 scroll-mt-[130px]">
              <h2 className="text-2xl font-bold text-[#4B2C20] mb-5 pl-2 border-l-4 border-[#FFB800] rounded-sm">{categoryName}</h2>
              {/* 1 col mobile, 2 col sm, 3 col md/lg */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {productsByCategory[categoryName].map(product => {
                  const quantity = getCartItemQuantity(product.id);
                  return (
                    <div key={product.id} className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:shadow-lg duration-300">
                      <div className="flex items-start gap-4">
                        <img 
                          src={product.image_url || '/placeholder.svg'} 
                          alt={product.name} 
                          className="w-24 h-24 rounded-[16px] object-cover bg-gray-50 shadow-inner"
                        />
                        <div className="flex-1 flex flex-col min-h-[96px]">
                          <h3 className="font-bold text-[#1C1B1F] text-[15px] leading-snug mb-1.5">{product.name}</h3>
                          <p className="text-[15px] font-bold text-[#4B2C20] mt-auto">{product.price.toLocaleString('vi-VN')} đ</p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100 mt-1">
                        {quantity > 0 ? (
                          <div className="flex items-center justify-between bg-[#FCF9F8] rounded-[16px] p-1.5 border border-gray-200">
                            <button onClick={() => updateCart(product, quantity - 1)} className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-white shadow-sm text-[#4B2C20] active:scale-95 transition-transform">
                              <Minus size={18} />
                            </button>
                            <span className="font-bold text-base w-8 text-center text-[#4B2C20]">{quantity}</span>
                            <button onClick={() => updateCart(product, quantity + 1)} className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#4B2C20] text-white shadow-sm active:scale-95 transition-transform">
                              <Plus size={18} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => updateCart(product, 1)} 
                            className="w-full h-[52px] flex items-center justify-center gap-2 rounded-[16px] bg-[#FFB800] text-[#4B2C20] font-bold text-[15px] hover:bg-[#e6a600] active:scale-[0.98] transition-all shadow-sm"
                          >
                            <Plus size={20} />
                            <span>Thêm món</span>
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
        <aside className="hidden lg:block lg:w-[35%] xl:w-[30%]">
          <div className="sticky top-[140px] h-[calc(100vh-160px)]">
            {renderCartContent(false)}
          </div>
        </aside>
      </div>

      {/* Cart Footer Bar (Mobile) - Material 3 Floating Bottom Bar */}
      {cart.length > 0 && !isCartOpen && (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-[#4B2C20] rounded-[24px] p-4 shadow-[0_8px_30px_rgba(75,44,32,0.3)] flex items-center justify-between z-40 animate-[slideUp_0.3s_ease-out]">
          <div className="flex flex-col text-white ml-2">
            <span className="text-[13px] opacity-90 font-medium">{getTotalItems()} món đã chọn</span>
            <span className="font-bold text-xl">{getTotalPrice().toLocaleString('vi-VN')} đ</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="bg-[#FFB800] text-[#4B2C20] h-12 px-6 rounded-[16px] font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-md"
          >
            <ShoppingBag size={20} />
            Xem giỏ
          </button>
        </div>
      )}

      {/* Cart Bottom Sheet (Mobile) - Material 3 Standard */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 lg:hidden backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
          <div className="bg-white h-[85vh] rounded-t-[32px] overflow-hidden flex flex-col relative animate-[slideUp_0.3s_ease-out] shadow-2xl">
            <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2"></div>
            {renderCartContent(true)}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        html {
          scroll-behavior: smooth;
        }
      `}} />
    </div>
  );
}