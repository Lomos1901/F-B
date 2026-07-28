'use client';

import { useState, useEffect } from 'react';
import { dashboardService } from '@/src/services/dashboardService';
import { toast } from 'react-toastify';
import { DollarSign, ShoppingCart, BarChart, AlertTriangle, TrendingUp, Loader2, Bell, Coffee, Calendar } from 'lucide-react';
import DashboardChart from '@/src/components/charts/DashboardChart';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// --- Định nghĩa Interfaces ---
interface KpiData {
  total_revenue: number;
  order_count: number;
  avg_revenue_per_order: number;
}
interface ChartData {
  report_date: string;
  total_revenue: number;
}
interface TopProduct {
  product_name: string;
  total_quantity: number;
}
interface Anomaly {
  id: string;
  alert_category: string;
  message: string;
  created_at: string;
  is_read: boolean;
}
interface DashboardData {
  kpis: KpiData;
  pendingOrdersCount: number;
  revenueChartData: ChartData[];
  topSellingProducts: TopProduct[];
  anomalies: Anomaly[];
}

// --- Components con ---
const KpiCard = ({ title, value, icon, formatAsCurrency = false, trendLabel = null }: any) => (
  <div className="relative overflow-hidden bg-dark-surface p-6 rounded-2xl border border-dark-border shadow-sm group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 rounded-xl bg-dark-bg border border-dark-border/50 group-hover:scale-110 group-hover:bg-brand-amber/10 transition-all duration-300">
        {icon}
      </div>
      {trendLabel && (
        <span className="flex items-center text-[11px] font-bold px-2 py-1 rounded-md bg-dark-bg text-dark-text-secondary">
          {trendLabel}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-xs font-bold text-dark-text-secondary uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-3xl font-black text-dark-text-primary tracking-tight">
        {formatAsCurrency ? value.toLocaleString('vi-VN') + 'đ' : value.toLocaleString('vi-VN')}
      </p>
    </div>
    {/* Decorative background glow */}
    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-brand-amber/5 rounded-full blur-3xl group-hover:bg-brand-amber/10 transition-colors pointer-events-none" />
  </div>
);

const AlertIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'LOW_STOCK':
      return <div className="p-1.5 rounded-full bg-yellow-500/10 text-yellow-500"><AlertTriangle size={16} /></div>;
    case 'UNUSUAL_SALES':
      return <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500"><TrendingUp size={16} /></div>;
    default:
      return <div className="p-1.5 rounded-full bg-slate-500/10 text-slate-500"><Bell size={16} /></div>;
  }
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashboardResult, anomaliesResult] = await Promise.all([
          dashboardService.getData(days),
          dashboardService.getLatestAnomalies()
        ]);

        setData({ ...dashboardResult, anomalies: anomaliesResult });

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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-amber/20 border-t-brand-amber rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-dark-text-secondary animate-pulse">Đang đồng bộ dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="bg-red-500/10 p-8 rounded-2xl text-center max-w-md">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={40} />
          <h2 className="text-lg font-bold text-red-500 mb-2">Lỗi kết nối dữ liệu</h2>
          <p className="text-sm text-red-400">Không thể tải dữ liệu dashboard. Vui lòng kiểm tra lại đường truyền hoặc thử lại sau.</p>
        </div>
      </div>
    );
  }

  const { kpis, pendingOrdersCount, revenueChartData, topSellingProducts, anomalies } = data;

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark-text-primary tracking-tight">Tổng quan</h1>
          <p className="text-sm font-medium text-dark-text-secondary mt-1">Theo dõi hoạt động kinh doanh Sẫm Coffee</p>
        </div>
        <div className="flex items-center gap-2 bg-dark-surface px-4 py-2 rounded-xl border border-dark-border shadow-sm">
          <Calendar size={18} className="text-brand-amber" />
          <span className="text-sm font-bold text-dark-text-primary">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Doanh thu hôm nay" value={kpis.total_revenue} icon={<DollarSign size={24} className="text-emerald-500"/>} formatAsCurrency trendLabel="HÔM NAY" />
        <KpiCard title="Số đơn hôm nay" value={kpis.order_count} icon={<ShoppingCart size={24} className="text-blue-500"/>} trendLabel="HÔM NAY" />
        <KpiCard title="Doanh thu / đơn" value={kpis.avg_revenue_per_order} icon={<BarChart size={24} className="text-indigo-500"/>} formatAsCurrency trendLabel="HÔM NAY" />
        <KpiCard title="Đang chế biến" value={pendingOrdersCount} icon={<Coffee size={24} className="text-amber-500"/>} trendLabel="TRỰC TIẾP" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border shadow-sm flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-dark-text-primary">Phân tích Doanh thu</h2>
                <p className="text-sm text-dark-text-secondary font-medium">Xu hướng doanh thu theo thời gian</p>
              </div>
              
              <div className="flex items-center bg-dark-bg p-1 rounded-xl border border-dark-border/50">
                <button onClick={() => setDays(7)} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${days === 7 ? 'bg-dark-surface text-brand-amber shadow-sm border border-dark-border/50' : 'text-dark-text-secondary hover:text-dark-text-primary'}`}>
                  7 Ngày
                </button>
                <button onClick={() => setDays(30)} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${days === 30 ? 'bg-dark-surface text-brand-amber shadow-sm border border-dark-border/50' : 'text-dark-text-secondary hover:text-dark-text-primary'}`}>
                  30 Ngày
                </button>
                {loading && <Loader2 className="animate-spin text-brand-amber ml-2 mr-1" size={16} />}
              </div>
            </div>
            
            <div className="h-[320px] w-full relative">
              {/* Giả sử DashboardChart có khả năng hiển thị loading hoặc mờ đi */}
              <div className={`transition-opacity duration-300 w-full h-full ${loading ? 'opacity-50' : 'opacity-100'}`}>
                <DashboardChart data={revenueChartData} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-8 flex flex-col">
          
          {/* Top Products */}
          <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-amber-500/10 text-brand-amber">
                <TrendingUp size={20}/>
              </div>
              <h2 className="text-lg font-bold text-dark-text-primary">Món bán chạy</h2>
            </div>
            
            <ul className="space-y-4">
              {topSellingProducts && topSellingProducts.length > 0 ? (
                topSellingProducts.map((product, index) => (
                  <li key={index} className="flex items-center gap-4 group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 border ${
                      index === 0 ? 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30' : 
                      index === 1 ? 'bg-slate-300/20 text-slate-500 border-slate-300/30' : 
                      index === 2 ? 'bg-amber-700/10 text-amber-700 border-amber-700/20' : 
                      'bg-dark-bg text-dark-text-secondary border-dark-border'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-dark-text-primary truncate group-hover:text-brand-amber transition-colors">{product.product_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-dark-text-primary">{product.total_quantity}</p>
                      <p className="text-[10px] text-dark-text-secondary font-bold uppercase tracking-wider">Lượt gọi</p>
                    </div>
                  </li>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-dark-text-secondary">
                  <Coffee size={32} className="opacity-20 mb-2" />
                  <p className="text-sm font-medium">Chưa có dữ liệu món bán chạy.</p>
                </div>
              )}
            </ul>
          </div>

          {/* Alerts */}
          <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                  <Bell size={20}/>
                </div>
                <h2 className="text-lg font-bold text-dark-text-primary">Cảnh báo</h2>
              </div>
              {anomalies && anomalies.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {anomalies.length}
                </span>
              )}
            </div>
            
            <div className="space-y-4 flex-1">
              {anomalies && anomalies.length > 0 ? (
                anomalies.slice(0, 4).map((item) => (
                  <div key={item.id} className="group relative pl-4 border-l-2 border-transparent hover:border-brand-amber transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertIcon category={item.alert_category} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark-text-primary leading-snug group-hover:text-brand-amber transition-colors">{item.message}</p>
                        <p className="text-xs text-dark-text-secondary mt-1 font-medium">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-dark-text-secondary">
                  <Bell size={32} className="opacity-20 mb-2" />
                  <p className="text-sm font-medium">Hệ thống đang hoạt động ổn định.</p>
                </div>
              )}
            </div>
            
            <Link href="/alerts" className="mt-6 pt-4 border-t border-dark-border block text-center text-sm font-bold text-brand-amber hover:text-brand-amber-dark transition-colors">
              Mở Trung tâm Cảnh báo
            </Link>
          </div>
          
        </div>
      </div>
    </main>
  );
}