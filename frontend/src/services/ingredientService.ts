import Cookies from "js-cookie";

const BASE_URL = "http://localhost:3001/ingredients";

// Hàm hỗ trợ lấy headers kèm Token cho lẹ, đỡ phải viết đi viết lại
const getHeaders = () => {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const ingredientService = {
  // 1. Lấy danh sách nguyên liệu đang dùng
  getAll: async () => {
    const res = await fetch(BASE_URL, { headers: getHeaders() });
    if (!res.ok) throw new Error("Không thể kết nối đến server");
    return res.json();
  },

  // 2. Lấy danh sách nguyên liệu lưu trữ (Archived)
  getArchived: async () => {
    const res = await fetch(`${BASE_URL}/archived`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi tải kho lưu trữ");
    return res.json();
  },

  // 3. Kiểm tra ràng buộc trước khi xóa
  checkUsage: async (id: string) => {
    const res = await fetch(`${BASE_URL}/${id}/check-usage`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Lỗi kiểm tra ràng buộc");
    return res.json();
  },

  // 4. Thêm nguyên liệu mới
  create: async (data: unknown) => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi tạo nguyên liệu");
    }
    return res.json();
  },

  // 5. Cập nhật thông tin nguyên liệu
  update: async (id: string, data: unknown) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi cập nhật");
    }
    return res.json();
  },

  // 6. Nhập kho
  importStock: async (id: string, amount: number, note: string) => {
    const res = await fetch(`${BASE_URL}/${id}/import`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ amount, note }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi nhập kho");
    }
    return res.json();
  },

  // 7. Kiểm kê kho
  stocktake: async (id: string, actual_quantity: number, note: string) => {
    const res = await fetch(`${BASE_URL}/${id}/stocktake`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ actual_quantity, note }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi kiểm kho");
    }
    return res.json();
  },

  // 8. Ngưng sử dụng (Xóa mềm)
  delete: async (id: string) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi khi xóa nguyên liệu");
    }
    return res.json();
  },

  // 9. Khôi phục nguyên liệu
  restore: async (id: string) => {
    const res = await fetch(`${BASE_URL}/${id}/restore`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi khôi phục");
    }
    return res.json();
  },

  // 10. Xóa vĩnh viễn (Hard Delete)
  hardDelete: async (id: string) => {
    const res = await fetch(`${BASE_URL}/${id}/hard`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi xóa vĩnh viễn");
    }
    return res.json();
  },
};
