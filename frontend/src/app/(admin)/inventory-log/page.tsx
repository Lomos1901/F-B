'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface InventoryLogEntry {
  id: string;
  created_at: string;
  change_amount: number; 
  note: string;
  performed_by: string; 
  ingredients: {
    name: string;
    base_unit: string;
    recipe_unit: string;
    conversion_factor: number;
  } | null;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<InventoryLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:3001/inventory-log/all-with-ingredients');
        
        if (!res.ok) {
          throw new Error('Không thể kết nối API lấy lịch sử kho.');
        }
        
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : (data.data || []));
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Hàm định dạng hiển thị Nhập/Xuất dựa trên bộ 3 quy đổi mới
  const formatAction = (change: number, ingredient: InventoryLogEntry['ingredients']) => {
    const isImport = change > 0;
    const absChange = Math.abs(change);
    let displayText = '';

    if (!ingredient) {
      displayText = `${absChange}`; // Nếu nguyên liệu đã bị xóa, chỉ hiện số
    } else if (isImport) {
      // Nếu Nhập kho -> Hiển thị theo đơn vị thương mại (base_unit)
      displayText = `${absChange} ${ingredient.base_unit}`;
    } else {
      // Nếu Xuất kho -> Hiển thị theo đơn vị pha chế (recipe_unit) bằng cách nhân với factor
      const usageAmount = absChange * ingredient.conversion_factor;
      displayText = `${usageAmount} ${ingredient.recipe_unit}`;
    }

    if (isImport) {
      return (
        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
          ➕ Nhập: {displayText}
        </span>
      );
    } else {
      return (
        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
          ➖ Xuất: {displayText}
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm, 'ngày' dd/MM/yyyy", { locale: vi });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-amber-700 tracking-wide uppercase">
            🕒 Nhật ký vận hành kho thô
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Tra cứu chi tiết mọi hoạt động nhập hàng, xuất kho, hao hụt và hủy nguyên liệu của Sẫm Coffee.
          </p>
        </div>

        {/* TRẠNG THÁI TẢI/LỖI */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-sm animate-pulse font-mono">☕ Đang trích xuất nhật ký Sẫm Coffee...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-xl border border-red-200 shadow-sm">
            <p className="text-red-600 text-sm font-medium">❌ Lỗi: {error}</p>
            <p className="text-gray-500 text-xs mt-2">Vui lòng kiểm tra lại cổng API Backend.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-sm italic">Hệ thống chưa ghi nhận hoạt động xuất nhập kho nào.</p>
          </div>
        ) : (
          
          /* BẢNG DỮ LIỆU CHÍNH */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-bold tracking-wider">
                  <th className="p-4 w-52">Thời gian</th>
                  <th className="p-4">Nguyên vật liệu</th>
                  <th className="p-4">Hành động & Số lượng</th>
                  <th className="p-4">Lý do điều chỉnh</th>
                  <th className="p-4">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    {/* Thời gian */}
                    <td className="p-4 font-mono text-gray-600 text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    
                    {/* Nguyên liệu */}
                    <td className="p-4">
                      <div className="font-bold text-gray-900">
                        {log.ingredients?.name || <span className="text-gray-400 italic">(Đã xóa)</span>}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase mt-0.5">
                        Kho: {log.ingredients ? `${log.ingredients.base_unit} ➜ ${log.ingredients.recipe_unit}` : 'N/A'}
                      </div>
                    </td>
                    
                    {/* Hành động & Số lượng */}
                    <td className="p-4">
                      {/* Truyền toàn bộ object ingredient vào hàm xử lý */}
                      {formatAction(log.change_amount, log.ingredients)}
                    </td>
                    
                    {/* Lý do */}
                    <td className="p-4 text-gray-700 font-medium">
                      {log.note || <span className="text-gray-400 italic">Không rõ lý do</span>}
                    </td>
                    
                    {/* Người thực hiện */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs shadow-inner">
                          {log.performed_by?.substring(0, 1).toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold text-gray-800 text-xs">
                          {log.performed_by || 'Hệ thống'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* FOOTER BẢNG */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center text-xs text-gray-500 font-medium">
              <span>Hiển thị nhật ký gần nhất</span>
              <span>Tổng số bản ghi: <span className="font-bold text-amber-700">{logs.length}</span></span>
            </div>
          </div>
        )}  

      </div>
    </div>
  );
}