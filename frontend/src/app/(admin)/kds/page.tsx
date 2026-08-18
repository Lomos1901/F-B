'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { orderService } from '@/src/services/orderService';
import { Check, CookingPot, Loader2, Coffee, RefreshCcw, Info, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { createClient } from '@supabase/supabase-js';

import Cookies from 'js-cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// supabase được khởi tạo bên dưới cùng với token

interface OrderItem {
  quantity: number;
  note?: string;
  products?: { id: string; name: string };
}

interface Order {
  id: string;
  table_number: string;
  created_at: string;
  order_detail: OrderItem[];
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-3 p-8 border-2 border-dashed border-gray-200 rounded-2xl">
    <Coffee size={48} className="text-gray-300" />
    <p className="text-sm font-medium">Không có đơn nào</p>
  </div>
);

const RecipeModal = ({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) => {
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const { productService } = await import('@/src/services/productService');
        const productData = await productService.getById(productId);
        setRecipeItems(productData.recipes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [productId]);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 leading-tight">Công thức<br/><span className="text-blue-600">{productName}</span></h2>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0">
            <X size={20} className="text-slate-600" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : recipeItems.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CookingPot size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Chưa cập nhật công thức</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {recipeItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                <span className="font-medium text-slate-700">{item.ingredients?.name}</span>
                <span className="font-bold text-blue-600 bg-blue-100/50 px-3 py-1 rounded-full">{item.quantity} {item.ingredients?.recipe_unit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderTicket = ({ order, onAction, actionText, isPending, icon, onViewRecipe }: { order: Order, onAction: () => void, actionText: string, isPending: boolean, icon: React.ReactNode, onViewRecipe: (id: string, name: string) => void }) => {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: vi });

  const borderColor = isPending ? 'border-l-amber-500' : 'border-l-blue-500';
  const buttonClass = isPending 
    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-600' 
    : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 focus:ring-emerald-700';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-[4px] ${borderColor} flex flex-col shadow-sm`}>
      <div className="p-4 flex justify-between items-center border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-800">Bàn {order.table_number}</h3>
        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">{timeAgo}</span>
      </div>
      <div className="p-4 flex-grow space-y-3">
        {order.order_detail.map((item, index) => (
          <div key={index} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
            <div className="flex justify-between items-start text-sm group">
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-medium">{item.products?.name || 'Sản phẩm không xác định'}</span>
                {item.products?.id && (
                  <button 
                    onClick={() => onViewRecipe(item.products!.id, item.products!.name)}
                    className="text-slate-300 hover:text-blue-500 transition-colors"
                    title="Xem công thức"
                  >
                    <Info size={16} />
                  </button>
                )}
              </div>
              <span className="font-bold text-blue-700 bg-blue-50 rounded-full px-2.5 py-0.5 mt-0.5">x{item.quantity}</span>
            </div>
            {item.note && (
              <span className="text-xs font-semibold text-rose-600 italic bg-rose-50 px-2 py-1 rounded inline-block w-fit mt-1 border border-rose-100">
                - {item.note}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="p-3 pt-0">
        <button 
          onClick={onAction}
          className={`w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${buttonClass}`}
        >
          {icon}
          {actionText}
        </button>
      </div>
    </div>
  );
};

export default function KDSPage() {
  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recipeModal, setRecipeModal] = useState<{isOpen: boolean, productId: string, productName: string}>({ isOpen: false, productId: '', productName: '' });

  const loadOrders = async () => {
    try {
      const preparing = await orderService.getOrdersByStatus('PREPARING');
      setPreparingOrders(preparing);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  const handleUpdateStatus = async (orderId: string, status: string, tableNumber: string) => {
    try {
      await orderService.updateStatus(orderId, status);
      toast.success(`Đã hoàn thành đơn hàng của bàn ${tableNumber}.`);
      loadOrders();
    } catch (err: any) {
      toast.error(`Lỗi khi cập nhật trạng thái: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && preparingOrders.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl max-w-md">
          <p className="font-semibold mb-2">Lỗi tải dữ liệu</p>
          <p className="text-sm">{error}</p>
          <button onClick={handleManualRefresh} className="mt-4 px-4 py-2 bg-red-100 rounded-full font-medium hover:bg-red-200 transition-colors">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <header className="px-4 sm:px-6 py-3 sm:py-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 z-20 sticky top-0 shadow-sm">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Pha chế (KDS)</h1>
            <span className="bg-blue-50 text-blue-700 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold border border-blue-200">
              {preparingOrders.length} Đơn chờ
            </span>
          </div>
          <button 
            onClick={handleManualRefresh} 
            className={`sm:hidden p-2 rounded-full bg-slate-100 text-slate-600 ${isRefreshing ? 'opacity-50' : ''}`}
          >
             <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className={`hidden sm:block p-2.5 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition-all border border-transparent hover:border-slate-200 ${isRefreshing ? 'opacity-50' : ''}`}
          disabled={isRefreshing}
          title="Làm mới dữ liệu"
        >
           <RefreshCcw size={24} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {preparingOrders.length === 0 ? (
            <div className="col-span-full pt-20">
              <EmptyState />
            </div>
          ) : (
            preparingOrders.map(order => (
              <OrderTicket 
                key={order.id} 
                order={order} 
                onAction={() => handleUpdateStatus(order.id, 'COMPLETED', order.table_number)}
                actionText="Đã pha xong"
                isPending={false}
                icon={<Check size={20} />}
                onViewRecipe={(id, name) => setRecipeModal({ isOpen: true, productId: id, productName: name })}
              />
            ))
          )}
        </div>
      </main>

      {recipeModal.isOpen && (
        <RecipeModal 
          productId={recipeModal.productId} 
          productName={recipeModal.productName} 
          onClose={() => setRecipeModal({ isOpen: false, productId: '', productName: '' })} 
        />
      )}
    </div>
  );
}