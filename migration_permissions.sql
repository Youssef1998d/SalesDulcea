-- ─── Granular permissions on agents ────────────────────────────────────────
alter table agents add column if not exists permissions text[] default '{}';

-- Backfill sensible defaults for existing users
update agents set permissions = array['orders'] where role = 'agent' and permissions = '{}';
update agents set permissions = array['orders','stock_management'] where role = 'stock_manager' and permissions = '{}';
