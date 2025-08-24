-- Create user profiles table for storing user information and nutrition goals
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Personal information
  name text,
  age integer,
  gender text check (gender in ('male', 'female', 'other')),
  height_cm integer,
  weight_kg numeric(5,2),
  activity_level text check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')) default 'moderately_active',
  
  -- Nutrition goals (calculated based on user data)
  daily_calories integer,
  daily_protein_g integer,
  daily_carbs_g integer,
  daily_fat_g integer,
  daily_fiber_g integer,
  daily_sugar_g integer,
  daily_sodium_mg integer,
  
  -- Daily steps goal
  daily_steps_goal integer default 10000
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- RLS policies for user_profiles
create policy "users_can_view_own_profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "users_can_insert_own_profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "users_can_update_own_profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "users_can_delete_own_profile"
  on public.user_profiles for delete
  using (auth.uid() = id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger handle_user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function public.handle_updated_at();
