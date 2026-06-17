import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Btn, Badge, SectionTitle, EmptyState, SkeletonList, SelectField } from "../../../components/ui";

export function BrowseTab({ stock, loading, clients = [], onPlaceOrder }) {
  const T       = useTheme();
  const [cart,     setCart]     = useState({});
  const [clientId, setClientId] = useState("");
  const [placing,  setPlacing]  = useState(false);
  const [placed,   setPlaced]   = useState(false);
  const [error,    setError]    = useState(null);

  // Group by product
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
    setError(null);
    const lines = Object.entries(cart)
      .filter(([, q]) => Number(q) > 0)
      .map(([productId, q]) => ({
        productId,
        quantity: q,
        unit: byProduct[productId]?.product.unit,
      }));
    if (!lines.length) return;
    if (!clientId) { setError("Veuillez sélectionner un client pour la commande."); return; }
    setPlacing(true);
    try {
      // Placing the order also generates its facture (an order always carries one).
      await onPlaceOrder({ clientId, lines });
      setCart({});
      setClientId("");
      setPlaced(true);
      setTimeout(() => setPlaced(false), 2500);
    } catch (e) {
      setError(e.message || "Échec de la commande.");
    } finally { setPlacing(false); }
  }

  const cartTotal = Object.values(cart).reduce((s, q) => s + Number(q || 0), 0);
  const hasCart   = cartTotal > 0;

  if (loading) return <SkeletonList count={4} height={80} />;
  if (!rows.length) return (
    <EmptyState icon="📦" title="Aucun stock disponible" sub="Le responsable stock n'a pas encore ajouté de lots. Revenez plus tard." />
  );

  return (
    <div>
      <SectionTitle>Stock disponible</SectionTitle>

      {rows.map(({ product, available, incoming }) => {
        const qty    = Number(cart[product.id] || "");
        const hasQty = qty > 0;
        const low    = available < 50 && available > 0;
        const empty  = available === 0;

        return (
          <div key={product.id} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${hasQty ? T.accent : empty ? T.danger : low ? T.warning : T.success}`,
            borderRadius: 14, padding: "14px 16px", marginBottom: 10,
            boxShadow: T.shadow,
            opacity: empty ? 0.6 : 1,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 13, color: empty ? T.danger : low ? T.warning : T.textSub }}>
                  {empty ? "Rupture de stock" : `${available} ${product.unit} disponibles`}
                </div>

                {/* Incoming badges */}
                {incoming.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {incoming.map(s => (
                      <Badge key={s.id} color={T.info}>
                        +{s.quantity} {product.unit} — {s.expected_date ? new Date(s.expected_date).toLocaleDateString("fr-FR") : "à venir"}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity input */}
              {!empty && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setQty(product.id, Math.max(0, qty - 1))}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`,
                      background: T.surfaceHi, color: T.text, fontSize: 18, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >−</button>
                  <input
                    type="number" min="0"
                    value={cart[product.id] || ""}
                    placeholder="0"
                    onChange={e => setQty(product.id, e.target.value)}
                    style={{
                      width: 60, textAlign: "center",
                      background: hasQty ? T.accent + "22" : T.surfaceHi,
                      border: `1.5px solid ${hasQty ? T.accent : T.border}`,
                      borderRadius: 9, padding: "8px 6px",
                      color: hasQty ? T.accent : T.text,
                      fontSize: 15, fontWeight: hasQty ? 700 : 400,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQty(product.id, qty + 1)}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`,
                      background: T.surfaceHi, color: T.text, fontSize: 18, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >+</button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Cart summary + client + order button — sticky above bottom bar */}
      <div style={{ position: "sticky", bottom: 80, marginTop: 16 }}>
        {hasCart && (
          <div style={{
            background: T.accent + "22", border: `1px solid ${T.accent}44`,
            borderRadius: 12, padding: "10px 14px", marginBottom: 8,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>
              {cartTotal} unités sélectionnées
            </div>
            <div style={{ fontSize: 12, color: T.textSub }}>
              {Object.keys(cart).filter(k => Number(cart[k]) > 0).length} produit(s)
            </div>
          </div>
        )}

        {/* Client is required — every order belongs to one client */}
        {hasCart && (
          clients.length === 0 ? (
            <div style={{
              background: T.surfaceHi, border: `1px dashed ${T.border}`,
              borderRadius: 12, padding: "12px 14px", marginBottom: 8,
              fontSize: 13, color: T.textDim, textAlign: "center",
            }}>
              Ajoutez d'abord un client (onglet Clients) pour pouvoir commander.
            </div>
          ) : (
            <div style={{
              background: T.surface, border: `1px solid ${clientId ? T.accent : T.border}`,
              borderRadius: 12, padding: "4px 14px 0", marginBottom: 8,
            }}>
              <SelectField label="Client *" value={clientId} onChange={setClientId}>
                <option value="">Sélectionner un client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
            </div>
          )
        )}

        {error && (
          <div style={{
            background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5",
            border: `1px solid ${T.danger}44`, color: T.danger,
            borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 8,
          }}>
            {error}
          </div>
        )}

        <Btn
          disabled={!hasCart || placing || (hasCart && clients.length === 0)}
          onClick={submit}
          size="lg"
          style={{ width: "100%", boxShadow: hasCart ? `0 4px 16px ${T.accent}44` : "none" }}
        >
          {placing ? "Envoi en cours..." : placed ? "✓ Commande créée !" : "Passer la commande →"}
        </Btn>
      </div>
    </div>
  );
}
