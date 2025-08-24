-- Create steps logs table for tracking daily step counts
create table if not exists public.steps_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Date and step data
  logged_date date not null default current_date,
  steps integer not null default 0,
  
  -- Additional activity data (optional)
  distance_km numeric(8,2), -- Estimated distance based on steps
  calories_burned integer, -- Estimated calories burned from steps
  active_minutes integer, -- Minutes of active movement
  
  -- Data source
  data_source text default 'manual', -- 'manual', 'fitness_tracker', 'phone'
  
  -- Ensure one record per user per date
  unique(user_id, logged_date)
);

-- Enable RLS
alter table public.steps_logs enable row level security;

-- RLS policies for steps_logs
create policy "users_can_view_own_steps_logs"
  on public.steps_logs for select
  using (auth.uid() = user_id);

create policy "users_can_insert_own_steps_logs"
  on public.steps_logs for insert
  with check (auth.uid() = user_id);

create policy "users_can_update_own_steps_logs"
  on public.steps_logs for update
  using (auth.uid() = user_id);

create policy "users_can_delete_own_steps_logs"
  on public.steps_logs for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger for steps_logs
create trigger handle_steps_logs_updated_at
  before update on public.steps_logs
  for each row
  execute function public.handle_updated_at();

-- Create index for better performance
create index if not exists idx_steps_logs_user_date on public.steps_logs(user_id, logged_date);
