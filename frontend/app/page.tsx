'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000')
      .then((res) => res.json())
      .then((result) => {
        if (result.status === "Thành công") {
          setIngredients(result.data);
        }
      });
  }, []);

  return (
    <main className="p-10 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500">Sẫm Coffee - Kiểm soát nguyên liệu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ingredients.length > 0 ? (
          ingredients.map((item: any, index) => {
            // Logic kiểm tra hàng sắp hết
            const isLow = item.stock_quantity <= item.min_threshold;
            
            return (
              <div key={index} className={`p-6 rounded-xl border-2 transition-all ${isLow ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-900'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{item.name}</h2>
                  {isLow && <span className="bg-red-600 text-xs px-2 py-1 rounded-full animate-pulse">Sắp hết!</span>}
                </div>
                
                <div className="space-y-2 text-gray-300">
                  <p>Tồn kho hiện tại: <span className={`font-bold ${isLow ? 'text-red-400' : 'text-green-400'}`}>{item.stock_quantity} {item.unit}</span></p>
                  <p className="text-sm">Ngưỡng tối thiểu: {item.min_threshold} {item.unit}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-500 text-lg">Đang kết nối dữ liệu từ quán Sẫm Coffee...</p>
          </div>
        )}
      </div>
    </main>
  );
}