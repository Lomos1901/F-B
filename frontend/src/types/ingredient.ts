export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock_quantity: number;
  min_threshold: number;
  cost_per_unit: number;
  created_at?: string;
}
