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
  is_active?: boolean;
  status?: 'AVAILABLE' | 'PENDING' | 'OCCUPIED';
  activeOrdersCount?: number;
  totalAmount?: number;
  earliestOrderTime?: number | null;
}

export const tableService = {
  async getTables(): Promise<TableInfo[]> {
    const res = await fetch(`${API_URL}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Lỗi khi tải danh sách bàn');
    return res.json();
  },

  async getTableStatus(): Promise<TableInfo[]> {
    const res = await fetch(`${API_URL}/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Lỗi khi tải trạng thái bàn');
    return res.json();
  },

  async createTable(data: { name: string; zone: string; is_active?: boolean }): Promise<TableInfo> {
    const res = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Lỗi khi thêm bàn');
    return res.json();
  },

  async updateTable(id: string, data: { name?: string; zone?: string; is_active?: boolean }): Promise<TableInfo> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Lỗi khi cập nhật bàn');
    return res.json();
  },

  async deleteTable(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Lỗi khi xóa bàn');
  }
};
