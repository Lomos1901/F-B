// src/services/orderService.ts

const API_URL = 'http://localhost:3001/orders';

export const orderService = {
  async placeOrder(tableNumber: string, items: { product_id: string; quantity: number; price_at_order: number }[]) {
    const res = await fetch(`${API_URL}/create-for-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_number: tableNumber,
        items: items,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Không thể gửi đơn hàng. Vui lòng thử lại.');
    }

    return res.json();
  },
};
