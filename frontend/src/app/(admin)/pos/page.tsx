'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { orderService } from '@/src/services/orderService';
import { paymentService } from '@/src/services/paymentService';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckCircle, Search, Clock, ReceiptText, Coffee, Loader2, AlertCircle, RefreshCw, X, LayoutGrid, ClipboardList, MoreHorizontal, QrCode } from 'lucide-react';
import { toast } from 'react-toastify';

// --- Interfaces ---
interface OrderItem {
  quantity: number;
  products?: { name: string; price: number };
}

interface Order {
  id: string;
  table_number: string;
  total_price: number;
  created_at: string;
  order_status?: { status_name: string };
  order_detail: OrderItem[];
}

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ xác nhận' },
  { id: 'PREPARING', label: 'Đang chế biến' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
];

const getStatusConfig = (status: string) => {
  const config = {
    PENDING: { text: 'Chờ xác nhận', color: 'text-[#4B2C20]', bg: 'bg-[#FFB800]/20' },
    PREPARING: { text: 'Đang chế biến', color: 'text-[#1E3A8A]', bg: 'bg-[#DBEAFE]' },
    COMPLETED: { text: 'Hoàn thành', color: 'text-[#065F46]', bg: 'bg-[#D1FAE5]' },
    PAID: { text: 'Đã thanh toán', color: 'text-gray-600', bg: 'bg-gray-200' },
  };
  return config[status as keyof typeof config] || { text: status, color: 'text-gray-600', bg: 'bg-gray-200' };
};

export default function POSPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileReceiptOpen, setIsMobileReceiptOpen] = useState(false);
  
  // Payment State
  const [paymentMethods, setPaymentMethods] = useState<{id: string, name: string, code: string}[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CASH');
  const [paymentStep, setPaymentStep] = useState<1 | 2>(1); // 1: Chọn PT, 2: Quét QR
  const [bankInfo, setBankInfo] = useState<{bank_bin: string, account_number: string, account_name: string} | null>(null);

  const loadOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [pending, preparing, completed] = await Promise.all([
        orderService.getOrdersByStatus('PENDING'),
        orderService.getOrdersByStatus('PREPARING'),
        orderService.getOrdersByStatus('COMPLETED'),
      ]);
      
      const combined = [...pending, ...preparing, ...completed].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setAllOrders(combined);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      if (!isRefresh) toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 15000); 
    
    // Tải danh sách PT thanh toán
    paymentService.getPaymentMethods()
      .then(data => setPaymentMethods(data))
      .catch(err => console.error("Chưa tải được PT thanh toán:", err));
      
    // Tải thông tin ngân hàng
    paymentService.getBankInfo()
      .then(data => setBankInfo(data))
      .catch(err => console.error("Chưa tải được thông tin ngân hàng:", err));
      
    return () => clearInterval(interval);
  }, []);

  const handleOpenPaymentModal = () => {
    if (!selectedOrder) return;
    setPaymentStep(1);
    setIsPaymentModalOpen(true);
  };

  const handleNextPaymentStep = async () => {
    if (!selectedOrder || processingPayment) return;
    
    if (selectedPaymentMethod === 'CASH') {
      await executePayment();
    } else {
      setPaymentStep(2);
    }
  };

  const executePayment = async () => {
    setProcessingPayment(true);
    try {
      if (paymentMethods.length > 0) {
        await paymentService.createPayment(selectedOrder!.id, selectedOrder!.total_price, selectedPaymentMethod);
      } else {
        await orderService.updateStatus(selectedOrder!.id, 'PAID');
      }
      
      toast.success(`Đã thanh toán thành công Hóa đơn Bàn ${selectedOrder!.table_number}!`);
      setSelectedOrderId(null);
      setIsMobileReceiptOpen(false);
      setIsPaymentModalOpen(false);
      await loadOrders(true);
    } catch (err: any) {
      toast.error(`Lỗi thanh toán: ${err.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const matchesSearch = order.table_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'ALL' || order.order_status?.status_name === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [allOrders, searchTerm, activeTab]);

  const selectedOrder = useMemo(() => {
    return allOrders.find(o => o.id === selectedOrderId) || null;
  }, [allOrders, selectedOrderId]);

  useEffect(() => {
    if (selectedOrderId) {
      setIsMobileReceiptOpen(true);
    }
  }, [selectedOrderId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#FCF9F8] text-[#4B2C20] gap-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <Loader2 className="animate-spin text-[#FFB800]" size={48} />
        <p className="font-semibold animate-pulse">Đang đồng bộ Sẫm POS...</p>
      </div>
    );
  }

  const ReceiptContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
          <h2 className="font-bold text-2xl text-[#4B2C20] tracking-tight">SẪM COFFEE</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Phiếu Tạm Tính</p>
          <div className="flex justify-between items-end mt-6 text-sm font-bold text-[#4B2C20]">
            <span>Bàn: <span className="text-xl">{selectedOrder!.table_number}</span></span>
            <span className="text-xs font-medium text-gray-500">{format(new Date(selectedOrder!.created_at), 'HH:mm - dd/MM')}</span>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          {selectedOrder!.order_detail.map((item, index) => {
            const itemPrice = item.products?.price || 0;
            const itemTotal = itemPrice * item.quantity;
            return (
              <div key={index} className="flex justify-between items-start text-sm">
                <div className="flex-1 pr-3">
                  <p className="font-medium text-[#4B2C20]">{item.products?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{itemPrice.toLocaleString('vi-VN')}đ x {item.quantity}</p>
                </div>
                <span className="font-bold text-[#4B2C20]">{itemTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            );
          })}
        </div>
        
        <div className="border-t border-dashed border-gray-300 pt-4 mb-2">
          <div className="flex justify-between items-center text-base font-bold text-[#4B2C20]">
            <span>TỔNG CỘNG</span>
            <span className="text-2xl text-[#FFB800]">{selectedOrder!.total_price.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 text-[#4B2C20] rounded-xl font-medium hover:bg-black/5 active:bg-black/10 transition-colors">
          <Printer size={18} /> 
          <span>In tạm tính</span>
        </button>
        <button 
          onClick={handleOpenPaymentModal}
          disabled={processingPayment}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#FFB800] hover:bg-[#FFB800]/90 active:bg-[#FFB800]/80 text-[#4B2C20] rounded-xl font-bold transition-colors disabled:opacity-50"
        >
          {processingPayment ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>} 
          <span>Thanh toán</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* CENTER COLUMN: DANH SÁCH BÀN (MAIN GRID) */}
      <div className="flex-1 flex flex-col min-w-0 pb-[64px] sm:pb-0 relative">
        
        {/* Mobile Top App Bar */}
        <div className="sticky top-0 z-10 bg-[#FCF9F8] px-4 py-3 flex items-center justify-between sm:hidden">
          {!isSearchExpanded ? (
            <>
              <h1 className="text-2xl font-bold text-[#4B2C20]">POS</h1>
              <button onClick={() => setIsSearchExpanded(true)} className="p-2 rounded-full hover:bg-black/5 active:bg-black/10">
                <Search size={24} className="text-[#4B2C20]" />
              </button>
            </>
          ) : (
            <div className="flex items-center w-full bg-white rounded-full px-3 py-1 border border-gray-200">
              <Search size={20} className="text-gray-500 mr-2" />
              <input 
                autoFocus
                type="text" 
                placeholder="Tìm bàn..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button onClick={() => { setIsSearchExpanded(false); setSearchTerm(''); }} className="p-1 rounded-full hover:bg-black/5">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop/Tablet Top App Bar */}
        <div className="hidden sm:flex items-center justify-between px-6 py-4 bg-[#FCF9F8]">
          <h1 className="text-2xl font-bold text-[#4B2C20]">POS</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => loadOrders(true)} className={`p-2 rounded-full hover:bg-black/5 active:bg-black/10 ${refreshing ? 'animate-spin text-[#FFB800]' : 'text-gray-500'}`}>
              <RefreshCw size={24} />
            </button>
            <div className="flex items-center bg-white rounded-full px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-[#4B2C20] w-64 transition-all">
              <Search size={20} className="text-gray-500 mr-2" />
              <input 
                type="text" 
                placeholder="Tìm bàn..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Horizontal Filter Chips */}
        <div className="px-4 sm:px-6 pb-4 overflow-x-auto scrollbar-hide flex gap-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  isActive 
                  ? 'bg-[#4B2C20] text-white border-[#4B2C20]' 
                  : 'bg-transparent text-[#4B2C20] border-gray-300 hover:bg-black/5 active:bg-black/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
          {error && allOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
              <AlertCircle size={32} />
              <p className="font-semibold">{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-70">
              <Coffee size={64} className="mb-4 text-gray-300" />
              <p className="text-lg font-bold text-[#4B2C20]">Không có đơn hàng</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map(order => {
                const isSelected = selectedOrderId === order.id;
                const status = order.order_status?.status_name || 'UNKNOWN';
                const conf = getStatusConfig(status);
                const waitTime = differenceInMinutes(new Date(), new Date(order.created_at));

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`
                      relative group flex flex-col text-left rounded-2xl overflow-hidden transition-all duration-200 outline-none bg-white border border-gray-200
                      ${isSelected ? 'ring-2 ring-[#FFB800] scale-[1.02]' : 'hover:bg-black/5 active:bg-black/10'}
                    `}
                  >
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="text-2xl font-bold text-[#4B2C20] mb-2">
                        Bàn {order.table_number}
                      </div>
                      
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${conf.bg} ${conf.color}`}>
                          {conf.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs font-semibold text-gray-500 mt-auto pt-2 uppercase tracking-wider">
                        <Clock size={14} className="mr-1.5" />
                        {waitTime === 0 ? 'Vừa gọi món' : `${waitTime} phút`}
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-[#FCF9F8] border-t border-gray-200 flex justify-between items-center group-hover:bg-black/5 transition-colors">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Tổng</span>
                      <span className="font-bold text-[#4B2C20] text-lg">
                        {order.total_price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile FAB Refresh */}
        <button
          onClick={() => loadOrders(true)}
          className="sm:hidden fixed bottom-20 right-4 p-4 bg-[#FFB800] text-[#4B2C20] rounded-full shadow-md hover:bg-[#FFB800]/90 active:bg-[#FFB800]/80 z-30"
        >
          <RefreshCw size={24} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* RIGHT COLUMN: HÓA ĐƠN CHI TIẾT (Desktop / Tablet Landscape) */}
      <div className="hidden sm:flex flex-col w-[350px] xl:w-[400px] bg-white border-l border-gray-200 z-20">
        {selectedOrder ? (
          <ReceiptContent />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-[#FCF9F8]">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-sm">
              <ReceiptText size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-[#4B2C20] mb-1">Chưa chọn bàn</h3>
            <p className="text-sm font-medium">Chọn một bàn để xem hóa đơn.</p>
          </div>
        )}
      </div>

      {/* MOBILE RECEIPT OVERLAY */}
      {isMobileReceiptOpen && selectedOrder && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col bg-black/50 animate-in fade-in">
          <div className="flex-1" onClick={() => setIsMobileReceiptOpen(false)} />
          <div className="h-[85vh] bg-white rounded-t-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom-full overflow-hidden">
            <div className="flex justify-center items-center p-3 cursor-pointer" onClick={() => setIsMobileReceiptOpen(false)}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            <div className="flex justify-between items-center px-6 py-2 border-b border-gray-100">
              <h3 className="font-bold text-lg text-[#4B2C20]">Chi tiết Bàn {selectedOrder.table_number}</h3>
              <button onClick={() => setIsMobileReceiptOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <ReceiptContent />
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#FCF9F8] border-t border-gray-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          <button className="flex flex-col items-center justify-center w-full h-full text-[#4B2C20] hover:bg-black/5 active:bg-black/10 transition-colors rounded-xl mx-1">
            <div className="px-4 py-1 bg-[#FFB800]/20 rounded-full mb-1">
              <LayoutGrid size={24} className="text-[#4B2C20]" />
            </div>
            <span className="text-[11px] font-medium">Bàn</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-[#4B2C20] hover:bg-black/5 active:bg-black/10 transition-colors rounded-xl mx-1">
            <ClipboardList size={24} className="mb-1" />
            <span className="text-[11px] font-medium">Đơn hàng</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-[#4B2C20] hover:bg-black/5 active:bg-black/10 transition-colors rounded-xl mx-1">
            <Coffee size={24} className="mb-1" />
            <span className="text-[11px] font-medium">Thực đơn</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-[#4B2C20] hover:bg-black/5 active:bg-black/10 transition-colors rounded-xl mx-1">
            <MoreHorizontal size={24} className="mb-1" />
            <span className="text-[11px] font-medium">Thêm</span>
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#4B2C20]">
                {paymentStep === 1 ? 'Xác nhận thanh toán' : 'Quét mã để thanh toán'}
              </h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6">
              {paymentStep === 1 ? (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Bàn {selectedOrder.table_number}</p>
                    <p className="text-4xl font-bold text-[#FFB800]">{selectedOrder.total_price.toLocaleString('vi-VN')}đ</p>
                  </div>

                  {paymentMethods.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      <p className="text-sm font-bold text-[#4B2C20] mb-2">Phương thức thanh toán:</p>
                      {paymentMethods.map(method => (
                        <label key={method.code} className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${selectedPaymentMethod === method.code ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={method.code}
                            checked={selectedPaymentMethod === method.code}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="w-5 h-5 text-[#FFB800] focus:ring-[#FFB800] border-gray-300"
                          />
                          <span className="ml-3 font-semibold text-[#4B2C20]">{method.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
                      <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                      <p>Chưa tìm thấy dữ liệu PT thanh toán. Bạn cần chạy file <strong>supabase_payments.sql</strong>. Tạm thời thanh toán theo cách cũ.</p>
                    </div>
                  )}

                  <button 
                    onClick={handleNextPaymentStep}
                    disabled={processingPayment}
                    className="w-full py-4 bg-[#4B2C20] hover:bg-[#3A2218] text-white rounded-2xl font-bold text-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {processingPayment ? <Loader2 size={24} className="animate-spin"/> : (selectedPaymentMethod === 'CASH' ? <CheckCircle size={24}/> : <QrCode size={24}/>)} 
                    <span>{selectedPaymentMethod === 'CASH' ? 'Hoàn tất thanh toán' : 'Tạo mã QR'}</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{selectedPaymentMethod}</p>
                    <div className="bg-[#FCF9F8] p-4 rounded-2xl inline-block border border-gray-200 shadow-sm mx-auto mb-4">
                      {selectedPaymentMethod === 'BANK_TRANSFER' && bankInfo ? (
                        <img 
                          src={`https://img.vietqr.io/image/${bankInfo.bank_bin}-${bankInfo.account_number}-compact2.png?amount=${selectedOrder.total_price}&addInfo=Thanh toan don ban ${selectedOrder.table_number}&accountName=${encodeURIComponent(bankInfo.account_name)}`}
                          alt="VietQR"
                          className="w-56 h-56 object-contain"
                        />
                      ) : (
                        <div className="w-56 h-56 flex flex-col items-center justify-center text-gray-400">
                          <QrCode size={64} className="mb-2 opacity-50" />
                          <span className="text-sm">Chưa có thông tin</span>
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#FFB800] mb-1">{selectedOrder.total_price.toLocaleString('vi-VN')}đ</p>
                    <p className="text-sm font-medium text-gray-500">Đưa mã này cho khách hàng quét để thanh toán</p>
                  </div>
                  
                  <button 
                    onClick={executePayment}
                    disabled={processingPayment}
                    className="w-full py-4 bg-[#FFB800] hover:bg-[#FFB800]/90 text-[#4B2C20] rounded-2xl font-bold text-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {processingPayment ? <Loader2 size={24} className="animate-spin"/> : <CheckCircle size={24}/>} 
                    <span>Xác nhận đã nhận tiền</span>
                  </button>
                  <button 
                    onClick={() => setPaymentStep(1)}
                    disabled={processingPayment}
                    className="w-full mt-3 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl font-bold transition-colors hover:bg-gray-50"
                  >
                    Quay lại
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}