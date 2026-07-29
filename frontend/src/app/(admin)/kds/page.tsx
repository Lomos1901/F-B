'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { orderService } from '@/src/services/orderService';
import { Check, CookingPot, Loader2, Coffee, RefreshCcw } from 'lucide-react';
import { toast } from 'react-toastify';

interface OrderItem {
  quantity: number;
  products?: { name: string };
}

interface Order {
  id: string;
  table_number: string;
  created_at: string;
  order_detail: OrderItem[];
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-3 p-8 border-2 border-dashed border-gray-200 rounded-2xl">
    <Coffee size={48} className="text-gray-300" />
    <p className="text-sm font-medium">Không có đơn nào</p>
  </div>
);

const OrderTicket = ({ order, onAction, actionText, isPending, icon }: { order: Order, onAction: () => void, actionText: string, isPending: boolean, icon: React.ReactNode }) => {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: vi });

  const borderColor = isPending ? 'border-l-amber-500' : 'border-l-blue-500';
  const buttonClass = isPending 
    ? 'bg-[#FFB800]/10 text-[#4B2C20] hover:bg-[#FFB800]/20 focus:ring-[#4B2C20]' 
    : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 focus:ring-emerald-700';

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 border-l-[4px] ${borderColor} flex flex-col shadow-sm`}>
      <div className="p-4 flex justify-between items-center border-b border-black/5">
        <h3 className="text-xl font-bold text-[#4B2C20]">Bàn {order.table_number}</h3>
        <span className="text-xs font-medium text-[#4B2C20] bg-[#F3EDF7] px-3 py-1.5 rounded-full">{timeAgo}</span>
      </div>
      <div className="p-4 flex-grow space-y-3">
        {order.order_detail.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-700 font-medium">{item.products?.name || 'Sản phẩm không xác định'}</span>
            <span className="font-bold text-[#4B2C20] bg-[#F3EDF7] rounded-full px-2.5 py-0.5">x{item.quantity}</span>
          </div>
        ))}
      </div>
      <div className="p-3 pt-0">
        <button 
          onClick={onAction}
          className={`w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${buttonClass}`}
        >
          {icon}
          {actionText}
        </button>
      </div>
    </div>
  );
};

export default function KDSPage() {
  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const preparing = await orderService.getOrdersByStatus('PREPARING');
      setPreparingOrders(preparing);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  const handleUpdateStatus = async (orderId: string, status: string, tableNumber: string) => {
    try {
      await orderService.updateStatus(orderId, status);
      toast.success(`Đã hoàn thành đơn hàng của bàn ${tableNumber}.`);
      loadOrders();
    } catch (err: any) {
      toast.error(`Lỗi khi cập nhật trạng thái: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#FCF9F8]">
        <Loader2 size={48} className="animate-spin text-[#FFB800]" />
      </div>
    );
  }

  if (error && preparingOrders.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#FCF9F8]">
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl max-w-md">
          <p className="font-semibold mb-2">Lỗi tải dữ liệu</p>
          <p className="text-sm">{error}</p>
          <button onClick={handleManualRefresh} className="mt-4 px-4 py-2 bg-red-100 rounded-full font-medium hover:bg-red-200 transition-colors">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F8]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <header className="px-6 py-4 bg-[#FCF9F8] flex items-center justify-between border-b border-black/5 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#4B2C20]">Màn hình Pha chế (KDS)</h1>
          <span className="bg-[#FFB800]/20 text-[#4B2C20] px-4 py-1.5 rounded-full text-sm font-bold border border-[#FFB800]/30">
            {preparingOrders.length} Đơn đang chờ
          </span>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className={`p-2.5 rounded-full hover:bg-black/5 active:bg-black/10 text-[#4B2C20] transition-all border border-transparent hover:border-black/10 ${isRefreshing ? 'opacity-50' : ''}`}
          disabled={isRefreshing}
          title="Làm mới dữ liệu"
        >
           <RefreshCcw size={24} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {preparingOrders.length === 0 ? (
            <div className="col-span-full pt-20">
              <EmptyState />
            </div>
          ) : (
            preparingOrders.map(order => (
              <OrderTicket
                key={order.id}
                order={order}
                onAction={() => handleUpdateStatus(order.id, 'PAID', order.table_number)}
                actionText="Hoàn thành đơn này"
                isPending={false}
                icon={<Check size={20} />}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}