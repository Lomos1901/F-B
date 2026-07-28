'use client';

import { useState, useEffect } from 'react';
import { paymentService } from '@/src/services/paymentService';
import { Save, Building2, CreditCard, User, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankBin, setBankBin] = useState('970422');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const { user } = useAuth();
  const router = useRouter();

  // Danh sách các ngân hàng phổ biến tại Việt Nam (Mã BIN)
  const BANKS = [
    { bin: '970422', name: 'MBBank - Ngân hàng Quân Đội' },
    { bin: '970436', name: 'Vietcombank' },
    { bin: '970415', name: 'VietinBank' },
    { bin: '970418', name: 'BIDV' },
    { bin: '970405', name: 'Agribank' },
    { bin: '970407', name: 'Techcombank' },
    { bin: '970423', name: 'TPBank' },
    { bin: '970432', name: 'VPBank' },
    { bin: '970416', name: 'ACB' },
    { bin: '970403', name: 'Sacombank' },
    { bin: '970427', name: 'VietABank' },
    { bin: '970454', name: 'VietCapitalBank' },
  ];

  useEffect(() => {
    paymentService.getBankInfo()
      .then(data => {
        setBankBin(data.bank_bin || '970422');
        setAccountNumber(data.account_number || '');
        setAccountName(data.account_name || '');
      })
      .catch(err => {
        console.error('Lỗi khi tải thông tin ngân hàng:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (user && user.role !== 'OWNER') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSave = async () => {
    if (!accountNumber || !accountName) {
      toast.error('Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản');
      return;
    }
    
    setSaving(true);
    try {
      await paymentService.updateBankInfo(bankBin, accountNumber, accountName);
      toast.success('Lưu thông tin ngân hàng thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF9F8]">
        <Loader2 className="animate-spin text-[#FFB800]" size={48} />
      </div>
    );
  }

  if (!user || user.role !== 'OWNER') return null;

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-[#4B2C20] p-6 sm:p-10" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cài Đặt Quán</h1>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="text-[#FFB800]" />
              Cấu hình Ngân Hàng nhận tiền
            </h2>
            <p className="text-sm text-gray-500 mt-1">Thông tin này sẽ được dùng để tạo mã QR Chuyển khoản (VietQR) cho khách quét tại quầy POS.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Chọn Ngân Hàng */}
            <div>
              <label className="block text-sm font-bold text-[#4B2C20] mb-2 flex items-center gap-2">
                Ngân hàng
              </label>
              <select 
                value={bankBin}
                onChange={(e) => setBankBin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent transition-all bg-white"
              >
                {BANKS.map(bank => (
                  <option key={bank.bin} value={bank.bin}>{bank.name}</option>
                ))}
              </select>
            </div>

            {/* Số tài khoản */}
            <div>
              <label className="block text-sm font-bold text-[#4B2C20] mb-2 flex items-center gap-2">
                <CreditCard size={18} className="text-gray-400" />
                Số tài khoản
              </label>
              <input 
                type="text" 
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                placeholder="Ví dụ: 123456789"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent transition-all"
              />
            </div>

            {/* Tên chủ tài khoản */}
            <div>
              <label className="block text-sm font-bold text-[#4B2C20] mb-2 flex items-center gap-2">
                <User size={18} className="text-gray-400" />
                Tên chủ tài khoản
              </label>
              <input 
                type="text" 
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                placeholder="Ví dụ: NGUYEN VAN A"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent transition-all uppercase"
              />
            </div>

            {/* Demo QR */}
            {accountNumber && accountName && (
              <div className="mt-8 p-6 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-gray-300">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Mã QR Xem trước</p>
                <img 
                  src={`https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=50000&addInfo=Thanh toan don hang&accountName=${encodeURIComponent(accountName)}`}
                  alt="Demo QR"
                  className="w-48 h-48 object-contain bg-white p-2 rounded-xl shadow-sm"
                />
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#4B2C20] hover:bg-[#3A2218] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
