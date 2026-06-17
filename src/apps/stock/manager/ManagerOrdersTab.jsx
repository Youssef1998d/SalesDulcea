import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Btn, Badge, SectionTitle, EmptyState, SkeletonList } from "../../../components/ui";
import { useIsMobile } from "../../../hooks/useIsMobile";

const STATUS_COLOR = { pending: "warning", confirmed: "info", delivered: "success", rejected: "danger" };
const STATUS_LABEL = { pending: "En attente", confirmed: "Confirmée", delivered: "Livrée", rejected: "Refusée" };

export function ManagerOrdersTab({ orders, stock, loading, onConfirm, onReject, onDeliver }) {
  const T      = useTheme();
  const mobile = useIsMobile();
  const [alloc, setAlloc] = useState({});

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

  const pending   = orders.filter(o => o.status === "pending");
  const confirmed = orders.filter(o => o.status === "confirmed");
  const rest      = orders.filter(o => o.status !== "pending" && o.status !== "confirmed");

  if (loading) return <SkeletonList count={3} height={100} />;

  return (
    <div>
      {/* Pending orders */}
      <SectionTitle>En attente · {pending.length}</SectionTitle>
      {!pending.length && (
        <EmptyState icon="🧾" title="Aucune commande en attente" sub="Les nouvelles commandes des agents apparaîtront ici" />
      )}

      {pending.map(o => (
        <div key={o.id} style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.warning}`,
          borderRadius: 14, padding: "16px", marginBottom: 10,
          boxShadow: T.shadow,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{o.clients?.name || "Client —"}</div>
              <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>
                {o.agents?.full_name ? `${o.agents.full_name} · ` : ""}
                {new Date(o.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </div>
            </div>
            <Badge color={T.warning}>En attente</Badge>
          </div>

          {/* Lines with allocation */}
          {(o.order_lines || []).map(l => {
            const opts = stockOptionsFor(l.product_id);
            const cur  = alloc[o.id]?.[l.id] || {};
            return (
              <div key={l.id} style={{
                marginBottom: 12, paddingBottom: 12,
                borderBottom: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>
                  {l.products?.name}
                  <span style={{ color: T.textDim, fontWeight: 400, marginLeft: 8 }}>
                    demandé: {l.quantity_requested} {l.unit}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {/* Batch selector */}
                  <select
                    value={cur.stockId || ""}
                    onChange={e => setLineAlloc(o.id, l.id, "stockId", e.target.value)}
                    style={{
                      flex: 1, minWidth: 120,
                      background: T.surfaceHi, border: `1px solid ${T.border}`,
                      borderRadius: 9, padding: "8px 10px",
                      color: T.text, fontSize: 12, outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = T.accent}
                    onBlur={e => e.target.style.borderColor = T.border}
                  >
                    <option value="">Lot...</option>
                    {opts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.batch_label || "Lot"} ({s.quantity} dispo)
                      </option>
                    ))}
                  </select>

                  {/* Quantity override */}
                  <input
                    type="number" min="0"
                    value={cur.qty ?? l.quantity_requested}
                    onChange={e => setLineAlloc(o.id, l.id, "qty", e.target.value)}
                    style={{
                      width: 80, background: T.surfaceHi,
                      border: `1px solid ${T.border}`, borderRadius: 9,
                      padding: "8px 10px", color: T.text, fontSize: 13,
                      fontWeight: 600, outline: "none", textAlign: "center",
                    }}
                    onFocus={e => e.target.style.borderColor = T.accent}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="success" onClick={() => confirm(o)} style={{ flex: 1 }}>✓ Confirmer</Btn>
            <Btn variant="danger"  onClick={() => onReject(o.id)} style={{ flex: 1 }}>✕ Refuser</Btn>
          </div>
        </div>
      ))}

      {/* Confirmed — awaiting delivery */}
      {confirmed.length > 0 && (
        <>
          <SectionTitle>Confirmées · {confirmed.length}</SectionTitle>
          {confirmed.map(o => (
            <div key={o.id} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${T.info}`,
              borderRadius: 14, padding: "14px 16px", marginBottom: 9,
              boxShadow: T.shadow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{o.clients?.name || "Client —"}</div>
                  <div style={{ fontSize: 12, color: T.textDim }}>{o.agents?.full_name ? `${o.agents.full_name} · ` : ""}{new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
                </div>
                <Badge color={T.info}>Confirmée</Badge>
              </div>
              {(o.order_lines || []).map(l => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSub, padding: "3px 0" }}>
                  <span>{l.products?.name}</span>
                  <span>{l.quantity_confirmed ?? l.quantity_requested} {l.unit}</span>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <Btn size="sm" variant="success" onClick={() => onDeliver(o.id)}>✓ Marquer livrée</Btn>
              </div>
            </div>
          ))}
        </>
      )}

      {/* History */}
      {rest.length > 0 && (
        <>
          <SectionTitle>Historique · {rest.length}</SectionTitle>
          {rest.map(o => (
            <div key={o.id} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "12px 15px", marginBottom: 8,
              opacity: 0.8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{o.clients?.name || "Client —"}</div>
                  <div style={{ fontSize: 11, color: T.textDim }}>{o.agents?.full_name ? `${o.agents.full_name} · ` : ""}{new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
                </div>
                <Badge color={T[STATUS_COLOR[o.status]]}>{STATUS_LABEL[o.status] || o.status}</Badge>
              </div>
              {(o.order_lines || []).map(l => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textDim, padding: "2px 0" }}>
                  <span>{l.products?.name}</span>
                  <span>{l.quantity_confirmed ?? l.quantity_requested} {l.unit}</span>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
