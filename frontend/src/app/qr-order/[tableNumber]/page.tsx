'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { productService } from '@/src/services/productService';
import { orderService } from '@/src/services/orderService';

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

export default function QROrderPage() {
  const params = useParams();
  const tableNumber = params.tableNumber as string;

  const [productsByCategory, setProductsByCategory] = useState<GroupedProducts>({});
  const [cart, setCart] = useState<(Product & { quantity: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData: Product[] = await productService.getAll();

        // SỬA LẠI: Khai báo kiểu cho `acc`
        const grouped = productsData.reduce((acc: GroupedProducts, product) => {
          const categoryName = product.categories?.name || 'Chưa phân loại';
          if (!acc[categoryName]) {
            acc[categoryName] = [];
          }
          acc[categoryName].push(product);
          return acc;
        }, {}); // Khởi tạo với object rỗng
        setProductsByCategory(grouped);

      } catch (err: any) {
        setError('Không thể tải thực đơn. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (tableNumber) {
        fetchProducts();
    }
  }, [tableNumber]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem && existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleOrder = async () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn món trước khi đặt hàng.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_order: item.price,
      }));

      await orderService.createForCustomer(tableNumber, orderItems);
      setOrderSuccess(true);
      setCart([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (Phần JSX không đổi)
  return (
    <div>...</div>
  );
}
