'use client';

import { useState, useEffect } from 'react';
import { analyticsService } from '@/src/services/analyticsService';
import { toast } from 'react-toastify';
import { Bot, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DiagnosticData {
  product_name: string;
  today_quantity: number;
  mean_daily_sales: number;
  stddev_daily_sales: number;
  threshold: number;
  is_anomaly: boolean;
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getTodayDiagnostics();
      setDiagnostics(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleRunAnalysis = async () => {
    setRunning(true);
    try {
      const result = await analyticsService.runAnalysis();
      toast.success(result.message);
      // Tải lại dữ liệu chẩn đoán sau khi chạy để xem có gì thay đổi không
      // và tải lại trang Trung tâm Cảnh báo để xem kết quả
      await fetchDiagnostics();
      window.location.href = '/alerts';
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold text-dark-text-primary mb-4 flex items-center gap-3">
        <Bot size={28} />
        Trang Chẩn đoán AI
      </h1>
      <p className="text-dark-text-secondary mb-8">Công cụ này giúp kiểm tra logic phát hiện bất thường của hệ thống.</p>

      <div className="mb-8">
        <button
          onClick={handleRunAnalysis}
          disabled={running}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-500 transition-all"
        >
          {running ? <Loader2 className="animate-spin" /> : <Play />}
          {running ? 'Đang chạy...' : 'Chạy Phân tích Ngay'}
        </button>
      </div>

      <div className="bg-dark-surface border border-dark-border shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Sản phẩm</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Bán hôm nay</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Trung bình (30d)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Độ lệch chuẩn</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Ngưỡng Cảnh báo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Bất thường?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline-block" /></td></tr>
            ) : (
              diagnostics.map((item, index) => (
                <tr key={index} className={item.is_anomaly ? 'bg-yellow-500/10' : 'hover:bg-dark-bg'}>
                  <td className="px-4 py-4 font-medium text-dark-text-primary">{item.product_name}</td>
                  <td className="px-4 py-4 text-center font-mono text-lg font-bold text-white">{item.today_quantity}</td>
                  <td className="px-4 py-4 text-center font-mono text-dark-text-secondary">{item.mean_daily_sales.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center font-mono text-dark-text-secondary">{item.stddev_daily_sales.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center font-mono text-brand-amber">{item.threshold.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">
                    {item.is_anomaly ? <CheckCircle className="inline-block text-green-400" /> : <XCircle className="inline-block text-red-500" />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}