'use client';

import { useEffect, useState } from 'react';
import { Ingredient } from '../../../types/ingredient';
import { ingredientService } from '../../../services/ingredientService';

type ModalType = 'IMPORT' | 'STOCKTAKE' | 'EDIT' | 'DELETE' | null;
type ViewMode = 'ACTIVE' | 'ARCHIVED';

export default function DashboardPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State quản lý chế độ xem (Tab)
  const [viewMode, setViewMode] = useState<ViewMode>('ACTIVE');

  // State quản lý Modal và dữ liệu đang thao tác
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho Form Nhập/Kiểm kho
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');

  // State cho Form Sửa thông tin
  const [editForm, setEditForm] = useState({ name: '', unit: '', min_threshold: 0, cost_per_unit: 0 });

  // State quản lý cảnh báo khi xóa
  const [deleteWarnings, setDeleteWarnings] = useState<string[]>([]);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  
  // Hàm lấy dữ liệu phụ thuộc vào Tab hiện tại
  const fetchIngredients = async () => {
    setLoading(true);
    try {
      if (viewMode === 'ACTIVE') {
        const data = await ingredientService.getAll();
        setIngredients(Array.isArray(data) ? data : (data.data || []));
      } else {
        // Tạm thời gọi fetch trực tiếp cho API archived (Nếu bạn chưa viết hàm getArchived trong service)
        const res = await fetch('http://localhost:3001/ingredients/archived');
        const data = await res.json();
        setIngredients(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu kho:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại dữ liệu mỗi khi người dùng chuyển Tab
  useEffect(() => {
    fetchIngredients();
  }, [viewMode]);

  // --- CÁC HÀM XỬ LÝ MỞ MODAL ---
  const openImportModal = (item: Ingredient) => {
    setSelectedItem(item);
    setAmount('');
    setNote('');
    setActiveModal('IMPORT');
  };

  const openStocktakeModal = (item: Ingredient) => {
    setSelectedItem(item);
    setAmount(item.stock_quantity); 
    setNote('');
    setActiveModal('STOCKTAKE');
  };

  const openEditModal = (item: Ingredient) => {
    setSelectedItem(item);
    setEditForm({
      name: item.name,
      unit: item.unit,
      min_threshold: item.min_threshold || 0,
      cost_per_unit: item.cost_per_unit || 0,
    });
    setActiveModal('EDIT');
  };

  const openDeleteModal = async (item: Ingredient) => {
    setSelectedItem(item);
    setActiveModal('DELETE');
    setIsCheckingUsage(true);
    setDeleteWarnings([]);

    try {
      const res = await fetch(`http://localhost:3001/ingredients/${item.id}/check-usage`);
      if (res.ok) {
        const data = await res.json();
        if (data.is_used) {
          setDeleteWarnings(data.used_in);
        }
      }
    } catch (error) {
      console.error('Lỗi khi check dependencies');
    } finally {
      setIsCheckingUsage(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
  };

  // --- CÁC HÀM SUBMIT GỌI API BACKEND ---
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      let res;
      if (activeModal === 'IMPORT') {
        res = await fetch(`http://localhost:3001/ingredients/${selectedItem.id}/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(amount), note }),
        });
      } else if (activeModal === 'STOCKTAKE') {
        res = await fetch(`http://localhost:3001/ingredients/${selectedItem.id}/stocktake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actual_quantity: Number(amount), note }),
        });
      } else if (activeModal === 'EDIT') {
        res = await fetch(`http://localhost:3001/ingredients/${selectedItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
      }

      if (res?.ok) {
        alert('Thao tác thành công!');
        closeModal();
        fetchIngredients(); 
      } else {
        const errData = await res?.json();
        alert('Lỗi: ' + (errData?.message || 'Không thể xử lý yêu cầu'));
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3001/ingredients/${selectedItem.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Đã ngưng sử dụng nguyên liệu thành công!');
        closeModal();
        fetchIngredients();
      } else {
        alert('Có lỗi xảy ra khi xóa!');
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm Khôi phục nguyên liệu từ Kho lưu trữ
  const handleRestore = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục nguyên liệu này không?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/ingredients/${id}/restore`, {
        method: 'PATCH',
      });
      if (res.ok) {
        alert('Khôi phục thành công! Nguyên liệu đã trở lại kho hoạt động.');
        fetchIngredients();
      } else {
        alert('Có lỗi xảy ra khi khôi phục!');
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-gray-900 p-8 font-sans relative">
      <div className="max-w-6xl mx-auto">
        
        {/* TIÊU ĐỀ & NÚT THÊM MỚI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-700 tracking-wide uppercase">
              Quản trị Kho nguyên liệu thô
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Kiểm soát nhập/xuất, điều chỉnh hao hụt và theo dõi định mức.
            </p>
          </div>
          {viewMode === 'ACTIVE' && (
            <button className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs tracking-wider uppercase rounded-lg transition shadow-sm flex items-center gap-2">
              <span>➕</span> THÊM NGUYÊN LIỆU MỚI
            </button>
          )}
        </div>

        {/* TOGGLE TAB CHUYỂN ĐỔI CHẾ ĐỘ XEM */}
        <div className="flex bg-gray-200 p-1 rounded-lg w-fit mb-8 shadow-inner">
          <button
            onClick={() => setViewMode('ACTIVE')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${
              viewMode === 'ACTIVE' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>📦</span> Đang sử dụng
          </button>
          <button
            onClick={() => setViewMode('ARCHIVED')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${
              viewMode === 'ARCHIVED' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>🗄️</span> Kho lưu trữ
          </button>
        </div>
        
        {/* LƯỚI DANH SÁCH NGUYÊN LIỆU */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-200 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500 text-sm font-mono animate-pulse">☕ Đang kết nối dữ liệu kho Sẫm Coffee...</p>
            </div>
          ) : ingredients.length > 0 ? (
            ingredients.map((item: Ingredient) => {
              const isLow = item.stock_quantity <= item.min_threshold;
              
              return (
                <div 
                  key={item.id} 
                  className={`relative flex flex-col justify-between p-5 rounded-xl border shadow-sm transition hover:shadow-md ${
                    viewMode === 'ARCHIVED' ? 'bg-gray-50 border-gray-200 grayscale-[0.5] opacity-90' :
                    isLow ? 'bg-white border-red-300' : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Cảnh báo (Chỉ hiện khi đang ở tab Active) */}
                  {viewMode === 'ACTIVE' && isLow && (
                    <span className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md animate-bounce uppercase">
                      Sắp hết!
                    </span>
                  )}
                  
                  {/* Thông tin */}
                  <div>
                    <h2 className={`font-bold text-lg mb-4 pb-3 border-b flex items-center gap-2 ${viewMode === 'ARCHIVED' ? 'text-gray-500 border-gray-200' : 'text-gray-800 border-gray-100'}`}>
                      <span>{viewMode === 'ARCHIVED' ? '💤' : '📦'}</span> {item.name}
                    </h2>
                    
                    <div className="space-y-2.5 text-sm mb-6 opacity-90">
                      <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-gray-600 font-medium text-xs uppercase">Tồn kho hiện tại:</span>
                        <span className={`font-mono font-black text-base ${viewMode === 'ARCHIVED' ? 'text-gray-600' : isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.stock_quantity} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-gray-500 text-xs">Định mức tối thiểu:</span>
                        <span className="text-gray-700 font-semibold text-xs">{item.min_threshold} {item.unit}</span>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-gray-500 text-xs">Giá vốn tham chiếu:</span>
                        <span className="text-amber-700 font-mono font-bold text-xs">
                          {Number(item.cost_per_unit || 0).toLocaleString('vi-VN')} đ/{item.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VÙNG NÚT HÀNH ĐỘNG THAY ĐỔI THEO TAB */}
                  {viewMode === 'ACTIVE' ? (
                    <div className="grid grid-cols-4 gap-2 mt-auto border-t border-gray-100 pt-4">
                      <button onClick={() => openImportModal(item)} className="py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold uppercase transition flex flex-col items-center gap-1">
                        <span className="text-sm">📥</span> Nhập
                      </button>
                      <button onClick={() => openStocktakeModal(item)} className="py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-bold uppercase transition flex flex-col items-center gap-1">
                        <span className="text-sm">⚖️</span> Kiểm
                      </button>
                      <button onClick={() => openEditModal(item)} className="py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg text-[11px] font-bold uppercase transition flex flex-col items-center gap-1">
                        <span className="text-sm">✏️</span> Sửa
                      </button>
                      <button onClick={() => openDeleteModal(item)} className="py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-[11px] font-bold uppercase transition flex flex-col items-center gap-1">
                        <span className="text-sm">🗑️</span> Xóa
                      </button>
                    </div>
                  ) : (
                    <div className="mt-auto border-t border-gray-200 pt-4">
                      <button onClick={() => handleRestore(item.id)} className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg text-xs font-bold uppercase transition flex justify-center items-center gap-2 shadow-sm">
                        <span className="text-sm">🔄</span> KHÔI PHỤC HOẠT ĐỘNG
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-200 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500 text-sm italic">
                {viewMode === 'ACTIVE' ? 'Kho hàng hiện tại đang trống.' : 'Kho lưu trữ trống. Chưa có nguyên liệu nào bị ngưng sử dụng.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL CHO NHẬP/KIỂM/SỬA ================= */}
      {activeModal && activeModal !== 'DELETE' && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className={`px-6 py-4 border-b text-white ${
              activeModal === 'IMPORT' ? 'bg-emerald-600' : activeModal === 'STOCKTAKE' ? 'bg-amber-600' : 'bg-gray-800'
            }`}>
              <h3 className="font-bold uppercase tracking-wider text-sm">
                {activeModal === 'IMPORT' && '📥 Nhập lô hàng mới'}
                {activeModal === 'STOCKTAKE' && '⚖️ Kiểm kê / Điều chỉnh kho'}
                {activeModal === 'EDIT' && '✏️ Sửa thông tin nguyên liệu'}
              </h3>
              <p className="text-white/80 text-xs mt-1 font-medium">{selectedItem.name} (Đơn vị: {selectedItem.unit})</p>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-5">
              
              {/* FORM CHO NHẬP HÀNG & KIỂM KHO */}
              {(activeModal === 'IMPORT' || activeModal === 'STOCKTAKE') && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                      {activeModal === 'IMPORT' ? 'Số lượng nhập thêm (+):' : 'Số lượng đếm thực tế (=):'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-amber-500 transition pr-12"
                      />
                      <span className="absolute right-4 top-3 text-sm font-bold text-gray-400">{selectedItem.unit}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                      Lý do / Ghi chú (*):
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={activeModal === 'IMPORT' ? "VD: Nhập hàng từ nhà cung cấp A..." : "VD: Hao hụt do pha chế, đổ vỡ..."}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 transition"
                    ></textarea>
                  </div>
                </>
              )}

              {/* FORM CHO SỬA THÔNG TIN */}
              {activeModal === 'EDIT' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Tên nguyên liệu:</label>
                    <input type="text" required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Đơn vị đo:</label>
                      <input type="text" required value={editForm.unit} onChange={(e) => setEditForm({...editForm, unit: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Mức cảnh báo:</label>
                      <input type="number" required value={editForm.min_threshold} onChange={(e) => setEditForm({...editForm, min_threshold: Number(e.target.value)})} className="w-full border rounded-lg p-2.5 text-sm font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Giá vốn (VNĐ/Đơn vị):</label>
                    <input type="number" required value={editForm.cost_per_unit} onChange={(e) => setEditForm({...editForm, cost_per_unit: Number(e.target.value)})} className="w-full border rounded-lg p-2.5 text-sm font-mono" />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-5 py-2 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                  HỦY BỎ
                </button>
                <button type="submit" disabled={isSubmitting} className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition shadow-md disabled:bg-gray-400 ${
                  activeModal === 'IMPORT' ? 'bg-emerald-600 hover:bg-emerald-700' : activeModal === 'STOCKTAKE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-800 hover:bg-gray-900'
                }`}>
                  {isSubmitting ? 'ĐANG XỬ LÝ...' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RIÊNG CHO XÓA MỀM (CẢNH BÁO) ================= */}
      {activeModal === 'DELETE' && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b bg-red-600 text-white flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h3 className="font-bold uppercase tracking-wider text-sm">Xác nhận ngưng sử dụng</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-700 text-sm mb-4">
                Bạn đang yêu cầu ngưng sử dụng nguyên liệu: <strong className="text-red-600 uppercase">{selectedItem.name}</strong>.
              </p>

              {/* Khung cảnh báo thông minh */}
              {isCheckingUsage ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 font-mono animate-pulse flex items-center gap-2">
                  <span>⏳</span> Đang quét dữ liệu công thức pha chế...
                </div>
              ) : deleteWarnings.length > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <p className="text-sm text-amber-800 font-bold mb-2">🛑 KHOAN ĐÃ! Ràng buộc dữ liệu:</p>
                  <p className="text-xs text-amber-700 mb-2">Nguyên liệu này hiện đang là thành phần của các món nước sau:</p>
                  <ul className="list-disc pl-5 text-xs text-amber-900 font-medium font-mono space-y-1">
                    {deleteWarnings.map((drink, idx) => (
                      <li key={idx}>{drink}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-700 mt-3 italic">
                    Dữ liệu hóa đơn cũ vẫn sẽ được giữ nguyên. Tuy nhiên, sau khi xóa, nguyên liệu này sẽ chuyển vào Kho lưu trữ. Bạn có chắc chắn không?
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium mb-4 flex items-start gap-2">
                  <span className="text-sm">✅</span>
                  <span>Nguyên liệu này hiện chưa được gắn vào công thức món nước nào. Có thể xóa an toàn!</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-5 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                  QUAY LẠI
                </button>
                <button 
                  type="button" 
                  onClick={confirmDelete}
                  disabled={isCheckingUsage || isSubmitting} 
                  className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-md disabled:bg-gray-400"
                >
                  {isSubmitting ? 'ĐANG XÓA...' : 'VẪN XÓA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}