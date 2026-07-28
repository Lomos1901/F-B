'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'BARISTA' | 'CASHIER';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

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
    try {
      const userCookie = Cookies.get('user');
      const tokenCookie = Cookies.get('access_token');
      if (userCookie && tokenCookie) {
        const userData: User = JSON.parse(userCookie);
        setUser(userData);
      } else {
        // Nếu thiếu 1 trong 2, coi như chưa đăng nhập
        Cookies.remove('user');
        Cookies.remove('access_token');
      }
    } catch (e) {
      console.error("Failed to parse user cookie:", e);
      Cookies.remove('user');
      Cookies.remove('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      const userData: User = data.user;

      setUser(userData);
      Cookies.set('user', JSON.stringify(userData), { expires: 7 });
      Cookies.set('access_token', data.access_token, { expires: 7 });

      // Thông báo đăng nhập thành công
      toast.success(`Chào mừng trở lại, ${userData.full_name}!`);

      if (userData.role === 'BARISTA') {
        router.push('/kds');
      } else if (userData.role === 'CASHIER') {
        router.push('/pos');
      } else {
        router.push('/dashboard');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Đã xảy ra lỗi không xác định.';
      setError(errorMessage);
      toast.error(errorMessage); // Thông báo lỗi
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('user');
    Cookies.remove('access_token');
    toast.info("Bạn đã đăng xuất."); // Thông báo đăng xuất
    router.push('/login');
  };

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