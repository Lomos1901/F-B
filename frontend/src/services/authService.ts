// src/services/authService.ts
import Cookies from 'js-cookie';

export const login = async (email, password) => {
  const res = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Xử lý lỗi chi tiết từ NestJS
    if (data.message && Array.isArray(data.message)) {
      throw new Error(data.message.join(', '));
    }
    throw new Error(data.message || 'Đăng nhập thất bại');
  }

  // Chỗ này cần sửa lại để lấy đúng token tùy chỉnh
  const accessToken = data.access_token;
  const user = data.user;

  if (!accessToken || !user) {
    throw new Error('Đăng nhập thành công nhưng không nhận được thông tin xác thực.');
  }

  Cookies.set('access_token', accessToken, { expires: 1 });
  Cookies.set('user', JSON.stringify(user), { expires: 1 });

  return user;
};

export const register = async (email, password, fullName) => {
  const res = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Xử lý lỗi chi tiết từ NestJS ValidationPipe
    // data.message lúc này sẽ là một mảng các chuỗi lỗi
    if (data.message && Array.isArray(data.message)) {
      throw new Error(data.message.join(', '));
    }
    throw new Error(data.message || 'Đăng ký thất bại');
  }

  return data;
};
