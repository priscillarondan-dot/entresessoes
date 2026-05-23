
create table if not exists psychologists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamptz default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid references psychologists(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  objective text,
  access_code text unique not null,
  created_at timestamptz default now()
);

create table if not exists therapy_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  psychologist_id uuid references psychologists(id) on delete cascade,
  theme text not null,
  triggers text,
  weekly_goal text,
  exercises text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  session_id uuid references therapy_sessions(id) on delete cascade,
  message text not null,
  scheduled_period text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists patient_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  mood int not null,
  note text,
  created_at timestamptz default now()
);

alter table psychologists enable row level security;
alter table patients enable row level security;
alter table therapy_sessions enable row level security;
alter table support_messages enable row level security;
alter table patient_checkins enable row level security;

create policy "public psychologists" on psychologists for all using (true) with check (true);
create policy "public patients" on patients for all using (true) with check (true);
create policy "public sessions" on therapy_sessions for all using (true) with check (true);
create policy "public messages" on support_messages for all using (true) with check (true);
create policy "public checkins" on patient_checkins for all using (true) with check (true);
