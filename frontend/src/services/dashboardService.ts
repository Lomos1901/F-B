// frontend/src/services/dashboardService.ts
import Cookies from 'js-cookie';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const dashboardService = {
  async getData(days: number = 7) {
    const res = await fetch(`${API_BASE_URL}/dashboard?days=${days}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể lấy dữ liệu dashboard.');
    }
    return res.json();
  },

  /**
   * Lấy 5 cảnh báo CHƯA ĐỌC mới nhất để hiển thị trên dashboard.
   */
  async getLatestAnomalies() {
    // Thêm tham số unread=true vào API call
    const res = await fetch(`${API_BASE_URL}/analytics/anomalies?limit=5&unread=true`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json();
      console.error("Lỗi khi lấy cảnh báo:", error.message);
      return [];
    }
    return res.json();
  }
};