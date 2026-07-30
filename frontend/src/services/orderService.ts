// frontend/src/services/orderService.ts

import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/orders`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Service để tương tác với các API của module Order.
 * Đã được tái cấu trúc để tương thích với CSDL 3NF.
 */
export const orderService = {
  /**
   * API cho khách hàng tạo đơn hàng.
   */
  async createForCustomer(tableNumber: string, items: any[], note?: string) {
    const res = await fetch(`${API_URL}/create-for-customer`, {
      method: 'POST',
      // API này là public, không cần Auth Header
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: tableNumber, items, note }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi tạo đơn hàng');
    }
    return res.json();
  },

  /**
   * Tái cấu trúc: Lấy danh sách đơn hàng theo TÊN trạng thái.
   * Dùng cho KDS và POS.
   * @param statusName Tên trạng thái, ví dụ: 'PENDING', 'COMPLETED'
   */
  async getOrdersByStatus(statusName: string) {
    const res = await fetch(`${API_URL}/status/${statusName}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error(`Lỗi khi tải danh sách đơn hàng '${statusName}'`);
    }
    return res.json();
  },

  async getDailyReceipts(date?: string) {
    const url = date ? `${API_URL}/receipts/daily?date=${date}` : `${API_URL}/receipts/daily`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Lỗi khi tải danh sách hóa đơn trong ngày');
    }
    return res.json();
  },

  /**
   * Tái cấu trúc: Lấy đơn hàng đang mở của một bàn.
   * Dùng cho POS cũ (hiện không dùng nhưng vẫn giữ lại).
   */
  async getOpenOrderByTable(tableNumber: string) {
    const res = await fetch(`${API_URL}/table/${tableNumber}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Lỗi khi tìm đơn hàng của bàn.');
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },

  /**
   * Tái cấu trúc: Cập nhật trạng thái của một đơn hàng.
   * @param id ID của đơn hàng
   * @param statusName Tên trạng thái mới, ví dụ: 'PAID', 'COMPLETED'
   */
  async updateStatus(id: string, statusName: string) {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: statusName }), // Backend DTO vẫn nhận 'status' là một string
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi cập nhật trạng thái đơn hàng');
    }
    return res.json();
  },
};
