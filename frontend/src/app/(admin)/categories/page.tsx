'use client';

import { useState, useEffect } from 'react';

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

  // Load danh mục hiện tại lên màn hình
  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3001/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Không thể load danh mục:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
    <div className="min-h-screen bg-[#0c0f14] text-white p-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: FORM THÊM DANH MỤC */}
        <div className="md:col-span-1">
          <h1 className="text-2xl font-bold text-[#ff9f1c] mb-2">Quản lý nhóm món</h1>
          <p className="text-gray-400 text-sm mb-6">Định nghĩa các phân hệ đồ uống cho menu của Sẫm Coffee.</p>

          {message && (
            <div className={`p-3 rounded-lg mb-4 text-xs font-medium ${
              message.type === 'success' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-red-900/40 text-red-400 border border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreate} className="bg-[#141923] p-5 rounded-xl border border-gray-800 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-2">Tên nhóm món nước (*):</label>
              <input
                type="text"
                placeholder="Ví dụ: Coffee, Trà Sữa..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1c2431] border border-gray-700 rounded-md p-2 text-sm text-white focus:outline-none focus:border-[#ff9f1c]"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-2">Mô tả danh mục:</label>
              <textarea
                placeholder="Mô tả ngắn gọn về nhóm nước này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#1c2431] border border-gray-700 rounded-md p-2 text-sm text-white focus:outline-none focus:border-[#ff9f1c] h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#ff9f1c] hover:bg-[#e08a10] disabled:bg-gray-700 text-[#0c0f14] font-bold rounded-md transition text-xs shadow"
            >
              {loading ? 'Đang lưu...' : 'Thêm danh mục'}
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: DANH SÁCH CÁC DANH MỤC ĐANG CÓ */}
        <div className="md:col-span-2">
          <div className="bg-[#141923] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1c2431] text-gray-400 border-b border-gray-800 text-xs uppercase font-semibold">
                  <th className="p-4">Tên Danh Mục</th>
                  <th className="p-4">Mô Tả</th>
                  <th className="p-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">Chưa có danh mục nào được khởi tạo.</td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#181f2c] transition">
                      <td className="p-4 font-semibold text-[#ff9f1c]">{cat.name}</td>
                      <td className="p-4 text-gray-400 text-xs">{cat.description || 'Không có mô tả'}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="px-3 py-1 bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white rounded border border-red-900 transition text-xs"
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