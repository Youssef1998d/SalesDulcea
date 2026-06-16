-- ─── Stock batches ──────────────────────────────────────────────────────────
create table if not exists stock (
  id            uuid default gen_random_uuid() primary key,
  created_at    timestamp with time zone default timezone('utc', now()),
  org_id        uuid references organizations(id) not null,
  product_id    uuid references products(id) not null,
  quantity      numeric not null default 0,
  batch_label   text,
  is_future     boolean default false,
  expected_date date,
  notes         text
);
alter table stock disable row level security;

-- ─── Orders ─────────────────────────────────────────────────────────────────
create table if not exists orders (
  id            uuid default gen_random_uuid() primary key,
  created_at    timestamp with time zone default timezone('utc', now()),
  agent_id      uuid references agents(id) not null,
  org_id        uuid references organizations(id) not null,
  status        text default 'pending', -- pending | confirmed | rejected | delivered
  notes         text,
  confirmed_by  uuid references agents(id),
  confirmed_at  timestamp with time zone,
  delivered_at  timestamp with time zone
);
alter table orders disable row level security;

-- ─── Order lines ────────────────────────────────────────────────────────────
create table if not exists order_lines (
  id                  uuid default gen_random_uuid() primary key,
  order_id            uuid references orders(id) on delete cascade not null,
  product_id          uuid references products(id) not null,
  stock_id            uuid references stock(id),
  quantity_requested  numeric not null,
  quantity_confirmed  numeric,
  unit                text
);
alter table order_lines disable row level security;
