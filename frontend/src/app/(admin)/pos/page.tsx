'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { productService } from '@/src/services/productService';
import { categoryService } from '@/src/services/categoryService';
import { orderService } from '@/src/services/orderService';
import { paymentService } from '@/src/services/paymentService';
import { shiftService } from '@/src/services/shiftService';
import { tableService, TableInfo } from '@/src/services/tableService';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2, Bell, Search, Minus, Plus, Trash2, X, Clock, User, ChevronDown, Coffee, LayoutGrid, UtensilsCrossed } from 'lucide-react';
import { toast } from 'react-toastify';
import QrOrderDrawer from '@/src/components/pos/QrOrderDrawer';
import ConfirmModal from '@/src/components/ConfirmModal';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Interfaces ---
interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category_id?: string;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export default function KiotVietPOSPage() {
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // === 1. SHIFT & GLOBAL STATE ===
  const [hasActiveShift, setHasActiveShift] = useState<boolean | null>(null);
  const [openingShift, setOpeningShift] = useState(false);
  const [startingCash, setStartingCash] = useState('');
  
  // === 2. MENU STATE ===
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(true);

  // === 3. CART & PAYMENT STATE ===
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [paymentMethodCode, setPaymentMethodCode] = useState<string>('CASH');
  const [availableMethods, setAvailableMethods] = useState<{id: string, name: string, code: string}[]>([]);
  const [bankInfo, setBankInfo] = useState<{bank_bin: string, account_number: string, account_name: string} | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  
  // === 4. DRAWER & NOTIFICATION STATE ===
  const [isQrDrawerOpen, setIsQrDrawerOpen] = useState(false);
  const [pendingQrCount, setPendingQrCount] = useState(0);

  // === 5. TABLES STATE ===
  const [activeTab, setActiveTab] = useState<'MENU' | 'TABLES'>('MENU');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('Khách tại quầy');

  // === 6. PRINT RECEIPT STATE ===
  const [printData, setPrintData] = useState<any>(null);
  const [isConfirmClearCartOpen, setIsConfirmClearCartOpen] = useState(false);

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        setPrintData(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  const fetchTables = async () => {
    try {
      const data = await tableService.getTableStatus();
      setTables(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);

  // === Lắng nghe thanh toán tự động từ SePay ===
  useEffect(() => {
    const channel = supabase
      .channel('public:payments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
        },
        async (payload) => {
          const payment = payload.new;
          if (payment.note && payment.note.includes('SePay auto')) {
            toast.success('💰 Khách hàng vừa thanh toán qua SePay thành công!');
            
            // Nếu giao dịch này là của mã QR đang mở trên màn hình POS, đóng Modal lại
            if (payment.order_id === pendingOrderId) {
              setShowQrModal(false);
              setCart([]);
              setPendingOrderId(null);
            }

            // Fetch thông tin đơn hàng để in hóa đơn
            const { data: orderData } = await supabase
              .from('orders')
              .select('id, table_number, total_price, order_detail(quantity, note, products(name, price))')
              .eq('id', payment.order_id)
              .single();

            if (orderData) {
              setPrintData({
                cart: orderData.order_detail.map((d: any) => ({ 
                  product: d.products, 
                  quantity: d.quantity, 
                  note: d.note 
                })),
                total: orderData.total_price,
                orderId: orderData.id,
                table: orderData.table_number,
                time: new Date().toLocaleString('vi-VN')
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pendingOrderId]);

  // === 7. KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleCheckoutClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => {
    shiftService.getCurrentShift()
      .then(shift => setHasActiveShift(!!shift))
      .catch(() => setHasActiveShift(false));

    paymentService.getPaymentMethods().then(methods => {
      setAvailableMethods(methods);
      if(methods.length > 0) setPaymentMethodCode(methods[0].code);
    }).catch(console.error);

    paymentService.getBankInfo().then(info => setBankInfo(info)).catch(console.error);

    Promise.all([
      productService.getAll(),
      categoryService.getAll()
    ]).then(([prodsData, catsData]) => {
      setProducts(Array.isArray(prodsData) ? prodsData : (prodsData?.data || []));
      setCategories(Array.isArray(catsData) ? catsData : (catsData?.data || []));
    }).catch(err => {
      toast.error('Lỗi khi tải thực đơn: ' + err.message);
    }).finally(() => {
      setLoadingMenu(false);
    });
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startingCash) return toast.error("Vui lòng nhập tiền đầu ca");
    setOpeningShift(true);
    try {
      await shiftService.openShift(Number(startingCash));
      toast.success("Mở ca thành công!");
      setHasActiveShift(true);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi mở ca');
    } finally {
      setOpeningShift(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: item.quantity + delta };
        }
        return item;
      })
      .filter(item => item.quantity > 0)
    );
  };

  const setQuantityExact = (productId: string, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    const validQty = isNaN(qty) ? 0 : qty;
    
    setCart(prev => prev
      .map(item => item.product.id === productId ? { ...item, quantity: validQty } : item)
      .filter(item => item.quantity > 0)
    );
  };

  const updateCartNote = (productId: string, note: string) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, note } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setIsConfirmClearCartOpen(true);
  };

  
  const handleCheckoutClick = async () => {
    if (cart.length === 0) return toast.warning("Giỏ hàng trống!");
    
    // Nếu chọn chuyển khoản và có thông tin ngân hàng thì bật QR Modal
    if (paymentMethodCode !== 'CASH' && bankInfo) {
      try {
        const itemsPayload = cart.map(item => ({ product_id: item.product.id, quantity: item.quantity, price_at_order: item.product.price, note: item.note }));
        const orderRes = await orderService.createForCustomer(selectedTableName, itemsPayload);
        setPendingOrderId(orderRes.orderId);
        setShowQrModal(true);
      } catch (err: any) {
        toast.error("Lỗi tạo đơn: " + err.message);
      }
    } else {
      // Thanh toán tiền mặt hoặc không có thông tin bank thì chạy luôn
      executeCheckout();
    }
  };

  const executeCheckout = async () => {
    setIsProcessingOrder(true);
    setShowQrModal(false);
    try {
      let newOrderId: string;
      
      if (pendingOrderId) {
        newOrderId = pendingOrderId;
      } else {
        const itemsPayload = cart.map(item => ({ product_id: item.product.id, quantity: item.quantity, price_at_order: item.product.price, note: item.note }));
        const orderRes = await orderService.createForCustomer(selectedTableName, itemsPayload);
        newOrderId = orderRes.orderId;
      }

      if (paymentMethodCode) {
        await paymentService.createPayment(newOrderId, cartTotal, paymentMethodCode);
      } else {
        await orderService.updateStatus(newOrderId, 'PREPARING');
      }

      toast.success("Thanh toán thành công! Đã gửi hóa đơn xuống Bếp.");
      
      // Capture data for receipt printing
      setPrintData({
        cart: [...cart],
        total: cartTotal,
        orderId: newOrderId,
        table: selectedTableName,
        time: new Date().toLocaleString('vi-VN')
      });

      setCart([]);
      setPendingOrderId(null);
    } catch (err: any) {
      toast.error("Lỗi thanh toán: " + err.message);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategoryId === 'ALL' || p.category_id === activeCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategoryId, searchTerm]);

  if (hasActiveShift === null || loadingMenu) {
    return <div className="flex justify-center items-center h-screen bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  if (hasActiveShift === false) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md text-center border border-slate-200">
          <Clock size={48} className="mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold mb-2">Mở Ca Làm Việc</h2>
          <p className="text-sm text-slate-500 mb-6">Nhập số tiền mặt có trong két để bắt đầu bán hàng.</p>
          <form onSubmit={handleOpenShift}>
            <input 
              type="number" value={startingCash} onChange={(e) => setStartingCash(e.target.value)}
              placeholder="0 đ"
              className="w-full p-3 mb-6 bg-slate-50 border border-slate-200 text-xl font-bold text-center rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required min="0" autoFocus
            />
            <button type="submit" disabled={openingShift} className="w-full py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
              {openingShift ? <Loader2 className="animate-spin"/> : 'XÁC NHẬN MỞ CA'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 font-sans text-slate-800 print:hidden">
      
      {/* 1. TOP NAVBAR */}
      <header className="h-auto md:h-14 py-2 md:py-0 bg-blue-600 text-white flex flex-col md:flex-row items-center justify-between px-2 md:px-4 shrink-0 shadow-sm z-10 gap-2 md:gap-0">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <h1 className="text-lg font-bold tracking-wider hidden sm:block">LUMOS POS</h1>
          <div className="relative flex-1 md:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              ref={searchInputRef}
              type="text" placeholder="Tìm hàng hóa (F3)..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-[320px] h-9 bg-white rounded-full pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-300 shadow-inner transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
          <div className="flex bg-white/15 rounded-lg p-1 shrink-0">
            <button 
              onClick={() => setActiveTab('MENU')}
              className={`px-3 md:px-4 py-1.5 rounded-md flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold transition-colors ${activeTab === 'MENU' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <UtensilsCrossed size={16} /> <span className="hidden sm:inline">Thực Đơn</span>
            </button>
            <button 
              onClick={() => { setActiveTab('TABLES'); fetchTables(); }}
              className={`px-3 md:px-4 py-1.5 rounded-md flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold transition-colors ${activeTab === 'TABLES' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <LayoutGrid size={16} /> <span className="hidden sm:inline">Phòng/Bàn</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button 
              onClick={() => setIsQrDrawerOpen(true)}
              className="relative flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-xs md:text-sm font-medium border border-white/20"
            >
              <Bell size={16} /> <span className="hidden sm:inline">Đơn QR</span>
              {pendingQrCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-md animate-pulse">
                  {pendingQrCount}
                </span>
              )}
            </button>
            <div className="w-px h-6 bg-white/20 hidden md:block"></div>
            <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-1.5 rounded-md transition-colors text-xs md:text-sm">
              <User size={16} /> <span className="hidden sm:inline">{user?.full_name || 'Thu Ngân'}</span> <ChevronDown size={14} className="opacity-70" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-slate-200 lg:bg-transparent">
        
        {/* LEFT: PRODUCTS / TABLES */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-[50vh] lg:min-h-0">
          
          {activeTab === 'MENU' ? (
            <>
              {/* Categories Strip */}
              <div className="flex gap-2 overflow-x-auto px-3 py-2 bg-white border-b border-slate-200 shrink-0 scrollbar-hide shadow-sm">
                <button
                  onClick={() => setActiveCategoryId('ALL')}
                  className={`min-w-[110px] px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-300 ease-in-out border text-center ${
                    activeCategoryId === 'ALL' 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tất cả
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`min-w-[110px] px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-300 ease-in-out border text-center whitespace-nowrap ${
                      activeCategoryId === cat.id 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {loadingMenu ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8"/></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 auto-rows-max">
                    {filteredProducts.map(prod => (
                      <button
                        key={prod.id}
                        onClick={() => addToCart(prod)}
                        className="group bg-white rounded-xl border border-slate-200 flex flex-col transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-md text-center h-full active:scale-95 overflow-hidden"
                      >
                        <div className="relative w-full pt-[100%] bg-slate-50 border-b border-slate-100 shrink-0 mx-auto">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                              <Coffee size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col w-full justify-between flex-1 p-2">
                          <h3 className="font-bold text-slate-800 text-[12px] leading-tight line-clamp-2 h-8 group-hover:text-blue-600 transition-colors">{prod.name}</h3>
                          <p className="text-[13px] font-bold text-blue-600 mt-0.5">{prod.price.toLocaleString('vi-VN')} đ</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {Array.from(new Set(tables.map(t => t.zone))).map(zone => (
                <div key={zone} className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">{zone}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {tables.filter(t => t.zone === zone).map(table => (
                      <button
                        key={table.id}
                        onClick={() => {
                          setSelectedTableName(table.name);
                          setActiveTab('MENU');
                        }}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-xl border shadow-sm transition-all h-24 hover:shadow-md ${
                          selectedTableName === table.name 
                            ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600 text-blue-900' 
                            : 'bg-white border-slate-300 hover:border-blue-400 text-gray-800'
                        }`}
                      >
                        <span className="font-bold text-base">{table.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: CART / RECEIPT (KiotViet style) */}
        <div className="w-full lg:w-[380px] bg-white flex flex-col border-t lg:border-t-0 lg:border-l border-slate-300 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] lg:shadow-[-2px_0_10px_rgba(0,0,0,0.05)] z-10 shrink-0 min-h-[50vh] lg:min-h-0">
          
          {/* Cart Header */}
          <div className="h-12 border-b border-gray-200 flex items-center justify-between px-3 bg-gray-50/50">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors" onClick={() => setActiveTab('TABLES')}>
              <User size={16} /> {selectedTableName} <ChevronDown size={14} className="opacity-70" />
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <Trash2 size={12} /> Hủy đơn
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto bg-white p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Coffee size={48} className="mb-4 opacity-30" />
                <p className="text-sm">Chưa có món nào trong giỏ</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {cart.map((item, index) => (
                  <li key={item.product.id} className="flex items-start gap-3 relative group">
                    <button 
                      onClick={() => removeFromCart(item.product.id)} 
                      className="absolute -top-2 -left-2 text-red-500 p-1 bg-white rounded-full shadow-md border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50"
                    >
                      <X size={12} />
                    </button>
                    
                    {item.product.image_url ? (
                       <img src={item.product.image_url} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0" />
                    ) : (
                       <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center text-slate-300">
                          <Coffee size={20} />
                       </div>
                    )}
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-800 text-[13px] leading-tight pr-2 line-clamp-2">{item.product.name}</p>
                        <p className="text-blue-600 font-bold text-[13px] whitespace-nowrap">{(item.product.price * item.quantity).toLocaleString('vi-VN')} đ</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <input 
                          type="text" 
                          placeholder="Ghi chú (ít đá...)"
                          value={item.note || ''}
                          onChange={(e) => updateCartNote(item.product.id, e.target.value)}
                          className="w-full mr-3 text-[11px] px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white placeholder:text-slate-400 transition-colors"
                        />
                        
                        <div className="flex items-center gap-1.5 bg-blue-50/80 rounded-full p-1 border border-blue-100 shrink-0">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm text-blue-600 hover:bg-slate-50 active:scale-95 transition-transform">
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <input 
                            type="text"
                            value={item.quantity}
                            onChange={(e) => setQuantityExact(item.product.id, e.target.value)}
                            className="font-bold text-[13px] w-8 p-0 border-none ring-0 text-center text-slate-800 bg-transparent outline-none focus:ring-0"
                          />
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-transform">
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Payment Footer */}
          <div className="bg-gray-50 border-t border-gray-300 p-3 shrink-0">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
              <span>Tổng tiền hàng <span className="text-xs font-semibold bg-gray-200 px-2 py-0.5 rounded text-gray-600 ml-1 inline-block min-w-[24px] text-center">{cart.reduce((a,b)=>a+b.quantity,0)}</span></span>
              <span className="font-bold text-gray-800">{cartTotal.toLocaleString('vi-VN')} đ</span>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-800">KHÁCH CẦN TRẢ</span>
              <span className="text-xl font-bold text-blue-600">{cartTotal.toLocaleString('vi-VN')}</span>
            </div>

            <div className="mb-4">
              <span className="text-xs text-gray-500 font-semibold mb-2 block uppercase tracking-wider">Phương thức thanh toán</span>
              <div className="grid grid-cols-2 gap-2">
                {availableMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethodCode(method.code)}
                    className={`py-2 px-3 text-sm font-bold rounded-lg border transition-all ${
                      paymentMethodCode === method.code 
                        ? 'bg-blue-50 border-blue-600 text-blue-700' 
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleCheckoutClick}
              disabled={cart.length === 0 || isProcessingOrder}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white disabled:text-gray-500 font-bold text-lg rounded-xl flex justify-center items-center gap-2 transition-colors shadow-sm"
            >
              {isProcessingOrder ? <Loader2 className="animate-spin text-white" /> : (
                <>THANH TOÁN <span className="text-sm font-normal text-white/70">(F9)</span></>
              )}
            </button>
          </div>

        </div>
      </div>

      <QrOrderDrawer 
        isOpen={isQrDrawerOpen} 
        onClose={() => setIsQrDrawerOpen(false)} 
        onOrdersCountChange={setPendingQrCount}
        onPrintReceipt={setPrintData}
      />

      {/* QR Code Modal for Bank Transfer */}
      {showQrModal && bankInfo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 text-center shadow-2xl w-[360px] animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-xl text-slate-800 mb-2">Chuyển khoản</h3>
            <p className="text-gray-500 text-sm mb-4">Vui lòng yêu cầu khách quét mã QR dưới đây</p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center">
              <img 
                src={`https://img.vietqr.io/image/${bankInfo.bank_bin}-${bankInfo.account_number}-compact2.jpg?amount=${cartTotal}&addInfo=DH ${pendingOrderId || ''}&accountName=${encodeURIComponent(bankInfo.account_name)}`}
                alt="VietQR"
                className="w-48 h-48 object-contain rounded-md shadow-sm border border-gray-200"
              />
            </div>

            <div className="mb-6 space-y-1">
              <p className="text-sm font-semibold">{bankInfo.account_name}</p>
              <p className="text-xs text-gray-500">{bankInfo.account_number} - Ngân hàng {bankInfo.bank_bin}</p>
              <p className="text-lg font-bold text-blue-600 mt-2">{cartTotal.toLocaleString('vi-VN')} đ</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowQrModal(false); setPendingOrderId(null); }} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={executeCheckout} 
                disabled={isProcessingOrder}
                className="flex-1 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isProcessingOrder ? 'Đang xử lý...' : 'Đã nhận tiền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* PRINT RECEIPT (Only visible when printing) */}
    {printData && (
      <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden !important; }
          #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
          #receipt-print-area {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            margin: 0 auto;
            width: 100%;
            max-width: 80mm;
            padding: 10px;
            background: white;
            z-index: 99999;
          }
        }
      `}} />
      <div id="receipt-print-area" className="hidden print:block text-black font-sans" style={{ color: '#000' }}>
        <div className="text-center mb-4">
          <h1 className="font-bold text-2xl uppercase mb-1">LUMOS COFFEE</h1>
          <p className="text-xs">Đ/c: 123 Đường Cà Phê, Quận 1, TP.HCM</p>
          <p className="text-xs">SĐT: 0123 456 789</p>
          <div className="border-t border-dashed border-black my-2 w-full"></div>
          <h2 className="font-bold text-lg mt-2">PHIẾU THANH TOÁN</h2>
        </div>
        
        <div className="text-[13px] mb-3 space-y-1">
          <p><strong>Bàn:</strong> {printData.table}</p>
          <p><strong>Mã HĐ:</strong> {printData.orderId.split('-')[0].toUpperCase()}</p>
          <p><strong>Giờ in:</strong> {printData.time}</p>
        </div>

        <table className="w-full text-[13px] mb-3 text-left">
          <thead className="border-b border-dashed border-black">
            <tr>
              <th className="py-1 w-3/5">Món</th>
              <th className="py-1 text-center">SL</th>
              <th className="py-1 text-right">T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {printData.cart.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-1 pr-1 font-medium">
                  {item.product.name}
                  {item.note && <div className="text-[10px] italic font-normal text-gray-600">Ghi chú: {item.note}</div>}
                </td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">{(item.product.price * item.quantity).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black my-2 w-full"></div>
        
        <div className="flex justify-between items-center text-[15px] font-bold mb-6 mt-2">
          <span>TỔNG CỘNG:</span>
          <span>{printData.total.toLocaleString('vi-VN')} đ</span>
        </div>

        <div className="text-center text-[11px] italic mt-8">
          <p>Cảm ơn & Hẹn gặp lại quý khách!</p>
          <p>Powered by Sam POS</p>
        </div>
      </div>
      </>
    )}
      <ConfirmModal
        isOpen={isConfirmClearCartOpen}
        title="Xóa giỏ hàng"
        message="Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng không? Hành động này không thể hoàn tác."
        onConfirm={() => {
          setCart([]);
          setIsConfirmClearCartOpen(false);
        }}
        onCancel={() => setIsConfirmClearCartOpen(false)}
        type="danger"
      />
    </>
  );
}