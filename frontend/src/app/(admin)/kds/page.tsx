'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { orderService } from '@/src/services/orderService';
import { Check, CookingPot, Loader2 } from 'lucide-react';
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

const OrderTicket = ({ order, onAction, actionText, color, buttonColor, icon }: { order: Order, onAction: () => void, actionText: string, color: string, buttonColor: string, icon: React.ReactNode }) => {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: vi });

  return (
    <div className={`bg-white rounded-xl shadow-lg border-l-8 ${color} flex flex-col transition-all duration-300 hover:shadow-2xl`}>
      <div className="p-5 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-2xl text-slate-800">Bàn {order.table_number}</h3>
          <p className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{timeAgo}</p>
        </div>
      </div>
      <ul className="flex-grow p-5 space-y-3 text-base">
        {order.order_detail.map((item, index) => (
          <li key={index} className="flex justify-between items-center">
            <span className="text-slate-700">{item.products?.name || 'Sản phẩm không xác định'}</span>
            <span className="font-bold text-slate-900 bg-slate-100 rounded-md px-3 py-1">x{item.quantity}</span>
          </li>
        ))}
      </ul>
      <div className="p-4 bg-slate-50/70 rounded-b-xl">
        <button onClick={onAction} className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-white ${buttonColor} transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2`}>
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
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

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
    return <div className="flex justify-center items-center h-screen bg-slate-100"><Loader2 size={48} className="animate-spin text-brand-amber" /></div>;
  }

  if (error && pendingOrders.length === 0 && preparingOrders.length === 0) {
    return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">Lỗi tải dữ liệu: {error}</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans">
      <header className="p-4 border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-800">Màn hình Pha chế (KDS)</h1>
      </header>
      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* SỬA LỖI GIAO DIỆN: Bỏ màu nền cột, dùng nền trắng */}
        <div className="bg-white rounded-xl p-4 flex flex-col shadow-md border border-slate-200">
          <h2 className="text-xl font-bold text-yellow-800 mb-4 px-2">Chờ xác nhận ({pendingOrders.length})</h2>
          <div className="flex-grow overflow-y-auto space-y-5 pr-2">
            {pendingOrders.map(order => (
              <OrderTicket
                key={order.id}
                order={order}
                onAction={() => handleUpdateStatus(order.id, 'PREPARING', order.table_number)}
                actionText="Bắt đầu làm"
                color="border-yellow-400"
                buttonColor="bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500"
                icon={<CookingPot size={18} />}
              />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 flex flex-col shadow-md border border-slate-200">
          <h2 className="text-xl font-bold text-blue-800 mb-4 px-2">Đang làm ({preparingOrders.length})</h2>
          <div className="flex-grow overflow-y-auto space-y-5 pr-2">
            {preparingOrders.map(order => (
              <OrderTicket
                key={order.id}
                order={order}
                onAction={() => handleUpdateStatus(order.id, 'COMPLETED', order.table_number)}
                actionText="Hoàn thành"
                color="border-blue-400"
                buttonColor="bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
                icon={<Check size={18} />}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}