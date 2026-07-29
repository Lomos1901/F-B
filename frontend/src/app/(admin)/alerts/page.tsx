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
      return <TrendingUp className="text-green-500" size={24} />;
    case 'GHOST_PRODUCT':
      return <BarChart2 className="text-purple-500" size={24} />;
    case 'INVENTORY_FORECAST':
      return <Info className="text-yellow-500" size={24} />;
    case 'AI_INSIGHT':
      return <Sparkles className="text-blue-500" size={24} />;
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
      <div className="flex h-full items-center justify-center bg-[#FCF9F8]">
        <Loader2 className="animate-spin text-[#FFB800]" size={48} />
      </div>
    );
  }

  return (
    <main className="flex flex-col h-full bg-[#FCF9F8] text-[#4B2C20]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* HEADER */}
      <div className="px-6 py-6 border-b border-gray-200 bg-white flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="text-blue-600" size={28} />
            Trung tâm Cảnh báo AI (AI Command Center)
          </h1>
          <p className="text-gray-500 mt-1">Hệ thống AI tự động theo dõi, phân tích dữ liệu và đưa ra khuyến nghị theo thời gian thực.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedScenario} 
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 bg-white font-medium text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="real">⚡ Dữ liệu Thực tế (Realtime)</option>
            <option value="spike">🌪️ Kịch bản: Bão đơn hàng (Tăng vọt)</option>
            <option value="ghost">📉 Kịch bản: Ế ẩm cuối tháng</option>
            <option value="fraud">⚠️ Kịch bản: Báo động nhân viên gian lận</option>
          </select>
          <button 
            onClick={handleGenerateAIReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200 disabled:opacity-70"
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
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('ALL')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'ALL' ? 'bg-[#4B2C20] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Tất cả Cảnh báo
          </button>
          <button 
            onClick={() => setActiveTab('UNREAD')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'UNREAD' ? 'bg-[#4B2C20] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Chưa đọc
          </button>
        </div>

        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Hệ thống đang hoạt động ổn định</h3>
            <p className="text-gray-500 max-w-md">Không có dấu hiệu bất thường nào được AI ghi nhận. Mọi thứ đều trong tầm kiểm soát.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <div 
                key={anomaly.id} 
                className={`relative overflow-hidden bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg ${anomaly.is_read ? 'border-gray-200 opacity-75' : 'border-blue-200 shadow-md shadow-blue-50/50'}`}
              >
                {!anomaly.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                )}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center ${anomaly.alert_category === 'AI_INSIGHT' ? 'bg-gradient-to-br from-blue-100 to-indigo-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <AlertIcon category={anomaly.alert_category} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm uppercase tracking-wider text-gray-500">
                          {getCategoryLabel(anomaly.alert_category)}
                        </span>
                        {!anomaly.is_read && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">MỚI</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-400">
                        {formatDistanceToNow(new Date(anomaly.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    
                    {/* Nếu là AI Insight thì hiển thị Markdown, nếu không thì hiển thị Text thường */}
                    {anomaly.alert_category === 'AI_INSIGHT' ? (
                      <div className="prose prose-sm prose-blue max-w-none text-gray-700 mb-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                        <ReactMarkdown>{anomaly.message}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-800 font-medium text-[15px] mb-3 leading-relaxed">{anomaly.message}</p>
                    )}

                    {anomaly.recommended_action && anomaly.alert_category !== 'AI_INSIGHT' && (
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 inline-block">
                        <span className="text-sm font-bold text-[#4B2C20]">💡 Đề xuất hành động:</span>
                        <span className="text-sm text-gray-600 ml-2">{anomaly.recommended_action}</span>
                      </div>
                    )}
                    
                    {!anomaly.is_read && (
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={() => handleMarkAsRead(anomaly.id)}
                          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
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