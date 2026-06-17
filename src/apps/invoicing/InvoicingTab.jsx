import { useState, useEffect } from "react";
import { useTheme } from "../../core/theme";
import { Btn, Badge, SectionTitle, EmptyState, SkeletonList } from "../../components/ui";
import { useInvoices } from "../../hooks/useInvoices";
import { INVOICE_STATUS, fmtMoneyDT, fmtDateFr } from "../../core/invoiceConstants";
import { GenerateInvoiceModal } from "./GenerateInvoiceModal";
import { InvoiceDetailScreen } from "./InvoiceDetailScreen";

// Invoicing hub. Used as the "Factures" tab by both agent and manager apps.
//   role     : 'agent' | 'kam' | 'superadmin'
//   orders   : agent's own orders (used to surface delivered orders to invoice)
//   pendingOrder : an order routed in from elsewhere to auto-open generation
export function InvoicingTab({
  role, orgId, agentId, org, clients = [], products = [],
  orders = [], pendingOrder = null, onConsumePending, onOpenSettings,
}) {
  const T = useTheme();
  const isAgent = role === "agent";

  const { invoices, loading, load, createInvoice, regeneratePdf, recordPayment, cancelInvoice } =
    useInvoices({ orgId, agentId: isAgent ? agentId : null });

  const [genOpen,   setGenOpen]   = useState(false);
  const [genOrder,  setGenOrder]  = useState(null);
  const [detail,    setDetail]    = useState(null);

  useEffect(() => { load(); }, [load]);

  // Auto-open generation when routed in from the Orders tab
  useEffect(() => {
    if (pendingOrder) {
      setGenOrder(pendingOrder);
      setGenOpen(true);
      onConsumePending?.();
    }
  }, [pendingOrder]);

  const invoicedOrderIds = new Set(
    invoices.filter(i => i.order_id && i.status !== "cancelled").map(i => i.order_id)
  );
  const deliveredToInvoice = isAgent
    ? orders.filter(o => o.status === "delivered" && !invoicedOrderIds.has(o.id))
    : [];

  async function handleGenerate(payload) {
    const created = await createInvoice({ ...payload, org, createdBy: agentId });
    setDetail(created);
  }

  function openGenerate(order = null) {
    setGenOrder(order);
    setGenOpen(true);
  }

  return (
    <div>
      {isAgent && (
        <Btn style={{ width: "100%", marginBottom: 16 }} onClick={() => openGenerate(null)}>
          + Générer une facture
        </Btn>
      )}

      {!isAgent && onOpenSettings && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <Btn variant="subtle" size="sm" onClick={onOpenSettings}>⚙ Paramètres société</Btn>
        </div>
      )}
      {!isAgent && org && !org.stamp_url && (
        <div style={{
          background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5",
          border: `1px solid ${T.danger}44`, color: T.danger,
          borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14,
        }}>
          ⚠ Cachet de l'entreprise non configuré — les agents ne pourront pas générer de factures.
        </div>
      )}

      {/* Delivered orders awaiting invoicing (agent) */}
      {deliveredToInvoice.length > 0 && (
        <>
          <SectionTitle>Commandes livrées à facturer · {deliveredToInvoice.length}</SectionTitle>
          {deliveredToInvoice.map(o => (
            <div key={o.id} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${T.success}`,
              borderRadius: 14, padding: "13px 15px", marginBottom: 9, boxShadow: T.shadow,
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                  Commande du {new Date(o.created_at).toLocaleDateString("fr-FR")}
                </div>
                <div style={{ fontSize: 12, color: T.textDim }}>
                  {(o.order_lines || []).length} produit(s)
                </div>
              </div>
              <Btn size="sm" onClick={() => openGenerate(o)}>Générer une facture</Btn>
            </div>
          ))}
        </>
      )}

      {/* Invoice list */}
      <SectionTitle>{isAgent ? "Mes factures" : "Toutes les factures"} · {invoices.length}</SectionTitle>

      {loading && <SkeletonList count={3} height={76} />}
      {!loading && invoices.length === 0 && (
        <EmptyState icon="🧾" title="Aucune facture"
          sub={isAgent ? "Générez votre première facture depuis une vente ou une commande livrée" : "Les factures créées par les agents apparaîtront ici"} />
      )}

      {invoices.map(inv => {
        const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.issued;
        return (
          <div key={inv.id} className="eb-card"
            onClick={() => setDetail(inv)}
            style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${T[st.color] || T.info}`,
              borderRadius: 14, padding: "13px 15px", marginBottom: 9,
              boxShadow: T.shadow, cursor: "pointer",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: T.text, letterSpacing: 1 }}>
                {inv.invoice_number}
              </div>
              <Badge color={T[st.color] || T.info}>{st.label}</Badge>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: T.textSub }}>
                {inv.client_name || inv.clients?.name || "—"}
                {!isAgent && inv.agents?.full_name ? ` · ${inv.agents.full_name}` : ""}
              </div>
              <div style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{fmtMoneyDT(inv.total_amount)}</div>
            </div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>{fmtDateFr(inv.issue_date)}</div>
          </div>
        );
      })}

      {/* Overlays */}
      <GenerateInvoiceModal
        open={genOpen}
        onClose={() => { setGenOpen(false); setGenOrder(null); }}
        clients={clients}
        products={products}
        org={org}
        order={genOrder}
        onGenerate={handleGenerate}
      />

      {detail && (
        <InvoiceDetailScreen
          invoice={detail}
          org={org}
          role={role}
          onClose={() => setDetail(null)}
          onRecordPayment={async (inv, amt) => { const res = await recordPayment(inv, amt); setDetail(d => d && ({ ...d, amount_paid: res.amount_paid, status: res.status })); }}
          onCancel={async (inv) => { await cancelInvoice(inv.id); setDetail(d => d && ({ ...d, status: "cancelled" })); }}
          onRegenerate={async (inv) => { const url = await regeneratePdf(inv, org); setDetail(d => d && ({ ...d, pdf_url: url })); }}
        />
      )}
    </div>
  );
}
