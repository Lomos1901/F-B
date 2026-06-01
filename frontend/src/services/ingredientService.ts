// src/services/ingredientService.ts

const API_URL = 'http://localhost:3001/ingredients';

const getToken = () => {
  if (typeof window !== 'undefined') {
    const Cookies = require('js-cookie');
    return Cookies.get('access_token');
  }
  return null;
};

export const ingredientService = {
  async getAll() {
    const token = getToken();
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch ingredients');
    return res.json();
  },

  async getArchived() {
    const token = getToken();
    const res = await fetch(`${API_URL}/archived`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch archived ingredients');
    return res.json();
  },

  async create(data) {
    const token = getToken();
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create ingredient');
    }
    return res.json();
  },

  async update(id, data) {
    const token = getToken();
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update ingredient');
    }
    return res.json();
  },

  async delete(id) {
    const token = getToken();
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete ingredient');
    }
    return res.json();
  },

  async restore(id) {
    const token = getToken();
    const res = await fetch(`${API_URL}/restore/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to restore ingredient');
    }
    return res.json();
  },

  async hardDelete(id) {
    const token = getToken();
    const res = await fetch(`${API_URL}/hard-delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to permanently delete ingredient');
    }
    return res.json();
  },

  async importStock(id, amount, note) {
    const token = getToken();
    const res = await fetch(`${API_URL}/import-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ingredient_id: id, quantity_change: amount, reason: note }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to import stock');
    }
    return res.json();
  },

  async stocktake(id, amount, note) {
    const token = getToken();
    const res = await fetch(`${API_URL}/stock-take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ingredient_id: id, new_quantity: amount, reason: note }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update stock');
    }
    return res.json();
  },

  async checkUsage(id) {
    const token = getToken();
    const res = await fetch(`${API_URL}/check-usage/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        throw new Error('Failed to check ingredient usage');
    }
    return res.json();
  },
};
