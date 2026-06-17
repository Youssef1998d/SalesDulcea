import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTheme } from "../../core/theme";
import { Btn, Badge } from "../../components/ui";
import { OrderTimeline } from "../../components/OrderTimeline";
import { ORDER_STATUS } from "../../core/orderConstants";
import { fmtMoneyDT } from "../../core/invoiceConstants";

const READER_ID = "eb-qr-reader";

// Full-screen overlay: scan a PO QR with the camera, then show its cycle/timeline.
export function TrackingScanner({ open, onClose, org, onResolveQr, onGeneratePo }) {
  const T = useTheme();
  const [order,   setOrder]   = useState(null);
  const [error,   setError]   = useState(null);
  const [busyPo,  setBusyPo]  = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!open || order) return;
    let cancelled = false;
    const h = new Html5Qrcode(READER_ID);
    scannerRef.current = h;

    h.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      async decoded => {
        if (cancelled) return;
        try { await h.stop(); } catch { /* already stopped */ }
        const o = await onResolveQr(decoded);
        if (cancelled) return;
        if (o) setOrder(o);
        else   setError("Commande introuvable pour ce code.");
      },
      () => {} // ignore per-frame decode errors
    ).catch(e => { if (!cancelled) setError("Caméra indisponible : " + (e?.message || e)); });

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      if (inst) {
        inst.stop().catch(() => {}).finally(() => { try { inst.clear(); } catch {} });
      }
    };
  }, [open, order, onResolveQr]);

  function reset() { setOrder(null); setError(null); }

  async function openPo() {
    setBusyPo(true);
    try {
      const url = order.po_pdf_url || await onGeneratePo(order);
      window.open(url, "_blank", "noopener");
    } catch (e) { setError(e.message); }
    finally { setBusyPo(false); }
  }

  if (!open) return null;

  const st = order ? (ORDER_STATUS[order.status] || ORDER_STATUS.pending) : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 650, background: T.bg, overflowY: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 2, background: T.surface,
        borderBottom: `1px solid ${T.border}`, padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 12, boxShadow: T.shadow,
      }}>
        <button onClick={() => { reset(); onClose(); }} style={{ background: "none", border: "none", color: T.textSub, fontSize: 20, cursor: "pointer" }}>←</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: T.text, letterSpacing: 1 }}>
          {order ? order.po_number : "SCANNER UNE COMMANDE"}
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 16px 60px" }}>
        {error && (
          <div style={{ background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5", border: `1px solid ${T.danger}44`, color: T.danger, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {!order ? (
          <>
            <div style={{ fontSize: 13, color: T.textSub, marginBottom: 12 }}>
              Pointez la caméra vers le QR code imprimé sur le carton de livraison.
            </div>
            <div id={READER_ID} style={{ width: "100%", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }} />
          </>
        ) : (
          <>
            {/* Order summary */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16, boxShadow: T.shadow }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{order.clients?.name || "Client —"}</div>
                  <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>
                    {order.agents?.full_name ? `${order.agents.full_name} · ` : ""}
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <Badge color={T[st.color] || T.info}>{st.label}</Badge>
              </div>
              {order.invoice?.invoice_number && (
                <div style={{ fontSize: 12, color: T.textSub }}>
                  Facture {order.invoice.invoice_number} · {fmtMoneyDT(order.invoice.total_amount)}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 18px", marginBottom: 16, boxShadow: T.shadow }}>
              <OrderTimeline order={order} invoice={order.invoice} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="subtle" onClick={reset} style={{ flex: 1 }}>↺ Scanner une autre</Btn>
              <Btn onClick={openPo} disabled={busyPo} style={{ flex: 1 }}>
                {busyPo ? "..." : "📄 Bon de commande"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
