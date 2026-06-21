'use client';

import { useState, useEffect } from 'react';
import { productService } from '@/src/services/productService';
import { categoryService } from '@/src/services/categoryService';

// This is a generic QR order page, maybe for testing.
// It will be updated to call the correct service method.

export default function QROrderPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          // SỬA LẠI: Gọi đúng hàm `getAll`
          productService.getAll(),
          categoryService.getAll(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err: any) {
        setError('Không thể tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h1>Thực đơn</h1>
      {/* Hiển thị sản phẩm và danh mục */}
      <h2>Sản phẩm</h2>
      <ul>
        {products.map(p => <li key={p.id}>{p.name}</li>)}
      </ul>
      <h2>Danh mục</h2>
      <ul>
        {categories.map(c => <li key={c.id}>{c.name}</li>)}
      </ul>
    </div>
  );
}
