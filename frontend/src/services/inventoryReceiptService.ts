// frontend/src/services/inventoryReceiptService.ts

import Cookies from 'js-cookie';

// Đổi API URL
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/inventory-receipts`;

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
  async getAll(startDate?: string, endDate?: string, type?: string) {
    let url = API_URL;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Không thể kết nối API lấy lịch sử phiếu kho.');
    }
    return res.json();
  },
};
