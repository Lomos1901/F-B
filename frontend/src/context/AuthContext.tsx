'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'BARISTA' | 'CASHIER';
  // Thêm các thuộc tính khác nếu có
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userCookie = Cookies.get('user');
      if (userCookie) {
        const userData: User = JSON.parse(userCookie);
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to parse user cookie:", error);
      // Xóa cookie bị lỗi nếu có
      Cookies.remove('user');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
