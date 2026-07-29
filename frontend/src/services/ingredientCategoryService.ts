// frontend/src/services/ingredientCategoryService.ts

import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/ingredient-categories`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const ingredientCategoryService = {
  async getAll() {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lỗi khi tải danh mục nguyên liệu');
    return res.json();
  },

  async create(name: string) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi tạo danh mục');
    }
    return res.json();
  },

  async update(id: string, name: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi cập nhật danh mục');
    }
    return res.json();
  },

  async remove(id: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi xóa danh mục');
    }
    return res.json();
  },
};
