import { useTheme } from "../../../core/theme";
import { Badge, SectionTitle, EmptyState, SkeletonList } from "../../../components/ui";

const STATUS_CONFIG = {
  pending:   { color: "warning", label: "En attente",  icon: "⏳" },
  confirmed: { color: "info",    label: "Confirmée",   icon: "✓" },
  delivered: { color: "success", label: "Livrée",      icon: "📦" },
  rejected:  { color: "danger",  label: "Refusée",     icon: "✕" },
};

export function OrdersTab({ orders, loading }) {
  const T = useTheme();

  if (loading) return <SkeletonList count={3} height={90} />;

  if (!orders.length) return (
    <EmptyState
      icon="🧾"
      title="Aucune commande"
      sub="Passez votre première commande depuis l'onglet Stock"
    />
  );

  return (
    <div>
      <SectionTitle>Mes commandes · {orders.length}</SectionTitle>
      {orders.map(o => {
        const cfg = STATUS_CONFIG[o.status] || { color: "info", label: o.status, icon: "?" };
        return (
          <div key={o.id} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${T[cfg.color]}`,
            borderRadius: 14, padding: "14px 16px", marginBottom: 10,
            boxShadow: T.shadow,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                  {o.clients?.name || "Client —"}
                </div>
                <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>
                  {new Date(o.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  {o.agents?.full_name ? ` · ${o.agents.full_name}` : ""}
                </div>
              </div>
              <Badge color={T[cfg.color]}>{cfg.icon} {cfg.label}</Badge>
            </div>

            {/* Lines */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(o.order_lines || []).map(l => {
                const confirmed = l.quantity_confirmed !== null && l.quantity_confirmed !== undefined;
                return (
                  <div key={l.id} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 13, padding: "6px 0",
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    <span style={{ color: T.text, fontWeight: 500 }}>{l.products?.name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {confirmed && l.quantity_confirmed !== l.quantity_requested && (
                        <span style={{ fontSize: 11, color: T.textDim, textDecoration: "line-through" }}>
                          {l.quantity_requested}
                        </span>
                      )}
                      <span style={{ color: confirmed ? T.success : T.textSub, fontWeight: confirmed ? 700 : 400 }}>
                        {l.quantity_confirmed ?? l.quantity_requested} {l.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total quantity */}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: T.textDim }}>
                Total: <span style={{ color: T.text, fontWeight: 600 }}>
                  {(o.order_lines || []).reduce((s, l) => s + Number(l.quantity_confirmed ?? l.quantity_requested), 0)} unités
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
