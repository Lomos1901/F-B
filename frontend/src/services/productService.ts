// frontend/src/services/productService.ts

import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/products`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Service để tương tác với các API của module Product.
 * Đã được tái cấu trúc để tương thích với CSDL 3NF và các API mới.
 */
export const productService = {
  /**
   * Tái cấu trúc: Lấy tất cả sản phẩm kèm chi tiết.
   */
  async getAll() {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lỗi khi tải danh sách sản phẩm');
    return res.json();
  },

  /**
   * Tái cấu trúc: Lấy một sản phẩm bằng ID.
   */
  async getById(id: string) {
    const res = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lỗi khi tải chi tiết sản phẩm');
    return res.json();
  },

  /**
   * Tái cấu trúc: Tạo sản phẩm mới kèm theo công thức.
   */
  async create(data: any) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi tạo sản phẩm');
    }
    return res.json();
  },

  /**
   * Tái cấu trúc: Cập nhật sản phẩm và công thức.
   * Sử dụng phương thức PUT.
   */
  async update(id: string, data: any) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT', // Đổi sang PUT
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi cập nhật sản phẩm');
    }
    return res.json();
  },

  /**
   * Xóa một sản phẩm.
   */
  async remove(id: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi xóa sản phẩm');
    }
    return res.json();
  },

  /**
   * Tải ảnh sản phẩm lên.
   */
  async uploadImage(formData: FormData) {
    const token = Cookies.get('access_token');
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        // Không set 'Content-Type' ở đây, trình duyệt sẽ tự động làm
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi tải ảnh lên');
    }
    return res.json();
  },
};
