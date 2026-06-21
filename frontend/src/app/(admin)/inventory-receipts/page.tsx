'use client';

import { useState, useEffect } from 'react';
import { inventoryReceiptService } from '@/src/services/inventoryReceiptService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// --- Định nghĩa Interface ---
interface ReceiptDetail {
  quantity: number;
  ingredients: {
    name: string;
    base_unit: string;
  };
}

interface Receipt {
  id: string;
  receipt_type: 'IMPORT' | 'SALE_DEDUCTION' | 'STOCKTAKE_ADJUSTMENT';
  created_at: string;
  users?: { full_name: string };
  receipt_details: ReceiptDetail[];
}

// SỬA LẠI: Khai báo kiểu cho props
const ReceiptTypeBadge = ({ type }: { type: Receipt['receipt_type'] }) => {
  const styles = {
    IMPORT: 'bg-blue-900/50 text-blue-300',
    SALE_DEDUCTION: 'bg-red-900/50 text-red-400',
    STOCKTAKE_ADJUSTMENT: 'bg-yellow-900/50 text-yellow-300',
  };
  const text = {
    IMPORT: 'Nhập hàng',
    SALE_DEDUCTION: 'Xuất bán',
    STOCKTAKE_ADJUSTMENT: 'Kiểm kho',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type] || 'bg-gray-700'}`}>{text[type] || type}</span>;
};

export default function InventoryReceiptsPage() {
  // SỬA LẠI: Khai báo kiểu cho state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const data = await inventoryReceiptService.getAll();
        setReceipts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Đang tải lịch sử phiếu kho...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <main className="min-h-screen bg-dark-bg p-4 sm:p-6 md:p-8 font-sans text-dark-text-primary">
      <h1 className="text-3xl font-bold text-brand-amber mb-8">Lịch sử Phiếu kho</h1>
      <div className="space-y-6">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="bg-dark-surface border border-dark-border rounded-lg shadow-lg">
            <div className="p-4 flex justify-between items-center border-b border-dark-border">
              <div>
                <ReceiptTypeBadge type={receipt.receipt_type} />
                <p className="text-sm text-dark-text-secondary mt-2">
                  Ngày tạo: {format(new Date(receipt.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
              <p className="text-sm text-dark-text-secondary">
                Người thực hiện: <span className="font-semibold text-dark-text-primary">{receipt.users?.full_name || 'Hệ thống'}</span>
              </p>
            </div>
            <div className="p-4">
              <ul className="divide-y divide-dark-border/50">
                {receipt.receipt_details.map((detail, index) => (
                  <li key={index} className="py-2 flex justify-between items-center">
                    <span className="font-medium">{detail.ingredients.name}</span>
                    <span className={`font-mono font-semibold ${detail.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {detail.quantity > 0 ? '+' : ''}{detail.quantity} {detail.ingredients.base_unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
