'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { orderService } from '@/src/services/orderService';
import { paymentService } from '@/src/services/paymentService';
import { Clock, ReceiptText, Coffee, Loader2, AlertCircle, RefreshCw, X, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import { toast } from 'react-toastify';

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
];

const getStatusConfig = (status: string) => {
  const config = {
    PENDING: { text: 'Chờ xác nhận', color: 'text-[#4B2C20]', bg: 'bg-[#FFB800]/20' },
    PREPARING: { text: 'Đang chế biến', color: 'text-[#1E3A8A]', bg: 'bg-[#DBEAFE]' },
  };
  return config[status as keyof typeof config] || { text: status, color: 'text-gray-600', bg: 'bg-gray-200' };
};

interface QrOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrdersCountChange: (count: number) => void;
  onPrintReceipt?: (orderData: any) => void;
}

export default function QrOrderDrawer({ isOpen, onClose, onOrdersCountChange, onPrintReceipt }: QrOrderDrawerProps) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>('');
  
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, tableNumber: string, orderId: string | null}>({isOpen: false, tableNumber: '', orderId: null});
  
  const [paymentMethods, setPaymentMethods] = useState<{id: string, name: string, code: string}[]>([]);

  const loadOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [pending, preparing] = await Promise.all([
        orderService.getOrdersByStatus('PENDING'),
        orderService.getOrdersByStatus('PREPARING'),
      ]);
      
      const combined = [...pending, ...preparing].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setAllOrders(combined);
      onOrdersCountChange(pending.length); // Notify parent of pending count
      setError(null);
    } catch (err: any) {
      setError(err.message);
      if (!isRefresh && isOpen) toast.error('Không thể tải danh sách đơn hàng QR');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 15000); 
    
    paymentService.getPaymentMethods()
      .then(data => setPaymentMethods(data))
      .catch(err => console.error("Chưa tải được PT thanh toán:", err));
      
    return () => clearInterval(interval);
  }, []);

  const executeCancelOrder = async () => {
    if (!confirmModal.orderId) return;
    setIsCanceling(true);
    const orderIdToCancel = confirmModal.orderId;
    const tableNum = confirmModal.tableNumber;
    setConfirmModal({isOpen: false, tableNumber: '', orderId: null});
    
    try {
      await orderService.updateStatus(orderIdToCancel, 'CANCELLED');
      toast.success(`Đã hủy đơn bàn ${tableNum}`);
      setSelectedOrderId(null);
      await loadOrders(true);
    } catch (err: any) {
      toast.error(`Lỗi hủy đơn: ${err.message}`);
    } finally {
      setIsCanceling(false);
    }
  };

  const executePayment = async (order: Order) => {
    setProcessingPayment(true);
    try {
      const cashMethod = paymentMethods.find(m => m.code === 'CASH');
      if (cashMethod) {
        await paymentService.createPayment(order.id, order.total_price, cashMethod.code);
      } else {
        await orderService.updateStatus(order.id, 'PREPARING');
      }
      toast.success(`Đã xác nhận thanh toán đơn Bàn ${order.table_number}!`);
      
      if (onPrintReceipt) {
        onPrintReceipt({
          cart: order.order_detail.map(d => ({ product: d.products, quantity: d.quantity })),
          total: order.total_price,
          orderId: order.id,
          table: order.table_number,
          time: new Date().toLocaleString('vi-VN')
        });
      }

      setSelectedOrderId(null);
      await loadOrders(true);
    } catch (err: any) {
      toast.error(`Lỗi thanh toán: ${err.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      return activeTab === 'ALL' || order.order_status?.status_name === activeTab;
    });
  }, [allOrders, activeTab]);

  const selectedOrder = useMemo(() => {
    return allOrders.find(o => o.id === selectedOrderId) || null;
  }, [allOrders, selectedOrderId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 animate-in fade-in" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#FCF9F8]">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#4B2C20]">Đơn hàng từ Mã QR</h2>
            <button onClick={() => loadOrders(true)} className={`p-2 rounded-full hover:bg-black/5 ${refreshing ? 'animate-spin text-[#FFB800]' : 'text-gray-500'}`}>
              <RefreshCw size={20} />
            </button>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden bg-[#FCF9F8]">
          
          {/* Left: Orders List */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
            {/* Tabs */}
            <div className="px-6 py-4 flex gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeTab === tab.id 
                    ? 'bg-[#4B2C20] text-white border-[#4B2C20]' 
                    : 'bg-transparent text-[#4B2C20] border-gray-300 hover:bg-black/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {loading && allOrders.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 size={32} className="animate-spin text-[#FFB800]" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Coffee size={48} className="mb-4 text-gray-300" />
                  <p className="font-bold text-[#4B2C20]">Không có đơn hàng</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredOrders.map(order => {
                    const isSelected = selectedOrderId === order.id;
                    const status = order.order_status?.status_name || 'UNKNOWN';
                    const conf = getStatusConfig(status);
                    const waitTime = differenceInMinutes(new Date(), new Date(order.created_at));

                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`text-left rounded-2xl p-4 transition-all duration-200 border bg-white ${
                          isSelected ? 'ring-2 ring-[#FFB800] border-transparent scale-[1.02] shadow-md' : 'border-gray-200 hover:bg-black/5'
                        }`}
                      >
                        <div className="text-xl font-bold text-[#4B2C20] mb-2">Bàn {order.table_number}</div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${conf.bg} ${conf.color}`}>
                          {conf.text}
                        </span>
                        <div className="flex items-center text-xs font-semibold text-gray-500 mb-2">
                          <Clock size={12} className="mr-1" />
                          {waitTime === 0 ? 'Vừa gọi' : `${waitTime} phút`}
                        </div>
                        <div className="border-t border-gray-100 pt-2 flex justify-between items-center mt-2">
                          <span className="text-[10px] font-bold uppercase">Tổng</span>
                          <span className="font-bold text-[#FFB800]">{order.total_price.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Receipt Detail */}
          <div className="w-[350px] bg-white flex flex-col h-full">
            {selectedOrder ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                    <h2 className="font-bold text-xl text-[#4B2C20]">PHIẾU TẠM TÍNH</h2>
                    <div className="flex justify-between items-end mt-4 text-sm font-bold">
                      <span>Bàn: <span className="text-lg">{selectedOrder.table_number}</span></span>
                      <span className="text-xs font-medium text-gray-500">{format(new Date(selectedOrder.created_at), 'HH:mm')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {selectedOrder.order_detail.map((item, index) => (
                      <div key={index} className="flex justify-between items-start text-sm">
                        <div className="flex-1 pr-3">
                          <p className="font-medium text-[#4B2C20]">{item.products?.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{(item.products?.price || 0).toLocaleString('vi-VN')}đ x {item.quantity}</p>
                        </div>
                        <span className="font-bold text-[#4B2C20]">{((item.products?.price || 0) * item.quantity).toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-dashed border-gray-300 pt-4">
                    <div className="flex justify-between items-center font-bold text-[#4B2C20]">
                      <span>TỔNG CỘNG</span>
                      <span className="text-xl text-[#FFB800]">{selectedOrder.total_price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex flex-col gap-3">
                  {selectedOrder.order_status?.status_name === 'PENDING' && (
                    <button 
                      onClick={() => executePayment(selectedOrder)}
                      disabled={processingPayment || isCanceling}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FFB800] hover:bg-[#FFB800]/90 text-[#4B2C20] rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {processingPayment ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>} 
                      <span>Xác nhận Đã thu tiền</span>
                    </button>
                  )}
                  {selectedOrder.order_status?.status_name === 'PREPARING' && (
                    <button disabled className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-500 rounded-xl font-bold">
                      <Loader2 size={18} className="animate-spin"/> Bếp đang pha chế...
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        if (onPrintReceipt && selectedOrder) {
                          onPrintReceipt({
                            cart: selectedOrder.order_detail.map(d => ({ product: d.products, quantity: d.quantity })),
                            total: selectedOrder.total_price,
                            orderId: selectedOrder.id,
                            table: selectedOrder.table_number,
                            time: new Date().toLocaleString('vi-VN')
                          });
                        }
                      }}
                      className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
                    >
                      <Printer size={18} /> In bill
                    </button>
                    <button 
                      onClick={() => setConfirmModal({isOpen: true, tableNumber: selectedOrder.table_number, orderId: selectedOrder.id})}
                      disabled={processingPayment || isCanceling}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100"
                    >
                      <X size={18}/> Hủy đơn
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center bg-white">
                <ReceiptText size={48} className="text-gray-200 mb-4" />
                <p className="text-sm font-medium">Chọn một bàn để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Hủy Đơn */}
        {confirmModal.isOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
             <div className="bg-white rounded-2xl p-6 text-center shadow-2xl max-w-sm w-full">
               <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
               <h3 className="font-bold text-xl mb-2">Hủy đơn hàng?</h3>
               <p className="text-gray-600 mb-6">Bạn chắc chắn muốn hủy đơn Bàn {confirmModal.tableNumber}?</p>
               <div className="flex gap-3">
                 <button onClick={() => setConfirmModal({isOpen: false, tableNumber: '', orderId: null})} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Không</button>
                 <button onClick={executeCancelOrder} disabled={isCanceling} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">
                   {isCanceling ? 'Đang hủy...' : 'Đồng ý'}
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
