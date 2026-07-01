"use client";
import { useState, useEffect } from "react";
import { ingredientService } from "@/src/services/ingredientService";
import Link from "next/link";
import { Trash2, RotateCw, ArrowLeft, Archive } from "lucide-react";
import { toast } from "react-toastify";

// Định nghĩa kiểu dữ liệu cho một nguyên liệu
interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock_quantity: number;
  ingredient_category: {
    name: string;
  };
}

export default function ArchivedIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArchivedIngredients();
  }, []);

  const fetchArchivedIngredients = async () => {
    try {
      setLoading(true);
      const response = await ingredientService.getArchived();
      setIngredients(response.data || []);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || "Không thể tải danh sách nguyên liệu đã xóa.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn khôi phục nguyên liệu này?")) {
      try {
        await ingredientService.restore(id);
        toast.success("Khôi phục nguyên liệu thành công!");
        fetchArchivedIngredients();
      } catch (err: any) {
        toast.error(err.message || "Khôi phục thất bại.");
      }
    }
  };

  const handleHardDelete = async (id: string) => {
    if (confirm("Hành động này không thể hoàn tác! Bạn có chắc chắn muốn xóa vĩnh viễn nguyên liệu này?")) {
      try {
        await ingredientService.hardDelete(id);
        toast.success("Đã xóa vĩnh viễn nguyên liệu.");
        fetchArchivedIngredients();
      } catch (err: any) {
        toast.error(err.message || "Xóa vĩnh viễn thất bại.");
      }
    }
  };

  if (loading) return <div className="p-8 text-dark-text-secondary">Đang tải dữ liệu...</div>;
  if (error && ingredients.length === 0) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-text-primary flex items-center gap-3">
          <Archive size={28} />
          Thùng rác Nguyên liệu
        </h1>
        <Link href="/ingredients" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-dark-surface text-dark-text-secondary border border-dark-border hover:bg-dark-border transition-all">
          <ArrowLeft size={16} />
          Quay lại Kho
        </Link>
      </div>

      <div className="bg-dark-surface border border-dark-border shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Nguyên liệu</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Tồn kho</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Đơn vị</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {ingredients.map((ing) => (
              <tr key={ing.id} className="hover:bg-dark-bg transition-colors">
                <td className="px-6 py-4 font-medium text-dark-text-primary">{ing.name}</td>
                <td className="px-6 py-4 text-dark-text-secondary">{ing.ingredient_category?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-dark-text-secondary font-mono">{ing.stock_quantity}</td>
                <td className="px-6 py-4 text-dark-text-secondary">{ing.unit}</td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button
                    onClick={() => handleRestore(ing.id)}
                    className="p-2 text-green-400 hover:bg-dark-bg rounded-full"
                    title="Khôi phục"
                  >
                    <RotateCw size={16} />
                  </button>
                  <button
                    onClick={() => handleHardDelete(ing.id)}
                    className="p-2 text-red-500 hover:bg-dark-bg rounded-full"
                    title="Xóa vĩnh viễn"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ingredients.length === 0 && !loading && (
          <p className="text-center py-6 text-dark-text-secondary">Thùng rác trống.</p>
        )}
      </div>
    </main>
  );
}