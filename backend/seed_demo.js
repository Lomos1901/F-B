require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function clearData() {
  console.log('Clearing existing data...');
  const tables = [
    'recipes',
    'products',
    'categories',
    'receipt_details',
    'inventory_receipts',
    'ingredients',
    'ingredient_categories'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.log(`Failed to clear ${table}:`, error.message);
    } else {
      console.log(`Cleared ${table}`);
    }
  }
}

async function seedData() {
  await clearData();
  
  console.log('Seeding Demo Data...');
  
  // 1. Ingredient Categories
  const ingCatNames = [
    'Cà phê', 'Trà', 'Sữa & Kem', 'Syrup', 'Trái cây tươi', 'Topping', 'Vật tư'
  ];
  const ingCats = [];
  for (const name of ingCatNames) {
    const { data, error } = await supabase.from('ingredient_categories').insert({ name }).select().single();
    if (error) throw new Error(error.message);
    ingCats.push(data);
  }
  
  const getCatId = (name) => ingCats.find(c => c.name === name).id;

  // 2. Ingredients
  const ingredientsData = [
    { name: 'Cà phê hạt Robusta', base_unit: 'kg', recipe_unit: 'g', conversion_factor: 1000, cost_per_unit: 150000, category_id: getCatId('Cà phê'), stock_quantity: 15000, is_active: true },
    { name: 'Cà phê hạt Arabica', base_unit: 'kg', recipe_unit: 'g', conversion_factor: 1000, cost_per_unit: 250000, category_id: getCatId('Cà phê'), stock_quantity: 5000, is_active: true },
    { name: 'Sữa đặc Ngôi Sao Phương Nam', base_unit: 'Hộp', recipe_unit: 'ml', conversion_factor: 380, cost_per_unit: 20000, category_id: getCatId('Sữa & Kem'), stock_quantity: 15200, is_active: true },
    { name: 'Sữa tươi TH True Milk', base_unit: 'Hộp 1L', recipe_unit: 'ml', conversion_factor: 1000, cost_per_unit: 35000, category_id: getCatId('Sữa & Kem'), stock_quantity: 20000, is_active: true },
    { name: 'Whipping Cream Anchor', base_unit: 'Hộp 1L', recipe_unit: 'ml', conversion_factor: 1000, cost_per_unit: 145000, category_id: getCatId('Sữa & Kem'), stock_quantity: 5000, is_active: true },
    { name: 'Trà Oolong Lộc Phát', base_unit: 'Gói 1kg', recipe_unit: 'g', conversion_factor: 1000, cost_per_unit: 210000, category_id: getCatId('Trà'), stock_quantity: 3000, is_active: true },
    { name: 'Trà Đen Lộc Phát', base_unit: 'Gói 1kg', recipe_unit: 'g', conversion_factor: 1000, cost_per_unit: 180000, category_id: getCatId('Trà'), stock_quantity: 4000, is_active: true },
    { name: 'Syrup Đào Monin', base_unit: 'Chai 700ml', recipe_unit: 'ml', conversion_factor: 700, cost_per_unit: 220000, category_id: getCatId('Syrup'), stock_quantity: 1400, is_active: true },
    { name: 'Syrup Vani Monin', base_unit: 'Chai 700ml', recipe_unit: 'ml', conversion_factor: 700, cost_per_unit: 220000, category_id: getCatId('Syrup'), stock_quantity: 1400, is_active: true },
    { name: 'Đường cát trắng', base_unit: 'kg', recipe_unit: 'g', conversion_factor: 1000, cost_per_unit: 25000, category_id: getCatId('Topping'), stock_quantity: 20000, is_active: true },
    { name: 'Trân châu đen', base_unit: 'kg', recipe_unit: 'g', conversion_factor: 1000, cost_per_unit: 45000, category_id: getCatId('Topping'), stock_quantity: 10000, is_active: true },
    { name: 'Đào ngâm Hosen', base_unit: 'Lon 825g', recipe_unit: 'g', conversion_factor: 825, cost_per_unit: 65000, category_id: getCatId('Trái cây tươi'), stock_quantity: 4125, is_active: true },
    { name: 'Ly nhựa dập màng M', base_unit: 'Cái', recipe_unit: 'Cái', conversion_factor: 1, cost_per_unit: 800, category_id: getCatId('Vật tư'), stock_quantity: 2000, is_active: true },
    { name: 'Ly nhựa dập màng L', base_unit: 'Cái', recipe_unit: 'Cái', conversion_factor: 1, cost_per_unit: 1200, category_id: getCatId('Vật tư'), stock_quantity: 1500, is_active: true },
    { name: 'Ống hút nhựa', base_unit: 'Cái', recipe_unit: 'Cái', conversion_factor: 1, cost_per_unit: 150, category_id: getCatId('Vật tư'), stock_quantity: 5000, is_active: true },
  ];
  
  const ingredients = [];
  for (const item of ingredientsData) {
    const { data, error } = await supabase.from('ingredients').insert(item).select().single();
    if (error) throw new Error(error.message);
    ingredients.push(data);
  }
  
  const getIngId = (name) => ingredients.find(i => i.name === name).id;

  // 3. Product Categories
  const prodCatNames = [
    'Cà Phê Truyền Thống', 'Cà Phê Pha Máy', 'Trà Trái Cây', 'Trà Sữa', 'Đá Xay (Ice Blended)'
  ];
  const prodCats = [];
  for (const name of prodCatNames) {
    const { data, error } = await supabase.from('categories').insert({ name }).select().single();
    if (error) throw new Error(error.message);
    prodCats.push(data);
  }
  
  const getProdCatId = (name) => prodCats.find(c => c.name === name).id;

  // 4. Products & Recipes
  const productsData = [
    {
      name: 'Cà Phê Đen Đá', price: 29000, is_active: true, category_id: getProdCatId('Cà Phê Truyền Thống'),
      image_url: 'https://images.unsplash.com/photo-1572286258217-1f48ba6d5736?auto=format&fit=crop&q=80&w=800',
      recipes: [
        { ingredient: 'Cà phê hạt Robusta', quantity: 25 },
        { ingredient: 'Đường cát trắng', quantity: 15 },
        { ingredient: 'Ly nhựa dập màng M', quantity: 1 },
        { ingredient: 'Ống hút nhựa', quantity: 1 }
      ]
    },
    {
      name: 'Cà Phê Sữa Đá (Bạc Xỉu)', price: 35000, is_active: true, category_id: getProdCatId('Cà Phê Truyền Thống'),
      image_url: 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?auto=format&fit=crop&q=80&w=800',
      recipes: [
        { ingredient: 'Cà phê hạt Robusta', quantity: 15 },
        { ingredient: 'Sữa đặc Ngôi Sao Phương Nam', quantity: 30 },
        { ingredient: 'Sữa tươi TH True Milk', quantity: 40 },
        { ingredient: 'Ly nhựa dập màng M', quantity: 1 },
        { ingredient: 'Ống hút nhựa', quantity: 1 }
      ]
    },
    {
      name: 'Cà Phê Latte Nóng', price: 49000, is_active: true, category_id: getProdCatId('Cà Phê Pha Máy'),
      image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800',
      recipes: [
        { ingredient: 'Cà phê hạt Arabica', quantity: 18 },
        { ingredient: 'Sữa tươi TH True Milk', quantity: 150 },
        { ingredient: 'Ly nhựa dập màng M', quantity: 1 }
      ]
    },
    {
      name: 'Trà Đào Cam Sả', price: 45000, is_active: true, category_id: getProdCatId('Trà Trái Cây'),
      image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800',
      recipes: [
        { ingredient: 'Trà Oolong Lộc Phát', quantity: 10 },
        { ingredient: 'Syrup Đào Monin', quantity: 25 },
        { ingredient: 'Đào ngâm Hosen', quantity: 50 },
        { ingredient: 'Đường cát trắng', quantity: 20 },
        { ingredient: 'Ly nhựa dập màng L', quantity: 1 },
        { ingredient: 'Ống hút nhựa', quantity: 1 }
      ]
    },
    {
      name: 'Trà Sữa Trân Châu Đen', price: 39000, is_active: true, category_id: getProdCatId('Trà Sữa'),
      image_url: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&q=80&w=800',
      recipes: [
        { ingredient: 'Trà Đen Lộc Phát', quantity: 12 },
        { ingredient: 'Sữa đặc Ngôi Sao Phương Nam', quantity: 20 },
        { ingredient: 'Whipping Cream Anchor', quantity: 10 },
        { ingredient: 'Trân châu đen', quantity: 50 },
        { ingredient: 'Đường cát trắng', quantity: 15 },
        { ingredient: 'Ly nhựa dập màng L', quantity: 1 },
        { ingredient: 'Ống hút nhựa', quantity: 1 }
      ]
    },
    {
      name: 'Matcha Đá Xay', price: 55000, is_active: true, category_id: getProdCatId('Đá Xay (Ice Blended)'),
      image_url: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&q=80&w=800',
      recipes: [
        { ingredient: 'Sữa tươi TH True Milk', quantity: 60 },
        { ingredient: 'Sữa đặc Ngôi Sao Phương Nam', quantity: 30 },
        { ingredient: 'Syrup Vani Monin', quantity: 10 },
        { ingredient: 'Whipping Cream Anchor', quantity: 30 },
        { ingredient: 'Ly nhựa dập màng L', quantity: 1 },
        { ingredient: 'Ống hút nhựa', quantity: 1 }
      ]
    }
  ];

  for (const prod of productsData) {
    const { recipes, ...prodData } = prod;
    const { data: newProd, error } = await supabase.from('products').insert(prodData).select().single();
    if (error) throw new Error(error.message);
    
    for (const r of recipes) {
      const { error: rError } = await supabase.from('recipes').insert({
        product_id: newProd.id,
        ingredient_id: getIngId(r.ingredient),
        quantity: r.quantity
      });
      if (rError) throw new Error(rError.message);
    }
  }

  console.log('Seed completed successfully!');
}

seedData().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
