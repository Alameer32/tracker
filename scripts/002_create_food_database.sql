-- Create food database table for storing food items and their nutritional information
create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Food identification
  name text not null,
  brand text,
  barcode text unique, -- For barcode scanning
  serving_size text not null, -- e.g., "1 cup", "100g", "1 medium apple"
  serving_size_grams numeric(8,2), -- Weight in grams for standardization
  
  -- Nutritional information per serving
  calories numeric(8,2) not null,
  protein_g numeric(8,2) default 0,
  carbs_g numeric(8,2) default 0,
  fat_g numeric(8,2) default 0,
  fiber_g numeric(8,2) default 0,
  sugar_g numeric(8,2) default 0,
  sodium_mg numeric(8,2) default 0,
  
  -- Additional nutrients (optional)
  cholesterol_mg numeric(8,2) default 0,
  vitamin_a_iu numeric(8,2) default 0,
  vitamin_c_mg numeric(8,2) default 0,
  calcium_mg numeric(8,2) default 0,
  iron_mg numeric(8,2) default 0,
  
  -- Food categorization
  category text, -- e.g., "fruits", "vegetables", "grains", "protein", "dairy"
  subcategory text, -- e.g., "citrus fruits", "leafy greens"
  
  -- Data source tracking
  data_source text default 'user_added', -- 'usda', 'user_added', 'barcode_api'
  verified boolean default false -- Whether nutritional data has been verified
);

-- Create indexes for better performance
create index if not exists idx_food_items_name on public.food_items using gin(to_tsvector('english', name));
create index if not exists idx_food_items_barcode on public.food_items(barcode);
create index if not exists idx_food_items_category on public.food_items(category);

-- No RLS needed for food_items as it's a shared database that all users can read
-- Users can add new food items but cannot modify existing ones (except admins)
