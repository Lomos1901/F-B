'use client';
import { useEffect, useState } from 'react';
import { Ingredient } from '../../../types/ingredient'; 
// Import dịch vụ gọi API vừa tạo vào đây
import { ingredientService } from '../../../services/ingredientService';

export default function DashboardPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Sử dụng service giúp code tường minh và sạch sẽ hơn
    ingredientService.getAll()
      .then((data) => setIngredients(data))
      .catch((err) => console.error('Lỗi lấy dữ liệu kho:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-gray-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* TIÊU ĐỀ GIAO DIỆN SÁNG */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-amber-700 tracking-wide uppercase">
            Sẫm Coffee - Kiểm soát nguyên liệu
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Theo dõi tồn kho thực tế và cảnh báo định mức
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-200 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500 text-sm animate-pulse">☕ Đang kết nối dữ liệu từ quán Sẫm Coffee...</p>
            </div>
          ) : ingredients.length > 0 ? (
            ingredients.map((item: Ingredient, index) => {
              const isLow = item.stock_quantity <= item.min_threshold;
              
              return (
                <div 
                  key={index} 
                  className={`relative p-5 rounded-xl border shadow-sm transition hover:shadow-md ${
                    isLow ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                  }`}
                >
                  {isLow && (
                    <span className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                      Sắp hết!
                    </span>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <h2 className={`font-bold text-base pr-12 ${isLow ? 'text-red-700' : 'text-gray-800'}`}>
                      {item.name}
                    </h2>
                  </div>
                  
                  <div className="space-y-1.5 text-sm">
                    <p className="text-gray-600 font-medium">
                      Tồn kho hiện tại: <span className={`font-bold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                        {item.stock_quantity} {item.unit}
                      </span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      Ngưỡng tối thiểu: {item.min_threshold} {item.unit}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-200 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500 text-sm">Kho hàng hiện tại đang trống.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 