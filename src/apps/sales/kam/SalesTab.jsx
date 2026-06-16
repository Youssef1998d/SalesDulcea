import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Card, SectionTitle, EmptyState, Badge } from "../../../components/ui";
import { fmtS } from "../../../core/utils";
import { supabase } from "../../../core/supabase";

export function SalesTab({ allSales, products, agents, onRefresh }) {
  const T = useTheme();
  const [editingSale, setEditingSale] = useState(null); // sale id being edited
  const [editRate,    setEditRate]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [filter,      setFilter]      = useState("all"); // all | agent_id | product_id
  const [filterVal,   setFilterVal]   = useState("");

  // ── Per-sale commission edit ──────────────────────────────────────────────
  function startEdit(s) {
    setEditingSale(s.id);
    setEditRate(String(s.commission_rate || 8));
  }

  async function saveEdit(s) {
    setSaving(true);
    const rate     = Number(editRate);
    const earned   = s.net_amount * rate / 100;
    await supabase.from("sales").update({
      commission_rate:     rate,
      commission_earned:   earned,
      commission_override: true,
    }).eq("id", s.id);
    setEditingSale(null);
    setSaving(false);
    onRefresh();
  }

  // ── Filtered sales ────────────────────────────────────────────────────────
  const filtered = allSales.filter(s => {
    if (filter === "agent"   && filterVal) return s.agent_id   === filterVal;
    if (filter === "product" && filterVal) return s.product_id === filterVal;
    return true;
  });

  // ── Product summary (always on full allSales) ─────────────────────────────
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
      {/* Product summary */}
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

      {/* Filter bar */}
      <SectionTitle>Détail des ventes · {filtered.length}</SectionTitle>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {/* Filter by agent */}
        <select
          style={{ flex:1, background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 10px", color:T.text, fontSize:12, outline:"none" }}
          value={filter==="agent"?filterVal:""}
          onChange={e => { setFilter(e.target.value?"agent":"all"); setFilterVal(e.target.value); }}
        >
          <option value="">Tous les agents</option>
          {agents.filter(a=>a.role==="agent").map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}
        </select>

        {/* Filter by product */}
        <select
          style={{ flex:1, background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 10px", color:T.text, fontSize:12, outline:"none" }}
          value={filter==="product"?filterVal:""}
          onChange={e => { setFilter(e.target.value?"product":"all"); setFilterVal(e.target.value); }}
        >
          <option value="">Tous les produits</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <EmptyState icon="📋" title="Aucune vente" />}

      {filtered.slice(0,50).map(s => {
        const ag       = agents.find(a=>a.id===s.agent_id);
        const isEditing = editingSale === s.id;
        return (
          <Card key={s.id} accent={s.commission_override ? T.gold : undefined}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{s.product_name}</div>
                <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>{ag?.full_name||"Agent"} · {s.boxes} boxes</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.gold }}>{fmtS(s.gross_amount)} DT</div>
                {s.commission_override && <Badge color={T.gold}>Modifié</Badge>}
              </div>
            </div>

            {/* Commission display / edit */}
            {isEditing ? (
              <div style={{ background:T.surfaceHi, border:`1px solid ${T.accent}`, borderRadius:10, padding:"10px 12px", marginTop:8 }}>
                <div style={{ fontSize:11, color:T.textSub, marginBottom:6, textTransform:"uppercase", letterSpacing:1 }}>Modifier la commission</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input
                    type="number" min="0" max="100"
                    value={editRate}
                    onChange={e=>setEditRate(e.target.value)}
                    style={{ width:70, background:T.surface, border:`1px solid ${T.accent}`, borderRadius:7, padding:"7px 10px", color:T.gold, fontSize:15, fontWeight:700, outline:"none", textAlign:"center" }}
                  />
                  <div style={{ fontSize:12, color:T.textSub }}>%</div>
                  <div style={{ fontSize:12, color:T.textDim }}>
                    → <span style={{ color:T.gold, fontWeight:700 }}>{fmtS(s.net_amount * Number(editRate) / 100)} DT</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <button onClick={()=>saveEdit(s)} disabled={saving} style={{ flex:1, padding:"8px", background:T.accent, color:T.accentText, border:"none", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer" }}>
                    {saving?"...":"✓ Confirmer"}
                  </button>
                  <button onClick={()=>setEditingSale(null)} style={{ padding:"8px 14px", background:"transparent", color:T.textSub, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, cursor:"pointer" }}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
                <div style={{ fontSize:12, color:T.textDim }}>
                  Commission {s.commission_rate}% →
                  <span style={{ color:T.gold, fontWeight:700, marginLeft:4 }}>{fmtS(s.commission_earned)} DT</span>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ fontSize:11, color:T.textDim }}>{new Date(s.created_at).toLocaleDateString("fr-FR")}</div>
                  <button onClick={()=>startEdit(s)} style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 10px", color:T.textSub, fontSize:11, cursor:"pointer" }}>
                    ✎ %
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
