'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { orderService } from '@/src/services/orderService';
import { Check, CookingPot, Bell } from 'lucide-react';
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
    <div className={`bg-dark-surface rounded-lg shadow-lg border-l-4 ${color} flex flex-col`}>
      <div className="p-4 border-b border-dark-border">
        <h3 className="font-bold text-lg text-dark-text-primary">Bàn {order.table_number}</h3>
        <p className="text-xs text-dark-text-secondary">{timeAgo}</p>
      </div>
      <ul className="flex-grow p-4 space-y-2 text-sm">
        {order.order_detail.map((item, index) => (
          <li key={index} className="flex justify-between">
            <span className="text-dark-text-primary">{item.products?.name || 'Sản phẩm không xác định'}</span>
            <span className="font-bold text-dark-text-primary">x{item.quantity}</span>
          </li>
        ))}
      </ul>
      <div className="p-3 bg-dark-bg">
        <button onClick={onAction} className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md font-bold text-sm text-white ${buttonColor} transition-transform transform hover:scale-105`}>
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
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // SỬA LẠI: Thêm tableNumber vào hàm và nội dung thông báo
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

  if (error && pendingOrders.length === 0 && preparingOrders.length === 0) {
    return <div className="p-8 text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-dark-border">
        <h1 className="text-2xl font-bold text-dark-text-primary">Màn hình Pha chế</h1>
      </header>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
        {/* Cột Chờ xác nhận */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Chờ xác nhận ({pendingOrders.length})</h2>
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <OrderTicket
                key={order.id}
                order={order}
                // SỬA LẠI: Truyền thêm order.table_number
                onAction={() => handleUpdateStatus(order.id, 'PREPARING', order.table_number)}
                actionText="Bắt đầu làm"
                color="border-yellow-500"
                buttonColor="bg-yellow-500 hover:bg-yellow-600"
                icon={<CookingPot size={16} />}
              />
            ))}
          </div>
        </div>
        {/* Cột Đang làm */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Đang làm ({preparingOrders.length})</h2>
          <div className="space-y-4">
            {preparingOrders.map(order => (
              <OrderTicket
                key={order.id}
                order={order}
                // SỬA LẠI: Truyền thêm order.table_number
                onAction={() => handleUpdateStatus(order.id, 'COMPLETED', order.table_number)}
                actionText="Hoàn thành"
                color="border-blue-500"
                buttonColor="bg-blue-500 hover:bg-blue-600"
                icon={<Check size={16} />}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}