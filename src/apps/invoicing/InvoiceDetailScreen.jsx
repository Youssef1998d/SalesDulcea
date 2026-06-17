import { useState } from "react";
import { useTheme } from "../../core/theme";
import { Btn, Badge, Modal, Input } from "../../components/ui";
import { QrImage } from "../../components/QrImage";
import { INVOICE_STATUS, ENTITY_TYPES, fmtMoneyDT, fmtDateFr } from "../../core/invoiceConstants";

// Full invoice details page (overlay). Shows preview + agent/manager actions.
export function InvoiceDetailScreen({ invoice, org, role, onClose, onRecordPayment, onCancel, onRegenerate }) {
  const T = useTheme();
  const [payOpen,  setPayOpen]  = useState(false);
  const [payAmt,   setPayAmt]   = useState("");
  const [payError, setPayError] = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [msg,      setMsg]      = useState(null);

  const isManager = role === "kam" || role === "superadmin";
  const st = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.issued;

  async function download() {
    if (!invoice.pdf_url) return;
    const a = document.createElement("a");
    a.href = invoice.pdf_url;
    a.download = `${invoice.invoice_number}.pdf`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }

  async function share() {
    const shareData = {
      title: `Facture ${invoice.invoice_number}`,
      text:  `Facture ${invoice.invoice_number} — ${fmtMoneyDT(invoice.total_amount)}`,
      url:   invoice.pdf_url,
    };
    try {
      if (navigator.share && invoice.pdf_url) {
        await navigator.share(shareData);
      } else if (invoice.pdf_url) {
        await navigator.clipboard.writeText(invoice.pdf_url);
        setMsg("Lien copié dans le presse-papier");
        setTimeout(() => setMsg(null), 2500);
      }
    } catch { /* user cancelled share */ }
  }

  async function submitPayment() {
    // Accept both "50.5" and the French "50,5"
    const amt = Number(String(payAmt).replace(",", ".").trim());
    if (!isFinite(amt) || amt <= 0) { setPayError("Veuillez saisir un montant valide."); return; }
    setPayError(null);
    setBusy(true);
    try {
      await onRecordPayment(invoice, amt);
      setPayOpen(false);
      setPayAmt("");
    } catch (e) {
      setPayError(e.message || "Échec de l'enregistrement du paiement.");
    } finally { setBusy(false); }
  }

  async function regenerate() {
    setBusy(true);
    try { await onRegenerate(invoice); setMsg("PDF régénéré"); setTimeout(() => setMsg(null), 2500); }
    catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  const remaining = Number(invoice.total_amount) - Number(invoice.amount_paid || 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: T.bg, overflowY: "auto",
      animation: "fadeIn 0.2s ease",
    }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 2,
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 12,
        boxShadow: T.shadow,
      }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: T.textSub,
          fontSize: 20, cursor: "pointer", padding: "2px 6px",
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: T.text, letterSpacing: 1 }}>
            {invoice.invoice_number}
          </div>
        </div>
        <Badge color={T[st.color] || T.info}>{st.label}</Badge>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px 16px 60px" }}>
        {msg && (
          <div style={{
            background: T.accentDim, border: `1px solid ${T.accent}44`, color: T.accent,
            borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14,
          }}>{msg}</div>
        )}

        {/* Summary */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "16px 18px", marginBottom: 16, boxShadow: T.shadow,
        }}>
          <Row label="Numéro de facture" value={invoice.invoice_number} T={T} />
          <Row label="Client" value={invoice.client_name || invoice.clients?.name || "—"} T={T} />
          <Row label="Type" value={ENTITY_TYPES[invoice.client_entity_type] || "—"} T={T} />
          <Row label="Date" value={fmtDateFr(invoice.issue_date)} T={T} />
          <Row label="Statut" value={st.label} T={T} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>Montant</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: T.gold, letterSpacing: 1 }}>
              {fmtMoneyDT(invoice.total_amount)}
            </span>
          </div>
          {Number(invoice.amount_paid || 0) > 0 && (
            <div style={{ fontSize: 12, color: T.textDim, textAlign: "right", marginTop: 2 }}>
              Payé : {fmtMoneyDT(invoice.amount_paid)} · Reste : {fmtMoneyDT(remaining)}
            </div>
          )}
        </div>

        {/* Associated purchase orders */}
        {(invoice.purchase_orders || []).length > 0 && (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "14px 18px", marginBottom: 16, boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Bons de commande associés · {invoice.purchase_orders.length}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {invoice.purchase_orders.map((po, i) => (
                <div key={po.id || i} style={{ textAlign: "center" }}>
                  <QrImage value={po.qr_token} size={96} />
                  <div style={{ fontSize: 11, color: T.text, fontWeight: 600, marginTop: 4 }}>{po.po_number}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          <Btn onClick={download} disabled={!invoice.pdf_url} style={{ flex: 1, minWidth: 150 }}>⬇ Télécharger PDF</Btn>
          <Btn variant="subtle" onClick={share} disabled={!invoice.pdf_url} style={{ flex: 1, minWidth: 150 }}>↗ Partager la facture</Btn>
          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <Btn variant="success" onClick={() => setPayOpen(true)} style={{ flex: 1, minWidth: 150 }}>💵 Enregistrer un paiement</Btn>
          )}
          {isManager && invoice.status !== "cancelled" && (
            <>
              <Btn variant="subtle" onClick={regenerate} disabled={busy} style={{ flex: 1, minWidth: 130 }}>⟳ Régénérer le PDF</Btn>
              <Btn variant="danger"  onClick={() => onCancel(invoice)} style={{ flex: 1, minWidth: 130 }}>✕ Annuler la facture</Btn>
            </>
          )}
        </div>

        {/* Preview */}
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Aperçu de la facture
        </div>
        {invoice.pdf_url ? (
          <iframe
            title="Aperçu facture"
            src={invoice.pdf_url}
            style={{
              width: "100%", height: 720, border: `1px solid ${T.border}`,
              borderRadius: 12, background: "#fff",
            }}
          />
        ) : (
          <div style={{
            background: T.surfaceHi, border: `1px dashed ${T.border}`, borderRadius: 12,
            padding: 40, textAlign: "center", color: T.textDim, fontSize: 13,
          }}>
            Aucun PDF disponible.
          </div>
        )}
      </div>

      {/* Payment modal */}
      <Modal open={payOpen} onClose={() => { setPayOpen(false); setPayError(null); }} title="ENREGISTRER UN PAIEMENT">
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 14 }}>
          Total : {fmtMoneyDT(invoice.total_amount)} · Reste à payer : {fmtMoneyDT(remaining)}
        </div>
        <Input label="Montant reçu (DT)" type="text" inputMode="decimal" value={payAmt} onChange={setPayAmt} placeholder={String(remaining)} />
        {payError && (
          <div style={{
            background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5",
            border: `1px solid ${T.danger}44`, color: T.danger,
            borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14,
          }}>
            {payError}
          </div>
        )}
        <Btn style={{ width: "100%" }} onClick={submitPayment} disabled={busy}>
          {busy ? "Enregistrement..." : "Valider le paiement"}
        </Btn>
      </Modal>
    </div>
  );
}

function Row({ label, value, T }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 13, color: T.text, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
