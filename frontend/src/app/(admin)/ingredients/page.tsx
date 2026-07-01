'use client';

import { useState, useEffect } from 'react';
import { ingredientService } from '@/src/services/ingredientService';
import { useAuth } from '@/src/context/AuthContext';
import Link from 'next/link';
import { Plus, Trash2, Inbox, ClipboardList, AlertTriangle, Archive } from 'lucide-react';
import { toast } from 'react-toastify';

// --- Định nghĩa Interface ---
interface Ingredient {
  id: string;
  name: string;
  stock_quantity: number;
  base_unit: string;
  cost_per_unit: number;
  recipe_unit: string;
  conversion_factor: number;
  ingredient_categories?: { name: string };
}

interface ImportStockPayload {
  amount: number;
  note?: string;
  performed_by: string;
}

interface StocktakePayload {
  actual_quantity: number;
  note: string;
  performed_by: string;
}

interface ImportModalProps {
  ingredient: Ingredient;
  onClose: () => void;
  onConfirm: (payload: ImportStockPayload) => Promise<void>;
}

interface StocktakeModalProps {
  ingredient: Ingredient;
  onClose: () => void;
  onConfirm: (payload: StocktakePayload) => Promise<void>;
}

interface DeleteModalProps {
  ingredient: Ingredient;
  usage: { is_used: boolean; used_in: string[] };
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onHardConfirm: () => Promise<void>;
}

// --- MODAL COMPONENTS ---

const ImportStockModal = ({ ingredient, onClose, onConfirm }: ImportModalProps) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Vui lòng nhập số lượng hợp lệ.');
      return;
    }
    onConfirm({ amount: Number(amount), note, performed_by: user!.id });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-brand-amber flex items-center gap-2"><Inbox size={20}/>Nhập kho: {ingredient.name}</h2>
        <div className="space-y-4">
          <input type="number" placeholder={`Số lượng nhập (theo ${ingredient.base_unit})`} value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
          <input type="text" placeholder="Ghi chú (ví dụ: NCC ABC)" value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-dark-border text-dark-text-secondary hover:bg-gray-600 font-semibold">Hủy</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-500">Xác nhận Nhập</button>
        </div>
      </div>
    </div>
  );
};

const StocktakeModal = ({ ingredient, onClose, onConfirm }: StocktakeModalProps) => {
  const [actualQuantity, setActualQuantity] = useState('');
  const [note, setNote] = useState('');
  const { user } = useAuth();

  const handleSubmit = () => {
    if (actualQuantity === '' || Number(actualQuantity) < 0) {
      toast.error('Vui lòng nhập số lượng thực tế hợp lệ.');
      return;
    }
    if (!note.trim()) {
      toast.error('Vui lòng nhập lý do kiểm kho.');
      return;
    }
    onConfirm({ actual_quantity: Number(actualQuantity), note, performed_by: user!.id });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-brand-amber flex items-center gap-2"><ClipboardList size={20}/>Kiểm kho: {ingredient.name}</h2>
        <p className="text-sm text-dark-text-secondary mb-4">Tồn kho hệ thống: <span className="font-bold text-white">{ingredient.stock_quantity} {ingredient.base_unit}</span></p>
        <div className="space-y-4">
          <input type="number" placeholder={`Số lượng thực tế (${ingredient.base_unit})`} value={actualQuantity} onChange={e => setActualQuantity(e.target.value)} className="w-full p-3 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
          <input type="text" placeholder="Lý do kiểm kho (bắt buộc)" value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 bg-dark-bg border-dark-border rounded-md focus:ring-2 focus:ring-brand-amber" />
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-dark-border text-dark-text-secondary hover:bg-gray-600 font-semibold">Hủy</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-500">Xác nhận Kiểm</button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ ingredient, usage, onClose, onConfirm, onHardConfirm }: DeleteModalProps) => (
  <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
    <div className="bg-dark-surface border border-dark-border p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
      <h2 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2"><AlertTriangle size={20}/>Xác nhận Xóa</h2>
      <p className="text-dark-text-secondary">Bạn có chắc muốn xóa nguyên liệu <strong>{ingredient.name}</strong>?</p>
      {usage.is_used && (
        <div className="mt-4 p-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-sm">
          <strong>Cảnh báo:</strong> Nguyên liệu này đang được sử dụng trong các món: <span className="font-semibold">{usage.used_in.join(', ')}</span>. Việc xóa sẽ chỉ ẩn nó đi.
        </div>
      )}
      <div className="flex justify-end mt-6 space-x-3">
        <button onClick={onClose} className="px-4 py-2 rounded-md bg-dark-border text-dark-text-secondary hover:bg-gray-600 font-semibold">Hủy</button>
        {!usage.is_used && (
          <button onClick={onHardConfirm} className="px-4 py-2 bg-red-800 text-white rounded-md font-bold hover:bg-red-700">Xóa vĩnh viễn</button>
        )}
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-500">
          {usage.is_used ? 'Xác nhận Ẩn' : 'Xóa (Ẩn)'}
        </button>
      </div>
    </div>
  </div>
);

// --- COMPONENT TRANG CHÍNH ---

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: string; data: Ingredient; usage?: any } | null>(null);

  const loadIngredients = async () => {
    try {
      const result = await ingredientService.getAll();
      setIngredients(result.data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIngredients(); }, []);

  const handleImportStock = async (payload: ImportStockPayload) => {
    try {
      await ingredientService.importStock(modal!.data.id, payload);
      toast.success('Nhập kho thành công!');
      setModal(null);
      loadIngredients();
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  const handleStocktake = async (payload: StocktakePayload) => {
    try {
      await ingredientService.stocktake(modal!.data.id, payload);
      toast.success('Kiểm kho thành công!');
      setModal(null);
      loadIngredients();
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  const openDeleteModal = async (ingredient: Ingredient) => {
    try {
      const usage = await ingredientService.checkUsage(ingredient.id);
      setModal({ type: 'delete', data: ingredient, usage });
    } catch (err: any) { toast.error(`Lỗi khi kiểm tra phụ thuộc: ${err.message}`); }
  };

  const handleSoftDelete = async () => {
    try {
      await ingredientService.softDelete(modal!.data.id);
      toast.success('Đã ẩn nguyên liệu.');
      setModal(null);
      loadIngredients();
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  const handleHardDelete = async () => {
    try {
      await ingredientService.hardDelete(modal!.data.id);
      toast.success('Đã xóa vĩnh viễn nguyên liệu.');
      setModal(null);
      loadIngredients();
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  if (loading) return <div className="p-8 text-dark-text-secondary">Đang tải dữ liệu kho...</div>;
  if (error && ingredients.length === 0) return <div className="p-8 text-red-500">Lỗi: {error}</div>;

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-text-primary">Kho Nguyên liệu</h1>
        <div className="flex items-center gap-4">
          <Link href="/ingredients/archived" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-gray-600 text-white hover:bg-gray-500 transition-all">
            <Archive size={16} />
            Thùng rác
          </Link>

          <Link href="/ingredients/create" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-brand-amber text-black hover:bg-brand-amber-dark transition-all">
            <Plus size={16} />
            Thêm nguyên liệu
          </Link>
        </div>
      </div>

      <div className="bg-dark-surface border border-dark-border shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead className="bg-dark-bg">
            <tr>
              <th className="w-1/3 px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Nguyên liệu</th>
              <th className="w-1/6 px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Danh mục</th>
              <th className="w-1/6 px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Tồn (Nhập)</th>
              <th className="w-1/6 px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Tồn (Pha chế)</th>
              <th className="w-1/6 px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Giá vốn</th>
              <th className="w-auto px-6 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {ingredients.map((ing) => {
              const recipeStock = (ing.stock_quantity || 0) * (ing.conversion_factor || 1);
              return (
                <tr key={ing.id} className="hover:bg-dark-bg transition-colors">
                  <td className="px-6 py-4 font-medium text-dark-text-primary truncate">{ing.name}</td>
                  <td className="px-6 py-4 text-dark-text-secondary">{ing.ingredient_categories?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-dark-text-secondary font-mono">{ing.stock_quantity} {ing.base_unit}</td>
                  <td className="px-6 py-4 text-dark-text-secondary font-mono">{recipeStock.toLocaleString('vi-VN')} {ing.recipe_unit}</td>
                  <td className="px-6 py-4 text-dark-text-secondary font-mono">{ing.cost_per_unit.toLocaleString('vi-VN')} đ</td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => setModal({ type: 'import', data: ing })} className="p-2 text-green-400 hover:bg-dark-bg rounded-full" title="Nhập kho"><Inbox size={16}/></button>
                    <button onClick={() => setModal({ type: 'stocktake', data: ing })} className="p-2 text-blue-400 hover:bg-dark-bg rounded-full" title="Kiểm kho"><ClipboardList size={16}/></button>
                    <button onClick={() => openDeleteModal(ing)} className="p-2 text-red-500 hover:bg-dark-bg rounded-full" title="Xóa"><Trash2 size={16}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal?.type === 'import' && <ImportStockModal ingredient={modal.data} onClose={() => setModal(null)} onConfirm={handleImportStock} />}
      {modal?.type === 'stocktake' && <StocktakeModal ingredient={modal.data} onClose={() => setModal(null)} onConfirm={handleStocktake} />}
      {modal?.type === 'delete' && <DeleteModal ingredient={modal.data} usage={modal.usage!} onClose={() => setModal(null)} onConfirm={handleSoftDelete} onHardConfirm={handleHardDelete} />}
    </main>
  );
}