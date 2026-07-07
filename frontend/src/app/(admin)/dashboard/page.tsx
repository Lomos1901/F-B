'use client';

import { useState, useEffect } from 'react';
import { dashboardService } from '@/src/services/dashboardService';
import { toast } from 'react-toastify';
import { DollarSign, ShoppingCart, BarChart, AlertTriangle, TrendingUp, Loader2, Bell, ArrowRight } from 'lucide-react';
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
  alert_category: string; // Thêm category để chọn icon
  message: string;
  created_at: string;
}
interface DashboardData {
  kpis: KpiData;
  pendingOrdersCount: number;
  revenueChartData: ChartData[];
  topSellingProducts: TopProduct[];
  anomalies: Anomaly[];
}

// --- Components con ---
const KpiCard = ({ title, value, icon, formatAsCurrency = false }: { title: string, value: number, icon: React.ReactNode, formatAsCurrency?: boolean }) => (
  <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
    <div className="flex justify-between items-start">
      <p className="text-sm font-medium text-dark-text-secondary">{title}</p>
      {icon}
    </div>
    <p className="text-3xl font-bold mt-2">
      {formatAsCurrency ? value.toLocaleString('vi-VN') + 'đ' : value.toLocaleString('vi-VN')}
    </p>
  </div>
);

const AlertIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'SALES_SPIKE':
      return <TrendingUp className="text-green-400" size={24} />;
    default:
      return <AlertTriangle className="text-yellow-400" size={24} />;
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
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-brand-amber" size={48} />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-red-500">Không thể tải dữ liệu dashboard.</div>;
  }

  const { kpis, pendingOrdersCount, revenueChartData, topSellingProducts, anomalies } = data;

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold text-dark-text-primary mb-8">Tổng quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Doanh thu hôm nay" value={kpis.total_revenue} icon={<DollarSign size={24} className="text-green-400"/>} formatAsCurrency />
        <KpiCard title="Số đơn hôm nay" value={kpis.order_count} icon={<ShoppingCart size={24} className="text-blue-400"/>} />
        <KpiCard title="Doanh thu / đơn" value={kpis.avg_revenue_per_order} icon={<BarChart size={24} className="text-purple-400"/>} formatAsCurrency />
        <KpiCard title="Số đơn đang chờ" value={pendingOrdersCount} icon={<Loader2 size={24} className="text-yellow-400"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-dark-surface p-6 rounded-lg border border-dark-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Biểu đồ Doanh thu</h2>
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="animate-spin text-dark-text-secondary" size={16} />}
              <button onClick={() => setDays(7)} className={`px-3 py-1 text-sm rounded-md ${days === 7 ? 'bg-brand-amber text-black font-semibold' : 'bg-dark-bg'}`}>7 ngày</button>
              <button onClick={() => setDays(30)} className={`px-3 py-1 text-sm rounded-md ${days === 30 ? 'bg-brand-amber text-black font-semibold' : 'bg-dark-bg'}`}>30 ngày</button>
            </div>
          </div>
          <div className="h-[300px]">
            <DashboardChart data={revenueChartData} />
          </div>
        </div>

        <div className="space-y-8">
          {/* WIDGET CẢNH BÁO ĐÃ NÂNG CẤP */}
          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Bell size={20}/>Cảnh báo Mới nhất</h2>
            <div className="space-y-6">
              {anomalies && anomalies.length > 0 ? (
                anomalies.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center">
                      <AlertIcon category={item.alert_category} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-text-primary">{item.message}</p>
                      <p className="text-xs text-dark-text-secondary mt-1">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-dark-text-secondary text-center py-8">Không có cảnh báo mới.</p>
              )}
            </div>
            <Link href="/alerts" className="mt-8 block text-center text-sm font-semibold text-brand-amber hover:underline">
              Xem tất cả trong Trung tâm Cảnh báo
            </Link>
          </div>

          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUp size={20}/>Top 5 Món bán chạy</h2>
            <ul className="space-y-3">
              {topSellingProducts && topSellingProducts.length > 0 ? (
                topSellingProducts.map((product, index) => (
                  <li key={index} className="flex justify-between items-center text-sm">
                    <span className="text-dark-text-primary">{index + 1}. {product.product_name}</span>
                    <span className="font-bold text-dark-text-secondary">{product.total_quantity}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-dark-text-secondary text-center py-4">Chưa có dữ liệu.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}