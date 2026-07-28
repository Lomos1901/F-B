'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { orderService } from '@/src/services/orderService';
import { Printer, CheckCircle, Search, Clock, ReceiptText, Coffee, Loader2, AlertCircle, RefreshCw, X, LayoutGrid, ClipboardList, Menu, MoreHorizontal } from 'lucide-react';
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
    PENDING: { text: 'Chờ xác nhận', color: 'text-[#4B2C20]', bg: 'bg-[#FFB800]' }, // Golden Honey
    PREPARING: { text: 'Đang chế biến', color: 'text-[#1E3A8A]', bg: 'bg-[#DBEAFE]' }, // Blue
    COMPLETED: { text: 'Hoàn thành', color: 'text-[#065F46]', bg: 'bg-[#D1FAE5]' }, // Green
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

  // Thêm state quản lý hiển thị hoá đơn trên mobile
  const [isMobileReceiptOpen, setIsMobileReceiptOpen] = useState(false);

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
    return () => clearInterval(interval);
  }, []);

  const handleConfirmPayment = async () => {
    if (!selectedOrder || processingPayment) return;
    setProcessingPayment(true);
    try {
      await orderService.updateStatus(selectedOrder.id, 'PAID');
      toast.success(`Đã thanh toán thành công Hóa đơn Bàn ${selectedOrder.table_number}!`);
      setSelectedOrderId(null);
      setIsMobileReceiptOpen(false);
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

  // Effect mở receipt modal trên mobile khi chọn order
  useEffect(() => {
    if (selectedOrderId) {
      setIsMobileReceiptOpen(true);
    }
  }, [selectedOrderId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full bg-[#FCF9F8] text-[#4B2C20] gap-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <Loader2 className="animate-spin text-[#FFB800]" size={48} />
        <p className="font-semibold animate-pulse">Đang đồng bộ Sẫm POS...</p>
      </div>
    );
  }

  // Khối Hóa Đơn Tái Sử Dụng (Dùng cho cả Desktop Right Panel & Mobile Modal)
  const ReceiptContent = () => (
    <>
      <div className="flex-1 overflow-y-auto bg-[#FCF9F8] p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden relative mx-auto w-full" style={{ borderTop: '6px solid #FFB800' }}>
          <div className="p-5 pb-6">
            <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
              <h2 className="font-bold text-2xl text-[#4B2C20] tracking-tight">SẪM COFFEE</h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Phiếu Tạm Tính</p>
              <div className="flex justify-between items-end mt-4 text-sm font-bold text-[#4B2C20] bg-[#FCF9F8] p-2.5 rounded-md">
                <span>Bàn: <span className="text-lg">{selectedOrder!.table_number}</span></span>
                <span className="text-xs font-medium text-gray-500">{format(new Date(selectedOrder!.created_at), 'HH:mm - dd/MM')}</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {selectedOrder!.order_detail.map((item, index) => {
                const itemPrice = item.products?.price || 0;
                const itemTotal = itemPrice * item.quantity;
                return (
                  <div key={index} className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-3">
                      <p className="font-bold text-[#4B2C20] leading-tight">{item.products?.name}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{itemPrice.toLocaleString('vi-VN')}đ x {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#4B2C20]">{itemTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-dashed border-gray-300 pt-4 mb-2">
              <div className="flex justify-between items-center text-sm font-bold text-[#4B2C20]">
                <span>TỔNG CỘNG</span>
                <span className="text-xl text-[#FFB800]">{selectedOrder!.total_price.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center gap-1.5 py-3 px-3 bg-[#FCF9F8] border border-gray-200 text-[#4B2C20] hover:bg-gray-100 rounded-xl font-bold transition-colors">
            <Printer size={18} /> 
            <span className="text-xs">In Tạm tính</span>
          </button>
          <button 
            onClick={handleConfirmPayment}
            disabled={processingPayment}
            className="flex flex-col items-center justify-center gap-1.5 py-3 px-3 bg-[#FFB800] hover:bg-[#E5A600] text-[#4B2C20] rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {processingPayment ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>} 
            <span className="text-xs">Thanh Toán</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen md:h-[calc(100vh-4rem)] overflow-hidden bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* CENTER COLUMN: DANH SÁCH BÀN (MAIN GRID) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 pb-[70px] md:pb-0">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center hidden md:flex">
              <h1 className="text-2xl font-bold text-[#4B2C20]">POS</h1>
              <button onClick={() => loadOrders(true)} className={`p-2 rounded-full hover:bg-gray-100 ${refreshing ? 'animate-spin text-[#FFB800]' : 'text-gray-500'}`}>
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:max-w-xs flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm bàn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FCF9F8] border border-gray-200 rounded-xl focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] text-sm font-medium transition-all"
                />
              </div>
              
              {/* Horizontal Filter Chips */}
              <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  const count = tab.id === 'ALL' ? allOrders.length : allOrders.filter(o => o.order_status?.status_name === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all border ${
                        isActive 
                        ? 'bg-[#4B2C20] text-white border-[#4B2C20]' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#4B2C20]'
                      }`}
                    >
                      {tab.label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#FCF9F8]">
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
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
                      relative group flex flex-col text-left rounded-2xl overflow-hidden transition-all duration-200 outline-none bg-white
                      ${isSelected ? 'ring-2 ring-[#FFB800] shadow-md transform scale-[1.02]' : 'border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#FFB800]/50'}
                    `}
                  >
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl font-black text-[#4B2C20] leading-none">Bàn {order.table_number}</span>
                      </div>
                      
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${conf.bg} ${conf.color}`}>
                          {conf.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs font-semibold text-gray-500 mt-auto pt-1">
                        <Clock size={14} className="mr-1.5 opacity-70" />
                        {waitTime === 0 ? 'Vừa gọi món' : `Đợi ${waitTime} phút`}
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-gray-100 bg-[#FCF9F8] flex justify-between items-center">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Tổng hóa đơn</span>
                      <span className="font-black text-[#4B2C20] text-lg">
                        {order.total_price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: HÓA ĐƠN CHI TIẾT (Desktop / Tablet Landscape) */}
      <div className="w-[350px] lg:w-[400px] bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 hidden md:flex">
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
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-black/50 animate-in fade-in">
          <div className="flex-1" onClick={() => setIsMobileReceiptOpen(false)} />
          <div className="h-[85vh] bg-white rounded-t-3xl shadow-xl flex flex-col animate-in slide-in-from-bottom-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-[#4B2C20]">Chi tiết Bàn {selectedOrder.table_number}</h3>
              <button onClick={() => setIsMobileReceiptOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600">
                <X size={20} />
              </button>
            </div>
            <ReceiptContent />
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          <button className="flex flex-col items-center justify-center w-full h-full text-[#FFB800]">
            <LayoutGrid size={22} className="mb-1" />
            <span className="text-[10px] font-bold">Bàn</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-[#4B2C20]">
            <ClipboardList size={22} className="mb-1" />
            <span className="text-[10px] font-bold">Đơn hàng</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-[#4B2C20]">
            <Menu size={22} className="mb-1" />
            <span className="text-[10px] font-bold">Thực đơn</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-[#4B2C20]">
            <MoreHorizontal size={22} className="mb-1" />
            <span className="text-[10px] font-bold">Thêm</span>
          </button>
        </div>
      </div>

    </div>
  );
}