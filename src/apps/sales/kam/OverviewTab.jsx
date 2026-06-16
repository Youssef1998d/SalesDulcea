import { useTheme } from "../../../core/theme";
import { Card, Badge, SectionTitle, EmptyState, StatGrid } from "../../../components/ui";
import { fmtS } from "../../../core/utils";

export function OverviewTab({ agents, allVisits, allClients, allSales }) {
  const T      = useTheme();
  const active = agents.filter(a=>a.status==="active"&&a.role==="agent");

  const totalGMV  = allSales.reduce((a,s)=>a+Number(s.gross_amount||0),0);
  const totalComm = allSales.reduce((a,s)=>a+Number(s.commission_earned||0),0);
  const soldCount = allVisits.filter(v=>v.outcome==="Vendu").length;

  function agentStats(id) {
    const v     = allVisits.filter(v=>v.agent_id===id);
    const s     = v.filter(v=>v.outcome==="Vendu");
    const sales = allSales.filter(s=>s.agent_id===id);
    const gmv   = sales.reduce((a,s)=>a+Number(s.gross_amount||0),0);
    return { visits:v.length, sold:s.length, clients:allClients.filter(c=>c.agent_id===id).length, gmv, conv:v.length?Math.round(s.length/v.length*100):0 };
  }

  return (
    <div>
      <SectionTitle>Vue globale</SectionTitle>
      <StatGrid stats={[
        { label:"Agents actifs",  value:active.length },
        { label:"Visites totales",value:allVisits.length },
        { label:"Ventes totales", value:soldCount, accent:true },
        { label:"GMV total DT",   value:fmtS(totalGMV), accent:true },
      ]} />

      <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontSize:13 }}>
          <span style={{ color:T.textDim }}>Commissions agents totales</span>
          <span style={{ color:T.gold, fontWeight:700 }}>{fmtS(totalComm)} DT</span>
        </div>
      </div>

      <SectionTitle>Performance par agent</SectionTitle>
      {active.length === 0 && <EmptyState icon="🌊" title="Aucun agent actif" />}
      {active.map(a => {
        const st = agentStats(a.id);
        return (
          <Card key={a.id}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontWeight:700 }}>{a.full_name}</div>
              <Badge color={st.conv>=50?T.success:st.conv>=30?T.warning:T.danger}>{st.conv}% conv.</Badge>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {[["Visites",st.visits],["Ventes",st.sold],["Clients",st.clients],[`${fmtS(st.gmv)} DT`,"GMV"]].map(([v,l])=>(
                <div key={l} style={{ background:T.surfaceHi, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.text }}>{v}</div>
                  <div style={{ fontSize:10, color:T.textDim }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
