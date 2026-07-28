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
      <div className="flex h-full items-center justify-center bg-[#FCF9F8]">
        <Loader2 className="animate-spin text-[#FFB800]" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <div className="px-6 py-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="text-[#FFB800]" size={28} />
          Quản lý Ca làm việc
        </h1>
        <p className="text-gray-500 mt-1">Bàn giao, chốt tiền mặt và kiểm soát doanh thu theo ca.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
        {!currentShift ? (
          // NO ACTIVE SHIFT -> SHOW OPEN SHIFT FORM
          <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#4B2C20] p-6 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <DoorOpen size={32} />
              </div>
              <h2 className="text-2xl font-bold">Mở Ca Mới</h2>
              <p className="text-white/80 text-sm mt-1">Hệ thống đang không có ca làm việc nào mở.</p>
            </div>
            
            <form onSubmit={handleOpenShift} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tiền mặt đầu ca (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl font-bold text-[#4B2C20] focus:border-[#FFB800] focus:ring-0 outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Là số tiền lẻ đang có sẵn trong két để thối lại cho khách.</p>
              </div>

              <button 
                type="submit"
                disabled={processing}
                className="w-full py-4 bg-[#FFB800] hover:bg-[#FFB800]/90 text-[#4B2C20] rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-md"
              >
                {processing ? <Loader2 size={24} className="animate-spin"/> : <CheckCircle2 size={24}/>} 
                Bắt Đầu Nhận Khách
              </button>
            </form>
          </div>
        ) : (
          // ACTIVE SHIFT EXISTS -> SHOW CLOSE SHIFT FORM
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#D1FAE5] border-b border-[#059669]/20 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#059669] text-white rounded-full flex items-center justify-center shadow-inner">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#065F46]">Ca Đang Mở</h2>
                  <p className="text-sm text-[#059669] font-medium mt-0.5">Nhân viên: {currentShift.users?.full_name || 'Thu ngân'}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl">
                <Clock className="text-[#059669]" size={20} />
                <div>
                  <p className="text-xs font-bold text-[#065F46] uppercase">Bắt đầu lúc</p>
                  <p className="text-sm font-semibold text-[#065F46]">{format(new Date(currentShift.start_time), 'HH:mm - dd/MM/yyyy')}</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-[#4B2C20] mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <Wallet size={20} /> Tổng kết Doanh Thu
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-500">Doanh thu trong ca</span>
                    <span className="font-bold text-gray-800">{currentShift.metrics?.total_sales.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-500">Khách chuyển khoản</span>
                    <span className="font-bold text-blue-600">{currentShift.metrics?.transfer_sales.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-100">
                    <span className="font-medium text-gray-500">Khách trả tiền mặt</span>
                    <span className="font-bold text-[#059669]">{currentShift.metrics?.cash_sales.toLocaleString('vi-VN')}đ</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium text-gray-500">Tiền mặt đầu ca</span>
                      <span className="font-bold text-gray-800">{Number(currentShift.starting_cash).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="p-4 mt-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm font-bold text-gray-700 uppercase flex items-center justify-between">
                        Tiền trong két phải có:
                      </p>
                      <p className="text-3xl font-black text-[#FFB800] mt-1 text-right">
                        {currentShift.metrics?.expected_cash.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-red-600 mb-4 border-b border-red-200 pb-2 flex items-center gap-2">
                  <LockKeyhole size={20} /> Chốt Ca Màn Hình
                </h3>
                <form onSubmit={handleCloseShift} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tiền mặt bàn giao (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={endingCash}
                        onChange={(e) => setEndingCash(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-xl font-bold text-[#4B2C20] focus:border-red-500 focus:ring-0 outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tổng số tiền mặt đếm được trong két lúc này.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Ghi chú (nếu có)</label>
                    <textarea 
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Giải trình lệch tiền, hoặc chi tiêu ngoài..."
                      className="w-full p-3 bg-white border-2 border-gray-300 rounded-xl text-sm focus:border-[#4B2C20] outline-none transition-colors resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={processing}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-md"
                  >
                    {processing ? <Loader2 size={24} className="animate-spin"/> : <LockKeyhole size={24}/>} 
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-green-50 border-b border-green-100 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-green-800">Chốt ca thành công!</h2>
              <p className="text-sm text-green-600 mt-1">Đã lưu lịch sử bàn giao tiền mặt.</p>
            </div>
            <div className="p-6 bg-gray-50 flex flex-col gap-3">
              <button 
                onClick={() => handlePrint()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2"
              >
                <Printer size={20} /> In Phiếu Bàn Giao
              </button>
              <button 
                onClick={() => setClosedShiftResult(null)}
                className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
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
