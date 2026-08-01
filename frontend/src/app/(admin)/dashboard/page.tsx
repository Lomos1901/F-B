'use client';

import { useState, useEffect } from 'react';
import { dashboardService } from '@/src/services/dashboardService';
import { toast } from 'react-toastify';
import {
  DollarSign, ShoppingCart, BarChart3, Coffee,
  Loader2, TrendingUp, TrendingDown, AlertTriangle, Bell,
  ChevronRight, Banknote, CreditCard,
} from 'lucide-react';
import DashboardChart from '@/src/components/charts/DashboardChart';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// --- Interfaces ---
interface KpiData {
  total_revenue: number;
  order_count: number;
  avg_revenue_per_order: number;
}
interface ChartData { report_date: string; total_revenue: number; }
interface TopProduct { product_name: string; total_quantity: number; }
interface Anomaly { id: string; alert_category: string; message: string; created_at: string; is_read: boolean; }
interface PaymentMethod { code: string; name: string; total: number; count: number; }
interface DashboardData {
  kpis: KpiData;
  pendingOrdersCount: number;
  revenueChartData: ChartData[];
  topSellingProducts: TopProduct[];
  anomalies: Anomaly[];
  yesterdayRevenue: number;
  paymentBreakdown: PaymentMethod[];
}

// --- Helpers ---
const fmt = (n: number) => n.toLocaleString('vi-VN');
const fmtCurrency = (n: number) => `${fmt(n)}đ`;

/** Tính % tăng/giảm so với hôm qua */
const calcTrend = (today: number, yesterday: number) => {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
};

// --- Reusable M3 Components ---

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`}>
    {children}
  </div>
);

const alertStyle = (cat: string) => {
  if (['LOW_STOCK', 'INVENTORY_FORECAST', 'INVENTORY_DISCREPANCY'].includes(cat))
    return { icon: <AlertTriangle size={16} />, bg: 'bg-amber-50', text: 'text-amber-600' };
  if (['UNUSUAL_SALES', 'SALES_SPIKE', 'AI_INSIGHT'].includes(cat))
    return { icon: <TrendingUp size={16} />, bg: 'bg-blue-50', text: 'text-blue-600' };
  return { icon: <Bell size={16} />, bg: 'bg-slate-50', text: 'text-slate-600' };
};

// --- Main Page ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashboard, anomalies] = await Promise.all([
          dashboardService.getData(days),
          dashboardService.getLatestAnomalies(),
        ]);
        setData({ ...dashboard, anomalies });
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0B57D0] animate-spin" />
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const {
    kpis, pendingOrdersCount, revenueChartData,
    topSellingProducts, anomalies, yesterdayRevenue, paymentBreakdown,
  } = data;

  const revenueTrend = calcTrend(kpis.total_revenue, yesterdayRevenue);
  const isUp = revenueTrend >= 0;

  // Tính tổng thanh toán và tỉ lệ từng phương thức
  const totalPayment = paymentBreakdown?.reduce((s, m) => s + m.total, 0) || 0;

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">

      {/* === HEADER === */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổng quan</h1>
        <p className="text-sm text-slate-500 capitalize">{today}</p>
      </div>

      {/* === TẦNG 1: KPIs === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Doanh thu + trend */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} strokeWidth={2} />
            </div>
            {yesterdayRevenue !== undefined && (
              <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg ${
                isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {Math.abs(revenueTrend)}%
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-0.5">Doanh thu</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{fmtCurrency(kpis.total_revenue)}</p>
        </Card>

        {/* Đơn hàng */}
        <Card>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0B57D0] flex items-center justify-center mb-4">
            <ShoppingCart size={20} strokeWidth={2} />
          </div>
          <p className="text-sm text-slate-500 mb-0.5">Đơn hàng</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{fmt(kpis.order_count)}</p>
        </Card>

        {/* Trung bình / đơn */}
        <Card>
          <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
            <BarChart3 size={20} strokeWidth={2} />
          </div>
          <p className="text-sm text-slate-500 mb-0.5">Trung bình/đơn</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{fmtCurrency(kpis.avg_revenue_per_order)}</p>
        </Card>

        {/* Đang chế biến */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Coffee size={20} strokeWidth={2} />
            </div>
            {pendingOrdersCount > 0 && (
              <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full animate-pulse">
                Đang xử lý
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-0.5">Đang chế biến</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{pendingOrdersCount}</p>
        </Card>
      </div>

      {/* === TẦNG 2: Biểu đồ + Panel phải === */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Biểu đồ doanh thu */}
        <Card className="lg:col-span-3 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <h2 className="text-base font-bold text-slate-900">Doanh thu</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[7, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    days === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {d} ngày
                </button>
              ))}
            </div>
          </div>
          <div className={`h-[240px] sm:h-[280px] w-full transition-opacity ${loading ? 'opacity-40' : ''}`}>
            <DashboardChart data={revenueChartData} />
          </div>
        </Card>

        {/* Panel phải: Thanh toán + Món bán chạy */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Cơ cấu thanh toán */}
          <Card>
            <h2 className="text-base font-bold text-slate-900 mb-4">Thanh toán hôm nay</h2>
            {paymentBreakdown && paymentBreakdown.length > 0 ? (
              <div className="space-y-3">
                {paymentBreakdown.map(method => {
                  const pct = totalPayment > 0 ? Math.round((method.total / totalPayment) * 100) : 0;
                  const isCash = method.code === 'CASH';
                  return (
                    <div key={method.code}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isCash ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#0B57D0]'
                          }`}>
                            {isCash ? <Banknote size={16} /> : <CreditCard size={16} />}
                          </div>
                          {method.name}
                        </div>
                        <span className="font-bold text-slate-900">{fmtCurrency(method.total)}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCash ? 'bg-emerald-500' : 'bg-[#0B57D0]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{method.count} giao dịch · {pct}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Chưa có giao dịch hôm nay</p>
            )}
          </Card>

          {/* Món bán chạy */}
          <Card className="flex-1 flex flex-col">
            <h2 className="text-base font-bold text-slate-900 mb-4">Món bán chạy</h2>
            {topSellingProducts && topSellingProducts.length > 0 ? (
              <ul className="space-y-3.5 flex-1">
                {topSellingProducts.slice(0, 5).map((p, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      i === 0 ? 'bg-[#0B57D0] text-white' :
                      i === 1 ? 'bg-blue-100 text-[#0B57D0]' :
                      i === 2 ? 'bg-blue-50 text-blue-500' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-800 font-medium truncate">{p.product_name}</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{p.total_quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-slate-400">Chưa có dữ liệu hôm nay</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* === TẦNG 3: Cảnh báo (chỉ hiện khi có dữ liệu thật) === */}
      {anomalies && anomalies.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Thông báo</h2>
              <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {anomalies.length}
              </span>
            </div>
            <Link href="/alerts" className="text-xs font-semibold text-[#0B57D0] hover:underline flex items-center gap-0.5">
              Xem tất cả <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.slice(0, 4).map(item => {
              const s = alertStyle(item.alert_category);
              return (
                <div key={item.id} className={`flex items-start gap-3 p-3.5 rounded-2xl ${s.bg}`}>
                  <div className={`p-1.5 rounded-full ${s.text} flex-shrink-0 mt-0.5`}>{s.icon}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{item.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}