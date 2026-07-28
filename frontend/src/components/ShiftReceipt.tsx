import { format } from 'date-fns';
import { forwardRef } from 'react';

interface ShiftReceiptProps {
  shift: any;
}

const ShiftReceipt = forwardRef<HTMLDivElement, ShiftReceiptProps>(({ shift }, ref) => {
  if (!shift) return null;

  const diff = shift.status === 'CLOSED' ? Number(shift.ending_cash) - Number(shift.expected_cash) : 0;
  
  // Calculate cash_sales from expected_cash - starting_cash for historical shifts
  // or use metrics if available (for current shift)
  const cashSales = shift.metrics?.cash_sales ?? (Number(shift.expected_cash) - Number(shift.starting_cash));
  const transferSales = shift.metrics?.transfer_sales ?? '---';
  const totalSales = shift.metrics?.total_sales ?? '---';

  return (
    <div 
      ref={ref}
      className="bg-white p-6 max-w-sm mx-auto text-black print:p-0 print:w-full print:max-w-full"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-black pb-4 border-dashed">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">SẪM COFFEE</h1>
        <p className="text-xs">123 Đường Cà Phê, Quận 1, TP.HCM</p>
        <p className="text-xs">SĐT: 0909 123 456</p>
        <h2 className="text-xl font-bold uppercase mt-4">Phiếu Chốt Ca</h2>
        <p className="text-sm mt-1">Mã ca: {shift.id.substring(0, 8).toUpperCase()}</p>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-6 border-b-2 border-black pb-4 border-dashed text-sm">
        <div className="flex justify-between">
          <span>Ngày:</span>
          <span>{format(new Date(shift.start_time), 'dd/MM/yyyy')}</span>
        </div>
        <div className="flex justify-between">
          <span>Giờ mở:</span>
          <span>{format(new Date(shift.start_time), 'HH:mm')}</span>
        </div>
        <div className="flex justify-between">
          <span>Giờ chốt:</span>
          <span>{shift.end_time ? format(new Date(shift.end_time), 'HH:mm') : '---'}</span>
        </div>
        <div className="flex justify-between">
          <span>Nhân viên mở:</span>
          <span>{shift.opener?.full_name || shift.users?.full_name || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Nhân viên chốt:</span>
          <span>{shift.closer?.full_name || shift.users?.full_name || 'N/A'}</span>
        </div>
      </div>

      {/* Financials */}
      <div className="space-y-3 mb-6 border-b-2 border-black pb-4 border-dashed text-sm">
        <h3 className="font-bold uppercase text-center mb-2">Chi Tiết Doanh Thu</h3>
        
        {totalSales !== '---' && (
          <>
            <div className="flex justify-between">
              <span>Tổng doanh thu:</span>
              <span>{totalSales.toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Khách CK:</span>
              <span>{transferSales.toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Tiền mặt thu vào:</span>
              <span>{cashSales.toLocaleString('vi-VN')}</span>
            </div>
            <div className="my-2 border-t border-dotted border-gray-400"></div>
          </>
        )}

        <div className="flex justify-between">
          <span>Tiền vốn đầu ca:</span>
          <span>{Number(shift.starting_cash).toLocaleString('vi-VN')}</span>
        </div>
        
        <div className="flex justify-between font-bold text-base mt-2">
          <span>Hệ thống tính:</span>
          <span>{Number(shift.expected_cash).toLocaleString('vi-VN')}</span>
        </div>
        
        <div className="flex justify-between font-bold text-base mt-2">
          <span>Thực tế bàn giao:</span>
          <span>{Number(shift.ending_cash).toLocaleString('vi-VN')}</span>
        </div>

        <div className="flex justify-between font-bold mt-2 pt-2 border-t border-black">
          <span>Mức chênh lệch:</span>
          <span>{diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')}</span>
        </div>
      </div>

      {/* Notes & Signatures */}
      <div className="text-sm">
        {shift.notes && (
          <div className="mb-6">
            <p className="font-bold">Ghi chú:</p>
            <p className="italic">{shift.notes}</p>
          </div>
        )}

        <div className="flex justify-between mt-8 text-center px-4">
          <div>
            <p className="font-bold">Người bàn giao</p>
            <p className="text-xs italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-16"></div>
          </div>
          <div>
            <p className="font-bold">Người nhận</p>
            <p className="text-xs italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-16"></div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs mt-8 italic">
        <p>Cảm ơn & Hẹn gặp lại!</p>
        <p>In lúc: {format(new Date(), 'HH:mm dd/MM/yyyy')}</p>
      </div>
    </div>
  );
});

ShiftReceipt.displayName = 'ShiftReceipt';

export default ShiftReceipt;
