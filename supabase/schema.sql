-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamptz default now()
);

-- 2026 F1 Drivers
create table public.drivers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  abbreviation text not null unique,
  team text not null,
  number int not null,
  is_bortoleto boolean default false
);

-- Races
create table public.races (
  id uuid default uuid_generate_v4() primary key,
  round_number int not null,
  name text not null,
  circuit text not null,
  country text not null,
  qualifying_start_time timestamptz not null,
  race_start_time timestamptz not null,
  random_position int, -- drawn randomly (4-20), set when predictions open
  openf1_quali_session_key int,
  openf1_race_session_key int,
  status text default 'upcoming' check (status in ('upcoming', 'open', 'closed', 'finished')),
  created_at timestamptz default now()
);

-- Race Results (auto-populated via OpenF1 API)
create table public.race_results (
  id uuid default uuid_generate_v4() primary key,
  race_id uuid references public.races on delete cascade unique not null,
  pole_driver_id uuid references public.drivers,
  p1_driver_id uuid references public.drivers,
  p2_driver_id uuid references public.drivers,
  p3_driver_id uuid references public.drivers,
  random_pos_driver_id uuid references public.drivers,
  bortoleto_position int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Predictions
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  race_id uuid references public.races on delete cascade not null,
  pole_driver_id uuid references public.drivers,
  p1_driver_id uuid references public.drivers,
  p2_driver_id uuid references public.drivers,
  p3_driver_id uuid references public.drivers,
  random_pos_driver_id uuid references public.drivers,
  bortoleto_position int check (bortoleto_position between 1 and 20),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, race_id)
);

-- Scores (computed after results are in)
create table public.scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  race_id uuid references public.races on delete cascade not null,
  pole_points int default 0,
  p1_points int default 0,
  p2_points int default 0,
  p3_points int default 0,
  random_pos_points int default 0,
  bortoleto_points int default 0,
  total_points int default 0,
  unique(user_id, race_id)
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.races enable row level security;
alter table public.race_results enable row level security;
alter table public.predictions enable row level security;
alter table public.scores enable row level security;

-- Profiles: users can read all, edit only their own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Drivers: everyone can read
create policy "drivers_select" on public.drivers for select using (true);

-- Races: everyone can read
create policy "races_select" on public.races for select using (true);

-- Race results: everyone can read
create policy "race_results_select" on public.race_results for select using (true);

-- Predictions: users can read all (for transparency), but only insert/update their own
create policy "predictions_select" on public.predictions for select using (true);
create policy "predictions_insert" on public.predictions for insert with check (auth.uid() = user_id);
create policy "predictions_update" on public.predictions for update using (auth.uid() = user_id);

-- Scores: everyone can read
create policy "scores_select" on public.scores for select using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2026 F1 Grid (as of early 2026)
insert into public.drivers (name, abbreviation, team, number, is_bortoleto) values
  ('Max Verstappen', 'VER', 'Red Bull Racing', 1, false),
  ('Liam Lawson', 'LAW', 'Red Bull Racing', 30, false),
  ('Lewis Hamilton', 'HAM', 'Ferrari', 44, false),
  ('Charles Leclerc', 'LEC', 'Ferrari', 16, false),
  ('George Russell', 'RUS', 'Mercedes', 63, false),
  ('Andrea Kimi Antonelli', 'ANT', 'Mercedes', 12, false),
  ('Lando Norris', 'NOR', 'McLaren', 4, false),
  ('Oscar Piastri', 'PIA', 'McLaren', 81, false),
  ('Fernando Alonso', 'ALO', 'Aston Martin', 14, false),
  ('Lance Stroll', 'STR', 'Aston Martin', 18, false),
  ('Nico Hülkenberg', 'HUL', 'Sauber', 27, false),
  ('Gabriel Bortoleto', 'BOR', 'Sauber', 5, true),
  ('Pierre Gasly', 'GAS', 'Alpine', 10, false),
  ('Jack Doohan', 'DOO', 'Alpine', 7, false),
  ('Carlos Sainz', 'SAI', 'Williams', 55, false),
  ('Alexander Albon', 'ALB', 'Williams', 23, false),
  ('Yuki Tsunoda', 'TSU', 'Racing Bulls', 22, false),
  ('Isack Hadjar', 'HAD', 'Racing Bulls', 6, false),
  ('Oliver Bearman', 'BEA', 'Haas', 87, false),
  ('Esteban Ocon', 'OCO', 'Haas', 31, false);

-- ─────────────────────────────────────────────────────────────────────────────
-- Grupos (leaderboard privado entre amigos)
-- Nota: estas duas tabelas foram criadas manualmente em produção antes de
-- entrarem neste arquivo. Rodar este bloco só é necessário em um banco novo.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique not null, -- código de 5 caracteres compartilhado com os amigos
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists group_members_group_id_idx on public.group_members (group_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Grupos: todos podem ler (necessário para entrar por código); só o próprio
-- usuário autenticado pode criar
create policy "groups_select" on public.groups for select using (true);
create policy "groups_insert" on public.groups for insert with check (auth.uid() = created_by);

-- Membros: todos podem ler (o ranking por grupo precisa da lista); cada usuário
-- só pode inserir/remover a si mesmo
create policy "group_members_select" on public.group_members for select using (true);
create policy "group_members_insert" on public.group_members for insert with check (auth.uid() = user_id);
create policy "group_members_delete" on public.group_members for delete using (auth.uid() = user_id);
