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
    throw new Error(data.message || 'Đăng nhập thất bại');
  }

  const activeToken = data.token || data.access_token || data.data?.token || data.data?.access_token;
  const activeUser = data.user || data.data?.user || data.data || { full_name: "Nhân viên", role: "staff" };

  if (!activeToken) {
    throw new Error('Đăng nhập thành công nhưng hệ thống không tìm thấy mã Token xác thực!');
  }

  Cookies.set('access_token', activeToken, { expires: 1 });
  Cookies.set('user', JSON.stringify(activeUser), { expires: 1 });

  return activeUser;
};

export const register = async (email, password, fullName) => {
  const res = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Đăng ký thất bại');
  }

  return data;
};
