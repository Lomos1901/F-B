// frontend/src/services/inventoryReceiptService.ts

import Cookies from 'js-cookie';

// Đổi API URL
const API_URL = 'http://localhost:3001/inventory-receipts';

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const inventoryReceiptService = {
  /**
   * Lấy tất cả các phiếu kho và chi tiết của chúng.
   */
  async getAll() {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Không thể kết nối API lấy lịch sử phiếu kho.');
    }
    return res.json();
  },
};
