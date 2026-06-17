-- ============================================================================
-- East Blue Sales — link purchase orders to a client
-- Run in the Supabase SQL editor (after migration_invoices.sql).
-- ============================================================================

-- An order is now associated with exactly one client (and already with an agent
-- via agent_id). The agent's name is available through agents.full_name.
alter table orders add column if not exists client_id uuid references clients(id) on delete set null;

create index if not exists orders_client_idx on orders(client_id);
