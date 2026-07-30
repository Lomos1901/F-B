// frontend/src/services/analyticsService.ts
import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/analytics`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const analyticsService = {
  /** Lấy danh sách cảnh báo bất thường. */
  async getAnomalies(unreadOnly: boolean = false) {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread', 'true');
    const res = await fetch(`${API_URL}/anomalies?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể lấy danh sách cảnh báo.');
    }
    // Nếu response không có nội dung, trả về mảng rỗng để tránh lỗi json
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return [];
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
      throw new Error(error.message || 'Không thể lấy dữ liệu chẩn đoán doanh số.');
    }
    return res.json();
  },

  async getInventoryDiagnostics() {
    const res = await fetch(`${API_URL}/inventory-diagnostics`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể lấy dữ liệu chẩn đoán kho.');
    }
    return res.json();
  },

  async runAnalysis(force: boolean = false) {
    const res = await fetch(`${API_URL}/run-analysis?force=${force}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Kích hoạt phân tích thất bại.');
    }
    return res.json();
  },

  async generateAiReport() {
    const res = await fetch(`${API_URL}/generate-ai-report`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể tạo báo cáo AI.');
    }
    return res.json();
  }
};