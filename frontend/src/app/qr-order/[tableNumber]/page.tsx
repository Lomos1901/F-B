'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { productService } from '@/src/services/productService';
import { orderService } from '@/src/services/orderService';
import { Plus, Minus, ShoppingCart, Send, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

// --- Định nghĩa Interface ---
interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  categories?: { name: string };
}

interface GroupedProducts {
  [categoryName: string]: Product[];
}

interface CartItem extends Product {
  quantity: number;
}

// --- Component Giỏ hàng ---
const CartComponent = ({ cart, onUpdate, onOrder, loading, totalPrice }: { cart: CartItem[], onUpdate: (product: Product, quantity: number) => void, onOrder: () => void, loading: boolean, totalPrice: number }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Giỏ hàng của bạn</h3>
      <div className="flex-grow overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center mt-8">Chưa có món nào trong giỏ</p>
        ) : (
          <ul className="space-y-4">
            {cart.map(item => (
              <li key={item.id} className="flex items-center gap-4">
                <img src={item.image_url || '/placeholder.svg'} alt={item.name} className="w-16 h-16 rounded-md object-cover"/>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.price.toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onUpdate(item, item.quantity - 1)} className="p-1 bg-gray-200 rounded-full text-gray-700"><Minus size={14}/></button>
                  <span className="font-bold text-gray-800">{item.quantity}</span>
                  <button onClick={() => onUpdate(item, item.quantity + 1)} className="p-1 bg-amber-500 rounded-full text-white"><Plus size={14}/></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {cart.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-semibold text-gray-700">Tổng cộng:</span>
            <span className="text-2xl font-bold text-amber-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
          </div>
          <button
            onClick={onOrder}
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400 transition-colors"
          >
            <Send size={20}/>
            {loading ? 'Đang gửi...' : 'Gửi đơn hàng'}
          </button>
        </div>
      )}
    </div>
  );
};


export default function QROrderPage() {
  const params = useParams();
  const tableNumber = params.tableNumber as string;

  const [productsByCategory, setProductsByCategory] = useState<GroupedProducts>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData: Product[] = await productService.getAll();
        const grouped = productsData.reduce((acc: GroupedProducts, product) => {
          const categoryName = product.categories?.name || 'Chưa phân loại';
          if (!acc[categoryName]) acc[categoryName] = [];
          acc[categoryName].push(product);
          return acc;
        }, {});
        setProductsByCategory(grouped);
      } catch (err: any) {
        setError('Không thể tải thực đơn. Vui lòng thử lại sau.');
        toast.error('Không thể tải thực đơn. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    if (tableNumber) fetchProducts();
  }, [tableNumber]);

  const updateCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.id !== product.id);
      }
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity } : item);
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const addToCart = (product: Product) => {
    const currentQuantity = getCartItemQuantity(product.id);
    updateCart(product, currentQuantity + 1);
  };

  const getCartItemQuantity = (productId: string) => cart.find(item => item.id === productId)?.quantity || 0;
  const getTotalPrice = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleOrder = async () => {
    if (cart.length === 0) {
      toast.warning('Vui lòng chọn món trước khi đặt hàng.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const orderItems = cart.map(item => ({ product_id: item.id, quantity: item.quantity, price_at_order: item.price }));
      await orderService.createForCustomer(tableNumber, orderItems);
      setOrderSuccess(true);
      // Không cần toast ở đây vì đã có màn hình success riêng
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && Object.keys(productsByCategory).length === 0) return <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-800">Đang tải thực đơn...</div>;
  if (error) return <div className="flex justify-center items-center h-screen bg-gray-50 text-red-500 p-4 text-center">{error}</div>;
  if (orderSuccess) return (
    <div className="flex flex-col justify-center items-center h-screen bg-green-50 text-center p-4">
      <h1 className="text-2xl font-bold text-green-700 mb-4">Đặt hàng thành công!</h1>
      <p className="text-gray-600">Nhân viên sẽ sớm chuẩn bị món cho bạn. Cảm ơn bạn đã sử dụng dịch vụ!</p>
      <button onClick={() => setOrderSuccess(false)} className="mt-6 bg-green-600 text-white py-2 px-4 rounded-lg">Đặt món mới</button>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-center text-gray-800">Sẫm Coffee - Bàn số {tableNumber}</h1>
      </header>

      <div className="container mx-auto p-4 lg:flex lg:gap-8">
        {/* --- Main Content (Menu) --- */}
        <main className="lg:w-2/3">
          {Object.keys(productsByCategory).map(categoryName => (
            <section key={categoryName} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b-2 border-amber-500 pb-2">{categoryName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productsByCategory[categoryName].map(product => {
                  const quantityInCart = getCartItemQuantity(product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white rounded-lg shadow p-4 flex text-left relative transition-transform transform hover:scale-105"
                    >
                      {quantityInCart > 0 && (
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                          {quantityInCart}
                        </div>
                      )}
                      <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-24 h-24 rounded-md object-cover mr-4"/>
                      <div className="flex-grow flex flex-col">
                        <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                        <p className="text-gray-600 font-semibold mt-1">{product.price.toLocaleString('vi-VN')} đ</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </main>

        {/* --- Cart Sidebar (Desktop) --- */}
        <aside className="hidden lg:block lg:w-1/3 sticky top-24 self-start">
          <CartComponent cart={cart} onUpdate={updateCart} onOrder={handleOrder} loading={loading} totalPrice={getTotalPrice()} />
        </aside>
      </div>

      {/* --- Cart Footer (Mobile) --- */}
      {cart.length > 0 && (
        <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 border-t z-20">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">Tổng cộng ({cart.reduce((acc, item) => acc + item.quantity, 0)} món):</p>
              <p className="text-xl font-extrabold text-amber-600">{getTotalPrice().toLocaleString('vi-VN')} đ</p>
            </div>
            <button
              onClick={handleOrder}
              disabled={loading || cart.length === 0}
              className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 disabled:bg-gray-400"
            >
              <Send size={20}/>
              {loading ? 'Đang gửi...' : 'Gửi đơn'}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}