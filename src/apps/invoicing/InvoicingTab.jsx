import { useState, useEffect } from "react";
import { useTheme } from "../../core/theme";
import { Btn, Badge, SectionTitle, EmptyState, SkeletonList } from "../../components/ui";
import { useInvoices } from "../../hooks/useInvoices";
import { INVOICE_STATUS, fmtMoneyDT, fmtDateFr } from "../../core/invoiceConstants";
import { GenerateInvoiceModal } from "./GenerateInvoiceModal";
import { InvoiceDetailScreen } from "./InvoiceDetailScreen";

// Invoicing hub. Agent: generate (from POs) + own list. Manager: all + cancel/regenerate.
//   orders : agent's own orders (to offer invoiceable POs). A PO can be billed
//            once confirmed or delivered, and only if not already invoiced.
export function InvoicingTab({
  role, orgId, agentId, org, clients = [], orders = [], onOpenSettings,
}) {
  const T = useTheme();
  const isAgent = role === "agent";

  const { invoices, loading, load, createInvoice, regeneratePdf, recordPayment, cancelInvoice } =
    useInvoices({ orgId, agentId: isAgent ? agentId : null });

  const [genOpen, setGenOpen] = useState(false);
  const [detail,  setDetail]  = useState(null);

  useEffect(() => { load(); }, [load]);

  const invoiceableOrders = isAgent
    ? orders.filter(o => ["confirmed", "delivered"].includes(o.status) && !o.invoice_id)
    : [];

  async function handleGenerate(payload) {
    const created = await createInvoice({ ...payload, org, createdBy: agentId });
    setDetail(created);
  }

  return (
    <div>
      {isAgent && (
        <Btn style={{ width: "100%", marginBottom: 4 }} onClick={() => setGenOpen(true)} disabled={!invoiceableOrders.length}>
          + Générer une facture
        </Btn>
      )}
      {isAgent && (
        <div style={{ fontSize: 12, color: T.textDim, textAlign: "center", marginBottom: 16 }}>
          {invoiceableOrders.length
            ? `${invoiceableOrders.length} commande(s) facturable(s) · regroupez les commandes d'un même client`
            : "Aucune commande facturable (confirmée ou livrée) pour le moment"}
        </div>
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

      <SectionTitle>{isAgent ? "Mes factures" : "Toutes les factures"} · {invoices.length}</SectionTitle>

      {loading && <SkeletonList count={3} height={76} />}
      {!loading && invoices.length === 0 && (
        <EmptyState icon="🧾" title="Aucune facture"
          sub={isAgent ? "Sélectionnez des commandes confirmées/livrées d'un même client pour les facturer" : "Les factures créées par les agents apparaîtront ici"} />
      )}

      {invoices.map(inv => {
        const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.issued;
        const poCount = (inv.purchase_orders || []).length;
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
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>
              {fmtDateFr(inv.issue_date)}{poCount ? ` · ${poCount} bon(s) de commande` : ""}
            </div>
          </div>
        );
      })}

      {/* Overlays */}
      <GenerateInvoiceModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        clients={clients}
        orders={invoiceableOrders}
        org={org}
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
