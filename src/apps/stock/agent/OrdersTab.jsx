import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Badge, Btn, SectionTitle, EmptyState, SkeletonList } from "../../../components/ui";
import { OrderTimeline } from "../../../components/OrderTimeline";
import { TrackingScanner } from "../../tracking/TrackingScanner";
import { ORDER_STATUS } from "../../../core/orderConstants";

const CANCELLABLE = ["pending", "confirmed", "shipped"];

export function OrdersTab({ orders, loading, org, onGeneratePo, onCancelOrder, onResolveQr }) {
  const T = useTheme();
  const [expanded, setExpanded] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [busy,     setBusy]     = useState(null);

  if (loading) return <SkeletonList count={3} height={90} />;

  async function openPo(o) {
    setBusy(o.id);
    try {
      const url = o.po_pdf_url || (onGeneratePo ? await onGeneratePo(o) : null);
      if (url) window.open(url, "_blank", "noopener");
    } finally { setBusy(null); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionTitle>Mes commandes · {orders.length}</SectionTitle>
        {onResolveQr && (
          <Btn size="sm" variant="subtle" onClick={() => setScanOpen(true)}>📷 Scanner</Btn>
        )}
      </div>

      {!orders.length && (
        <EmptyState icon="🧾" title="Aucune commande" sub="Passez votre première commande depuis l'onglet Stock" />
      )}

      {orders.map(o => {
        const cfg = ORDER_STATUS[o.status] || { color: "info", label: o.status };
        const isOpen = expanded === o.id;
        const canCancel = CANCELLABLE.includes(o.status) && !o.invoice_id;
        return (
          <div key={o.id} className="eb-card" style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${T[cfg.color] || T.info}`,
            borderRadius: 14, padding: "14px 16px", marginBottom: 10, boxShadow: T.shadow,
          }}>
            <div onClick={() => setExpanded(isOpen ? null : o.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{o.clients?.name || "Client —"}</div>
                <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>
                  {o.po_number || "—"}
                  {o.agents?.full_name ? ` · ${o.agents.full_name}` : ""}
                  {" · "}{new Date(o.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <Badge color={T[cfg.color] || T.info}>{cfg.label}</Badge>
            </div>

            {/* Lines */}
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {(o.order_lines || []).map(l => {
                const confirmed = l.quantity_confirmed !== null && l.quantity_confirmed !== undefined;
                return (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ color: T.text, fontWeight: 500 }}>{l.products?.name}</span>
                    <span style={{ color: confirmed ? T.success : T.textSub, fontWeight: confirmed ? 700 : 400 }}>
                      {l.quantity_confirmed ?? l.quantity_requested} {l.unit}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Expanded: timeline + actions */}
            {isOpen && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <OrderTimeline order={o} invoice={o.invoice} />
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <Btn size="sm" onClick={() => openPo(o)} disabled={busy === o.id}>
                    {busy === o.id ? "..." : o.po_pdf_url ? "📄 Bon de commande" : "📄 Générer le bon de commande"}
                  </Btn>
                  {canCancel && onCancelOrder && (
                    <Btn size="sm" variant="danger" onClick={() => onCancelOrder(o.id)}>Annuler</Btn>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <TrackingScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        org={org}
        onResolveQr={onResolveQr}
        onGeneratePo={onGeneratePo}
      />
    </div>
  );
}
