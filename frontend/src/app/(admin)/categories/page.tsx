'use client';

import { useState, useEffect, useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. SỬA LỖI GẠCH ĐỎ: Bọc hàm bằng useCallback để React ghi nhớ hàm này
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Không thể load danh mục:', error);
    }
  }, []); // <-- Khởi tạo 1 lần

  // Lúc này đưa fetchCategories vào mảng phụ thuộc, cảnh báo đỏ sẽ biến mất hoàn toàn
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Xử lý tạo danh mục mới
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('http://localhost:3001/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Thêm danh mục mới thành công!' });
        setName('');
        setDescription('');
        fetchCategories(); // Reload lại danh sách
      } else {
        setMessage({ type: 'error', text: result.message || 'Lỗi xử lý.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối Backend.' });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa danh mục
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này? Các món thuộc danh mục này sẽ bị hủy liên kết.')) return;

    try {
      const res = await fetch(`http://localhost:3001/categories/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCategories(); // Reload lại danh sách
      }
    } catch (error) {
      console.error('Lỗi xóa:', error);
    }
  };

  return (
    // 2. CHUYỂN TOÀN BỘ GIAO DIỆN SANG MÀU SÁNG
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 p-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: FORM THÊM DANH MỤC */}
        <div className="md:col-span-1">
          <h1 className="text-2xl font-bold text-amber-700 tracking-wide uppercase mb-1">Quản lý nhóm món</h1>
          <p className="text-gray-500 text-sm mb-6">Định nghĩa các phân hệ đồ uống cho menu của Sẫm Coffee.</p>

          {message && (
            <div className={`p-3.5 rounded-lg mb-5 text-sm font-medium border shadow-sm ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <div>
              <label className="block text-xs text-gray-600 font-bold uppercase mb-2">Tên nhóm món nước (*):</label>
              <input
                type="text"
                placeholder="Ví dụ: Coffee, Trà Sữa..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 font-bold uppercase mb-2">Mô tả danh mục:</label>
              <textarea
                placeholder="Mô tả ngắn gọn về nhóm nước này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 h-24 resize-none transition shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold tracking-wider uppercase rounded-lg transition text-xs shadow-md"
            >
              {loading ? 'Đang lưu...' : '➕ Thêm danh mục'}
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: DANH SÁCH CÁC DANH MỤC ĐANG CÓ */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-bold tracking-wider">
                  <th className="p-4">Tên Danh Mục</th>
                  <th className="p-4">Mô Tả</th>
                  <th className="p-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">Chưa có danh mục nào được khởi tạo.</td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{cat.name}</td>
                      <td className="p-4 text-gray-500 text-xs">{cat.description || 'Không có mô tả'}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md border border-red-200 hover:border-red-600 transition text-xs font-semibold"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}