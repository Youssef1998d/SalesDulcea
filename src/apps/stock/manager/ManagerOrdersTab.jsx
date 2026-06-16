import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Card, Btn, Badge, Input, SectionTitle, EmptyState } from "../../../components/ui";

const STATUS_COLOR = { pending:"warning", confirmed:"info", delivered:"success", rejected:"danger" };
const STATUS_LABEL = { pending:"En attente", confirmed:"Confirmée", delivered:"Livrée", rejected:"Refusée" };

export function ManagerOrdersTab({ orders, stock, loading, onConfirm, onReject, onDeliver }) {
  const T = useTheme();
  const [alloc, setAlloc] = useState({}); // orderId -> { lineId: { stockId, qty } }

  function stockOptionsFor(productId) {
    return stock.filter(s => s.product_id === productId && !s.is_future && Number(s.quantity) > 0);
  }

  function setLineAlloc(orderId, lineId, field, value) {
    setAlloc(a => ({
      ...a,
      [orderId]: { ...(a[orderId] || {}), [lineId]: { ...(a[orderId]?.[lineId] || {}), [field]: value } },
    }));
  }

  async function confirm(order) {
    const lines = (order.order_lines || []).map(l => {
      const a = alloc[order.id]?.[l.id] || {};
      return { lineId: l.id, stockId: a.stockId || null, quantityConfirmed: a.qty ?? l.quantity_requested };
    });
    await onConfirm(order.id, lines);
  }

  const pending = orders.filter(o => o.status === "pending");
  const rest    = orders.filter(o => o.status !== "pending");

  if (loading) return <EmptyState icon="🧾" title="Chargement..." />;

  return (
    <div>
      <SectionTitle>Commandes en attente</SectionTitle>
      {!pending.length && <EmptyState icon="🧾" title="Aucune commande en attente" />}
      {pending.map(o => (
        <Card key={o.id} accent={T.warning}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{o.agents?.full_name}</div>
            <div style={{ fontSize:12, color:T.textDim }}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
          </div>
          {(o.order_lines || []).map(l => {
            const opts = stockOptionsFor(l.product_id);
            const cur  = alloc[o.id]?.[l.id] || {};
            return (
              <div key={l.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:6 }}>
                  {l.products?.name} — demandé: {l.quantity_requested} {l.unit}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <select
                    value={cur.stockId || ""}
                    onChange={e => setLineAlloc(o.id, l.id, "stockId", e.target.value)}
                    style={{ flex:1, background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 10px", color:T.text, fontSize:12 }}
                  >
                    <option value="">Lot...</option>
                    {opts.map(s => <option key={s.id} value={s.id}>{s.batch_label || "Lot"} ({s.quantity} dispo)</option>)}
                  </select>
                  <div style={{ width:80 }}>
                    <Input type="number" value={cur.qty ?? l.quantity_requested} onChange={v => setLineAlloc(o.id, l.id, "qty", v)} />
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="success" onClick={() => confirm(o)} style={{ flex:1 }}>Confirmer</Btn>
            <Btn variant="danger" onClick={() => onReject(o.id)} style={{ flex:1 }}>Refuser</Btn>
          </div>
        </Card>
      ))}

      <SectionTitle>Historique</SectionTitle>
      {rest.map(o => (
        <Card key={o.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{o.agents?.full_name}</div>
              <div style={{ fontSize:12, color:T.textDim }}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
            </div>
            <Badge color={T[STATUS_COLOR[o.status]]}>{STATUS_LABEL[o.status] || o.status}</Badge>
          </div>
          {(o.order_lines || []).map(l => (
            <div key={l.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:T.textSub, padding:"3px 0" }}>
              <span>{l.products?.name}</span>
              <span>{l.quantity_confirmed ?? l.quantity_requested} {l.unit}</span>
            </div>
          ))}
          {o.status === "confirmed" && <Btn size="sm" onClick={() => onDeliver(o.id)} style={{ marginTop:8 }}>Marquer livrée</Btn>}
        </Card>
      ))}
    </div>
  );
}
