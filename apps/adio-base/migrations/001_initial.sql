create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  mobile text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists generation_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  agent_id text not null default 'component-forge',
  requirement text not null,
  framework text not null check (framework in ('react', 'html')),
  component_name text not null,
  status text not null check (status in ('started', 'completed', 'failed')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists generation_prompts (
  id bigint generated always as identity primary key,
  operation_id uuid not null references generation_operations(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  prompt text not null,
  created_at timestamptz not null default now()
);

create table if not exists generation_files (
  id bigint generated always as identity primary key,
  operation_id uuid not null references generation_operations(id) on delete cascade,
  filename text not null check (filename !~ '(^/|\.\.|\\)'),
  content text not null,
  created_at timestamptz not null default now(),
  unique (operation_id, filename)
);

create index if not exists generation_operations_user_created_idx on generation_operations(user_id, created_at desc);
create index if not exists generation_prompts_user_created_idx on generation_prompts(user_id, created_at desc);
create index if not exists generation_operations_user_status_idx on generation_operations(user_id, status);

alter table app_users enable row level security;
alter table generation_operations enable row level security;
alter table generation_prompts enable row level security;
alter table generation_files enable row level security;
