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
      <div className="flex h-full items-center justify-center bg-[#FCF9F8]">
        <Loader2 className="animate-spin text-[#FFB800]" size={48} />
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
    <div className="flex flex-col h-full bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <div className="px-6 py-6 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="text-[#FFB800]" size={28} />
            Lịch sử Ca làm việc
          </h1>
          <p className="text-gray-500 mt-1">Quản lý và đối soát doanh thu theo từng ca.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <Calendar className="text-gray-400 ml-2" size={20} />
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none p-1"
          />
          <span className="text-gray-400">-</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none p-1"
          />
        </div>
      </div>

      <div className="p-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex justify-center items-center">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Tổng số ca đã chốt</p>
              <p className="text-2xl font-black text-[#4B2C20]">{closedShifts.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex justify-center items-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Tiền thất thoát (Âm)</p>
              <p className="text-2xl font-black text-red-600">{totalMissing.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex justify-center items-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Tiền dư (Dương)</p>
              <p className="text-2xl font-black text-green-600">+{totalSurplus.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-gray-200">Thời gian ca</th>
                  <th className="p-4 font-bold border-b border-gray-200">Nhân sự</th>
                  <th className="p-4 font-bold border-b border-gray-200 text-right">Hệ thống tính</th>
                  <th className="p-4 font-bold border-b border-gray-200 text-right">Thực tế đếm</th>
                  <th className="p-4 font-bold border-b border-gray-200 text-right">Chênh lệch</th>
                  <th className="p-4 font-bold border-b border-gray-200 text-center">Trạng thái</th>
                  <th className="p-4 font-bold border-b border-gray-200"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shifts.map((shift) => {
                  const diff = shift.status === 'CLOSED' ? Number(shift.ending_cash) - Number(shift.expected_cash) : 0;
                  
                  return (
                    <tr 
                      key={shift.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedShift(shift)}
                    >
                      <td className="p-4">
                        <div className="text-sm font-bold text-[#4B2C20]">
                          {format(new Date(shift.start_time), 'HH:mm')} - {shift.end_time ? format(new Date(shift.end_time), 'HH:mm') : '...'}
                        </div>
                        <div className="text-xs text-gray-500">{format(new Date(shift.start_time), 'dd/MM/yyyy')} ({calculateDuration(shift.start_time, shift.end_time)})</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-gray-800">{shift.opener?.full_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400">Mở két</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm font-bold text-gray-600">
                          {shift.status === 'CLOSED' ? Number(shift.expected_cash).toLocaleString('vi-VN') + 'đ' : '---'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm font-bold text-[#4B2C20]">
                          {shift.status === 'CLOSED' ? Number(shift.ending_cash).toLocaleString('vi-VN') + 'đ' : '---'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {shift.status === 'CLOSED' ? (
                          <div className={`text-sm font-bold inline-flex px-2 py-1 rounded-lg ${diff === 0 ? 'bg-green-100 text-green-700' : diff < 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')}đ
                          </div>
                        ) : (
                          <span className="text-gray-300">---</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {shift.status === 'OPEN' ? (
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Đang mở</span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Đã chốt</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-gray-300 group-hover:text-[#FFB800] transition-colors">
                        <ChevronRight size={20} />
                      </td>
                    </tr>
                  );
                })}
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-[#4B2C20] flex items-center gap-2">
                <FileText size={24} className="text-[#FFB800]" />
                Chi tiết Ca Làm Việc
              </h2>
              <button 
                onClick={() => setSelectedShift(null)}
                className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Thời gian mở</p>
                  <p className="text-sm font-semibold text-gray-800">{format(new Date(selectedShift.start_time), 'HH:mm - dd/MM/yyyy')}</p>
                  <p className="text-xs text-gray-500 mt-1">Bởi: {selectedShift.opener?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Thời gian chốt</p>
                  {selectedShift.end_time ? (
                    <>
                      <p className="text-sm font-semibold text-gray-800">{format(new Date(selectedShift.end_time), 'HH:mm - dd/MM/yyyy')}</p>
                      <p className="text-xs text-gray-500 mt-1">Bởi: {selectedShift.closer?.full_name}</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">Chưa chốt</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Tiền mặt đầu ca:</span>
                  <span className="font-bold text-gray-800">{Number(selectedShift.starting_cash).toLocaleString('vi-VN')}đ</span>
                </div>
                {selectedShift.status === 'CLOSED' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Tiền mặt hệ thống tính:</span>
                      <span className="font-bold text-gray-800">{Number(selectedShift.expected_cash).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="text-gray-600 font-medium">Tiền mặt thực tế đếm:</span>
                      <span className="font-bold text-xl text-[#FFB800]">{Number(selectedShift.ending_cash).toLocaleString('vi-VN')}đ</span>
                    </div>
                  </>
                )}
              </div>

              {selectedShift.notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">Ghi chú lúc chốt ca</p>
                  <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm italic border border-yellow-100">
                    "{selectedShift.notes}"
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between">
              <button 
                onClick={() => handlePrint()}
                className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-200 transition-colors flex items-center gap-2"
              >
                <Printer size={16} /> In Phiếu
              </button>
              <button 
                onClick={() => setSelectedShift(null)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
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
