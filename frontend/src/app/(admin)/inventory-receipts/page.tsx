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
  product_id?: string;
  products?: { name: string };
  ingredients: IngredientInfo;
}

interface Receipt {
  id: string;
  receipt_type: 'IMPORT' | 'SALE_DEDUCTION' | 'STOCKTAKE_ADJUSTMENT';
  created_at: string;
  order_id?: string;
  users?: { full_name: string };
  receipt_details: ReceiptDetail[];
}

const ReceiptTypeBadge = ({ type }: { type: Receipt['receipt_type'] }) => {
  if (type === 'IMPORT') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-xs rounded-full">
        <ArrowDownToLine size={14} /> Nhập hàng
      </div>
    );
  }
  if (type === 'SALE_DEDUCTION') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200/60 font-bold text-xs rounded-full">
        <ArrowUpFromLine size={14} /> Xuất bán
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 font-bold text-xs rounded-full">
      <RefreshCcw size={14} /> Kiểm kho
    </div>
  );
};

const SmartQuantity = ({ detail }: { detail: ReceiptDetail }) => {
  const { quantity, ingredients } = detail;
  const { base_unit, recipe_unit, conversion_factor = 1 } = ingredients;

  const absQuantity = Math.abs(quantity);
  const sign = quantity > 0 ? '+' : quantity < 0 ? '-' : '';
  const colorClass = quantity > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/50' : quantity < 0 ? 'text-red-700 bg-red-50 border border-red-200/50' : 'text-slate-600 bg-slate-100 border border-slate-200/50';

  if (absQuantity < 1 && recipe_unit && conversion_factor) {
    const recipeQuantity = absQuantity * conversion_factor;
    return (
      <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-sm ${colorClass}`}>
        {sign}{recipeQuantity.toLocaleString('vi-VN')} {recipe_unit}
      </span>
    );
  }

  return (
    <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-sm ${colorClass}`}>
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
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      <div className="px-6 py-6 border-b border-slate-200 bg-white flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" size={28} />
            Lịch sử Phiếu Kho
          </h1>
          <p className="text-slate-500 mt-1">Theo dõi biến động xuất/nhập/kiểm kê nguyên liệu.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <FileText className="text-slate-400" size={18} />
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả loại phiếu</option>
              <option value="IMPORT">Nhập hàng</option>
              <option value="SALE_DEDUCTION">Xuất bán tự động</option>
              <option value="STOCKTAKE_ADJUSTMENT">Kiểm kho</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Calendar className="text-slate-400" size={18} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="space-y-4 max-w-4xl mx-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-200 text-center mb-4">
              {error}
            </div>
          )}
          {receipts.map((receipt) => (
            <div key={receipt.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 gap-3">
                <div className="flex items-center gap-4">
                  <ReceiptTypeBadge type={receipt.receipt_type} />
                  <div className="flex items-center text-sm text-slate-500 gap-1.5 font-medium">
                    <Calendar size={14} />
                    {format(new Date(receipt.created_at), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  Thực hiện bởi: <span className="font-bold text-slate-800">{receipt.users?.full_name || 'Hệ thống tự động'}</span>
                  {receipt.order_id && <div className="mt-1 text-blue-600 font-semibold cursor-pointer">Mã đơn: #{receipt.order_id.split('-')[0].toUpperCase()}</div>}
                </div>
              </div>
              
              <div className="p-4">
                {receipt.receipt_type === 'SALE_DEDUCTION' ? (
                  <div className="space-y-4">
                    {/* Nhóm chi tiết theo sản phẩm */}
                    {Object.values(receipt.receipt_details.reduce((acc, detail) => {
                      const key = detail.product_id || 'unknown';
                      if (!acc[key]) acc[key] = { name: detail.products?.name || 'Nguyên liệu lẻ (không thuộc món)', items: [] };
                      acc[key].items.push(detail);
                      return acc;
                    }, {} as Record<string, {name: string, items: ReceiptDetail[]}>)).map((group, gIndex) => (
                      <div key={gIndex} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">☕</span> {group.name}
                        </div>
                        <table className="w-full text-left border-collapse">
                          <tbody className="divide-y divide-slate-200/50">
                            {group.items.map((detail, index) => (
                              <tr key={index}>
                                <td className="py-2 pl-6 font-medium text-slate-600 text-sm flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                  {detail.ingredients.name}
                                </td>
                                <td className="py-2 text-right">
                                  <SmartQuantity detail={detail} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 font-semibold">
                        <th className="pb-2 font-semibold w-1/2">Tên nguyên liệu</th>
                        <th className="pb-2 font-semibold text-right">Biến động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receipt.receipt_details.map((detail, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                            {detail.ingredients.name}
                          </td>
                          <td className="py-3 text-right">
                            <SmartQuantity detail={detail} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}

          {receipts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <FileText className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500 font-medium">Chưa có dữ liệu phiếu kho nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}