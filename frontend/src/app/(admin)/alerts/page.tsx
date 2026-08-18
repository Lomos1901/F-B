'use client';

import { useState, useEffect } from 'react';
import { analyticsService } from '@/src/services/analyticsService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Bell, TrendingUp, AlertTriangle, Loader2, Eye, Info, BarChart2, Sparkles, BrainCircuit, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Anomaly {
  id: string;
  alert_category: string;
  message: string;
  recommended_action: string;
  created_at: string;
  is_read: boolean;
  expected_value?: number;
  actual_value?: number;
  anomaly_score?: number;
}

const AlertIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'SALES_SPIKE':
      return <TrendingUp className="text-emerald-500" size={24} />;
    case 'GHOST_PRODUCT':
      return <BarChart2 className="text-purple-500" size={24} />;
    case 'INVENTORY_FORECAST':
      return <Info className="text-blue-500" size={24} />;
    case 'INVENTORY_DISCREPANCY':
      return <AlertTriangle className="text-amber-500" size={24} />;
    case 'AI_INSIGHT':
      return <Sparkles className="text-blue-600" size={24} />;
    default:
      return <AlertTriangle className="text-red-500" size={24} />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'SALES_SPIKE': return 'Doanh thu đột biến';
    case 'GHOST_PRODUCT': return 'Sản phẩm ế ẩm';
    case 'INVENTORY_FORECAST': return 'Dự báo cạn kho';
    case 'INVENTORY_DISCREPANCY': return 'Chênh lệch tồn kho';
    case 'AI_INSIGHT': return 'Trợ lý AI Phân tích';
    default: return 'Cảnh báo hệ thống';
  }
};

export default function AlertsCenterPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getAnomalies(activeTab === 'UNREAD');
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
  }, [activeTab]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await analyticsService.markAsRead(id);
      setAnomalies(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
      toast.success('Đã đánh dấu đọc');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleGenerateAIReport = async () => {
    setIsGenerating(true);
    try {
      // Ép hệ thống quét lại toàn bộ cảnh báo kho hàng và doanh thu ngay lập tức
      await analyticsService.runAnalysis(true);
      toast.success('Hệ thống đã quét và cập nhật cảnh báo!');
      
      setActiveTab('ALL');
      await fetchAnomalies();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi quét dữ liệu');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading && anomalies.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }


  return (
    <main className="flex flex-col h-full bg-slate-50 text-slate-800">
      {/* HEADER */}
      <div className="px-6 py-6 border-b border-slate-200 bg-white flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <BrainCircuit className="text-blue-600" size={28} />
            Trung tâm Cảnh báo AI (AI Command Center)
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Hệ thống AI tự động theo dõi, phân tích dữ liệu và đưa ra khuyến nghị theo thời gian thực.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleGenerateAIReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                AI Đang suy nghĩ...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                QUÉT CẢNH BÁO NGAY
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
        {/* TABS */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('ALL')}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
              activeTab === 'ALL' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Tất cả Cảnh báo
          </button>
          <button 
            onClick={() => setActiveTab('UNREAD')}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
              activeTab === 'UNREAD' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Chưa đọc
          </button>
        </div>

        {/* PHẦN DANH SÁCH CẢNH BÁO */}

        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Hệ thống đang hoạt động ổn định</h3>
            <p className="text-slate-500 max-w-md text-sm">Không có dấu hiệu bất thường nào được AI ghi nhận. Mọi thứ đều trong tầm kiểm soát.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.filter(a => a.alert_category !== 'AI_INSIGHT').map(anomaly => (
              <div 
                key={anomaly.id} 
                className={`relative overflow-hidden bg-white rounded-xl border transition-all duration-200 ${
                  anomaly.is_read 
                    ? 'border-slate-200 opacity-70' 
                    : 'border-blue-200 shadow-sm'
                }`}
              >
                {!anomaly.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                )}
                <div className="p-4 flex flex-col sm:flex-row gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                    <AlertIcon category={anomaly.alert_category} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          {getCategoryLabel(anomaly.alert_category)}
                        </span>
                        {!anomaly.is_read && (
                          <span className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            MỚI
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatDistanceToNow(new Date(anomaly.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    
                    <p className="text-slate-700 font-medium text-sm mb-2">{anomaly.message}</p>

                    {anomaly.alert_category === 'INVENTORY_FORECAST' && anomaly.actual_value !== undefined && anomaly.actual_value < 3 && (
                      <div className="mb-3 inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-md text-[11px] font-bold">
                        <AlertTriangle size={14} className="text-red-600" />
                        {anomaly.actual_value <= 0.5 
                          ? 'KHẨN CẤP: Đã hết hoặc sắp hết trong ngày hôm nay!' 
                          : `RỦI RO: Chỉ còn đủ dùng trong ${Math.floor(anomaly.actual_value)} ngày tới`}
                      </div>
                    )}

                    {anomaly.recommended_action && (
                      <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 mb-3 inline-block">
                        <span className="text-[11px] font-bold text-amber-700">💡 Gợi ý:</span>
                        <span className="text-[11px] text-amber-700/80 ml-1.5 font-medium">{anomaly.recommended_action}</span>
                      </div>
                    )}
                    
                    {!anomaly.is_read && (
                      <div className="flex justify-end mt-1">
                        <button 
                          onClick={() => handleMarkAsRead(anomaly.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                          Đánh dấu xử lý
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}