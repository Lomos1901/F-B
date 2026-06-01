// src/services/categoryService.ts

const API_URL = 'http://localhost:3001/categories';

export const categoryService = {
  async getAll() {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  },

  async create(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Lỗi xử lý.');
    }
    return result;
  },

  async delete(id: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Lỗi xóa.');
    }
  },
};
