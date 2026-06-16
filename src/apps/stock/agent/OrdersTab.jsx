import { useTheme } from "../../../core/theme";
import { Card, Badge, SectionTitle, EmptyState } from "../../../components/ui";

const STATUS_COLOR = { pending:"warning", confirmed:"info", delivered:"success", rejected:"danger" };
const STATUS_LABEL = { pending:"En attente", confirmed:"Confirmée", delivered:"Livrée", rejected:"Refusée" };

export function OrdersTab({ orders, loading }) {
  const T = useTheme();

  if (loading) return <EmptyState icon="🧾" title="Chargement..." />;
  if (!orders.length) return <EmptyState icon="🧾" title="Aucune commande" sub="Passez votre première commande dans Stock" />;

  return (
    <div>
      <SectionTitle>Mes commandes</SectionTitle>
      {orders.map(o => (
        <Card key={o.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:12, color:T.textDim }}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
            <Badge color={T[STATUS_COLOR[o.status]]}>{STATUS_LABEL[o.status] || o.status}</Badge>
          </div>
          {(o.order_lines || []).map(l => (
            <div key={l.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"4px 0", color:T.textSub }}>
              <span>{l.products?.name}</span>
              <span>{l.quantity_confirmed ?? l.quantity_requested} {l.unit}</span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
