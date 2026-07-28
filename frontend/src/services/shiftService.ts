import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/shifts`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const shiftService = {
  async getCurrentShift() {
    const res = await fetch(`${API_URL}/current`, { headers: getAuthHeaders() });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Lỗi khi tải thông tin ca làm việc hiện tại');
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },

  async openShift(startingCash: number) {
    const res = await fetch(`${API_URL}/open`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ starting_cash: startingCash }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi mở ca làm việc');
    }
    return res.json();
  },

  async closeShift(id: string, endingCash: number, notes?: string) {
    const res = await fetch(`${API_URL}/${id}/close`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ending_cash: endingCash, notes }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi đóng ca làm việc');
    }
    return res.json();
  },

  async getHistory(startDate?: string, endDate?: string) {
    let url = `${API_URL}/history`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Lỗi khi tải lịch sử ca làm việc');
    }
    return res.json();
  }
};
