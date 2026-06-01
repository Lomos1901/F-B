'use client';

import { useState, useEffect } from 'react';
import { productService } from '@/src/services/productService';
import { categoryService } from '@/src/services/categoryService';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  categories: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function OrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          productService.getAllWithRecipes(),
          categoryService.getAll(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categories?.id === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-center text-amber-700">Sẫm Coffee Menu</h1>
      </header>

      <main className="p-4">
        {/* Category Filters */}
        <div className="flex justify-center space-x-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${!selectedCategory ? 'bg-amber-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${selectedCategory === cat.id ? 'bg-amber-600 text-white' : 'bg-white text-gray-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <p className="text-center">Đang tải menu...</p>
        ) : error ? (
          <p className="text-center text-red-500">Lỗi: {error}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-32 h-32 object-cover rounded-md mb-4" />
                <h2 className="text-lg font-semibold text-center">{product.name}</h2>
                <p className="text-amber-600 font-bold mt-2">{product.price.toLocaleString('vi-VN')} đ</p>
                <button className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg w-full">
                  Thêm vào giỏ
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
