// src/services/categoryService.ts
import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/categories`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Service để tương tác với các API của module Category (Danh mục Thực đơn).
 * Đã được sửa lại để có đầy đủ các hàm CRUD.
 */
export const categoryService = {
  async getAll() {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lỗi khi tải danh mục thực đơn');
    return res.json();
  },

  async create(data: { name: string; description?: string }) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi tạo danh mục');
    }
    return res.json();
  },

  async update(id: string, data: { name: string; description?: string }) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
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
