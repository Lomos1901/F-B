'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const API_URL = 'http://localhost:3001/orders';

// ... (Các hàm fetch không đổi)
const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

async function fetchCompletedOrders() {
  const res = await fetch(`${API_URL}/completed`, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error('Lỗi khi tải danh sách hóa đơn.');
  }
  return res.json();
}

async function updateOrderStatus(id, status) {
  const res = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật trạng thái.');
  return res.json();
}


export default function POSPage() {
  const [allOrders, setAllOrders] = useState([]); // State để giữ danh sách gốc
  const [searchTerm, setSearchTerm] = useState(''); // State cho ô tìm kiếm
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    if (!loading) setLoading(true); // Chỉ set loading nếu không phải lần đầu
    setError('');
    try {
      const fetchedOrders = await fetchCompletedOrders();
      setAllOrders(fetchedOrders);
    } catch (err) {
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

  const handlePayment = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await updateOrderStatus(selectedOrder.id, 'PAID');
      alert(`Đã xác nhận thanh toán thành công cho bàn ${selectedOrder.table_number}!`);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách đơn hàng dựa trên searchTerm
  const filteredOrders = allOrders.filter(order =>
    order.table_number.toString().includes(searchTerm)
  );

  return (
    <main className="min-h-screen bg-zinc-900 p-4 sm:p-6 md:p-8 font-sans text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-amber-500">Màn hình Thu ngân (POS)</h1>
          {/* Thêm lại ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm số bàn..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {loading && allOrders.length === 0 && <p className="text-center text-gray-400">Đang tải danh sách hóa đơn...</p>}
        {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg text-center mb-6">{error}</p>}

        {!loading && filteredOrders.length === 0 && !error && (
          <div className="text-center text-gray-500 bg-zinc-800 p-10 rounded-lg">
            <p className="text-2xl mb-2">🤷</p>
            <p>{searchTerm ? `Không tìm thấy hóa đơn cho bàn "${searchTerm}".` : "Không có hóa đơn nào đang chờ thanh toán."}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 cursor-pointer hover:border-amber-500 hover:bg-zinc-700 transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-amber-400">Bàn {order.table_number}</span>
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Đã xong</span>
              </div>
              <p className="text-2xl font-semibold mt-2">{order.total_price.toLocaleString('vi-VN')} đ</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(order.created_at), 'HH:mm', { locale: vi })}
              </p>
            </div>
          ))}
        </div>

        {/* Modal Chi tiết Hóa đơn */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
            <div className="bg-zinc-800 rounded-lg shadow-lg p-6 border border-zinc-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-amber-400 mb-4">Chi tiết Hóa đơn - Bàn {selectedOrder.table_number}</h2>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {selectedOrder.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-zinc-700 pb-2">
                    <div>
                      <p className="text-lg">{item.products.name}</p>
                      <p className="text-sm text-gray-400">
                        {item.quantity} x {(item.unit_price || 0).toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                    <p className="font-semibold text-lg">
                      {(item.quantity * (item.unit_price || 0)).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t-2 border-amber-500 pt-4">
                <span className="text-xl font-bold">TỔNG CỘNG</span>
                <span className="text-3xl font-extrabold text-amber-400">
                  {selectedOrder.total_price.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="mt-8 w-full bg-green-600 py-4 rounded-lg text-xl font-bold hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'XÁC NHẬN THANH TOÁN'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
