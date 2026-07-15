// frontend/src/services/analyticsService.ts
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:3001/analytics';

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const analyticsService = {
  async getAnomalies() {
    const res = await fetch(`${API_URL}/anomalies`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể lấy danh sách cảnh báo.');
    }
    return res.json();
  },

  async markAsRead(id: string) {
    const res = await fetch(`${API_URL}/anomalies/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể đánh dấu đã đọc.');
    }
    return res.json();
  },

  async getTodayDiagnostics() {
    const res = await fetch(`${API_URL}/today-diagnostics`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể lấy dữ liệu chẩn đoán.');
    }
    return res.json();
  },

  async runAnalysis() {
    const res = await fetch(`${API_URL}/run-analysis`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Kích hoạt phân tích thất bại.');
    }
    return res.json();
  }
};