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
}

const AlertIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'SALES_SPIKE':
      return <TrendingUp className="text-emerald-500" size={24} />;
    case 'GHOST_PRODUCT':
      return <BarChart2 className="text-purple-500" size={24} />;
    case 'INVENTORY_FORECAST':
      return <Info className="text-blue-500" size={24} />;
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
    case 'INVENTORY_FORECAST': return 'Cảnh báo tồn kho';
    case 'AI_INSIGHT': return 'Trợ lý AI Phân tích';
    default: return 'Cảnh báo hệ thống';
  }
};

export default function AlertsCenterPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [selectedScenario, setSelectedScenario] = useState<string>('real');

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getAnomalies();
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
      await analyticsService.generateAiReport(selectedScenario);
      toast.success('AI đã phân tích xong dữ liệu!');
      
      setActiveTab('ALL');
      await fetchAnomalies();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gọi AI');
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
          <select 
            value={selectedScenario} 
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-sm text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="real">⚡ Dữ liệu Thực tế (Realtime)</option>
            <option value="spike">🌪️ Kịch bản: Bão đơn hàng (Tăng vọt)</option>
            <option value="ghost">📉 Kịch bản: Ế ẩm cuối tháng</option>
            <option value="fraud">⚠️ Kịch bản: Báo động nhân viên gian lận</option>
          </select>
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
                YÊU CẦU AI PHÂN TÍCH NGAY
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

        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Hệ thống đang hoạt động ổn định</h3>
            <p className="text-slate-500 max-w-md text-sm">Không có dấu hiệu bất thường nào được AI ghi nhận. Mọi thứ đều trong tầm kiểm soát.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <div 
                key={anomaly.id} 
                className={`relative overflow-hidden bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${
                  anomaly.is_read 
                    ? 'border-slate-200 opacity-75' 
                    : 'border-blue-200 shadow-sm'
                }`}
              >
                {!anomaly.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                )}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
                  <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    anomaly.alert_category === 'AI_INSIGHT' 
                      ? 'bg-blue-50 border border-blue-100' 
                      : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <AlertIcon category={anomaly.alert_category} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider">
                          {getCategoryLabel(anomaly.alert_category)}
                        </span>
                        {!anomaly.is_read && (
                          <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            MỚI
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        {formatDistanceToNow(new Date(anomaly.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    
                    {/* Nếu là AI Insight thì hiển thị Markdown, nếu không thì hiển thị Text thường */}
                    {anomaly.alert_category === 'AI_INSIGHT' ? (
                      <div className="prose prose-sm prose-blue max-w-none text-slate-700 mb-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <ReactMarkdown>{anomaly.message}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-slate-800 font-medium text-sm mb-3 leading-relaxed">{anomaly.message}</p>
                    )}

                    {anomaly.recommended_action && anomaly.alert_category !== 'AI_INSIGHT' && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 mb-4 inline-block">
                        <span className="text-xs font-semibold text-slate-700">💡 Đề xuất hành động:</span>
                        <span className="text-xs text-slate-600 ml-2">{anomaly.recommended_action}</span>
                      </div>
                    )}
                    
                    {!anomaly.is_read && (
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={() => handleMarkAsRead(anomaly.id)}
                          className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors"
                        >
                          <Eye size={16} />
                          Đánh dấu đã xử lý
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