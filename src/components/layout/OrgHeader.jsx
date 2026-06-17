import { useTheme } from "../../core/theme";
import { Icon } from "../Icon";

export function OrgHeader({ rightSlot, onThemeToggle, themeMode, compact = false }) {
  const T = useTheme();

  return (
    <div style={{
      background: T.mode === "dark"
        ? `linear-gradient(135deg, ${T.surface}, ${T.bg})`
        : T.surface,
      padding: compact ? "10px 20px" : "12px 20px",
      borderBottom: `1px solid ${T.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0,
      zIndex: 100,
      boxShadow: T.mode === "light" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
    }}>
      {/* Org identity */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {T.orgLogo ? (
            <img
              src={T.orgLogo}
              alt={T.orgName}
              style={{ height: 26, objectFit: "contain", borderRadius: 4 }}
            />
          ) : (
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 20, color: T.accent,
              letterSpacing: 3, lineHeight: 1,
            }}>
              {T.orgName}
            </div>
          )}
        </div>
        {!compact && (
          <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 0.8, textTransform: "uppercase" }}>
            powered by East Blue
          </div>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            title={themeMode === "dark" ? "Mode clair" : "Mode sombre"}
            style={{
              background: "none", border: `1px solid ${T.border}`,
              borderRadius: 8, padding: 8,
              cursor: "pointer", color: T.textSub,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            <Icon name={themeMode === "dark" ? "sun" : "moon"} size={16} />
          </button>
        )}
        {rightSlot}
      </div>
    </div>
  );
}
