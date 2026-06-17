import { useState, useMemo } from "react";
import { useTheme } from "../../core/theme";
import { Modal, Btn, Input, SelectField } from "../../components/ui";
import { supabase } from "../../core/supabase";
import { fmtMoneyDT, ENTITY_TYPES } from "../../core/invoiceConstants";

// Generate one invoice from one or more purchase orders of the SAME client.
//   orders : the agent's invoiceable POs (confirmed/delivered, not yet invoiced)
function poTotal(o) {
  return (o.order_lines || []).reduce((s, l) => {
    const qty = Number(l.quantity_confirmed ?? l.quantity_requested);
    return s + qty * Number(l.products?.price || 0);
  }, 0);
}

export function GenerateInvoiceModal({ open, onClose, clients, orders = [], org, onGenerate }) {
  const T = useTheme();
  const [clientId,   setClientId]   = useState("");
  const [entityType, setEntityType] = useState("company");
  const [taxId,      setTaxId]      = useState("");
  const [taxRate,    setTaxRate]    = useState(String(org?.tax_rate ?? 0));
  const [selected,   setSelected]   = useState({}); // orderId -> bool
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState(null);

  const client = clients.find(c => c.id === clientId) || null;

  // POs available for the chosen client
  const clientOrders = useMemo(
    () => orders.filter(o => o.client_id === clientId),
    [orders, clientId]
  );
  const chosenOrders = clientOrders.filter(o => selected[o.id]);

  const subtotal = chosenOrders.reduce((s, o) => s + poTotal(o), 0);
  const taxAmt   = subtotal * Number(taxRate || 0) / 100;
  const total    = subtotal + taxAmt;

  function pickClient(id) {
    setClientId(id);
    setSelected({});
    const c = clients.find(c => c.id === id);
    if (c) { setEntityType(c.entity_type || "company"); setTaxId(c.tax_identification_number || ""); }
  }

  async function generate() {
    setError(null);
    if (!client)               { setError("Veuillez sélectionner un client."); return; }
    if (!chosenOrders.length)  { setError("Sélectionnez au moins une commande."); return; }
    if (!org?.stamp_url)       { setError("Impossible de générer la facture. Veuillez configurer le cachet de l'entreprise."); return; }

    setBusy(true);
    try {
      if (client.entity_type !== entityType || (client.tax_identification_number || "") !== taxId) {
        await supabase.from("clients")
          .update({ entity_type: entityType, tax_identification_number: taxId || null })
          .eq("id", client.id);
      }
      const enrichedClient = { ...client, entity_type: entityType, tax_identification_number: taxId || null };
      await onGenerate({ client: enrichedClient, orders: chosenOrders, taxRate: Number(taxRate || 0) });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="GÉNÉRER UNE FACTURE">
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

          {/* Purchase orders to bill (same client) */}
          <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: "4px 0 8px" }}>
            Commandes à facturer
          </div>
          {clientOrders.length === 0 ? (
            <div style={{ background: T.surfaceHi, border: `1px dashed ${T.border}`, borderRadius: 10, padding: "14px", textAlign: "center", fontSize: 13, color: T.textDim, marginBottom: 14 }}>
              Aucune commande facturable pour ce client (confirmée ou livrée, non encore facturée).
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              {clientOrders.map(o => {
                const on = !!selected[o.id];
                return (
                  <div key={o.id}
                    onClick={() => setSelected(s => ({ ...s, [o.id]: !s[o.id] }))}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: 10, cursor: "pointer",
                      background: on ? T.accent + "22" : T.surfaceHi,
                      border: `1.5px solid ${on ? T.accent : T.border}`,
                      borderRadius: 10, padding: "10px 12px", marginBottom: 8,
                    }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: on ? T.accent : T.text }}>
                        {on ? "☑" : "☐"} {o.po_number || "Commande"}
                      </div>
                      <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
                        {new Date(o.created_at).toLocaleDateString("fr-FR")} · {(o.order_lines || []).length} produit(s)
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{fmtMoneyDT(poTotal(o))}</div>
                  </div>
                );
              })}
            </div>
          )}

          <Input label="TVA (%)" type="text" inputMode="decimal" value={taxRate} onChange={setTaxRate} />
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
        </>
      )}

      {error && (
        <div style={{ background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5", border: `1px solid ${T.danger}44`, color: T.danger, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <Btn style={{ width: "100%" }} onClick={generate} disabled={busy || !chosenOrders.length}>
        {busy ? "Génération en cours..." : `Générer la facture${chosenOrders.length ? ` (${chosenOrders.length} commande${chosenOrders.length > 1 ? "s" : ""})` : ""} →`}
      </Btn>
    </Modal>
  );
}
