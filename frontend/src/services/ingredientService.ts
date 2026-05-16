import Cookies from "js-cookie";

const BASE_URL = "http://localhost:3001/ingredients";

export const ingredientService = {
  getAll: async () => {
    try {
      const token = Cookies.get("token");

      const res = await fetch(BASE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Đưa token vào header
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Không thể kết nối đến server");

      const result = await res.json();
      console.log("👉 Dữ liệu kho nhận được từ Backend:", result); // Thêm dòng này để xem ở F12 Console

      // Khắc phục lỗi cấu trúc: Nếu Backend trả về dạng mảng thẳng
      if (Array.isArray(result)) {
        return result;
      }

      // Nếu Backend trả về dạng bọc object status
      if (result && result.status === "Thành công") {
        return result.data;
      }

      // Nếu Backend trả về dạng bọc data thẳng
      if (result && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error("Lỗi lấy dữ liệu tại Service Frontend:", error);
      return [];
    }
  },
};
