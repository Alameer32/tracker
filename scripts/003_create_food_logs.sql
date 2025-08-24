-- Create food logs table for tracking daily food intake
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- When the food was consumed
  logged_date date not null default current_date,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')) not null,
  
  -- Quantity consumed
  quantity numeric(8,2) not null default 1, -- How many servings
  
  -- Calculated nutritional values (quantity * food_item values)
  total_calories numeric(8,2) not null,
  total_protein_g numeric(8,2) default 0,
  total_carbs_g numeric(8,2) default 0,
  total_fat_g numeric(8,2) default 0,
  total_fiber_g numeric(8,2) default 0,
  total_sugar_g numeric(8,2) default 0,
  total_sodium_mg numeric(8,2) default 0,
  
  -- Optional notes
  notes text
);

-- Enable RLS
alter table public.food_logs enable row level security;

-- RLS policies for food_logs
create policy "users_can_view_own_food_logs"
  on public.food_logs for select
  using (auth.uid() = user_id);

create policy "users_can_insert_own_food_logs"
  on public.food_logs for insert
  with check (auth.uid() = user_id);

create policy "users_can_update_own_food_logs"
  on public.food_logs for update
  using (auth.uid() = user_id);

create policy "users_can_delete_own_food_logs"
  on public.food_logs for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_food_logs_user_date on public.food_logs(user_id, logged_date);
create index if not exists idx_food_logs_meal_type on public.food_logs(meal_type);
