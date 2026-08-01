'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { orderService } from '@/src/services/orderService';
import { ReceiptText, Calendar, Search, Loader2, AlertCircle, X } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_methods?: {
    name: string;
  };
}

interface Order {
  id: string;
  table_number: string;
  total_price: number;
  created_at: string;
  order_status?: { status_name: string };
  payments?: Payment[];
  order_detail?: any[];
}

export default function ReceiptsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Mặc định lấy ngày hôm nay
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local time
  );
  
  const [searchTerm, setSearchTerm] = useState('');

  const loadReceipts = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getDailyReceipts(date);
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts(selectedDate);
  }, [selectedDate]);

  const filteredOrders = orders.filter(order => 
    order.table_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      
      {/* Header & Controls */}
      <div className="px-6 py-6 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <ReceiptText size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Hóa đơn trong ngày
            </h1>
            <p className="text-xs text-slate-500">Tra cứu và quản lý danh sách hóa đơn thanh toán</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all shadow-sm"
              />
            </div>
            
            <button 
              onClick={() => loadReceipts(selectedDate)}
              className="px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-full hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-500/10"
            >
              Lọc
            </button>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo bàn..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm placeholder:text-slate-400 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tổng hóa đơn</p>
            <p className="text-3xl font-bold text-slate-800">{filteredOrders.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <ReceiptText size={24} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-blue-600">{totalRevenue.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">
            ₫
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={36} />
            <p className="text-slate-500 font-medium animate-pulse text-sm">Đang tải hóa đơn...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3 text-red-500 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <AlertCircle size={36} />
            <p className="font-semibold text-sm">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <ReceiptText size={48} className="opacity-40 text-slate-400" />
            <p className="font-semibold text-slate-600 text-base">Không có hóa đơn nào</p>
            <p className="text-xs text-slate-400">Thử chọn ngày khác hoặc thay đổi từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              // Lấy tên PT thanh toán nếu có
              const paymentMethod = order.payments?.[0]?.payment_methods?.name || 'Tiền mặt';
              
              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        Bàn {order.table_number}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đã thanh toán
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>{format(new Date(order.created_at), 'HH:mm - dd/MM/yyyy')}</span>
                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                        <span className="text-slate-400">PT:</span> {paymentMethod}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right sm:text-right flex sm:flex-col justify-between items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng cộng</p>
                    <p className="text-2xl font-bold text-blue-600">{order.total_price.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <ReceiptText size={18} />
                </div>
                Chi tiết hóa đơn
              </h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">LUMOS COFFEE</h3>
                <p className="text-sm font-semibold text-blue-600 mt-1">Bàn {selectedOrder.table_number}</p>
                <p className="text-xs text-slate-400 mt-0.5">{format(new Date(selectedOrder.created_at), 'HH:mm - dd/MM/yyyy')}</p>
              </div>

              <div className="border-t border-dashed border-slate-200 py-4 mb-4 space-y-3">
                {selectedOrder.order_detail?.map((item: any, idx: number) => {
                   const price = item.price_at_order || item.products?.price || 0;
                   return (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex-1 pr-4">
                        <span className="font-medium text-slate-800">{item.products?.name}</span>
                        <div className="text-slate-500 text-xs mt-0.5">{price.toLocaleString('vi-VN')}đ x {item.quantity}</div>
                      </div>
                      <span className="font-semibold text-slate-800">{(price * item.quantity).toLocaleString('vi-VN')}đ</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-slate-200 pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phương thức thanh toán</span>
                  <span className="text-sm font-semibold text-slate-700">{selectedOrder.payments?.[0]?.payment_methods?.name || 'Tiền mặt'}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-800 text-sm font-semibold">TỔNG CỘNG</span>
                  <span className="text-blue-600 text-2xl font-extrabold">{selectedOrder.total_price.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
