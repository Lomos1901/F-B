'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productService } from '@/src/services/productService';
import { orderService } from '@/src/services/orderService';
import { paymentService } from '@/src/services/paymentService';
import { Plus, Minus, X, CheckCircle2, ShoppingBag, Coffee, QrCode } from 'lucide-react';
import { toast } from 'react-toastify';

// --- Interfaces ---
interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  is_active?: boolean;
  categories?: { name: string };
  category?: { name: string };
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
  const router = useRouter();

  const [productsByCategory, setProductsByCategory] = useState<GroupedProducts>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Payment states
  const [paymentMethods, setPaymentMethods] = useState<{id: string, name: string, code: string}[]>([]);
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<string>('CASH');
  const [bankInfo, setBankInfo] = useState<{bank_bin: string, account_number: string, account_name: string} | null>(null);
  const [showBankQR, setShowBankQR] = useState(false);
  const [finalOrderTotal, setFinalOrderTotal] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productsRes, methodsRes, bankRes] = await Promise.all([
          productService.getAll(),
          paymentService.getPaymentMethods().catch(() => []),
          paymentService.getBankInfo().catch(() => null)
        ]);

        const productsData: Product[] = Array.isArray(productsRes) ? productsRes : (productsRes.data || []);
        
        const grouped = productsData.reduce((acc: GroupedProducts, product) => {
          const categoryName = (product.categories?.name || product.category?.name) || 'Khác';
          if (!acc[categoryName]) acc[categoryName] = [];
          acc[categoryName].push(product);
          return acc;
        }, {});
        
        setProductsByCategory(grouped);
        const categories = Object.keys(grouped);
        if (categories.length > 0) {
          setActiveCategory(categories[0]);
        }

        if (Array.isArray(methodsRes) && methodsRes.length > 0) {
          setPaymentMethods(methodsRes);
          setSelectedPaymentCode(methodsRes[0].code);
        }
        if (bankRes) setBankInfo(bankRes);

      } catch (err: any) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    if (tableNumber) fetchInitialData();
  }, [tableNumber]);

  const updateCart = (product: Product, quantity: number) => {
    if (product.is_active === false) return; // Prevent adding inactive items

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
      const noteStr = `Khách báo: ${selectedPaymentCode === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}`;
      await orderService.createForCustomer(tableNumber, orderItems, noteStr);
      
      const total = getTotalPrice();
      setFinalOrderTotal(total);

      if (selectedPaymentCode !== 'CASH' && bankInfo) {
        setShowBankQR(true);
      } else {
        setOrderSuccess(true);
      }
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
    <div className={`flex flex-col h-full ${isMobile ? 'bg-white' : 'bg-white rounded-2xl shadow-sm border border-slate-200'}`}>
      <div className={`p-4 ${isMobile ? 'border-b border-slate-200 flex justify-between items-center' : 'border-b border-slate-200'}`}>
        <h3 className="text-xl font-bold text-slate-800">Giỏ hàng của bạn</h3>
        {isMobile && (
          <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ShoppingBag size={48} className="mb-4 opacity-50" />
            <p>Chưa có món nào trong giỏ</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {cart.map(item => (
              <li key={item.id} className="flex items-center gap-3">
                <img src={item.image_url || '/placeholder.svg'} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                  <p className="text-blue-600 font-semibold text-sm">{item.price.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50/60 rounded-full p-1 border border-blue-100">
                  <button onClick={() => updateCart(item, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm text-blue-600 hover:bg-slate-50">
                    <Minus size={14} />
                  </button>
                  <span className="font-semibold text-sm w-4 text-center text-slate-800">{item.quantity}</span>
                  <button onClick={() => updateCart(item, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700">
                    <Plus size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cart.length > 0 && (
        <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="mb-3">
            <span className="text-[11px] text-slate-400 font-semibold mb-2 block uppercase tracking-wider">Chọn cách thanh toán</span>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentCode(method.code)}
                  className={`py-2 px-3 text-sm font-bold rounded-xl border transition-all ${
                    selectedPaymentCode === method.code 
                      ? 'bg-blue-50 border-blue-600 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {method.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-800 font-medium">Tổng cộng:</span>
            <span className="text-xl font-bold text-blue-600">{getTotalPrice().toLocaleString('vi-VN')} đ</span>
          </div>
          <button
            onClick={handleOrder}
            disabled={isOrdering || paymentMethods.length === 0}
            className="w-full bg-blue-600 text-white font-bold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 disabled:bg-slate-300 hover:bg-blue-700 transition-colors shadow-sm"
          >
            {isOrdering ? 'Đang xử lý...' : (selectedPaymentCode === 'CASH' ? 'Đặt món & Trả tiền mặt' : 'Đặt món & Chuyển khoản')}
          </button>
        </div>
      )}
    </div>
  );

  if (loading && Object.keys(productsByCategory).length === 0) {
    return <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-600 font-medium">Đang tải thực đơn...</div>;
  }
  
  if (showBankQR && bankInfo) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 font-sans items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm w-full border border-slate-200">
          <QrCode size={48} className="mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Chuyển khoản</h2>
          <p className="text-slate-500 mb-6 text-sm">Quét mã QR dưới đây để thanh toán. Bếp sẽ bắt đầu làm món sau khi thu ngân nhận được tiền.</p>
          
          <div className="bg-slate-50 p-4 rounded-2xl mb-4 inline-block border border-slate-200">
            <img 
              src={`https://img.vietqr.io/image/${bankInfo.bank_bin}-${bankInfo.account_number}-compact2.jpg?amount=${finalOrderTotal}&addInfo=Thanh toan don ban ${tableNumber}&accountName=${encodeURIComponent(bankInfo.account_name)}`}
              alt="VietQR"
              className="w-56 h-56 object-contain rounded-xl shadow-sm"
            />
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-slate-800">{bankInfo.account_name}</p>
            <p className="text-xs text-slate-500 mb-1">{bankInfo.account_number} - {bankInfo.bank_bin}</p>
            <p className="text-xl font-bold text-blue-600">{finalOrderTotal.toLocaleString('vi-VN')} đ</p>
          </div>

          <button 
            onClick={() => {
              setShowBankQR(false);
              router.refresh();
            }}
            className="bg-blue-600 text-white font-bold py-3.5 px-8 rounded-full hover:bg-blue-700 transition-colors w-full shadow-sm text-sm"
          >
            Đã chuyển xong
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 text-center p-6 font-sans">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 animate-[bounce_1s_ease-in-out_infinite]">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Đặt hàng thành công!</h1>
        <p className="text-slate-600 mb-8 text-base max-w-md">Vui lòng thanh toán tiền mặt tại quầy (hoặc đưa cho nhân viên) để bếp bắt đầu làm món nhé.</p>
        <button 
          onClick={() => {
            setOrderSuccess(false);
            router.refresh();
          }} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm text-sm"
        >
          Trở về thực đơn
        </button>
      </div>
    );
  }

  const categories = Object.keys(productsByCategory);

  return (
    <div className="bg-slate-50 min-h-screen pb-24 lg:pb-8 font-sans text-slate-800">
      {/* Top App Bar - Refined for Material 3 */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider leading-tight">SẪM COFFEE</h1>
            <p className="text-xs font-medium text-blue-100">Bàn {tableNumber}</p>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors lg:hidden" onClick={() => setIsCartOpen(true)}>
          <div className="relative">
            <ShoppingBag size={24} />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-blue-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {getTotalItems()}
              </span>
            )}
          </div>
        </button>
      </header>

      {/* Hero Image Section with Brand Intro */}
      <section className="relative w-full h-48 sm:h-64 lg:h-72 bg-blue-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-indigo-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559925393-8be0a33e7a14?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 shadow-sm">Thưởng thức hương vị</h2>
          <p className="text-sm sm:text-base font-medium text-blue-100 max-w-md shadow-sm">Khám phá menu đa dạng của Sẫm Coffee. Chạm để chọn món, chúng tôi sẽ phục vụ ngay tại bàn {tableNumber}.</p>
        </div>
      </section>

      {/* Category Chips (Sticky) - Material 3 Filter Chips */}
      <div className="flex gap-3 overflow-x-auto px-4 py-3 bg-slate-50/95 backdrop-blur-md sticky top-[72px] z-20 border-b border-slate-200 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => scrollToCategory(cat)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-in-out border ${
              activeCategory === cat 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm transform scale-[1.02]' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800 shadow-sm'
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
              <h2 className="text-xl font-bold text-slate-800 mb-5 pl-3 border-l-4 border-blue-600">{categoryName}</h2>
              {/* 2 col mobile, 3 col sm, 4 col md/lg */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {productsByCategory[categoryName].map(product => {
                  const quantity = getCartItemQuantity(product.id);
                  const isOutOfStock = product.is_active === false;

                  return (
                    <div key={product.id} className={`bg-white rounded-2xl p-2 sm:p-3 border border-slate-200 flex flex-col gap-2 transition-all duration-300 ${isOutOfStock ? 'opacity-60 grayscale-[0.3] cursor-not-allowed shadow-none' : 'shadow-sm hover:-translate-y-1 hover:shadow-md'}`}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative w-full aspect-square">
                          <img 
                            src={product.image_url || '/placeholder.svg'} 
                            alt={product.name} 
                            className="w-full h-full rounded-xl object-cover bg-slate-50 border border-slate-100"
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-xl"></div>
                          )}
                        </div>
                        <div className="flex flex-col w-full text-center">
                          <h3 className="font-bold text-slate-800 text-[13px] sm:text-[14px] leading-tight line-clamp-2 h-9 mt-1">{product.name}</h3>
                          <p className="text-[14px] sm:text-[15px] font-bold text-blue-600 mt-1">{product.price.toLocaleString('vi-VN')} đ</p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-100 mt-auto">
                        {isOutOfStock ? (
                          <div className="w-full h-[48px] flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-bold text-sm border border-slate-200">
                            Tạm hết hàng
                          </div>
                        ) : quantity > 0 ? (
                          <div className="flex items-center justify-between bg-blue-50/50 rounded-xl p-1.5 border border-blue-100">
                            <button onClick={() => updateCart(product, quantity - 1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white shadow-sm text-blue-600 active:scale-95 transition-transform">
                              <Minus size={16} />
                            </button>
                            <span className="font-bold text-sm w-8 text-center text-blue-700">{quantity}</span>
                            <button onClick={() => updateCart(product, quantity + 1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm active:scale-95 transition-transform">
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => updateCart(product, 1)} 
                            className="w-full h-[48px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
                          >
                            <Plus size={18} />
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
        <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-xl flex items-center justify-between z-40 border border-slate-800 animate-[slideUp_0.3s_ease-out]">
          <div className="flex flex-col text-white ml-2">
            <span className="text-xs text-slate-300 font-medium">{getTotalItems()} món đã chọn</span>
            <span className="font-bold text-lg text-white">{getTotalPrice().toLocaleString('vi-VN')} đ</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="bg-blue-600 text-white h-11 px-5 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform hover:bg-blue-700 shadow-sm text-sm"
          >
            <ShoppingBag size={18} />
            Xem giỏ
          </button>
        </div>
      )}

      {/* Cart Bottom Sheet (Mobile) - Material 3 Standard */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 lg:hidden backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
          <div className="bg-white h-[85vh] rounded-t-3xl overflow-hidden flex flex-col relative animate-[slideUp_0.3s_ease-out] shadow-2xl border-t border-slate-200">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-2"></div>
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