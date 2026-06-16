import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Card, Btn, Badge, SectionTitle, EmptyState, Input } from "../../../components/ui";

export function BrowseTab({ stock, loading, onPlaceOrder }) {
  const T = useTheme();
  const [cart, setCart] = useState({}); // productId -> qty
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const byProduct = {};
  stock.forEach(s => {
    const p = s.products;
    if (!p) return;
    if (!byProduct[p.id]) byProduct[p.id] = { product: p, available: 0, incoming: [] };
    if (s.is_future) byProduct[p.id].incoming.push(s);
    else byProduct[p.id].available += Number(s.quantity);
  });
  const rows = Object.values(byProduct);

  function setQty(productId, qty) {
    setCart(c => ({ ...c, [productId]: qty }));
  }

  async function submit() {
    const lines = Object.entries(cart)
      .filter(([, q]) => Number(q) > 0)
      .map(([productId, q]) => ({ productId, quantity: q, unit: byProduct[productId]?.product.unit }));
    if (!lines.length) return;
    setPlacing(true);
    try {
      await onPlaceOrder(lines);
      setCart({});
      setPlaced(true);
      setTimeout(() => setPlaced(false), 2000);
    } finally { setPlacing(false); }
  }

  const hasCart = Object.values(cart).some(q => Number(q) > 0);

  if (loading) return <EmptyState icon="📦" title="Chargement..." />;
  if (!rows.length) return <EmptyState icon="📦" title="Aucun stock disponible" sub="Revenez plus tard" />;

  return (
    <div>
      <SectionTitle>Stock disponible</SectionTitle>
      {rows.map(({ product, available, incoming }) => (
        <Card key={product.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{product.name}</div>
              <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>{available} {product.unit} disponibles</div>
              {incoming.map(s => (
                <div key={s.id} style={{ marginTop:4 }}>
                  <Badge color={T.info}>
                    +{s.quantity} {product.unit} — arrivée {s.expected_date ? new Date(s.expected_date).toLocaleDateString("fr-FR") : "?"}
                  </Badge>
                </div>
              ))}
            </div>
            <div style={{ width:90 }}>
              <Input type="number" value={cart[product.id] || ""} placeholder="Qté" onChange={v => setQty(product.id, v)} />
            </div>
          </div>
        </Card>
      ))}

      <div style={{ position:"sticky", bottom:90, marginTop:14 }}>
        <Btn disabled={!hasCart || placing} onClick={submit} style={{ width:"100%" }}>
          {placing ? "Envoi..." : placed ? "✓ Commande envoyée" : "Commander"}
        </Btn>
      </div>
    </div>
  );
}
