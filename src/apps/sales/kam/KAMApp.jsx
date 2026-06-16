import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../../core/theme";
import { OrgHeader } from "../../../components/layout/OrgHeader";
import { BottomBar } from "../../../components/layout/BottomBar";
import { Btn, EmptyState } from "../../ui";
import { supabase } from "../../../core/supabase";
import { AgentsTab }  from "./AgentsTab";
import { ProductsTab } from "./ProductsTab";
import { OverviewTab } from "./OverviewTab";
import { SalesTab }    from "./SalesTab";

export function KAMApp({ user, onSignOut }) {
  const T = useTheme();
  const [tab,          setTab]          = useState("agents");
  const [agents,       setAgents]       = useState([]);
  const [products,     setProducts]     = useState([]);
  const [allVisits,    setAllVisits]    = useState([]);
  const [allClients,   setAllClients]   = useState([]);
  const [allSales,     setAllSales]     = useState([]);
  const [agentProducts,setAP]          = useState([]);
  const [loading,      setLoading]      = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [ag,pr,vi,cl,sa,ap] = await Promise.all([
      supabase.from("agents").select("*").order("created_at",{ascending:false}),
      supabase.from("products").select("*").eq("active",true).order("name"),
      supabase.from("visits").select("*").order("ts",{ascending:false}),
      supabase.from("clients").select("*").order("created_at",{ascending:false}),
      supabase.from("sales").select("*").order("created_at",{ascending:false}),
      supabase.from("agent_products").select("*"),
    ]);
    setAgents(ag.data||[]); setProducts(pr.data||[]); setAllVisits(vi.data||[]);
    setAllClients(cl.data||[]); setAllSales(sa.data||[]); setAP(ap.data||[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function approve(id)  { await supabase.from("agents").update({status:"active"}).eq("id",id); loadAll(); }
  async function reject(id)   { await supabase.from("agents").update({status:"rejected"}).eq("id",id); loadAll(); }
  async function removeAgent(id) { if(!window.confirm("Supprimer ?"))return; await supabase.from("agents").delete().eq("id",id); loadAll(); }

  async function saveProduct(payload, existingId) {
    const p = { ...payload, active:true };
    if (existingId) await supabase.from("products").update(p).eq("id",existingId);
    else            await supabase.from("products").insert([p]);
    loadAll();
  }

  async function archiveProduct(id) {
    await supabase.from("products").update({active:false}).eq("id",id);
    loadAll();
  }

  async function toggleProduct(agentId, productId) {
    const ex = agentProducts.find(ap=>ap.agent_id===agentId&&ap.product_id===productId);
    if (ex) await supabase.from("agent_products").delete().eq("id",ex.id);
    else    await supabase.from("agent_products").insert([{agent_id:agentId,product_id:productId,commission_rate:8}]);
    loadAll();
  }

  async function setCommission(agentId, productId, rate) {
    const ex = agentProducts.find(ap=>ap.agent_id===agentId&&ap.product_id===productId);
    if (!ex) return;
    await supabase.from("agent_products").update({commission_rate:Number(rate)}).eq("id",ex.id);
    loadAll();
  }

  const pending = agents.filter(a=>a.status==="pending");

  const kamTabs = [
    { id:"agents",   icon:"👥", label:"Équipe",  badge:pending.length },
    { id:"products", icon:"📦", label:"Produits", badge:0 },
    { id:"overview", icon:"📊", label:"Overview", badge:0 },
    { id:"sales",    icon:"💰", label:"Ventes",   badge:0 },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", fontFamily:"'Inter',sans-serif", color:T.text, paddingBottom:80 }}>
      <OrgHeader rightSlot={<Btn variant="ghost" size="sm" onClick={onSignOut}>Déconnexion</Btn>} />

      <div style={{ padding:"16px 16px 0" }}>
        {loading && <EmptyState icon="⚓" title="Chargement..." sub="Récupération des données" />}

        {tab==="agents"   && !loading && <AgentsTab agents={agents} allVisits={allVisits} allClients={allClients} allSales={allSales} products={products} agentProducts={agentProducts} onApprove={approve} onReject={reject} onRemove={removeAgent} onToggleProduct={toggleProduct} onSetCommission={setCommission} />}
        {tab==="products" && !loading && <ProductsTab products={products} agentProducts={agentProducts} onSave={saveProduct} onArchive={archiveProduct} />}
        {tab==="overview" && !loading && <OverviewTab agents={agents} allVisits={allVisits} allClients={allClients} allSales={allSales} />}
        {tab==="sales"    && !loading && <SalesTab allSales={allSales} products={products} agents={agents} />}
      </div>

      <BottomBar tabs={kamTabs} active={tab} onChange={setTab} />
    </div>
  );
}
