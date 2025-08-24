-- Add some example barcodes to existing food items for testing
UPDATE public.food_items 
SET barcode = '0123456789012' 
WHERE name = 'Apple' AND brand IS NULL;

UPDATE public.food_items 
SET barcode = '0123456789013' 
WHERE name = 'Banana' AND brand IS NULL;

UPDATE public.food_items 
SET barcode = '0123456789014' 
WHERE name = 'Greek Yogurt' AND brand IS NULL;

UPDATE public.food_items 
SET barcode = '0123456789015' 
WHERE name = 'Chicken Breast' AND brand IS NULL;

UPDATE public.food_items 
SET barcode = '0123456789016' 
WHERE name = 'Brown Rice' AND brand IS NULL;

-- Add some branded items with realistic barcodes
INSERT INTO public.food_items (name, brand, barcode, serving_size, serving_size_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, category, subcategory, data_source, verified) VALUES
('Cheerios', 'General Mills', '0016000275270', '1 cup (28g)', 28, 100, 3, 20, 2, 3, 1, 140, 'grains', 'cereal', 'barcode_api', true),
('Coca-Cola', 'Coca-Cola', '0049000028911', '12 fl oz (355ml)', 355, 140, 0, 39, 0, 0, 39, 45, 'beverages', 'soda', 'barcode_api', true),
('Lay''s Classic', 'Frito-Lay', '0028400064316', '1 oz (28g)', 28, 160, 2, 15, 10, 1, 0, 170, 'snacks', 'chips', 'barcode_api', true);
