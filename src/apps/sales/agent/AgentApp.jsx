import { useState, useEffect } from "react";
import { useTheme } from "../../../core/theme";
import { OrgHeader } from "../../../components/layout/OrgHeader";
import { BottomBar } from "../../../components/layout/BottomBar";
import { Btn } from "../../ui";
import { useVisits }  from "../../../hooks/useVisits";
import { useClients } from "../../../hooks/useClients";
import { useProducts } from "../../../hooks/useProducts";
import { useSales }   from "../../../hooks/useSales";
import { emptyLine, calcFin, fmtS } from "../../../core/utils";
import { LogTab }        from "./LogTab";
import { FollowupTab }   from "./FollowupTab";
import { ClientsTab }    from "./ClientsTab";
import { StatsTab, NBATab } from "./StatsNBATab";

const OUTCOMES = ["Vendu","Intéressé","Revenir","Refus"];
const CONTACTS = ["Propriétaire","Manager","Employé"];

export function AgentApp({ user, agent, onSignOut }) {
  const T = useTheme();

  const { visits, loading:vLoad, load:loadVisits, add:addVisit, update:updateVisit, remove:removeVisit } = useVisits(user.id);
  const { clients, loading:cLoad, load:loadClients, save:saveClient, remove:removeClient, recordReorder } = useClients(user.id);
  const { products, loadAssigned } = useProducts(user.id);
  const { insertFromVisit } = useSales();

  const [tab,    setTab]    = useState("log");
  const [form,   setForm]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    loadAssigned().then(() => {});
    loadVisits();
    loadClients();
  }, []);

  // Once products load, init form
  useEffect(() => {
    if (products.length > 0 && !form) {
      setForm({ business:"", zone:"", contact:CONTACTS[0], lines:[emptyLine(products)], outcome:OUTCOMES[0], note:"" });
    }
  }, [products]);

  async function handleLogVisit() {
    if (!form?.business.trim()) return;
    setSaving(true);
    const now     = new Date();
    const visitId = Date.now();
    try {
      await addVisit({ id:visitId, agent_id:user.id, ts:now.toISOString(), hour:now.getHours(), business:form.business.trim(), zone:form.zone, contact:form.contact, lines:form.lines.map(l=>({productId:l.productId,boxes:Number(l.boxes),freePots:Number(l.freePots)})), outcome:form.outcome, note:form.note });
      if (form.outcome === "Vendu") await insertFromVisit(visitId, user.id, form.lines, products);
      setForm({ business:"", zone:"", contact:CONTACTS[0], lines:[emptyLine(products)], outcome:OUTCOMES[0], note:"" });
      setSaved(true); setTimeout(()=>setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  async function handleConvert(id, lines) {
    await updateVisit(id, { outcome:"Vendu" });
    await insertFromVisit(id, user.id, lines, products);
  }

  async function handleReorder(client) {
    const amt = window.prompt(`Montant (DT) — ${client.name} ?`);
    if (!amt) return;
    await recordReorder(client.id, amt);
  }

  // Stats
  const sold      = visits.filter(v=>v.outcome==="Vendu");
  const followups = visits.filter(v=>v.outcome==="Intéressé"||v.outcome==="Revenir");
  const total     = visits.length;
  const convRate  = total ? Math.round(sold.length/total*100) : 0;
  let tGross=0, tInv=0, tBoxes=0;
  sold.forEach(v=>{ const f=calcFin(v.lines,products); tGross+=f.gross; tInv+=f.inv; (v.lines||[]).forEach(l=>{tBoxes+=Number(l.boxes||0);}); });
  visits.filter(v=>v.outcome!=="Vendu").forEach(v=>{tInv+=calcFin(v.lines,products).inv;});
  const urgentClients = clients.filter(c=>{ const {daysUntil:du}=require("../../../core/utils"); return false; }); // computed in ClientsTab
  const todayStr  = new Date().toDateString();
  const todayV    = visits.filter(v=>new Date(v.ts).toDateString()===todayStr).length;
  const todayS    = sold.filter(v=>new Date(v.ts).toDateString()===todayStr).length;

  const tabs = [
    { id:"log",      icon:"📋", label:"Log",     badge:0 },
    { id:"followup", icon:"🔁", label:"Relances", badge:followups.length },
    { id:"clients",  icon:"👥", label:"Clients",  badge:0 },
    { id:"dash",     icon:"📊", label:"Stats",    badge:0 },
    { id:"nba",      icon:"🎯", label:"Action",   badge:0 },
  ];

  if (!form) return (
    <div style={{ background:T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:T.textSub }}>Chargement...</div>
    </div>
  );

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", fontFamily:"'Inter',sans-serif", color:T.text, paddingBottom:90 }}>
      <OrgHeader rightSlot={<Btn size="sm" variant="ghost" onClick={onSignOut}>Déco</Btn>} />

      <div style={{ padding:"16px 16px 0" }}>
        {tab==="log"      && <LogTab form={form} setForm={setForm} products={products} onSubmit={handleLogVisit} saving={saving} saved={saved} visits={visits} onDeleteVisit={removeVisit} onConvertVisit={handleConvert} />}
        {tab==="followup" && <FollowupTab followups={followups} products={products} loading={vLoad} onConvert={handleConvert} onDelete={removeVisit} />}
        {tab==="clients"  && <ClientsTab clients={clients} loading={cLoad} onSave={saveClient} onDelete={removeClient} onReorder={handleReorder} />}
        {tab==="dash"     && <StatsTab visits={visits} sold={sold} convRate={convRate} tGross={tGross} tInv={tInv} tBoxes={tBoxes} todayVisits={todayV} todaySales={todayS} products={products} />}
        {tab==="nba"      && <NBATab total={total} urgentClients={[]} followups={followups} convRate={convRate} tInv={tInv} tGross={tGross} fmtS={fmtS} />}
      </div>

      <BottomBar tabs={tabs} active={tab} onChange={setTab} />
    </div>
  );
}
