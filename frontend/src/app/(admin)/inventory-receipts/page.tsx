'use client';

import { useState, useEffect } from 'react';
import { inventoryReceiptService } from '@/src/services/inventoryReceiptService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FileText, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Loader2, Calendar } from 'lucide-react';

interface IngredientInfo {
  name: string;
  base_unit: string;
  recipe_unit?: string;
  conversion_factor?: number;
}

interface ReceiptDetail {
  quantity: number;
  ingredients: IngredientInfo;
}

interface Receipt {
  id: string;
  receipt_type: 'IMPORT' | 'SALE_DEDUCTION' | 'STOCKTAKE_ADJUSTMENT';
  created_at: string;
  users?: { full_name: string };
  receipt_details: ReceiptDetail[];
}

const ReceiptTypeBadge = ({ type }: { type: Receipt['receipt_type'] }) => {
  if (type === 'IMPORT') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full">
        <ArrowDownToLine size={14} /> Nhập hàng
      </div>
    );
  }
  if (type === 'SALE_DEDUCTION') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full">
        <ArrowUpFromLine size={14} /> Xuất bán
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-full">
      <RefreshCcw size={14} /> Kiểm kho
    </div>
  );
};

const SmartQuantity = ({ detail }: { detail: ReceiptDetail }) => {
  const { quantity, ingredients } = detail;
  const { base_unit, recipe_unit, conversion_factor = 1 } = ingredients;

  const absQuantity = Math.abs(quantity);
  const sign = quantity > 0 ? '+' : quantity < 0 ? '-' : '';
  const colorClass = quantity > 0 ? 'text-green-600 bg-green-50' : quantity < 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50';

  if (absQuantity < 1 && recipe_unit && conversion_factor) {
    const recipeQuantity = absQuantity * conversion_factor;
    return (
      <span className={`font-mono font-bold px-2 py-1 rounded-lg text-sm ${colorClass}`}>
        {sign}{recipeQuantity.toLocaleString('vi-VN')} {recipe_unit}
      </span>
    );
  }

  return (
    <span className={`font-mono font-bold px-2 py-1 rounded-lg text-sm ${colorClass}`}>
      {sign}{absQuantity.toLocaleString('vi-VN')} {base_unit}
    </span>
  );
};

export default function InventoryReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lọc
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const data = await inventoryReceiptService.getAll(startDate, endDate, typeFilter);
      setReceipts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [startDate, endDate, typeFilter]);

  if (loading && receipts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FCF9F8]">
        <Loader2 className="animate-spin text-[#FFB800]" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <div className="px-6 py-6 border-b border-gray-200 bg-white flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-[#FFB800]" size={28} />
            Lịch sử Phiếu Kho
          </h1>
          <p className="text-gray-500 mt-1">Theo dõi biến động xuất/nhập/kiểm kê nguyên liệu.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <FileText className="text-gray-400" size={18} />
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả loại phiếu</option>
              <option value="IMPORT">Nhập hàng</option>
              <option value="SALE_DEDUCTION">Xuất bán tự động</option>
              <option value="STOCKTAKE_ADJUSTMENT">Kiểm kho</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <Calendar className="text-gray-400" size={18} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
        <div className="space-y-4 max-w-4xl mx-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 text-center mb-4">
              {error}
            </div>
          )}
          {receipts.map((receipt) => (
            <div key={receipt.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 bg-gray-50/50 flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 gap-3">
                <div className="flex items-center gap-4">
                  <ReceiptTypeBadge type={receipt.receipt_type} />
                  <div className="flex items-center text-sm text-gray-500 gap-1.5 font-medium">
                    <Calendar size={14} />
                    {format(new Date(receipt.created_at), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Thực hiện bởi: <span className="font-bold text-[#4B2C20]">{receipt.users?.full_name || 'Hệ thống tự động'}</span>
                </div>
              </div>
              
              <div className="p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-bold w-1/2">Tên nguyên liệu</th>
                      <th className="pb-2 font-bold text-right">Biến động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {receipt.receipt_details.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 font-semibold text-[#4B2C20] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]"></div>
                          {detail.ingredients.name}
                        </td>
                        <td className="py-3 text-right">
                          <SmartQuantity detail={detail} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {receipts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <FileText className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500 font-medium">Chưa có dữ liệu phiếu kho nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}