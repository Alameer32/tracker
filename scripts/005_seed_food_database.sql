-- Seed the food database with common food items
insert into public.food_items (name, brand, serving_size, serving_size_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, category, subcategory, data_source, verified) values
-- Fruits
('Apple', null, '1 medium (182g)', 182, 95, 0.5, 25, 0.3, 4, 19, 2, 'fruits', 'tree_fruits', 'usda', true),
('Banana', null, '1 medium (118g)', 118, 105, 1.3, 27, 0.4, 3, 14, 1, 'fruits', 'tropical_fruits', 'usda', true),
('Orange', null, '1 medium (154g)', 154, 62, 1.2, 15, 0.2, 3, 12, 0, 'fruits', 'citrus_fruits', 'usda', true),
('Strawberries', null, '1 cup (152g)', 152, 49, 1, 12, 0.5, 3, 7, 2, 'fruits', 'berries', 'usda', true),
('Blueberries', null, '1 cup (148g)', 148, 84, 1.1, 21, 0.5, 4, 15, 1, 'fruits', 'berries', 'usda', true),

-- Vegetables
('Broccoli', null, '1 cup chopped (91g)', 91, 25, 3, 5, 0.3, 2, 1, 33, 'vegetables', 'cruciferous', 'usda', true),
('Spinach', null, '1 cup raw (30g)', 30, 7, 0.9, 1, 0.1, 1, 0, 24, 'vegetables', 'leafy_greens', 'usda', true),
('Carrots', null, '1 medium (61g)', 61, 25, 0.5, 6, 0.1, 2, 3, 42, 'vegetables', 'root_vegetables', 'usda', true),
('Bell Pepper', null, '1 medium (119g)', 119, 25, 1, 6, 0.2, 2, 4, 4, 'vegetables', 'peppers', 'usda', true),
('Tomato', null, '1 medium (123g)', 123, 22, 1.1, 5, 0.2, 1, 3, 5, 'vegetables', 'nightshades', 'usda', true),

-- Grains
('Brown Rice', null, '1 cup cooked (195g)', 195, 216, 5, 45, 2, 4, 0, 10, 'grains', 'rice', 'usda', true),
('Quinoa', null, '1 cup cooked (185g)', 185, 222, 8, 39, 4, 5, 0, 13, 'grains', 'pseudocereals', 'usda', true),
('Oatmeal', null, '1 cup cooked (234g)', 234, 147, 6, 25, 3, 4, 0, 9, 'grains', 'oats', 'usda', true),
('Whole Wheat Bread', null, '1 slice (28g)', 28, 81, 4, 14, 1, 2, 1, 144, 'grains', 'bread', 'usda', true),

-- Proteins
('Chicken Breast', null, '3 oz cooked (85g)', 85, 140, 26, 0, 3, 0, 0, 63, 'protein', 'poultry', 'usda', true),
('Salmon', null, '3 oz cooked (85g)', 85, 175, 25, 0, 8, 0, 0, 59, 'protein', 'fish', 'usda', true),
('Eggs', null, '1 large (50g)', 50, 70, 6, 0, 5, 0, 0, 70, 'protein', 'eggs', 'usda', true),
('Greek Yogurt', null, '1 cup (245g)', 245, 130, 23, 9, 0, 0, 9, 68, 'dairy', 'yogurt', 'usda', true),
('Almonds', null, '1 oz (28g)', 28, 164, 6, 6, 14, 4, 1, 1, 'protein', 'nuts', 'usda', true),

-- Dairy
('Milk', null, '1 cup (244g)', 244, 149, 8, 12, 8, 0, 12, 105, 'dairy', 'milk', 'usda', true),
('Cheddar Cheese', null, '1 oz (28g)', 28, 113, 7, 0, 9, 0, 0, 174, 'dairy', 'cheese', 'usda', true);
