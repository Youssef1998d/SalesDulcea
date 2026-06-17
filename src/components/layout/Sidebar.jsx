import { useState } from "react";
import { useTheme } from "../../core/theme";
import { Icon } from "../Icon";

const ROLE_LABEL = { agent: "Agent terrain", kam: "KAM", stock_manager: "Responsable stock" };

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// Desktop navigation. Follows the active theme (light/dark) like the rest of the UI.
export function Sidebar({ tabs, active, onChange, agent, onSignOut, onThemeToggle, themeMode }) {
  const T = useTheme();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("eb_sidebar_collapsed") === "true"; } catch { return false; }
  });

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("eb_sidebar_collapsed", String(next)); } catch {}
  }

  const width = collapsed ? 64 : 240;

  return (
    <div style={{
      width, minWidth: width, height: "100vh", flexShrink: 0,
      background: T.surface, borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.2s ease",
      overflow: "hidden",
      position: "sticky", top: 0,
    }}>
      {/* Top — logo */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        flexShrink: 0,
      }}>
        {!collapsed ? (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: T.accent, letterSpacing: 3, lineHeight: 1, whiteSpace: "nowrap" }}>
              {T.orgName}
            </div>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 1, marginTop: 3, textTransform: "uppercase" }}>
              powered by East Blue
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: T.accent, letterSpacing: 2 }}>EB</div>
        )}
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Déplier" : "Replier"}
          style={{
            background: "none", border: "none", color: T.textDim,
            cursor: "pointer", padding: 4, borderRadius: 6, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={18} />
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: collapsed ? "12px 8px" : "12px 12px", overflowY: "auto" }}>
        {tabs.map(tab => {
          const on = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              title={collapsed ? tab.label : undefined}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "11px" : "10px 12px",
                border: "none", borderRadius: 10,
                background: on ? T.accent + "22" : "transparent",
                color: on ? T.accent : T.textSub,
                cursor: "pointer", marginBottom: 2,
                transition: "background 0.15s, color 0.15s", position: "relative",
              }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = T.surfaceHi; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={tab.icon} size={20} />
              {!collapsed && (
                <span style={{ fontSize: 13, fontWeight: on ? 700 : 500, flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>
                  {tab.label}
                </span>
              )}
              {tab.badge > 0 && (
                <span style={{
                  position: collapsed ? "absolute" : "static",
                  top: collapsed ? 6 : undefined, right: collapsed ? 6 : undefined,
                  background: T.danger, color: "#fff",
                  fontSize: 9, fontWeight: 700, borderRadius: 10,
                  padding: "1px 5px", minWidth: 16, textAlign: "center",
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom — user + controls */}
      <div style={{ padding: collapsed ? "12px 8px" : "12px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        {!collapsed && agent && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: T.accent + "22", border: `1.5px solid ${T.accent}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13, color: T.accent, flexShrink: 0,
            }}>
              {initials(agent.full_name)}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {agent.full_name}
              </div>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 1 }}>
                {ROLE_LABEL[agent.role] || agent.role}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, justifyContent: collapsed ? "center" : "flex-start", flexWrap: "wrap" }}>
          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              title={themeMode === "dark" ? "Mode clair" : "Mode sombre"}
              style={{
                background: T.surfaceHi, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: 9, cursor: "pointer", color: T.textSub,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name={themeMode === "dark" ? "sun" : "moon"} size={16} />
            </button>
          )}
          <button
            onClick={onSignOut}
            title="Se déconnecter"
            style={{
              background: "none", border: `1px solid ${T.border}`,
              borderRadius: 8, padding: collapsed ? 9 : "9px 12px", cursor: "pointer",
              color: T.textDim, fontSize: 12, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = T.danger; e.currentTarget.style.borderColor = T.danger; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.textDim; e.currentTarget.style.borderColor = T.border; }}
          >
            <Icon name="log-out" size={16} />
            {!collapsed && "Déconnecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
