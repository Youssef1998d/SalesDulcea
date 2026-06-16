import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Card, Badge, Btn, SectionTitle, EmptyState } from "../../../components/ui";
import { fmtS } from "../../../core/utils";

export function AgentsTab({ agents, allVisits, allClients, allSales, products, agentProducts, onApprove, onReject, onRemove, onToggleProduct, onSetCommission }) {
  const T = useTheme();
  const [assignAgent, setAssignAgent] = useState(null);

  const pending = agents.filter(a=>a.status==="pending");
  const active  = agents.filter(a=>a.status==="active"&&a.role==="agent");

  function agentStats(id) {
    const v = allVisits.filter(v=>v.agent_id===id);
    const s = v.filter(v=>v.outcome==="Vendu");
    const sales = allSales.filter(s=>s.agent_id===id);
    const gmv  = sales.reduce((a,s)=>a+Number(s.gross_amount||0),0);
    return { visits:v.length, sold:s.length, clients:allClients.filter(c=>c.agent_id===id).length, gmv, conv:v.length?Math.round(s.length/v.length*100):0 };
  }

  return (
    <div>
      {/* Assignment Modal */}
      {assignAgent && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"18px 18px 0 0", padding:"24px 20px", width:"100%", maxWidth:480, maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:T.gold, letterSpacing:2 }}>PRODUITS — {assignAgent.full_name}</div>
              <button onClick={()=>setAssignAgent(null)} style={{ background:"none", border:"none", color:T.textSub, fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            {products.length === 0 && <EmptyState icon="📦" title="Aucun produit" sub="Ajoutez des produits d'abord" />}
            {products.map(p => {
              const ap       = agentProducts.find(a=>a.agent_id===assignAgent.id&&a.product_id===p.id);
              const assigned = !!ap;
              return (
                <div key={p.id} style={{ background:T.surfaceHi, border:`1px solid ${assigned?T.accent:T.border}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:assigned?10:0 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color:assigned?T.accent:T.text }}>{p.name}</div>
                      <div style={{ fontSize:11, color:T.textDim }}>{p.price} DT · {p.unit}</div>
                    </div>
                    <button className="eb-btn" onClick={()=>onToggleProduct(assignAgent.id,p.id)} style={{
                      padding:"6px 14px", borderRadius:20, border:`1.5px solid ${assigned?T.accent:T.border}`,
                      background:assigned?T.accent+"22":"transparent", color:assigned?T.accent:T.textSub,
                      fontSize:12, fontWeight:600, cursor:"pointer",
                    }}>{assigned?"✓ Assigné":"+ Assigner"}</button>
                  </div>
                  {assigned && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                      <div style={{ fontSize:11, color:T.textDim }}>Commission %</div>
                      <input type="number" min="0" max="100" defaultValue={ap.commission_rate||8}
                        onBlur={e=>onSetCommission(assignAgent.id,p.id,e.target.value)}
                        style={{ width:64, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:"5px 8px", color:T.gold, fontSize:13, fontWeight:700, outline:"none" }} />
                      <div style={{ fontSize:11, color:T.textDim }}>% sur ventes nettes</div>
                    </div>
                  )}
                </div>
              );
            })}
            <Btn style={{ width:"100%", marginTop:8 }} onClick={()=>setAssignAgent(null)}>Fermer</Btn>
          </div>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && <>
        <SectionTitle>Demandes en attente · {pending.length}</SectionTitle>
        {pending.map(a=>(
          <Card key={a.id} accent={T.warning}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{a.full_name}</div>
                {a.phone&&<div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>📞 {a.phone}</div>}
                <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>Inscrit le {new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
              <Badge color={T.warning}>En attente</Badge>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn size="sm" variant="success" onClick={()=>onApprove(a.id)}>✓ Approuver</Btn>
              <Btn size="sm" variant="danger"  onClick={()=>onReject(a.id)}>✕ Rejeter</Btn>
            </div>
          </Card>
        ))}
      </>}

      {/* Active agents */}
      <SectionTitle>Agents actifs · {active.length}</SectionTitle>
      {active.length===0 && <EmptyState icon="🌊" title="Aucun agent actif" sub="Approuvez des demandes pour constituer votre équipe" />}
      {active.map(a=>{
        const st       = agentStats(a.id);
        const assigned = agentProducts.filter(ap=>ap.agent_id===a.id);
        return (
          <Card key={a.id} accent={T.success}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{a.full_name}</div>
                {a.phone&&<div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>📞 {a.phone}</div>}
              </div>
              <Badge color={T.success}>Actif</Badge>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
              {[["Visites",st.visits],["Ventes",st.sold],[`${st.conv}%`,"Conv."],[`${fmtS(st.gmv)}`,"DT GMV"]].map(([v,l])=>(
                <div key={l} style={{ background:T.surfaceHi, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.text }}>{v}</div>
                  <div style={{ fontSize:10, color:T.textDim }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Produits assignés ({assigned.length})</div>
              {assigned.length===0
                ? <div style={{ fontSize:12, color:T.textDim, fontStyle:"italic" }}>Aucun produit assigné</div>
                : <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {assigned.map(ap=>{const p=products.find(p=>p.id===ap.product_id);return p?<span key={ap.id} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:T.accent+"22", color:T.accent, border:`1px solid ${T.accent}44` }}>{p.name} · {ap.commission_rate}%</span>:null;})}
                  </div>
              }
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Btn size="sm" variant="primary" onClick={()=>setAssignAgent(a)}>📦 Gérer produits</Btn>
              <Btn size="sm" variant="danger"  onClick={()=>onRemove(a.id)}>Supprimer</Btn>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
