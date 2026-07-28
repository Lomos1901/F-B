import Cookies from 'js-cookie';

const API_URL = 'http://localhost:3001/payments';

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const paymentService = {
  async getPaymentMethods() {
    const res = await fetch(`${API_URL}/methods`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Lỗi khi tải danh sách phương thức thanh toán');
    }
    return res.json();
  },

  async createPayment(orderId: string, amount: number, paymentMethodCode: string) {
    const res = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        amount,
        payment_method_code: paymentMethodCode
      }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Lỗi khi tạo thanh toán');
    }
    return res.json();
  },

  async getBankInfo() {
    const res = await fetch(`${API_URL}/bank-info`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Lỗi khi tải thông tin ngân hàng');
    }
    return res.json();
  },

  async updateBankInfo(bank_bin: string, account_number: string, account_name: string) {
    const res = await fetch(`${API_URL}/bank-info`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bank_bin, account_number, account_name }),
    });
    if (!res.ok) {
      throw new Error('Lỗi khi cập nhật thông tin ngân hàng');
    }
    return res.json();
  }
};
