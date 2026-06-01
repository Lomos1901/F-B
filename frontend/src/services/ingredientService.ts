import Cookies from 'js-cookie';

const API_URL = 'http://localhost:3001/ingredients';

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  if (!token) {
    // Có thể xử lý chuyển hướng về trang login ở đây nếu cần
    console.error("Access token not found.");
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const ingredientService = {
  async getAll() {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch ingredients');
    return res.json();
  },

  async getArchived() {
    const res = await fetch(`${API_URL}/archived`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch archived ingredients');
    return res.json();
  },

  async create(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create ingredient');
    }
    return res.json();
  },

  async update(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update ingredient');
    }
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete ingredient');
    }
    return res.json();
  },

  async restore(id) {
    const res = await fetch(`${API_URL}/${id}/restore`, {
      method: 'PATCH', // Sửa từ POST thành PATCH cho đúng với controller
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to restore ingredient');
    }
    return res.json();
  },

  async hardDelete(id) {
    const res = await fetch(`${API_URL}/${id}/hard`, { // Sửa đường dẫn
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to permanently delete ingredient');
    }
    return res.json();
  },

  async importStock(id, amount, note) {
    const res = await fetch(`${API_URL}/${id}/import`, { // Sửa đường dẫn
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, note }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to import stock');
    }
    return res.json();
  },

  async stocktake(id, amount, note) {
    const res = await fetch(`${API_URL}/${id}/stocktake`, { // Sửa đường dẫn
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ actual_quantity: amount, note }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update stock');
    }
    return res.json();
  },

  async checkUsage(id: string) {
    // SỬA LẠI ĐƯỜNG DẪN CHO ĐÚNG
    const res = await fetch(`${API_URL}/${id}/check-usage`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Failed to check ingredient usage');
    }
    return res.json();
  },
};
