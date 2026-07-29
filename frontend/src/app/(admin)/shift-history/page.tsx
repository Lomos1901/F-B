'use client';

import { useState, useEffect, useRef } from 'react';
import { shiftService } from '@/src/services/shiftService';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { History, Loader2, Filter, Search, Calendar, ChevronDown, CheckCircle2, AlertTriangle, FileText, ChevronRight, X, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole } from '@/src/enums/user-role.enum';
import { useReactToPrint } from 'react-to-print';
import ShiftReceipt from '@/src/components/ShiftReceipt';

export default function ShiftHistoryPage() {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: "@media print { body { -webkit-print-color-adjust: exact; margin: 0; } @page { margin: 0; } }"
  });

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState<any>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await shiftService.getHistory(startDate, endDate);
      setShifts(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [startDate, endDate]);

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 'Đang mở';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = differenceInHours(endDate, startDate);
    const mins = differenceInMinutes(endDate, startDate) % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading && shifts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Calculate top cards
  const closedShifts = shifts.filter(s => s.status === 'CLOSED');
  const totalMissing = closedShifts.reduce((sum, s) => {
    const diff = Number(s.ending_cash) - Number(s.expected_cash);
    return diff < 0 ? sum + diff : sum;
  }, 0);
  const totalSurplus = closedShifts.reduce((sum, s) => {
    const diff = Number(s.ending_cash) - Number(s.expected_cash);
    return diff > 0 ? sum + diff : sum;
  }, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      <div className="px-6 py-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <History className="text-blue-600" size={28} />
            Lịch sử Ca làm việc
          </h1>
          <p className="text-slate-500 mt-1">Quản lý và đối soát doanh thu theo từng ca.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Calendar className="text-slate-400 ml-2" size={20} />
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none p-1"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none p-1"
          />
        </div>
      </div>

      <div className="p-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex justify-center items-center">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng số ca đã chốt</p>
              <p className="text-2xl font-bold text-slate-800">{closedShifts.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex justify-center items-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tiền thất thoát (Âm)</p>
              <p className="text-2xl font-bold text-red-600">{totalMissing.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex justify-center items-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tiền dư (Dương)</p>
              <p className="text-2xl font-bold text-emerald-600">+{totalSurplus.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold border-b border-slate-200">Thời gian ca</th>
                  <th className="p-4 font-semibold border-b border-slate-200">Nhân sự</th>
                  <th className="p-4 font-semibold border-b border-slate-200 text-right">Hệ thống tính</th>
                  <th className="p-4 font-semibold border-b border-slate-200 text-right">Thực tế đếm</th>
                  <th className="p-4 font-semibold border-b border-slate-200 text-right">Chênh lệch</th>
                  <th className="p-4 font-semibold border-b border-slate-200 text-center">Trạng thái</th>
                  <th className="p-4 font-semibold border-b border-slate-200"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((shift) => {
                  const diff = shift.status === 'CLOSED' ? Number(shift.ending_cash) - Number(shift.expected_cash) : 0;
                  
                  return (
                    <tr 
                      key={shift.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedShift(shift)}
                    >
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-800">
                          {format(new Date(shift.start_time), 'HH:mm')} - {shift.end_time ? format(new Date(shift.end_time), 'HH:mm') : '...'}
                        </div>
                        <div className="text-xs text-slate-500">{format(new Date(shift.start_time), 'dd/MM/yyyy')} ({calculateDuration(shift.start_time, shift.end_time)})</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-800">{shift.opener?.full_name || 'N/A'}</div>
                        <div className="text-xs text-slate-500">Mở két</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm font-semibold text-slate-600">
                          {shift.status === 'CLOSED' ? Number(shift.expected_cash).toLocaleString('vi-VN') + 'đ' : '---'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm font-semibold text-slate-800">
                          {shift.status === 'CLOSED' ? Number(shift.ending_cash).toLocaleString('vi-VN') + 'đ' : '---'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {shift.status === 'CLOSED' ? (
                          <div className={`text-sm font-semibold inline-flex px-2.5 py-1 rounded-full ${diff === 0 ? 'bg-emerald-50 text-emerald-700' : diff < 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                            {diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')}đ
                          </div>
                        ) : (
                          <span className="text-slate-300">---</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {shift.status === 'OPEN' ? (
                          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">Đang mở</span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">Đã chốt</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-slate-400 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={20} />
                      </td>
                    </tr>
                  );
                })}
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Không tìm thấy ca làm việc nào trong thời gian này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText size={24} className="text-blue-600" />
                Chi tiết Ca Làm Việc
              </h2>
              <button 
                onClick={() => setSelectedShift(null)}
                className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1.5 shadow-sm border border-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Thời gian mở</p>
                  <p className="text-sm font-semibold text-slate-800">{format(new Date(selectedShift.start_time), 'HH:mm - dd/MM/yyyy')}</p>
                  <p className="text-xs text-slate-500 mt-1">Bởi: {selectedShift.opener?.full_name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Thời gian chốt</p>
                  {selectedShift.end_time ? (
                    <>
                      <p className="text-sm font-semibold text-slate-800">{format(new Date(selectedShift.end_time), 'HH:mm - dd/MM/yyyy')}</p>
                      <p className="text-xs text-slate-500 mt-1">Bởi: {selectedShift.closer?.full_name}</p>
                    </>
                  ) : (
                    <p className="text-xs font-semibold text-blue-700 bg-blue-50 inline-block px-2.5 py-1 rounded-full">Chưa chốt</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Tiền mặt đầu ca:</span>
                  <span className="font-bold text-slate-800">{Number(selectedShift.starting_cash).toLocaleString('vi-VN')}đ</span>
                </div>
                {selectedShift.status === 'CLOSED' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">Tiền mặt hệ thống tính:</span>
                      <span className="font-bold text-slate-800">{Number(selectedShift.expected_cash).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="text-slate-600 font-medium">Tiền mặt thực tế đếm:</span>
                      <span className="font-bold text-xl text-blue-600">{Number(selectedShift.ending_cash).toLocaleString('vi-VN')}đ</span>
                    </div>
                  </>
                )}
              </div>

              {selectedShift.notes && (
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-2">Ghi chú lúc chốt ca</p>
                  <div className="bg-slate-50 text-slate-700 p-3 rounded-xl text-sm italic border border-slate-200">
                    "{selectedShift.notes}"
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
              <button 
                onClick={() => handlePrint()}
                className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-full font-semibold text-sm hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm border border-blue-200/50"
              >
                <Printer size={16} /> In Phiếu
              </button>
              <button 
                onClick={() => setSelectedShift(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Hidden receipt for printing */}
          <div className="hidden">
            <ShiftReceipt ref={printRef} shift={selectedShift} />
          </div>
        </div>
      )}
    </div>
  );
}
