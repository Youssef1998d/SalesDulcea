import { useState, useEffect, useCallback } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { EmptyState } from "../../../components/ui";
import { supabase } from "../../../core/supabase";
import { AgentsTab }   from "./AgentsTab";
import { ProductsTab } from "./ProductsTab";
import { OverviewTab } from "./OverviewTab";
import { SalesTab }    from "./SalesTab";
import { InvoicingTab, CompanySettings } from "../../invoicing";
import { OrdersTab } from "../../stock";
import { useOrders } from "../../../hooks/useOrders";

export function KAMApp({ user, onSignOut, agent, onThemeToggle, themeMode }) {
  const [tab,           setTab]     = useState("overview");
  const [agents,        setAgents]  = useState([]);
  const [products,      setProducts]= useState([]);
  const [allVisits,     setAllV]    = useState([]);
  const [allClients,    setAllC]    = useState([]);
  const [allSales,      setAllS]    = useState([]);
  const [agentProducts, setAP]      = useState([]);
  const [loading,       setLoading] = useState(false);
  const [org,           setOrg]     = useState(agent?.organizations || null);
  const [settingsOpen,  setSettingsOpen] = useState(false);

  const { orders: orgOrders, load: loadOrders, generatePoDocument, findByQrToken, cancelOrder } = useOrders({ orgId: agent?.org_id });
  useEffect(() => { if (agent?.org_id) loadOrders(); }, [agent, loadOrders]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [ag, pr, vi, cl, sa, ap] = await Promise.all([
      supabase.from("agents").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("active", true).order("name"),
      supabase.from("visits").select("*").order("ts", { ascending: false }),
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
      supabase.from("agent_products").select("*"),
    ]);
    setAgents(ag.data || []); setProducts(pr.data || []); setAllV(vi.data || []);
    setAllC(cl.data || []); setAllS(sa.data || []); setAP(ap.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function approve(id)     { await supabase.from("agents").update({ status: "active" }).eq("id", id); loadAll(); }
  async function reject(id)      { await supabase.from("agents").update({ status: "rejected" }).eq("id", id); loadAll(); }
  async function removeAgent(id) { if (!window.confirm("Supprimer ?")) return; await supabase.from("agents").delete().eq("id", id); loadAll(); }

  const ROLE_DEFAULT_PERMISSIONS = { agent: ["orders"], stock_manager: ["orders", "stock_management"] };

  async function updateRole(id, role) {
    await supabase.from("agents").update({ role, permissions: ROLE_DEFAULT_PERMISSIONS[role] || [] }).eq("id", id);
    loadAll();
  }
  async function togglePermission(id, perm) {
    const a    = agents.find(a => a.id === id);
    const cur  = a?.permissions || [];
    const next = cur.includes(perm) ? cur.filter(p => p !== perm) : [...cur, perm];
    await supabase.from("agents").update({ permissions: next }).eq("id", id);
    loadAll();
  }

  async function saveProduct(payload, existingId) {
    const p = { ...payload, active: true };
    if (existingId) await supabase.from("products").update(p).eq("id", existingId);
    else            await supabase.from("products").insert([p]);
    loadAll();
  }
  async function archiveProduct(id) {
    await supabase.from("products").update({ active: false }).eq("id", id);
    loadAll();
  }

  async function toggleProduct(agentId, productId) {
    const ex = agentProducts.find(ap => ap.agent_id === agentId && ap.product_id === productId);
    if (ex) await supabase.from("agent_products").delete().eq("id", ex.id);
    else    await supabase.from("agent_products").insert([{ agent_id: agentId, product_id: productId, commission_rate: 8 }]);
    loadAll();
  }

  const pending = agents.filter(a => a.status === "pending");
  const kamTabs = [
    { id: "overview",  icon: "grid",          label: "Synthèse",  badge: 0 },
    { id: "agents",    icon: "users",         label: "Équipe",    badge: pending.length },
    { id: "products",  icon: "box",           label: "Produits",  badge: 0 },
    { id: "orders",    icon: "shopping-cart", label: "Commandes", badge: 0 },
    { id: "sales",     icon: "trending-up",   label: "Ventes",    badge: 0 },
    { id: "invoices",  icon: "file-text",     label: "Factures",  badge: 0 },
  ];

  return (
    <AppShell
      tabs={kamTabs}
      active={tab}
      onChange={setTab}
      agent={agent}
      onSignOut={onSignOut}
      onThemeToggle={onThemeToggle}
      themeMode={themeMode}
    >
      {loading && <EmptyState icon="⚓" title="Chargement..." sub="Récupération des données" />}

      {!loading && tab === "overview" && (
        <OverviewTab
          agents={agents}
          allVisits={allVisits}
          allClients={allClients}
          allSales={allSales}
        />
      )}
      {!loading && tab === "agents" && (
        <AgentsTab
          agents={agents}
          allVisits={allVisits}
          allClients={allClients}
          allSales={allSales}
          products={products}
          agentProducts={agentProducts}
          onApprove={approve}
          onReject={reject}
          onRemove={removeAgent}
          onToggleProduct={toggleProduct}
          onUpdateRole={updateRole}
          onTogglePermission={togglePermission}
          onRefresh={loadAll}
        />
      )}
      {!loading && tab === "products" && (
        <ProductsTab
          products={products}
          agentProducts={agentProducts}
          onSave={saveProduct}
          onArchive={archiveProduct}
        />
      )}
      {!loading && tab === "sales" && (
        <SalesTab
          allSales={allSales}
          products={products}
          agents={agents}
          onRefresh={loadAll}
        />
      )}
      {!loading && tab === "orders" && (
        <OrdersTab
          orders={orgOrders}
          loading={false}
          org={org}
          title="Toutes les commandes"
          onGeneratePo={generatePoDocument}
          onResolveQr={findByQrToken}
          onCancelOrder={cancelOrder}
        />
      )}
      {!loading && tab === "invoices" && (
        <InvoicingTab
          role={agent?.role || "kam"}
          orgId={agent?.org_id}
          agentId={user.id}
          org={org}
          clients={allClients}
          orders={orgOrders}
          onOrdersChanged={loadOrders}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      <CompanySettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        org={org}
        onSaved={setOrg}
      />
    </AppShell>
  );
}
