'use client';

import { useState, useEffect } from 'react';
import { dashboardService } from '@/src/services/dashboardService';
import { toast } from 'react-toastify';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Loader2, Bell, Coffee, Calendar, ChevronRight, BarChart3 } from 'lucide-react';
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

// --- M3 Components ---
const M3Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

const M3KpiCard = ({ title, value, icon, formatAsCurrency = false, colorClass = 'text-[#0B57D0]', bgClass = 'bg-[#0B57D0]/10' }: any) => (
  <M3Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-[16px] ${bgClass} ${colorClass}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-[28px] font-bold text-slate-900 leading-tight">
        {formatAsCurrency ? value.toLocaleString('vi-VN') + 'đ' : value.toLocaleString('vi-VN')}
      </h3>
    </div>
  </M3Card>
);

const AlertIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'LOW_STOCK':
    case 'INVENTORY_FORECAST':
    case 'INVENTORY_DISCREPANCY':
      return <div className="p-2 rounded-full bg-[#F2B8B5]/30 text-[#B3261E]"><AlertTriangle size={18} /></div>;
    case 'UNUSUAL_SALES':
    case 'SALES_SPIKE':
    case 'AI_INSIGHT':
      return <div className="p-2 rounded-full bg-[#C2E7FF]/50 text-[#004A77]"><TrendingUp size={18} /></div>;
    default:
      return <div className="p-2 rounded-full bg-slate-100 text-slate-600"><Bell size={18} /></div>;
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
      <div className="flex justify-center items-center min-h-[80vh] bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#0B57D0] animate-spin" />
          <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] bg-[#FAFAFA]">
        <div className="bg-[#F2B8B5]/20 p-8 rounded-[24px] text-center max-w-md">
          <AlertTriangle className="mx-auto text-[#B3261E] mb-4" size={40} />
          <h2 className="text-lg font-bold text-[#B3261E] mb-2">Không thể tải dữ liệu</h2>
          <p className="text-sm text-[#B3261E]/80">Vui lòng kiểm tra kết nối mạng và thử lại.</p>
        </div>
      </div>
    );
  }

  const { kpis, pendingOrdersCount, revenueChartData, topSellingProducts, anomalies } = data;

  return (
    <main className="p-6 md:p-8 max-w-[1400px] mx-auto bg-[#FAFAFA] min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-1">Tổng quan</h1>
          <p className="text-base text-slate-500">Hoạt động kinh doanh cửa hàng hôm nay</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-slate-200 shadow-sm">
          <Calendar size={18} className="text-[#0B57D0]" />
          <span className="text-sm font-medium text-slate-700">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Quick Stats (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <M3KpiCard 
          title="Doanh thu hôm nay" 
          value={kpis.total_revenue} 
          icon={<DollarSign size={24} />} 
          formatAsCurrency 
          colorClass="text-[#146C2E]" 
          bgClass="bg-[#C4EED0]/50" 
        />
        <M3KpiCard 
          title="Đơn hàng hoàn tất" 
          value={kpis.order_count} 
          icon={<ShoppingCart size={24} />} 
          colorClass="text-[#0B57D0]" 
          bgClass="bg-[#D3E3FD]/50" 
        />
        <M3KpiCard 
          title="Giá trị TB / Đơn" 
          value={kpis.avg_revenue_per_order} 
          icon={<BarChart3 size={24} />} 
          formatAsCurrency 
          colorClass="text-[#8F4C38]" 
          bgClass="bg-[#FFDBCF]/50" 
        />
        <M3KpiCard 
          title="Đang chế biến" 
          value={pendingOrdersCount} 
          icon={<Coffee size={24} />} 
          colorClass="text-[#B3261E]" 
          bgClass="bg-[#F2B8B5]/30" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 flex flex-col">
          <M3Card className="flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Doanh thu</h2>
                <p className="text-sm text-slate-500">Biểu đồ biến động doanh thu</p>
              </div>
              
              <div className="flex items-center bg-slate-100 p-1 rounded-full">
                <button 
                  onClick={() => setDays(7)} 
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${days === 7 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  7 Ngày
                </button>
                <button 
                  onClick={() => setDays(30)} 
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${days === 30 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  30 Ngày
                </button>
                {loading && <Loader2 className="animate-spin text-[#0B57D0] ml-2 mr-2" size={16} />}
              </div>
            </div>
            
            <div className="h-[340px] w-full relative mt-auto">
              <div className={`transition-opacity duration-300 w-full h-full ${loading ? 'opacity-50' : 'opacity-100'}`}>
                <DashboardChart data={revenueChartData} />
              </div>
            </div>
          </M3Card>
        </div>

        {/* Right Sidebar area */}
        <div className="space-y-6 flex flex-col">
          
          {/* Top Products */}
          <M3Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Món bán chạy</h2>
                <p className="text-sm text-slate-500">Top sản phẩm được yêu thích</p>
              </div>
            </div>
            
            <ul className="space-y-5">
              {topSellingProducts && topSellingProducts.length > 0 ? (
                topSellingProducts.slice(0, 5).map((product, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      index === 0 ? 'bg-[#D3E3FD] text-[#0B57D0]' : 
                      index === 1 ? 'bg-slate-100 text-slate-700' : 
                      index === 2 ? 'bg-[#FFDBCF]/50 text-[#8F4C38]' : 
                      'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.product_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{product.total_quantity}</p>
                    </div>
                  </li>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                  <Coffee size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Chưa có dữ liệu.</p>
                </div>
              )}
            </ul>
          </M3Card>

          {/* System Alerts */}
          <M3Card className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thông báo</h2>
                <p className="text-sm text-slate-500">Hoạt động & Cảnh báo</p>
              </div>
              {anomalies && anomalies.length > 0 && (
                <span className="bg-[#B3261E] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {anomalies.length}
                </span>
              )}
            </div>
            
            <div className="space-y-5 flex-1">
              {anomalies && anomalies.length > 0 ? (
                anomalies.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 group cursor-pointer">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertIcon category={item.alert_category} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 leading-snug group-hover:text-[#0B57D0] transition-colors line-clamp-2">
                        {item.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Bell size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Không có thông báo mới.</p>
                </div>
              )}
            </div>
            
            <Link href="/alerts" className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-[#0B57D0] hover:bg-[#0B57D0]/5 py-2 rounded-full transition-colors">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </M3Card>
          
        </div>
      </div>
    </main>
  );
}