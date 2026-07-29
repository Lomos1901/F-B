import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/tables`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export interface TableInfo {
  id: string;
  name: string;
  zone: string;
  status: 'AVAILABLE' | 'PENDING' | 'OCCUPIED';
  activeOrdersCount: number;
  totalAmount: number;
  earliestOrderTime: number | null;
}

export const tableService = {
  async getTableStatus(): Promise<TableInfo[]> {
    const res = await fetch(`${API_URL}/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Lỗi khi tải trạng thái bàn');
    }
    return res.json();
  }
};
