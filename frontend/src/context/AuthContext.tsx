'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService'; // Import authService

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'BARISTA' | 'CASHIER';
}

// Mở rộng Context để chứa các hàm và trạng thái mới
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Cung cấp giá trị mặc định cho các hàm
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Logic kiểm tra cookie khi tải trang không đổi
    try {
      const userCookie = Cookies.get('user');
      if (userCookie) {
        const userData: User = JSON.parse(userCookie);
        setUser(userData);
      }
    } catch (e) {
      console.error("Failed to parse user cookie:", e);
      Cookies.remove('user');
      Cookies.remove('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  // ĐỊNH NGHĨA HÀM LOGIN
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      const userData: User = data.user;

      // Lưu thông tin vào state và cookie
      setUser(userData);
      Cookies.set('user', JSON.stringify(userData), { expires: 7 });
      Cookies.set('access_token', data.access_token, { expires: 7 });

      // Chuyển hướng sau khi đăng nhập thành công
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  // ĐỊNH NGHĨA HÀM LOGOUT
  const logout = () => {
    setUser(null);
    Cookies.remove('user');
    Cookies.remove('access_token');
    router.push('/login');
  };

  // Cung cấp đầy đủ các giá trị cho context
  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
