import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/chat`;

const getAuthHeaders = () => {
  const token = Cookies.get('access_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export const chatService = {
  async sendMessage(message: string, history: ChatMessage[]): Promise<{ reply: string }> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi kết nối với trợ lý AI');
    }
    return res.json();
  },
};
