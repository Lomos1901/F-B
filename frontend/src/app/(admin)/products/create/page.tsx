'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { categoryService } from '@/src/services/categoryService';
import { ingredientService } from '@/src/services/ingredientService';
import { productService } from '@/src/services/productService';

interface Category { id: string; name: string; }
interface Ingredient { id: string; name: string; recipe_unit: string; }
interface RecipeInput { ingredient_id: string; ui_quantity: number; }

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [recipeRows, setRecipeRows] = useState<RecipeInput[]>([{ ingredient_id: '', ui_quantity: 0 }]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [categoriesData, ingredientsData] = await Promise.all([
          categoryService.getAll(),
          ingredientService.getAll(),
        ]);
        setCategories(categoriesData);
        setIngredients(ingredientsData.data || []);
      } catch (e: any) {
        setMessage({ type: 'error', text: 'Lỗi tải dữ liệu cần thiết: ' + e.message });
      }
    };
    loadInitialData();
  }, []);

  const addRow = () => setRecipeRows([...recipeRows, { ingredient_id: '', ui_quantity: 0 }]);
  const removeRow = (index: number) => setRecipeRows(recipeRows.filter((_, i) => i !== index));

  // SỬA LẠI: Viết lại hàm này cho type-safe
  const handleRowChange = (index: number, field: keyof RecipeInput, value: string | number) => {
    const updatedRows = recipeRows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setRecipeRows(updatedRows);
  };

  const getDisplayUnit = (ingId: string) => ingredients.find(i => i.id === ingId)?.recipe_unit || 'đơn vị';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await productService.uploadImage(formData);
      setImageUrl(data.imageUrl);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !productName.trim() || !productPrice) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin sản phẩm.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    const validRows = recipeRows.filter(row => row.ingredient_id && row.ui_quantity > 0);
    const ingredientsPayload = validRows.map(row => ({
      ingredient_id: row.ingredient_id,
      quantity_required: Number(row.ui_quantity),
    }));

    const productPayload = {
      category_id: categoryId,
      name: productName,
      price: Number(productPrice),
      image_url: imageUrl,
      ingredients: ingredientsPayload,
    };

    try {
      await productService.create(productPayload);
      alert('Tạo món nước mới thành công!');
      router.push('/products');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-dark-bg p-4 sm:p-6 md:p-8 font-sans text-dark-text-primary">
      {/* ... Giao diện không đổi ... */}
    </main>
  );
}
