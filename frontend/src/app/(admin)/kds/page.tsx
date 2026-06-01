'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Cookies from 'js-cookie'; // 1. Import Cookies

const API_URL = 'http://localhost:3001/orders';

// 2. Tạo hàm tiện ích lấy header xác thực
const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// 3. Cập nhật các hàm fetch để sử dụng header
async function fetchOrdersByStatus(status) {
  const res = await fetch(`${API_URL}/status/${status}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch ${status} orders`);
  return res.json();
}

async function updateOrderStatus(id, status) {
  const res = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}


export default function KDSPage() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [error, setError] = useState(null);

  const loadOrders = async () => {
    try {
      setError(null); // Xóa lỗi cũ trước khi tải lại
      const [pending, preparing] = await Promise.all([
        fetchOrdersByStatus('PENDING'),
        fetchOrdersByStatus('PREPARING'),
      ]);
      setPendingOrders(pending);
      setPreparingOrders(preparing);
    } catch (err) {
      console.error("KDS Error:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      loadOrders();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Sửa lại giao diện cho dễ đọc trên nền tối
  const OrderTicket = ({ order, actionText, onAction, color, buttonColor }) => (
    <div className={`bg-zinc-800 rounded-lg shadow-lg p-4 border-l-4 ${color} flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-amber-400">Bàn {order.table_number}</h3>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: vi })}
          </span>
        </div>
        <ul className="space-y-2 border-t border-zinc-700 pt-3 mt-3">
          {order.order_items.map((item, index) => (
            <li key={index} className="flex justify-between items-center text-gray-300">
              <span>{item.products.name}</span>
              <span className="font-bold text-lg">x{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={onAction}
        className={`mt-4 w-full ${buttonColor} text-white py-2.5 rounded-lg font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md`}
      >
        {actionText}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-900 p-4 sm:p-6 md:p-8 font-sans text-white">
      <h1 className="text-3xl font-bold text-center text-amber-500 mb-8">Màn hình Pha chế (KDS)</h1>
      {error && <p className="text-red-500 text-center bg-red-900/50 p-3 rounded-lg">Lỗi tải dữ liệu: {error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* Cột Chờ làm */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-4 text-blue-400">Chờ làm ({pendingOrders.length})</h2>
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <OrderTicket
                key={order.id}
                order={order}
                actionText="Bắt đầu làm"
                onAction={() => handleUpdateStatus(order.id, 'PREPARING')}
                color="border-blue-500"
                buttonColor="bg-blue-600"
              />
            ))}
          </div>
        </div>

        {/* Cột Đang làm */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">Đang làm ({preparingOrders.length})</h2>
          <div className="space-y-4">
            {preparingOrders.map(order => (
              <OrderTicket
                key={order.id}
                order={order}
                actionText="Đã xong"
                onAction={() => handleUpdateStatus(order.id, 'COMPLETED')}
                color="border-yellow-500"
                buttonColor="bg-yellow-600"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
