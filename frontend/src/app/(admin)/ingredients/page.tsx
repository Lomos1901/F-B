'use client';

import { useState, useEffect, useMemo } from 'react';
import { ingredientService } from '@/src/services/ingredientService';
import { useAuth } from '@/src/context/AuthContext';
import Link from 'next/link';
import { Plus, Trash2, Inbox, ClipboardList, AlertTriangle, Archive, Search, Filter, Edit, Package, Loader2 } from 'lucide-react';
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
  ingredient_categories?: { id: string; name: string };
  category_id?: string;
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

// --- MODAL COMPONENTS (Giao diện M3 White + Blue) ---

const ImportStockModal = ({ ingredient, onClose, onConfirm }: ImportModalProps) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Vui lòng nhập số lượng hợp lệ.');
      return;
    }
    setIsSubmitting(true);
    await onConfirm({ amount: Number(amount), note, performed_by: user!.id });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
          <Inbox className="text-blue-600" size={24}/>
          Nhập kho nguyên liệu
        </h2>
        <div className="p-4 bg-blue-50 rounded-xl mb-4 border border-blue-100">
          <p className="font-semibold text-slate-800">{ingredient.name}</p>
          <p className="text-sm text-slate-500 mt-1">Tồn hiện tại: <span className="font-bold text-blue-600">{ingredient.stock_quantity} {ingredient.base_unit}</span></p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng nhập ({ingredient.base_unit}) <span className="text-red-500">*</span></label>
            <input type="number" placeholder="Nhập số lượng..." value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
            <input type="text" placeholder="Ví dụ: NCC ABC giao..." value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800" />
          </div>
        </div>
        <div className="flex justify-end mt-8 space-x-3">
          <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors">Hủy bỏ</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Xác nhận Nhập
          </button>
        </div>
      </div>
    </div>
  );
};

const StocktakeModal = ({ ingredient, onClose, onConfirm }: StocktakeModalProps) => {
  const [actualQuantity, setActualQuantity] = useState('');
  const [note, setNote] = useState('');
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (actualQuantity === '' || Number(actualQuantity) < 0) {
      toast.error('Vui lòng nhập số lượng thực tế hợp lệ.');
      return;
    }
    if (!note.trim()) {
      toast.error('Vui lòng nhập lý do kiểm kho.');
      return;
    }
    setIsSubmitting(true);
    await onConfirm({ actual_quantity: Number(actualQuantity), note, performed_by: user!.id });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" size={24}/>
          Kiểm kê kho
        </h2>
        <div className="p-4 bg-blue-50 rounded-xl mb-4 border border-blue-100">
          <p className="font-semibold text-slate-800">{ingredient.name}</p>
          <p className="text-sm text-slate-500 mt-1">Tồn trên hệ thống: <span className="font-bold text-blue-600">{ingredient.stock_quantity} {ingredient.base_unit}</span></p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng thực tế ({ingredient.base_unit}) <span className="text-red-500">*</span></label>
            <input type="number" placeholder="Đếm được bao nhiêu..." value={actualQuantity} onChange={e => setActualQuantity(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800" />
            {actualQuantity !== '' && (
              <p className={`text-xs mt-1.5 font-bold ${Number(actualQuantity) - ingredient.stock_quantity > 0 ? 'text-emerald-600' : Number(actualQuantity) - ingredient.stock_quantity < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                Độ lệch: {Number(actualQuantity) - ingredient.stock_quantity > 0 ? '+' : ''}{Number(actualQuantity) - ingredient.stock_quantity} {ingredient.base_unit}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do kiểm kho <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Ví dụ: Hao hụt, Hư hỏng..." value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800" />
          </div>
        </div>
        <div className="flex justify-end mt-8 space-x-3">
          <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors">Hủy bỏ</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Xác nhận Kiểm
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ ingredient, usage, onClose, onConfirm, onHardConfirm }: DeleteModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAction = async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    await action();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
          <AlertTriangle size={24}/>
          Xác nhận xóa nguyên liệu
        </h2>
        <p className="text-slate-600">Bạn có chắc muốn xóa nguyên liệu <strong>{ingredient.name}</strong> không? Hành động này có thể ảnh hưởng đến lịch sử thống kê.</p>
        
        {usage.is_used && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm">
            <strong>⚠️ Lưu ý:</strong> Nguyên liệu này đang được cấu hình định lượng cho các món: <span className="font-bold">{usage.used_in.join(', ')}</span>. Việc xóa sẽ chỉ <strong>ẩn</strong> nguyên liệu này khỏi danh sách để tránh lỗi hệ thống.
          </div>
        )}
        
        <div className="flex justify-end mt-8 space-x-3">
          <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors">Hủy bỏ</button>
          {!usage.is_used && (
            <button onClick={() => handleAction(onHardConfirm)} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-800 text-white rounded-full font-semibold hover:bg-slate-900 transition-colors">Xóa vĩnh viễn</button>
          )}
          <button onClick={() => handleAction(onConfirm)} disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {usage.is_used ? 'Chỉ Ẩn Đi' : 'Xóa (Ẩn)'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT TRANG CHÍNH ---

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: string; data: Ingredient; usage?: any } | null>(null);
  
  // States cho Lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const loadIngredients = async () => {
    try {
      const result = await ingredientService.getAll();
      const data = result.data || [];
      setIngredients(data);
      
      // Trích xuất danh sách categories duy nhất để làm Filter
      const cats = Array.from(new Set(data.map((i: Ingredient) => i.ingredient_categories?.name).filter(Boolean)));
      setCategories(cats.map(c => ({ name: c as string })));
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

  // Logic lọc dữ liệu
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'ALL' || ing.ingredient_categories?.name === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [ingredients, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }
  
  if (error && ingredients.length === 0) {
    return <div className="p-8 text-red-500 font-bold bg-slate-50 h-full flex items-center justify-center">{error}</div>;
  }

  return (
    <main className="flex flex-col h-full bg-slate-50 text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header & Tools */}
      <div className="px-6 py-6 border-b border-slate-200 bg-white flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-blue-600" size={28} />
            Kho Nguyên Liệu
          </h1>
          <p className="text-slate-500 mt-1">Quản lý tồn kho, nhập hàng và cảnh báo hết hàng.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên nguyên liệu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800 w-60"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="text-slate-400" size={18} />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <Link href="/ingredients/archived" className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors" title="Thùng rác">
            <Archive size={20} />
          </Link>

          <Link href="/ingredients/create" className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={18} />
            Thêm mới
          </Link>
        </div>
      </div>

      {/* Table Content */}
      <div className="p-6 overflow-y-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase text-slate-500 font-semibold bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-slate-500">Nguyên liệu</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">Danh mục</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">Tồn (Nhập)</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">Tồn (Pha chế)</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-right">Giá vốn</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Không tìm thấy nguyên liệu nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map((ing) => {
                    const recipeStock = (ing.stock_quantity || 0) * (ing.conversion_factor || 1);
                    const isLowStock = ing.stock_quantity <= 0;
                    const isWarning = ing.stock_quantity > 0 && ing.stock_quantity <= 2;

                    return (
                      <tr key={ing.id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-red-50/30' : isWarning ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{ing.name}</span>
                            {isLowStock && (
                              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full" title="Hết hàng!">
                                <AlertTriangle size={12} /> Hết hàng
                              </span>
                            )}
                            {isWarning && (
                              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full" title="Sắp hết hàng!">
                                <AlertTriangle size={12} /> Sắp hết
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                          {ing.ingredient_categories?.name || '---'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-sm ${isLowStock ? 'text-red-600 bg-red-100' : isWarning ? 'text-amber-600 bg-amber-100' : 'text-slate-800 bg-slate-100'}`}>
                            {ing.stock_quantity.toLocaleString('vi-VN')} {ing.base_unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-mono font-bold text-sm ${isLowStock ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-slate-500'}`}>
                            {recipeStock.toLocaleString('vi-VN')} {ing.recipe_unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-bold text-slate-600">
                            {ing.cost_per_unit.toLocaleString('vi-VN')} đ
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setModal({ type: 'import', data: ing })} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" title="Nhập kho">
                              <Inbox size={18} />
                            </button>
                            <button onClick={() => setModal({ type: 'stocktake', data: ing })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Kiểm kho">
                              <ClipboardList size={18} />
                            </button>
                            <Link href={`/ingredients/edit/${ing.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Chỉnh sửa">
                              <Edit size={18} />
                            </Link>
                            <button onClick={() => openDeleteModal(ing)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Xóa">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'import' && <ImportStockModal ingredient={modal.data} onClose={() => setModal(null)} onConfirm={handleImportStock} />}
      {modal?.type === 'stocktake' && <StocktakeModal ingredient={modal.data} onClose={() => setModal(null)} onConfirm={handleStocktake} />}
      {modal?.type === 'delete' && <DeleteModal ingredient={modal.data} usage={modal.usage!} onClose={() => setModal(null)} onConfirm={handleSoftDelete} onHardConfirm={handleHardDelete} />}
    </main>
  );
}