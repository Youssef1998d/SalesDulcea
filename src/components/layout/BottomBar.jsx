import { useTheme } from "../../core/theme";
import { Icon } from "../Icon";

export function BottomBar({ tabs, active, onChange }) {
  const T = useTheme();
  // Up to 5 tabs fill the bar; more than that scroll horizontally so nothing
  // is hidden (previously tabs beyond the 5th were silently dropped).
  const many = tabs.length > 5;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480,
      background: T.surface,
      borderTop: `1px solid ${T.border}`,
      display: "flex",
      flexWrap: "nowrap",
      overflowX: many ? "auto" : "visible",
      WebkitOverflowScrolling: "touch",
      zIndex: 200,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: T.mode === "light"
        ? "0 -4px 16px rgba(0,0,0,0.08)"
        : "0 -4px 16px rgba(0,0,0,0.4)",
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: many ? "0 0 20%" : 1,
              padding: "10px 4px 10px", background: "none", border: "none",
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, position: "relative",
              minHeight: 60,
            }}
          >
            {/* Active top line */}
            {on && (
              <div style={{
                position: "absolute", top: 0, left: "25%", right: "25%",
                height: 2, background: T.accent,
                borderRadius: "0 0 2px 2px",
              }} />
            )}

            {/* Badge */}
            {t.badge > 0 && (
              <div style={{
                position: "absolute", top: 6, right: "50%", transform: "translateX(14px)",
                background: "#f87171", color: "#fff",
                fontSize: 9, fontWeight: 700, borderRadius: 10,
                padding: "1px 5px", minWidth: 16, textAlign: "center",
                animation: "badgePulse 0.3s ease",
              }}>
                {t.badge}
              </div>
            )}

            {/* Icon */}
            <div style={{ color: on ? T.accent : T.textDim, display: "flex", transition: "color 0.15s" }}>
              <Icon name={t.icon} size={22} />
            </div>

            {/* Label */}
            <div style={{
              fontSize: 9, fontWeight: on ? 700 : 500,
              color: on ? T.accent : T.textDim,
              letterSpacing: 0.5, textTransform: "uppercase",
              transition: "color 0.15s", whiteSpace: "nowrap",
            }}>
              {t.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
