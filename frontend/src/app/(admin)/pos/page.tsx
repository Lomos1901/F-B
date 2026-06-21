'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { orderService } from '@/src/services/orderService';
import { X, Printer, CheckCircle } from 'lucide-react';

// --- Định nghĩa Interface ---
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

const OrderStatusBadge = ({ status }: { status: string }) => {
  const statusMap = {
    PENDING: { text: 'Chờ xác nhận', color: 'bg-yellow-500/20 text-yellow-400' },
    PREPARING: { text: 'Đang làm', color: 'bg-blue-500/20 text-blue-400' },
    COMPLETED: { text: 'Hoàn thành', color: 'bg-green-500/20 text-green-400' },
    PAID: { text: 'Đã thanh toán', color: 'bg-gray-500/20 text-gray-400' },
  };
  const { text, color } = statusMap[status] || { text: status, color: 'bg-gray-600' };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
};

const BillModal = ({ order, onClose, onConfirmPayment }: { order: Order, onClose: () => void, onConfirmPayment: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-sm flex flex-col">
        <header className="p-4 border-b border-dark-border flex justify-between items-center">
          <h2 className="font-bold text-lg">Hóa đơn Bàn {order.table_number}</h2>
          <button onClick={onClose} className="text-dark-text-secondary hover:text-white"><X size={20} /></button>
        </header>
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="text-center mb-6">
            <h3 className="font-bold text-xl">SẪM COFFEE</h3>
            <p className="text-sm text-dark-text-secondary">Ngày: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <ul className="divide-y divide-dark-border">
            {order.order_detail.map((item, index) => (
              <li key={index} className="py-2 flex justify-between text-sm">
                <span className="text-dark-text-primary">{item.products?.name} (x{item.quantity})</span>
                <span className="text-dark-text-secondary">{(item.products?.price! * item.quantity).toLocaleString('vi-VN')}đ</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-4 border-t-2 border-dashed border-dark-border">
            <div className="flex justify-between font-bold text-lg">
              <span>TỔNG CỘNG</span>
              <span>{order.total_price.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>
        <footer className="p-4 bg-dark-bg grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3 px-4 bg-dark-border text-dark-text-secondary rounded-md hover:bg-gray-600 font-semibold"><Printer size={16}/> In Bill</button>
          <button onClick={onConfirmPayment} className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-500 font-bold"><CheckCircle size={16}/> Xác nhận Thanh toán</button>
        </footer>
      </div>
    </div>
  );
};

export default function POSPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>('');

  const loadOrders = async () => {
    try {
      const [pending, preparing, completed] = await Promise.all([
        orderService.getOrdersByStatus('PENDING'),
        orderService.getOrdersByStatus('PREPARING'),
        orderService.getOrdersByStatus('COMPLETED'),
      ]);
      setAllOrders([...pending, ...preparing, ...completed]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    try {
      await orderService.updateStatus(selectedOrder.id, 'PAID');
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(`Lỗi khi xác nhận thanh toán: ${err.message}`);
    }
  };

  const filteredOrders = allOrders.filter(order => order.table_number.includes(searchTerm));

  if (loading) return <div className="p-8 text-dark-text-secondary">Đang tải dữ liệu bàn...</div>;
  if (error) return <div className="p-8 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-dark-text-primary">Thu ngân (POS)</h1>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Tìm số bàn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xs p-2 bg-dark-surface border border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber"
          />
        </div>
      </header>
      <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredOrders.map(order => (
          <button
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="bg-dark-surface border border-dark-border rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-brand-amber transition-all"
          >
            <span className="text-2xl font-bold text-dark-text-primary">Bàn {order.table_number}</span>
            <span className="text-sm text-dark-text-secondary mt-1">{order.total_price.toLocaleString('vi-VN')}đ</span>
            <div className="mt-2">
              <OrderStatusBadge status={order.order_status?.status_name || 'UNKNOWN'} />
            </div>
          </button>
        ))}
      </div>
      {selectedOrder && <BillModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onConfirmPayment={handleConfirmPayment} />}
    </div>
  );
}
