-- ============================================================================
-- East Blue Sales — Invoice Generation module
-- Run this in the Supabase SQL editor.
-- ============================================================================

-- ── 1. Company / organization fields ───────────────────────────────────────
-- logo_url already exists on organizations. Add the rest of the legal company
-- identity needed on a French invoice.
alter table organizations add column if not exists company_name             text;
alter table organizations add column if not exists address                  text;
alter table organizations add column if not exists phone                    text;
alter table organizations add column if not exists email                    text;
alter table organizations add column if not exists tax_identification_number text;
alter table organizations add column if not exists stamp_url                text;
alter table organizations add column if not exists tax_rate                 numeric not null default 0;

-- ── 2. Client identity fields (company vs individual) ───────────────────────
alter table clients add column if not exists entity_type               text not null default 'company';
alter table clients add column if not exists tax_identification_number text;
-- entity_type ∈ ('company','individual')

-- ── 3. invoices ─────────────────────────────────────────────────────────────
create table if not exists invoices (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  invoice_number     text not null,
  client_id          uuid references clients(id) on delete set null,
  order_id           uuid references orders(id)  on delete set null,
  issue_date         date not null default current_date,
  subtotal           numeric not null default 0,
  tax_rate           numeric not null default 0,
  tax_amount         numeric not null default 0,
  total_amount       numeric not null default 0,
  amount_paid        numeric not null default 0,
  status             text not null default 'draft',  -- draft | issued | paid | partially_paid | cancelled
  pdf_url            text,
  -- Client snapshot — invoice history must never be impacted by future changes
  client_name        text,
  client_address     text,
  client_phone       text,
  client_tax_id      text,
  client_entity_type text,
  created_by         uuid not null references agents(id) on delete cascade,
  created_at         timestamptz not null default now(),
  constraint invoices_org_number_unique unique (organization_id, invoice_number),
  constraint invoices_status_check check (status in ('draft','issued','paid','partially_paid','cancelled'))
);

create index if not exists invoices_org_idx        on invoices(organization_id);
create index if not exists invoices_created_by_idx on invoices(created_by);
create index if not exists invoices_order_idx      on invoices(order_id);

-- One active (non-cancelled) invoice per order
create unique index if not exists invoices_order_unique_active
  on invoices(order_id)
  where order_id is not null and status <> 'cancelled';

-- ── 4. invoice_lines ────────────────────────────────────────────────────────
create table if not exists invoice_lines (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,           -- snapshot
  quantity     numeric not null default 0,
  unit_price   numeric not null default 0, -- snapshot
  line_total   numeric not null default 0
);

create index if not exists invoice_lines_invoice_idx on invoice_lines(invoice_id);

-- ── 5. Sequential, organization-scoped invoice numbering ────────────────────
create table if not exists invoice_counters (
  organization_id uuid not null references organizations(id) on delete cascade,
  year            int  not null,
  last_number     int  not null default 0,
  primary key (organization_id, year)
);

-- Atomic next-number generator → FAC-2026-000001
create or replace function next_invoice_number(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now())::int;
  v_num  int;
begin
  insert into invoice_counters (organization_id, year, last_number)
  values (p_org, v_year, 1)
  on conflict (organization_id, year)
  do update set last_number = invoice_counters.last_number + 1
  returning last_number into v_num;

  return 'FAC-' || v_year::text || '-' || lpad(v_num::text, 6, '0');
end;
$$;

grant execute on function next_invoice_number(uuid) to authenticated;

-- ── 6. Row Level Security ───────────────────────────────────────────────────
alter table invoices      enable row level security;
alter table invoice_lines enable row level security;

-- invoices: creator sees own, managers (kam/superadmin/stock_manager) see all in their org
drop policy if exists invoices_select on invoices;
create policy invoices_select on invoices for select using (
  created_by = auth.uid()
  or exists (
    select 1 from agents a
    where a.id = auth.uid()
      and a.org_id = invoices.organization_id
      and a.role in ('kam','superadmin','stock_manager')
  )
);

drop policy if exists invoices_insert on invoices;
create policy invoices_insert on invoices for insert with check (
  created_by = auth.uid()
  and exists (
    select 1 from agents a
    where a.id = auth.uid() and a.org_id = invoices.organization_id
  )
);

drop policy if exists invoices_update on invoices;
create policy invoices_update on invoices for update using (
  created_by = auth.uid()
  or exists (
    select 1 from agents a
    where a.id = auth.uid()
      and a.org_id = invoices.organization_id
      and a.role in ('kam','superadmin')
  )
);

-- invoice_lines: follow access of parent invoice
drop policy if exists invoice_lines_all on invoice_lines;
create policy invoice_lines_all on invoice_lines for all using (
  exists (
    select 1 from invoices i
    where i.id = invoice_lines.invoice_id
      and (
        i.created_by = auth.uid()
        or exists (
          select 1 from agents a
          where a.id = auth.uid()
            and a.org_id = i.organization_id
            and a.role in ('kam','superadmin','stock_manager')
        )
      )
  )
) with check (
  exists (select 1 from invoices i where i.id = invoice_lines.invoice_id)
);

-- ── 7. Storage buckets ──────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('invoices','invoices', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('branding','branding', true)
  on conflict (id) do nothing;

drop policy if exists invoices_storage_read   on storage.objects;
create policy invoices_storage_read   on storage.objects for select
  using (bucket_id in ('invoices','branding'));

drop policy if exists invoices_storage_insert on storage.objects;
create policy invoices_storage_insert on storage.objects for insert
  with check (bucket_id in ('invoices','branding') and auth.role() = 'authenticated');

drop policy if exists invoices_storage_update on storage.objects;
create policy invoices_storage_update on storage.objects for update
  using (bucket_id in ('invoices','branding') and auth.role() = 'authenticated');

drop policy if exists invoices_storage_delete on storage.objects;
create policy invoices_storage_delete on storage.objects for delete
  using (bucket_id in ('invoices','branding') and auth.role() = 'authenticated');
