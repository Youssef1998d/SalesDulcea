import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../../core/theme";
import { Modal, Btn, Input, SelectField } from "../../components/ui";
import { supabase } from "../../core/supabase";
import { fmtMoneyDT, ENTITY_TYPES } from "../../core/invoiceConstants";

// Modal to generate an invoice from a delivered order or a direct sale.
//   order   : optional delivered order (with order_lines + products) — locks the lines
//   products: catalog (for direct-sale line building + order unit prices)
export function GenerateInvoiceModal({ open, onClose, clients, products, org, order = null, onGenerate }) {
  const T = useTheme();
  const [clientId,   setClientId]   = useState("");
  const [entityType, setEntityType] = useState("company");
  const [taxId,      setTaxId]      = useState("");
  const [taxRate,    setTaxRate]    = useState(String(org?.tax_rate ?? 0));
  const [manualLines, setManualLines] = useState([{ product_id: "", quantity: 1, unit_price: "" }]);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState(null);

  const client = clients.find(c => c.id === clientId) || null;

  // When generating from an order, preselect the order's client.
  useEffect(() => {
    if (order?.client_id && clients.some(c => c.id === order.client_id)) {
      pickClient(order.client_id);
    }
  }, [order, clients]); // eslint-disable-line

  // Lines: from order (locked) or manual (direct sale)
  const orderLines = useMemo(() => {
    if (!order) return null;
    return (order.order_lines || []).map(l => {
      const p   = products.find(p => p.id === l.product_id) || l.products || {};
      const qty = Number(l.quantity_confirmed ?? l.quantity_requested);
      return {
        product_id:   l.product_id,
        product_name: p.name || l.products?.name || "Produit",
        quantity:     qty,
        unit_price:   Number(p.price || 0),
      };
    });
  }, [order, products]);

  const effectiveLines = order
    ? orderLines
    : manualLines
        .filter(l => l.product_id && Number(l.quantity) > 0)
        .map(l => {
          const p = products.find(p => p.id === l.product_id);
          return {
            product_id:   l.product_id,
            product_name: p?.name || "Produit",
            quantity:     Number(l.quantity),
            unit_price:   l.unit_price === "" ? Number(p?.price || 0) : Number(l.unit_price),
          };
        });

  const subtotal = (effectiveLines || []).reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const taxAmt   = subtotal * Number(taxRate || 0) / 100;
  const total    = subtotal + taxAmt;

  function pickClient(id) {
    setClientId(id);
    const c = clients.find(c => c.id === id);
    if (c) {
      setEntityType(c.entity_type || "company");
      setTaxId(c.tax_identification_number || "");
    }
  }

  function setLine(i, k, v) {
    setManualLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  }
  const addLine = () => setManualLines(ls => [...ls, { product_id: "", quantity: 1, unit_price: "" }]);
  const rmLine  = i => setManualLines(ls => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls);

  async function generate() {
    setError(null);
    if (!client)                       { setError("Veuillez sélectionner un client."); return; }
    if (!effectiveLines.length)        { setError("Aucun produit sur la facture."); return; }
    if (!org?.stamp_url)               { setError("Impossible de générer la facture. Veuillez configurer le cachet de l'entreprise."); return; }

    setBusy(true);
    try {
      // Persist entity type / tax id back to the client record so it stays canonical
      if (client.entity_type !== entityType || (client.tax_identification_number || "") !== taxId) {
        await supabase.from("clients")
          .update({ entity_type: entityType, tax_identification_number: taxId || null })
          .eq("id", client.id);
      }

      const enrichedClient = { ...client, entity_type: entityType, tax_identification_number: taxId || null };
      await onGenerate({
        client:  enrichedClient,
        lines:   effectiveLines,
        orderId: order?.id || null,
        order,
        taxRate: Number(taxRate || 0),
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="GÉNÉRER UNE FACTURE">
      {order && (
        <div style={{
          background: T.accentDim, border: `1px solid ${T.accent}44`, color: T.accent,
          borderRadius: 10, padding: "9px 13px", fontSize: 12, marginBottom: 16,
        }}>
          Depuis la commande livrée de {order.agents?.full_name || "l'agent"} ·{" "}
          {new Date(order.created_at).toLocaleDateString("fr-FR")}
        </div>
      )}

      {/* Client */}
      <SelectField label="Client *" value={clientId} onChange={pickClient}>
        <option value="">Sélectionner un client...</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </SelectField>

      {client && (
        <>
          <SelectField label="Type de client" value={entityType} onChange={setEntityType}>
            {Object.entries(ENTITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </SelectField>
          <Input
            label={`Matricule fiscal${entityType === "individual" ? " (optionnel)" : ""}`}
            value={taxId} onChange={setTaxId} placeholder="0000000/A/M/000"
          />
          <div style={{ fontSize: 12, color: T.textDim, marginTop: -8, marginBottom: 14 }}>
            {client.address ? `📍 ${client.address}` : "Aucune adresse"}{client.phone ? ` · 📞 ${client.phone}` : ""}
          </div>
        </>
      )}

      {/* Lines */}
      <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Produits
      </div>

      {order ? (
        <div style={{ marginBottom: 14 }}>
          {(orderLines || []).map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.text, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <span>{l.product_name} × {l.quantity}</span>
              <span style={{ color: T.gold, fontWeight: 600 }}>{fmtMoneyDT(l.quantity * l.unit_price)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {manualLines.map((l, i) => {
            const p = products.find(p => p.id === l.product_id);
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 28px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                <select
                  value={l.product_id}
                  onChange={e => { setLine(i, "product_id", e.target.value); }}
                  style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 9px", color: T.text, fontSize: 12, outline: "none" }}
                >
                  <option value="">Produit...</option>
                  {products.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                </select>
                <input
                  type="number" min="0" value={l.quantity} placeholder="Qté"
                  onChange={e => setLine(i, "quantity", e.target.value)}
                  style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 6px", color: T.text, fontSize: 13, textAlign: "center", outline: "none" }}
                />
                <input
                  type="number" min="0" value={l.unit_price}
                  placeholder={p ? String(p.price) : "PU"}
                  onChange={e => setLine(i, "unit_price", e.target.value)}
                  style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 6px", color: T.text, fontSize: 13, textAlign: "center", outline: "none" }}
                />
                <button onClick={() => rmLine(i)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 15 }}>✕</button>
              </div>
            );
          })}
          <button onClick={addLine} style={{ width: "100%", padding: "9px", background: "none", border: `1.5px dashed ${T.border}`, borderRadius: 10, color: T.textDim, cursor: "pointer", fontSize: 12 }}>
            + Ajouter un produit
          </button>
        </div>
      )}

      {/* Tax + totals */}
      <Input label="TVA (%)" type="number" value={taxRate} onChange={setTaxRate} />
      <div style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
        {[["Sous-total", subtotal], [`TVA (${Number(taxRate || 0)}%)`, taxAmt]].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: T.textSub }}>
            <span>{l}</span><span>{fmtMoneyDT(v)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
          <span style={{ fontWeight: 700, color: T.text }}>Total TTC</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: T.gold }}>{fmtMoneyDT(total)}</span>
        </div>
      </div>

      {error && (
        <div style={{ background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5", border: `1px solid ${T.danger}44`, color: T.danger, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <Btn style={{ width: "100%" }} onClick={generate} disabled={busy}>
        {busy ? "Génération en cours..." : "Générer une facture →"}
      </Btn>
    </Modal>
  );
}
