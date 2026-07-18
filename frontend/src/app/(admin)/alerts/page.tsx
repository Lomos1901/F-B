'use client';

import { useState, useEffect } from 'react';
import { analyticsService } from '@/src/services/analyticsService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Bell, TrendingUp, AlertTriangle, Loader2, Eye, Info, BarChart2 } from 'lucide-react';

interface Anomaly {
  id: string;
  alert_category: string;
  message: string;
  recommended_action: string;
  created_at: string;
  is_read: boolean;
}

const AlertIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'SALES_SPIKE':
      return <TrendingUp className="text-green-400" size={20} />;
    case 'GHOST_PRODUCT':
      return <BarChart2 className="text-purple-400" size={20} />;
    case 'INVENTORY_FORECAST':
      return <Info className="text-yellow-400" size={20} />;
    default:
      return <AlertTriangle className="text-gray-400" size={20} />;
  }
};

export default function AlertsCenterPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getAnomalies();

      // THÊM "MÁY DÒ": In dữ liệu thô ra console của trình duyệt
      console.log('Dữ liệu thô nhận được từ API getAnomalies:', data);

      setAnomalies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setAnomalies(anomalies.map(a => a.id === id ? { ...a, is_read: true } : a));
    try {
      await analyticsService.markAsRead(id);
    } catch (err: any) {
      toast.error(err.message);
      setAnomalies(anomalies.map(a => a.id === id ? { ...a, is_read: false } : a));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-brand-amber" size={48} />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold text-dark-text-primary mb-8 flex items-center gap-3">
        <Bell size={28} />
        Trung tâm Cảnh báo
      </h1>

      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <p className="text-center py-10 text-dark-text-secondary">Không có cảnh báo nào.</p>
        ) : (
          anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`bg-dark-surface border border-dark-border rounded-lg p-5 flex gap-4 items-start transition-opacity duration-300 ${anomaly.is_read ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="pt-1">
                <AlertIcon category={anomaly.alert_category} />
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-dark-text-primary">{anomaly.message}</p>
                {anomaly.recommended_action && (
                  <p className="text-sm text-brand-amber mt-1">
                    <span className="font-semibold">Gợi ý:</span> {anomaly.recommended_action}
                  </p>
                )}
                <p className="text-xs text-dark-text-secondary mt-2">
                  {formatDistanceToNow(new Date(anomaly.created_at), { addSuffix: true, locale: vi })}
                </p>
              </div>
              {!anomaly.is_read && (
                <button
                  onClick={() => handleMarkAsRead(anomaly.id)}
                  className="p-2 text-dark-text-secondary hover:bg-dark-bg hover:text-white rounded-full"
                  title="Đánh dấu đã đọc"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}