import Cookies from 'js-cookie';

const API_URL = 'http://localhost:3001/products';

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const getAuthHeadersForFormData = () => {
  const token = Cookies.get('access_token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

export const productService = {
  async getAllWithRecipes() {
    const res = await fetch(`${API_URL}/all-with-recipes`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error(`Máy chủ phản hồi lỗi (Mã lỗi: ${res.status}). Vui lòng kiểm tra lại Backend.`);
    }
    const result = await res.json();
    return Array.isArray(result) ? result : (result.data || []);
  },

  async getById(id: string) {
    const res = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Không tìm thấy dữ liệu món nước này!');
    }
    const prodData = await res.json();
    return prodData.data || prodData;
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Hệ thống đang bận.');
    }
    return res.ok;
  },

  async createWithRecipe(data) {
    const response = await fetch(`${API_URL}/create-with-recipe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Lỗi xử lý hệ thống.');
    }
    return response.json();
  },

  async update(id: string, data) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Lỗi xử lý hệ thống.');
    }
    return response.json();
  },

  async uploadImage(formData) {
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Tải ảnh thất bại. Vui lòng thử lại.');
    }
    return res.json();
  },
};
