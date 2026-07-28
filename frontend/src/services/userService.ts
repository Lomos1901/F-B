// frontend/src/services/userService.ts
import Cookies from 'js-cookie';
import { UserRole } from '../enums/user-role.enum';

const API_URL = 'http://localhost:3001/users';

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

interface UpdateUserPayload {
  fullName?: string;
  role?: UserRole;
  password?: string;
}

export const userService = {
  async getAll() {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Không thể lấy danh sách người dùng.');
    }
    return res.json();
  },

  async create(payload: CreateUserPayload) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.message && Array.isArray(data.message)) {
        throw new Error(data.message.join(', '));
      }
      throw new Error(data.message || 'Tạo người dùng thất bại.');
    }
    return data;
  },

  async update(id: string, payload: UpdateUserPayload) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Cập nhật người dùng thất bại.');
    }
    return data;
  },

  async remove(id: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Xóa người dùng thất bại.');
    }
    return data;
  },
};