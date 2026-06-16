import { useTheme } from "../../../core/theme";
import { Card, SectionTitle, EmptyState } from "../../../components/ui";
import { fmtS } from "../../../core/utils";

export function SalesTab({ allSales, products, agents }) {
  const T = useTheme();

  const productSales = products.map(p => {
    const rows = allSales.filter(s=>s.product_id===p.id);
    return {
      ...p,
      totalBoxes: rows.reduce((a,s)=>a+Number(s.boxes||0),0),
      totalGross: rows.reduce((a,s)=>a+Number(s.gross_amount||0),0),
      totalComm:  rows.reduce((a,s)=>a+Number(s.commission_earned||0),0),
    };
  }).filter(p=>p.totalBoxes>0);

  return (
    <div>
      <SectionTitle>Ventes par produit</SectionTitle>
      {productSales.length === 0 && <EmptyState icon="💰" title="Aucune vente" sub="Les ventes apparaîtront ici quand des agents logueront des visites vendues" />}
      {productSales.map(p => (
        <Card key={p.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:T.gold }}>{fmtS(p.totalGross)} DT</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {[["Boxes",fmtS(p.totalBoxes)],["CA brut DT",fmtS(p.totalGross)],["Commissions DT",fmtS(p.totalComm)]].map(([l,v])=>(
              <div key={l} style={{ background:T.surfaceHi, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.text }}>{v}</div>
                <div style={{ fontSize:10, color:T.textDim }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <SectionTitle>Dernières ventes · {Math.min(allSales.length,20)} / {allSales.length}</SectionTitle>
      {allSales.length === 0 && <EmptyState icon="📋" title="Aucune vente" />}
      {allSales.slice(0,20).map(s => {
        const ag = agents.find(a=>a.id===s.agent_id);
        return (
          <Card key={s.id}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{s.product_name}</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.gold }}>{fmtS(s.gross_amount)} DT</div>
            </div>
            <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>{ag?.full_name||"Agent"} · {s.boxes} boxes</div>
            <div style={{ display:"flex", gap:12, fontSize:11, color:T.textDim }}>
              <span>Commission: <span style={{ color:T.gold }}>{fmtS(s.commission_earned)} DT</span></span>
              <span>{new Date(s.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
