// Purchase-order lifecycle. DB/code in English; UI labels in French.

export const ORDER_STATUS = {
  pending:   { label: "Créée",     color: "textDim" },
  confirmed: { label: "Confirmée", color: "info"    },
  shipped:   { label: "Expédiée",  color: "info"    },
  delivered: { label: "Livrée",    color: "success" },
  rejected:  { label: "Refusée",   color: "danger"  },
  cancelled: { label: "Annulée",   color: "danger"  },
};

// Ordered logistics + billing steps shown on the timeline / when the QR is scanned.
export const TIMELINE_STEPS = [
  { key: "created",   label: "Créée",     icon: "📝" },
  { key: "confirmed", label: "Confirmée", icon: "✅" },
  { key: "shipped",   label: "Expédiée",  icon: "🚚" },
  { key: "delivered", label: "Livrée",    icon: "📦" },
  { key: "invoiced",  label: "Facturée",  icon: "🧾" },
  { key: "paid",      label: "Payée",     icon: "💵" },
];

// Build a timeline for an order given its status + linked invoice.
// Returns { terminal, steps:[{ key,label,icon, done, current, at }] }.
export function buildTimeline(order, invoice) {
  const s = order?.status;

  // Terminal (cancelled / rejected) — short-circuit the cycle.
  if (s === "rejected" || s === "cancelled") {
    return {
      terminal: ORDER_STATUS[s].label,
      terminalColor: "danger",
      steps: [{ key: "created", label: "Créée", icon: "📝", done: true, current: false, at: order?.created_at }],
    };
  }

  const inv        = invoice || order?.invoice || null;
  const invoiced   = !!(order?.invoice_id || inv) && inv?.status !== "cancelled";
  const paid       = inv?.status === "paid";
  const partial    = inv?.status === "partially_paid";

  const done = {
    created:   true,
    confirmed: ["confirmed", "shipped", "delivered"].includes(s),
    shipped:   ["shipped", "delivered"].includes(s),
    delivered: s === "delivered",
    invoiced,
    paid,
  };

  const at = {
    created:   order?.created_at,
    confirmed: order?.confirmed_at,
    shipped:   order?.shipped_at,
    delivered: order?.delivered_at,
    invoiced:  inv?.created_at,
    paid:      paid ? inv?.updated_at : null,
  };

  // "current" = last done step (or first not-done after the run of done ones).
  let lastDoneIdx = -1;
  TIMELINE_STEPS.forEach((st, i) => { if (done[st.key]) lastDoneIdx = i; });

  const steps = TIMELINE_STEPS.map((st, i) => ({
    ...st,
    label: st.key === "paid" && partial ? "Partiellement payée" : st.label,
    done: !!done[st.key],
    current: i === lastDoneIdx,
    at: at[st.key] || null,
  }));

  return { terminal: null, steps };
}
