-- ============================================================================
-- East Blue Sales — Purchase-order lifecycle, QR tracking, multi-PO invoices
-- Run in the Supabase SQL editor (after migration_invoices.sql and
-- migration_orders_client.sql).
-- ============================================================================

-- ── 1. Order document + lifecycle fields ────────────────────────────────────
alter table orders add column if not exists po_number   text;
alter table orders add column if not exists qr_token    text;
alter table orders add column if not exists po_pdf_url   text;
alter table orders add column if not exists invoice_id   uuid references invoices(id) on delete set null;
alter table orders add column if not exists shipped_at   timestamptz;
alter table orders add column if not exists cancelled_at timestamptz;
-- status values used by the app:
--   pending(Créée) → confirmed(Confirmée) → shipped(Expédiée) → delivered(Livrée)
--   plus terminal rejected(Refusée) / cancelled(Annulée).
-- Billing states (Facturée / Payée) are derived from the linked invoice.

create index if not exists orders_invoice_idx on orders(invoice_id);

-- ── 2. Sequential PO numbering (BC-2026-000001), org-scoped ─────────────────
create table if not exists po_counters (
  organization_id uuid not null references organizations(id) on delete cascade,
  year            int  not null,
  last_number     int  not null default 0,
  primary key (organization_id, year)
);

create or replace function next_po_number(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now())::int;
  v_num  int;
begin
  insert into po_counters (organization_id, year, last_number)
  values (p_org, v_year, 1)
  on conflict (organization_id, year)
  do update set last_number = po_counters.last_number + 1
  returning last_number into v_num;
  return 'BC-' || v_year::text || '-' || lpad(v_num::text, 6, '0');
end;
$$;

grant execute on function next_po_number(uuid) to authenticated;

-- ── 3. Backfill QR tokens and PO numbers for existing orders ────────────────
update orders set qr_token = gen_random_uuid()::text where qr_token is null;

do $$
declare r record;
begin
  for r in select id, org_id from orders where po_number is null and org_id is not null order by created_at loop
    update orders set po_number = next_po_number(r.org_id) where id = r.id;
  end loop;
end $$;

create unique index if not exists orders_qr_token_unique on orders(qr_token);
create unique index if not exists orders_org_po_number_unique on orders(org_id, po_number);

-- ── 4. Move invoice↔order link onto orders (an invoice covers many POs) ─────
-- Preserve existing single-PO links, then drop the legacy invoices.order_id so
-- there is exactly one orders↔invoices relationship (avoids embed ambiguity).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'invoices' and column_name = 'order_id'
  ) then
    update orders o
       set invoice_id = i.id
      from invoices i
     where i.order_id = o.id
       and i.status <> 'cancelled'
       and o.invoice_id is null;

    drop index if exists invoices_order_unique_active;
    drop index if exists invoices_order_idx;
    alter table invoices drop column order_id;
  end if;
end $$;
