'use client';

import { useState, useEffect, useRef } from 'react';
import { shiftService } from '@/src/services/shiftService';
import { format } from 'date-fns';
import { Wallet, Loader2, AlertCircle, CheckCircle2, DollarSign, Clock, ShieldCheck, DoorOpen, LockKeyhole, Printer, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/src/context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import ShiftReceipt from '@/src/components/ShiftReceipt';

export default function ShiftsPage() {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: "@media print { body { -webkit-print-color-adjust: exact; margin: 0; } @page { margin: 0; } }"
  });

  const [currentShift, setCurrentShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Forms state
  const [startingCash, setStartingCash] = useState<string>('0');
  const [endingCash, setEndingCash] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [closedShiftResult, setClosedShiftResult] = useState<any>(null);

  const loadCurrentShift = async () => {
    setLoading(true);
    try {
      const shift = await shiftService.getCurrentShift();
      setCurrentShift(shift);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải thông tin ca');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentShift();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await shiftService.openShift(Number(startingCash));
      toast.success('Mở ca thành công!');
      await loadCurrentShift();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Bạn có chắc chắn muốn chốt ca không? Hành động này sẽ khóa ca và bàn giao tiền.')) return;
    
    setProcessing(true);
    try {
      const result = await shiftService.closeShift(currentShift.id, Number(endingCash), notes);
      toast.success('Đã chốt ca thành công!');
      
      // Calculate variance
      const diff = Number(result.ending_cash) - Number(result.expected_cash);
      if (diff !== 0) {
        toast.warning(`Tiền chốt ca lệch ${diff > 0 ? '+' : ''}${diff.toLocaleString('vi-VN')}đ so với hệ thống.`);
      }

      // Preserve metrics for printing
      result.metrics = currentShift.metrics;
      result.opener = currentShift.users;
      result.closer = { full_name: user?.full_name };

      setClosedShiftResult(result);
      await loadCurrentShift();
      setEndingCash('0');
      setNotes('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      <div className="px-6 py-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
          <Wallet className="text-blue-600" size={28} />
          Quản lý Ca làm việc
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Bàn giao, chốt tiền mặt và kiểm soát doanh thu theo ca.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
        {!currentShift ? (
          // NO ACTIVE SHIFT -> SHOW OPEN SHIFT FORM
          <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-blue-600 p-6 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <DoorOpen size={32} />
              </div>
              <h2 className="text-2xl font-bold">Mở Ca Mới</h2>
              <p className="text-blue-100 text-sm mt-1">Hệ thống đang không có ca làm việc nào mở.</p>
            </div>
            
            <form onSubmit={handleOpenShift} className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tiền mặt đầu ca (VNĐ)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Là số tiền lẻ đang có sẵn trong két để thối lại cho khách.</p>
              </div>

              <button 
                type="submit"
                disabled={processing}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-base transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {processing ? <Loader2 size={22} className="animate-spin"/> : <CheckCircle2 size={22}/>} 
                Bắt Đầu Nhận Khách
              </button>
            </form>
          </div>
        ) : (
          // ACTIVE SHIFT EXISTS -> SHOW CLOSE SHIFT FORM
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-sm">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-950">Ca Đang Mở</h2>
                  <p className="text-sm text-emerald-700 font-medium mt-0.5">Nhân viên: {currentShift.users?.full_name || 'Thu ngân'}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2 bg-white/80 border border-emerald-200/60 px-4 py-2 rounded-xl">
                <Clock className="text-emerald-600" size={20} />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bắt đầu lúc</p>
                  <p className="text-sm font-semibold text-slate-700">{format(new Date(currentShift.start_time), 'HH:mm - dd/MM/yyyy')}</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Wallet size={18} className="text-blue-600" /> Tổng kết Doanh Thu
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-500">Doanh thu trong ca</span>
                    <span className="font-bold text-slate-800">{currentShift.metrics?.total_sales.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-500">Khách chuyển khoản</span>
                    <span className="font-bold text-blue-600">{currentShift.metrics?.transfer_sales.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-100">
                    <span className="font-medium text-slate-500">Khách trả tiền mặt</span>
                    <span className="font-bold text-emerald-600">{currentShift.metrics?.cash_sales.toLocaleString('vi-VN')}đ</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium text-slate-500">Tiền mặt đầu ca</span>
                      <span className="font-bold text-slate-800">{Number(currentShift.starting_cash).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="p-4 mt-3 bg-blue-50/70 rounded-2xl border border-blue-100 shadow-sm">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center justify-between">
                        Tiền trong két phải có:
                      </p>
                      <p className="text-3xl font-black text-blue-600 mt-1 text-right">
                        {currentShift.metrics?.expected_cash.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4 pb-2 border-b border-red-100 flex items-center gap-2">
                  <LockKeyhole size={18} className="text-red-500" /> Chốt Ca Màn Hình
                </h3>
                <form onSubmit={handleCloseShift} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tiền mặt bàn giao (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={endingCash}
                        onChange={(e) => setEndingCash(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xl font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Tổng số tiền mặt đếm được trong két lúc này.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Ghi chú (nếu có)</label>
                    <textarea 
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Giải trình lệch tiền, hoặc chi tiêu ngoài..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={processing}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-base transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {processing ? <Loader2 size={22} className="animate-spin"/> : <LockKeyhole size={22}/>} 
                    Xác Nhận Chốt Ca
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Success Modal */}
      {closedShiftResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-emerald-50 border-b border-emerald-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-emerald-950">Chốt ca thành công!</h2>
              <p className="text-sm text-emerald-700 mt-1">Đã lưu lịch sử bàn giao tiền mặt.</p>
            </div>
            <div className="p-6 bg-white flex flex-col gap-3">
              <button 
                onClick={() => handlePrint()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm transition-colors flex justify-center items-center gap-2 shadow-sm"
              >
                <Printer size={20} /> In Phiếu Bàn Giao
              </button>
              <button 
                onClick={() => setClosedShiftResult(null)}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
          {/* Hidden receipt */}
          <div className="hidden">
            <ShiftReceipt ref={printRef} shift={closedShiftResult} />
          </div>
        </div>
      )}
    </div>
  );
}
