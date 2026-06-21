// src/services/authService.ts

const API_URL = 'http://localhost:3001/auth';

/**
 * Service để tương tác với các API của module Auth.
 */
export const authService = {
  /**
   * Gọi API đăng nhập.
   * @returns {Promise<{access_token: string, user: object}>} Dữ liệu trả về từ backend.
   */
  // SỬA LẠI: Thêm kiểu dữ liệu cho các tham số
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.message && Array.isArray(data.message)) {
        throw new Error(data.message.join(', '));
      }
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    if (!data.access_token || !data.user) {
      throw new Error('Phản hồi từ server không hợp lệ.');
    }

    return data;
  },

  /**
   * Gọi API đăng ký.
   */
  // SỬA LẠI: Thêm kiểu dữ liệu cho các tham số
  async register(email: string, password: string, fullName: string) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.message && Array.isArray(data.message)) {
        throw new Error(data.message.join(', '));
      }
      throw new Error(data.message || 'Đăng ký thất bại');
    }

    return data;
  },
};
