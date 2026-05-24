// Định nghĩa sẵn tên miền Backend để sau này đổi domain không phải đi tìm sửa từng file
const BASE_URL = "http://localhost:3001/products";

export const productService = {
  // 1. Hàm lấy danh sách thực đơn
  async getAll() {
    const res = await fetch(`${BASE_URL}/all-with-recipes`);
    if (!res.ok) throw new Error(`Lỗi máy chủ: ${res.status}`);
    const data = await res.json();
    // Đảm bảo luôn trả về mảng
    return Array.isArray(data) ? data : data.data || [];
  },

  // 2. Hàm lấy chi tiết 1 món (Dùng cho trang Edit)
  async getById(id: string) {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error("Không tìm thấy dữ liệu");
    const data = await res.json();
    return data.data || data;
  },

  // 3. Hàm xóa món nước
  async delete(id: string) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi khi xóa");
    }
    return res.json();
  },
};
