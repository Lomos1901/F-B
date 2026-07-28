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
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PREPARING'>('PENDING');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const [pending, preparing] = await Promise.all([
        orderService.getOrdersByStatus('PENDING'),
        orderService.getOrdersByStatus('PREPARING'),
      ]);
      setPendingOrders(pending);
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
      const statusText = status === 'PREPARING' ? 'bắt đầu làm' : 'đã hoàn thành';
      toast.success(`Đã ${statusText} đơn hàng của bàn ${tableNumber}.`);
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

  if (error && pendingOrders.length === 0 && preparingOrders.length === 0) {
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
    <div className="h-screen flex flex-col bg-[#FCF9F8] overflow-hidden" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <header className="px-4 py-3 bg-[#FCF9F8] flex items-center justify-between border-b border-black/5 z-10 shrink-0">
        <h1 className="text-2xl font-bold text-[#4B2C20]">Pha chế</h1>
        <button 
          onClick={handleManualRefresh} 
          className={`p-2 rounded-full hover:bg-black/5 text-[#4B2C20] transition-all ${isRefreshing ? 'opacity-50' : ''}`}
          disabled={isRefreshing}
        >
           <RefreshCcw size={24} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </header>
      
      {/* Mobile Segmented Button */}
      <div className="sm:hidden px-4 py-3 shrink-0">
        <div className="flex bg-[#F3EDF7] rounded-full p-1 border border-black/5">
          <button 
             className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'PENDING' ? 'bg-[#FFB800]/20 text-[#4B2C20] shadow-sm' : 'text-[#4B2C20]/70'}`}
             onClick={() => setActiveTab('PENDING')}
          >
            Chờ xác nhận ({pendingOrders.length})
          </button>
          <button 
             className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'PREPARING' ? 'bg-[#FFB800]/20 text-[#4B2C20] shadow-sm' : 'text-[#4B2C20]/70'}`}
             onClick={() => setActiveTab('PREPARING')}
          >
            Đang làm ({preparingOrders.length})
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex sm:grid sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
          
          {/* Pending Column */}
          <div className={`h-full flex flex-col ${activeTab === 'PENDING' ? 'w-full' : 'hidden'} sm:flex`}>
             <div className="hidden sm:flex items-center gap-2 mb-4">
               <h2 className="text-xl font-bold text-[#4B2C20]">Chờ xác nhận</h2>
               <span className="bg-[#FFB800]/20 text-[#4B2C20] px-3 py-1 rounded-full text-sm font-medium border border-[#FFB800]/30">{pendingOrders.length}</span>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 scrollbar-hide">
                {pendingOrders.length === 0 ? (
                  <EmptyState />
                ) : (
                  pendingOrders.map(order => (
                    <OrderTicket
                      key={order.id}
                      order={order}
                      onAction={() => handleUpdateStatus(order.id, 'PREPARING', order.table_number)}
                      actionText="Bắt đầu pha chế"
                      isPending={true}
                      icon={<CookingPot size={20} />}
                    />
                  ))
                )}
             </div>
          </div>

          {/* Preparing Column */}
          <div className={`h-full flex flex-col ${activeTab === 'PREPARING' ? 'w-full' : 'hidden'} sm:flex`}>
             <div className="hidden sm:flex items-center gap-2 mb-4">
               <h2 className="text-xl font-bold text-[#4B2C20]">Đang làm</h2>
               <span className="bg-emerald-500/20 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/30">{preparingOrders.length}</span>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 scrollbar-hide">
                {preparingOrders.length === 0 ? (
                  <EmptyState />
                ) : (
                  preparingOrders.map(order => (
                    <OrderTicket
                      key={order.id}
                      order={order}
                      onAction={() => handleUpdateStatus(order.id, 'COMPLETED', order.table_number)}
                      actionText="Hoàn thành"
                      isPending={false}
                      icon={<Check size={20} />}
                    />
                  ))
                )}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}