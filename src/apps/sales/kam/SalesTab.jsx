import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { SectionTitle, EmptyState, Badge, InlineEdit } from "../../../components/ui";
import { fmtS } from "../../../core/utils";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { supabase } from "../../../core/supabase";

export function SalesTab({ allSales, products, agents, onRefresh }) {
  const T      = useTheme();
  const mobile = useIsMobile();
  const [editingSale, setEditingSale] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [filterAgent, setFilterAgent] = useState("");
  const [filterProd,  setFilterProd]  = useState("");

  async function saveEdit(sale, newRate) {
    setSaving(true);
    const rate   = Number(newRate);
    const earned = sale.net_amount * rate / 100;
    await supabase.from("sales").update({
      commission_rate: rate, commission_earned: earned, commission_override: true,
    }).eq("id", sale.id);
    setEditingSale(null);
    setSaving(false);
    onRefresh();
  }

  const filtered = allSales.filter(s => {
    if (filterAgent && s.agent_id   !== filterAgent)  return false;
    if (filterProd  && s.product_id !== filterProd)   return false;
    return true;
  });

  const productSales = products.map(p => {
    const rows = allSales.filter(s => s.product_id === p.id);
    return {
      ...p,
      totalBoxes: rows.reduce((a, s) => a + Number(s.boxes || 0), 0),
      totalGross: rows.reduce((a, s) => a + Number(s.gross_amount || 0), 0),
      totalComm:  rows.reduce((a, s) => a + Number(s.commission_earned || 0), 0),
    };
  }).filter(p => p.totalBoxes > 0);

  return (
    <div>
      {/* Product summary */}
      <SectionTitle>Ventes par produit</SectionTitle>
      {productSales.length === 0 && (
        <EmptyState icon="💰" title="Aucune vente" sub="Les ventes apparaîtront ici quand les agents logueront des visites vendues" />
      )}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 20 }}>
        {productSales.map(p => (
          <div key={p.id} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${T.gold}`,
            borderRadius: 14, padding: "14px 16px",
            boxShadow: T.shadow,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>{p.name}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: T.gold, letterSpacing: 1, marginBottom: 8 }}>
              {fmtS(p.totalGross)} DT
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: T.text }}>{fmtS(p.totalBoxes)}</div>
                <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Boxes</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: T.success }}>{fmtS(p.totalComm)}</div>
                <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Commissions DT</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <SectionTitle>Détail des ventes · {filtered.length}</SectionTitle>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          style={{
            flex: 1, minWidth: 160,
            background: T.surfaceHi, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none",
          }}
        >
          <option value="">Tous les agents</option>
          {agents.filter(a => a.role === "agent").map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
        </select>
        <select
          value={filterProd}
          onChange={e => setFilterProd(e.target.value)}
          style={{
            flex: 1, minWidth: 160,
            background: T.surfaceHi, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none",
          }}
        >
          <option value="">Tous les produits</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <EmptyState icon="📋" title="Aucune vente" />}

      {!mobile ? (
        // Desktop table
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: T.shadow }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surfaceHi, borderBottom: `1px solid ${T.border}` }}>
                {["Produit", "Agent", "Boxes", "CA brut DT", "Commission", "Date"].map(h => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left",
                    fontSize: 11, color: T.textSub, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(s => {
                const ag = agents.find(a => a.id === s.agent_id);
                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.surfaceHi; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{s.product_name}</div>
                      {s.commission_override && <Badge color={T.gold}>Modifié</Badge>}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, color: T.textSub }}>{ag?.full_name || "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 13, color: T.text }}>{s.boxes}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: T.gold }}>{fmtS(s.gross_amount)}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {editingSale === s.id ? (
                        <InlineEdit
                          value={s.commission_rate || 8}
                          onSave={val => saveEdit(s, val)}
                          onCancel={() => setEditingSale(null)}
                          suffix="%"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingSale(s.id)}
                          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                          title="Cliquer pour modifier"
                        >
                          <span style={{ fontSize: 13, color: T.text }}>{s.commission_rate}%</span>
                          <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{fmtS(s.commission_earned)} DT</span>
                          <span style={{ fontSize: 10, color: T.textDim }}>✎</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: T.textDim }}>
                      {new Date(s.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Mobile cards
        filtered.slice(0, 50).map(s => {
          const ag = agents.find(a => a.id === s.agent_id);
          return (
            <div key={s.id} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: s.commission_override ? `3px solid ${T.gold}` : `1px solid ${T.border}`,
              borderRadius: 14, padding: "13px 15px", marginBottom: 9,
              boxShadow: T.shadow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{s.product_name}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: T.gold }}>{fmtS(s.gross_amount)} DT</div>
              </div>
              <div style={{ fontSize: 12, color: T.textSub, marginBottom: 8 }}>
                {ag?.full_name || "Agent"} · {s.boxes} boxes
              </div>
              {editingSale === s.id ? (
                <InlineEdit value={s.commission_rate || 8} onSave={val => saveEdit(s, val)} onCancel={() => setEditingSale(null)} suffix="%" />
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: T.textDim }}>
                    {s.commission_rate}% → <span style={{ color: T.gold, fontWeight: 700 }}>{fmtS(s.commission_earned)} DT</span>
                    {s.commission_override && <> · <Badge color={T.gold}>Modifié</Badge></>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: T.textDim }}>{new Date(s.created_at).toLocaleDateString("fr-FR")}</div>
                    <button onClick={() => setEditingSale(s.id)} style={{
                      background: T.surfaceHi, border: `1px solid ${T.border}`,
                      borderRadius: 6, padding: "4px 10px", color: T.textSub, fontSize: 11, cursor: "pointer",
                    }}>✎ %</button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
