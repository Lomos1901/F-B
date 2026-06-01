// src/services/inventoryLogService.ts

const API_URL = 'http://localhost:3001/inventory-log';

export const inventoryLogService = {
  async getAllWithIngredients() {
    const res = await fetch(`${API_URL}/all-with-ingredients`);
    if (!res.ok) {
      throw new Error('Không thể kết nối API lấy lịch sử kho.');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  },
};
