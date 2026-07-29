// frontend/src/services/ingredientService.ts

import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/ingredients`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  if (!token) {
    console.error("Access token not found.");
    // Trong ứng dụng thực tế, có thể chuyển hướng về trang login
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Service để tương tác với các API của module Ingredient.
 * Đã được tái cấu trúc để tương thích với CSDL 3NF.
 */
export const ingredientService = {
  async getAll() {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lỗi khi tải danh sách nguyên liệu');
    return res.json();
  },

  async getById(id: string) {
    const res = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lỗi khi tải thông tin nguyên liệu');
    return res.json();
  },

  async getArchived() {
    const res = await fetch(`${API_URL}/archived`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lỗi khi tải danh sách nguyên liệu đã lưu trữ');
    return res.json();
  },

  async create(data: any) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi tạo nguyên liệu');
    }
    return res.json();
  },

  async update(id: string, data: any) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi cập nhật nguyên liệu');
    }
    return res.json();
  },

  async softDelete(id: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi ẩn nguyên liệu');
    }
    return res.json();
  },

  async hardDelete(id: string) {
    const res = await fetch(`${API_URL}/${id}/hard`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Lỗi khi xóa vĩnh viễn nguyên liệu');
    }
    return res.json();
  },

  async restore(id: string) {
    const res = await fetch(`${API_URL}/${id}/restore`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi khôi phục nguyên liệu');
    }
    return res.json();
  },

  /**
   * Tái cấu trúc: Gửi payload cho nghiệp vụ nhập hàng.
   */
  async importStock(id: string, payload: { amount: number; note?: string; performed_by: string }) {
    const res = await fetch(`${API_URL}/${id}/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi nhập kho');
    }
    return res.json();
  },

  /**
   * Tái cấu trúc: Gửi payload cho nghiệp vụ kiểm kho.
   */
  async stocktake(id: string, payload: { actual_quantity: number; note: string; performed_by: string }) {
    const res = await fetch(`${API_URL}/${id}/stocktake`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi cập nhật kiểm kho');
    }
    return res.json();
  },

  async checkUsage(id: string) {
    const res = await fetch(`${API_URL}/${id}/check-usage`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Lỗi khi kiểm tra phụ thuộc của nguyên liệu');
    }
    return res.json();
  },
};
