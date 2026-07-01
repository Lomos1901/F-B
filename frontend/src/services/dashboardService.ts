// frontend/src/services/dashboardService.ts
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:3001/dashboard';

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const dashboardService = {
  async getData(days: number = 7) {
    const res = await fetch(`${API_URL}?days=${days}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể lấy dữ liệu dashboard.');
    }
    return res.json();
  },
};