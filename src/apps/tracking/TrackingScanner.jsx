import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTheme } from "../../core/theme";
import { Btn, Badge } from "../../components/ui";
import { OrderTimeline } from "../../components/OrderTimeline";
import { QrImage } from "../../components/QrImage";
import { ORDER_STATUS } from "../../core/orderConstants";
import { fmtMoneyDT } from "../../core/invoiceConstants";

const READER_ID = "eb-qr-reader";

// Full-screen overlay: scan a PO QR with the camera (or type the code), then
// show the order's cycle/timeline.
export function TrackingScanner({ open, onClose, org, onResolveQr, onGeneratePo }) {
  const T = useTheme();
  const [order,    setOrder]    = useState(null);
  const [error,    setError]    = useState(null);
  const [camState, setCamState] = useState("idle"); // idle | starting | on | error
  const [attempt,  setAttempt]  = useState(0);
  const [manual,   setManual]   = useState("");
  const [busyPo,   setBusyPo]   = useState(false);

  // Keep callbacks in refs so the camera effect doesn't restart when the parent
  // re-renders (new function identities) — that race caused a blank camera.
  const resolveRef = useRef(onResolveQr);
  const poRef      = useRef(onGeneratePo);
  resolveRef.current = onResolveQr;
  poRef.current      = onGeneratePo;

  const scannerRef = useRef(null);
  const hostRef    = useRef(null); // React-owned wrapper; the scanner's div is appended imperatively
  const handledRef = useRef(false); // ignore repeat decodes while resolving

  // Resolve a token. On success we set the order, which triggers the effect
  // cleanup to stop the camera (the single place stop() is called).
  async function handleToken(token) {
    const t = String(token || "").trim();
    if (!t) return;
    handledRef.current = true;
    setError(null);
    try {
      const o = await resolveRef.current(t);
      if (o) {
        setOrder(o);
      } else {
        setError("Commande introuvable pour ce code.");
        handledRef.current = false; // let them scan again (camera still running)
      }
    } catch (e) {
      setError(e?.message || "Erreur lors de la recherche.");
      handledRef.current = false;
    }
  }

  useEffect(() => {
    if (!open || order) return;
    if (!hostRef.current) return;
    let cancelled = false;

    // Create the scanner's element imperatively inside a React-owned host.
    // React never sees html5-qrcode's injected <video>/overlay nodes, so it
    // can't crash trying to remove children it didn't create.
    const el = document.createElement("div");
    el.id = READER_ID;
    hostRef.current.appendChild(el);

    const h = new Html5Qrcode(READER_ID);
    scannerRef.current = h;
    handledRef.current = false;
    setCamState("starting");
    setError(null);

    const config = { fps: 10, qrbox: { width: 220, height: 220 } };
    const onDecode = decoded => { if (!cancelled && !handledRef.current) handleToken(decoded); };

    // Prefer a real back-camera device id (most reliable on Android Chrome),
    // then fall back to facingMode strings accepted by html5-qrcode.
    (async () => {
      try {
        let cams = [];
        try { cams = await Html5Qrcode.getCameras(); } catch { /* permission denied → caught below */ }
        if (cancelled) return;

        if (cams && cams.length) {
          const back = cams.find(c => /back|rear|environment|arrière/i.test(c.label || "")) || cams[cams.length - 1];
          await h.start(back.id, config, onDecode, () => {});
        } else {
          await h.start({ facingMode: "environment" }, config, onDecode, () => {});
        }
        if (!cancelled) setCamState("on");
      } catch (e1) {
        // Last resort: front camera
        try {
          await h.start({ facingMode: "user" }, config, onDecode, () => {});
          if (!cancelled) setCamState("on");
        } catch (e2) {
          if (!cancelled) {
            setCamState("error");
            setError("Caméra indisponible : " + (e2?.message || e2) + ". Autorisez la caméra ou saisissez le code manuellement.");
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      scannerRef.current = null;
      const cleanupEl = () => {
        try { inst && inst.clear(); } catch { /* noop */ }
        try { if (el && el.parentNode) el.parentNode.removeChild(el); } catch { /* noop */ }
      };
      // stop() throws synchronously if the scanner isn't running — guard both
      // the sync throw and the async rejection.
      try {
        const p = inst && inst.stop();
        if (p && typeof p.then === "function") p.then(() => {}, () => {}).finally(cleanupEl);
        else cleanupEl();
      } catch { cleanupEl(); }
    };
  }, [open, order, attempt]); // eslint-disable-line

  function rescan() { handledRef.current = false; setOrder(null); setError(null); setManual(""); setAttempt(a => a + 1); }

  async function openPo() {
    setBusyPo(true);
    try {
      const url = order.po_pdf_url || await poRef.current(order);
      if (url) window.open(url, "_blank", "noopener");
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
        <button onClick={() => { rescan(); onClose(); }} style={{ background: "none", border: "none", color: T.textSub, fontSize: 20, cursor: "pointer" }}>←</button>
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
              Pointez la caméra vers le QR code du carton de livraison.
            </div>

            {/* Camera viewport — sized so the video is always visible */}
            <div style={{ position: "relative", width: "100%", minHeight: 300, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, background: "#000" }}>
              <div ref={hostRef} style={{ width: "100%" }} />
              {camState === "starting" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13 }}>
                  Démarrage de la caméra…
                </div>
              )}
            </div>

            {/* Manual fallback — always available (type the Réf printed under the QR) */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                Ou saisir le code (Réf)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={manual}
                  onChange={e => setManual(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleToken(manual); }}
                  placeholder="Collez la référence du bon de commande"
                  style={{ flex: 1, background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 12px", color: T.text, fontSize: 13, outline: "none" }}
                />
                <Btn onClick={() => handleToken(manual)} disabled={!manual.trim()}>Rechercher</Btn>
              </div>
              {camState === "error" && (
                <Btn variant="subtle" size="sm" style={{ marginTop: 10 }} onClick={rescan}>↺ Réessayer la caméra</Btn>
              )}
            </div>
          </>
        ) : (
          <>
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

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 18px", marginBottom: 16, boxShadow: T.shadow, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <OrderTimeline order={order} invoice={order.invoice} />
              </div>
              <div style={{ textAlign: "center" }}>
                <QrImage value={order.qr_token} size={110} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="subtle" onClick={rescan} style={{ flex: 1 }}>↺ Scanner une autre</Btn>
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
