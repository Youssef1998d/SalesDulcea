-- ============================================================================
-- East Blue Sales — allow managers to generate invoices on an agent's behalf
-- Run in the Supabase SQL editor (after the previous invoice migrations).
-- ============================================================================

-- The invoice is always attributed to the PO's initiating agent (created_by).
-- Previously the INSERT policy required created_by = auth.uid(), which blocked
-- managers. Now: the row's created_by may be the agent, as long as the inserter
-- is either that agent or a manager (kam/superadmin) of the same org.
drop policy if exists invoices_insert on invoices;
create policy invoices_insert on invoices for insert with check (
  exists (
    select 1 from agents a
    where a.id = auth.uid() and a.org_id = invoices.organization_id
  )
  and (
    created_by = auth.uid()
    or exists (
      select 1 from agents m
      where m.id = auth.uid()
        and m.org_id = invoices.organization_id
        and m.role in ('kam','superadmin')
    )
  )
);
