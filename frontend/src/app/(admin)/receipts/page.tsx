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
    <div className="flex flex-col h-full bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* Header & Controls */}
      <div className="px-6 py-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <ReceiptText className="text-[#FFB800]" size={28} />
          Hóa đơn trong ngày
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#4B2C20] focus:ring-1 focus:ring-[#4B2C20]"
              />
            </div>
            
            <button 
              onClick={() => loadReceipts(selectedDate)}
              className="px-4 py-2 bg-[#4B2C20] text-white rounded-lg hover:bg-[#3A2218] transition-colors"
            >
              Lọc
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo bàn..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#4B2C20] focus:ring-1 focus:ring-[#4B2C20]"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tổng hóa đơn</p>
          <p className="text-3xl font-bold text-[#4B2C20]">{filteredOrders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tổng doanh thu</p>
          <p className="text-3xl font-bold text-[#FFB800]">{totalRevenue.toLocaleString('vi-VN')}đ</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="animate-spin text-[#FFB800]" size={32} />
            <p className="text-gray-500 font-medium animate-pulse">Đang tải hóa đơn...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-red-500">
            <AlertCircle size={32} />
            <p className="font-semibold">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <ReceiptText size={48} className="opacity-50" />
            <p className="font-semibold text-lg">Không có hóa đơn nào</p>
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
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-[#4B2C20]">Bàn {order.table_number}</span>
                      <span className="px-2 py-0.5 bg-[#D1FAE5] text-[#065F46] text-xs font-bold uppercase rounded-full">
                        Đã thanh toán
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex gap-4">
                      <span>{format(new Date(order.created_at), 'HH:mm - dd/MM/yyyy')}</span>
                      <span className="font-medium text-gray-600">PT: {paymentMethod}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-500 uppercase">Tổng cộng</p>
                    <p className="text-2xl font-bold text-[#FFB800]">{order.total_price.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#FCF9F8]">
              <h2 className="text-lg font-bold text-[#4B2C20] flex items-center gap-2">
                <ReceiptText size={20} className="text-[#FFB800]"/> Chi tiết hóa đơn
              </h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[#4B2C20]">SẪM COFFEE</h3>
                <p className="text-sm text-gray-500 mt-1">Bàn {selectedOrder.table_number}</p>
                <p className="text-xs text-gray-400 mt-1">{format(new Date(selectedOrder.created_at), 'HH:mm - dd/MM/yyyy')}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 py-4 mb-4 space-y-3">
                {selectedOrder.order_detail?.map((item: any, idx: number) => {
                   const price = item.price_at_order || item.products?.price || 0;
                   return (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex-1 pr-4">
                        <span className="font-semibold text-[#1C1B1F]">{item.products?.name}</span>
                        <div className="text-gray-500 text-xs mt-0.5">{price.toLocaleString('vi-VN')}đ x {item.quantity}</div>
                      </div>
                      <span className="font-bold text-[#4B2C20]">{(price * item.quantity).toLocaleString('vi-VN')}đ</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                  <span>Phương thức thanh toán</span>
                  <span>{selectedOrder.payments?.[0]?.payment_methods?.name || 'Tiền mặt'}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold mt-2">
                  <span className="text-[#4B2C20]">TỔNG CỘNG</span>
                  <span className="text-[#FFB800] text-2xl">{selectedOrder.total_price.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-[#4B2C20] text-white font-bold rounded-xl hover:bg-[#3A2218] transition-colors"
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
