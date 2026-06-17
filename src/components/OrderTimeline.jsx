import { useTheme } from "../core/theme";
import { buildTimeline } from "../core/orderConstants";

// Vertical timeline of a purchase order's cycle (Créée → … → Payée),
// or a terminal Annulée/Refusée state.
export function OrderTimeline({ order, invoice }) {
  const T = useTheme();
  const { terminal, terminalColor, steps } = buildTimeline(order, invoice);

  const fmt = d => d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : null;

  if (terminal) {
    return (
      <div style={{
        background: (T[terminalColor] || T.danger) + "22",
        border: `1px solid ${(T[terminalColor] || T.danger)}44`,
        color: T[terminalColor] || T.danger,
        borderRadius: 12, padding: "12px 16px", fontWeight: 700, fontSize: 14,
      }}>
        Commande {terminal.toLowerCase()}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((st, i) => {
        const last = i === steps.length - 1;
        const col  = st.done ? T.success : st.current ? T.accent : T.textDim;
        return (
          <div key={st.key} style={{ display: "flex", gap: 12, minHeight: last ? 28 : 42 }}>
            {/* Rail */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
                background: st.done ? T.success + "22" : st.current ? T.accent + "22" : T.surfaceHi,
                border: `2px solid ${st.done ? T.success : st.current ? T.accent : T.border}`,
              }}>
                {st.done ? "✓" : st.icon}
              </div>
              {!last && (
                <div style={{ width: 2, flex: 1, background: st.done ? T.success : T.border, marginTop: 2, marginBottom: 2 }} />
              )}
            </div>
            {/* Label */}
            <div style={{ paddingBottom: last ? 0 : 8 }}>
              <div style={{ fontSize: 14, fontWeight: st.current ? 700 : 600, color: col }}>
                {st.label}
              </div>
              {st.at && <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{fmt(st.at)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
