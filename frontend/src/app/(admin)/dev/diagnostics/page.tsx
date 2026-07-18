'use client';

import { useState, useEffect } from 'react';
import { analyticsService } from '@/src/services/analyticsService';
import { toast } from 'react-toastify';
import { Bot, Play, CheckCircle, XCircle, Loader2, Warehouse, BarChartHorizontal } from 'lucide-react';

// --- Interfaces ---
interface SalesDiagnosticData {
  product_name: string;
  today_quantity: number;
  mean_daily_sales: number;
  stddev_daily_sales: number;
  threshold: number;
  is_anomaly: boolean;
}

interface InventoryDiagnosticData {
  ingredient_name: string;
  stock_quantity: number;
  unit: string;
  consumption_rate: number | string;
  days_remaining: number | string;
  threshold: number;
  is_alert: boolean;
}

export default function DiagnosticsPage() {
  const [salesDiagnostics, setSalesDiagnostics] = useState<SalesDiagnosticData[]>([]);
  const [inventoryDiagnostics, setInventoryDiagnostics] = useState<InventoryDiagnosticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [forceRun, setForceRun] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesData, inventoryData] = await Promise.all([
        analyticsService.getTodayDiagnostics(),
        analyticsService.getInventoryDiagnostics(),
      ]);
      setSalesDiagnostics(salesData);
      setInventoryDiagnostics(inventoryData);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAnalysis = async () => {
    setRunning(true);
    try {
      const result = await analyticsService.runAnalysis(forceRun);
      toast.success(result.message);
      await fetchData();
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
      <p className="text-dark-text-secondary mb-8">Công cụ này giúp kiểm tra và xác minh logic của hệ thống AI.</p>

      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleRunAnalysis}
          disabled={running}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-500 transition-all"
        >
          {running ? <Loader2 className="animate-spin" /> : <Play />}
          {running ? 'Đang chạy...' : 'Chạy Phân tích Ngay'}
        </button>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="force-run"
            checked={forceRun}
            onChange={(e) => setForceRun(e.target.checked)}
            className="h-5 w-5 rounded bg-dark-bg border-dark-border text-brand-amber focus:ring-brand-amber"
          />
          <label htmlFor="force-run" className="text-sm text-dark-text-secondary">
            Bỏ qua kiểm tra trùng lặp (Force)
          </label>
        </div>
      </div>

      {/* BẢNG CHẨN ĐOÁN KHO HÀNG */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-dark-text-primary mb-4 flex items-center gap-3"><Warehouse />Chẩn đoán Kho hàng</h2>
        <div className="bg-dark-surface border border-dark-border shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-dark-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Nguyên liệu</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Tồn kho</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Tiêu thụ / ngày</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Dự báo (ngày)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Ngưỡng (ngày)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Cảnh báo?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline-block" /></td></tr>
              ) : (
                inventoryDiagnostics.map((item, index) => (
                  <tr key={index} className={item.is_alert ? 'bg-yellow-500/10' : 'hover:bg-dark-bg'}>
                    <td className="px-4 py-4 font-medium text-dark-text-primary">{item.ingredient_name}</td>
                    <td className="px-4 py-4 text-center font-mono text-white">{`${parseFloat(item.stock_quantity).toFixed(2)} ${item.unit}`}</td>
                    <td className="px-4 py-4 text-center font-mono text-dark-text-secondary">{typeof item.consumption_rate === 'number' ? item.consumption_rate.toFixed(2) : item.consumption_rate}</td>
                    <td className="px-4 py-4 text-center font-mono font-bold text-brand-amber">{typeof item.days_remaining === 'number' ? item.days_remaining.toFixed(2) : item.days_remaining}</td>
                    <td className="px-4 py-4 text-center font-mono text-dark-text-secondary">{item.threshold}</td>
                    <td className="px-4 py-4 text-center">
                      {item.is_alert ? <CheckCircle className="inline-block text-green-400" /> : <XCircle className="inline-block text-red-500" />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SỬA LỖI: THÊM LẠI BẢNG CHẨN ĐOÁN DOANH SỐ */}
      <div>
        <h2 className="text-2xl font-semibold text-dark-text-primary mb-4 flex items-center gap-3"><BarChartHorizontal />Chẩn đoán Doanh số</h2>
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
                salesDiagnostics.map((item, index) => (
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
      </div>
    </main>
  );
}