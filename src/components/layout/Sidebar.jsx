import { useState } from "react";
import { useTheme } from "../../core/theme";

// Sidebar is always dark regardless of app theme mode
const S = {
  bg:        "#070f1e",
  surface:   "#0a1628",
  surfaceHi: "#0f2347",
  border:    "#1a3a6b",
  text:      "#e8f4ff",
  textSub:   "#7eb8f7",
  textDim:   "#3a5a8a",
};

const ROLE_LABEL = { agent: "Agent terrain", kam: "KAM", stock_manager: "Responsable stock" };

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function Sidebar({ tabs, active, onChange, agent, onSignOut, onThemeToggle, themeMode }) {
  const T = useTheme(); // for accent color only
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("eb_sidebar_collapsed") === "true"; } catch { return false; }
  });

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("eb_sidebar_collapsed", String(next)); } catch {}
  }

  const width = collapsed ? 60 : 240;

  return (
    <div style={{
      width, minWidth: width, height: "100vh", flexShrink: 0,
      background: S.bg, borderRight: `1px solid ${S.border}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.2s ease",
      overflow: "hidden",
      position: "sticky", top: 0,
    }}>
      {/* Top — logo */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 20px",
        borderBottom: `1px solid ${S.border}`,
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 20, color: T.accent,
              letterSpacing: 3, lineHeight: 1,
            }}>
              {T.orgName}
            </div>
            <div style={{ fontSize: 9, color: S.textDim, letterSpacing: 1, marginTop: 3, textTransform: "uppercase" }}>
              powered by East Blue
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 14, color: T.accent, letterSpacing: 2,
          }}>
            EB
          </div>
        )}
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            background: "none", border: "none", color: S.textDim,
            cursor: "pointer", padding: 4, borderRadius: 6,
            fontSize: 14, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: collapsed ? "12px 8px" : "12px 12px", overflowY: "auto" }}>
        {tabs.map(tab => {
          const on = active === tab.id;
          return (
            <div key={tab.id} style={{ position: "relative" }}>
              <button
                onClick={() => onChange(tab.id)}
                title={collapsed ? tab.label : undefined}
                style={{
                  width: "100%", display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px" : "10px 12px",
                  border: "none", borderRadius: 10,
                  background: on ? T.accent + "22" : "transparent",
                  cursor: "pointer", marginBottom: 2,
                  transition: "background 0.15s",
                  position: "relative",
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = S.surfaceHi; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{tab.icon}</span>
                {!collapsed && (
                  <span style={{
                    fontSize: 13, fontWeight: on ? 700 : 500,
                    color: on ? T.accent : S.textSub,
                    transition: "color 0.15s",
                    flex: 1, textAlign: "left",
                  }}>
                    {tab.label}
                  </span>
                )}
                {tab.badge > 0 && (
                  <span style={{
                    position: collapsed ? "absolute" : "static",
                    top: collapsed ? 6 : undefined,
                    right: collapsed ? 6 : undefined,
                    background: "#f87171", color: "#fff",
                    fontSize: 9, fontWeight: 700, borderRadius: 10,
                    padding: "1px 5px", minWidth: 16, textAlign: "center",
                    animation: "badgePulse 0.3s ease",
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom — user + controls */}
      <div style={{
        padding: collapsed ? "12px 8px" : "12px 16px",
        borderTop: `1px solid ${S.border}`,
        flexShrink: 0,
      }}>
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
              <div style={{ fontSize: 13, fontWeight: 600, color: S.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {agent.full_name}
              </div>
              <div style={{ fontSize: 10, color: S.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 1 }}>
                {ROLE_LABEL[agent.role] || agent.role}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, justifyContent: collapsed ? "center" : "flex-start", flexWrap: "wrap" }}>
          {/* Theme toggle */}
          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              title={themeMode === "dark" ? "Mode clair" : "Mode sombre"}
              style={{
                background: S.surfaceHi, border: `1px solid ${S.border}`,
                borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: S.textSub,
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {themeMode === "dark" ? "☀️" : "🌙"}
            </button>
          )}

          {/* Sign out */}
          {!collapsed && (
            <button
              onClick={onSignOut}
              title="Se déconnecter"
              style={{
                background: "none", border: `1px solid ${S.border}`,
                borderRadius: 8, padding: "7px 12px", cursor: "pointer",
                color: S.textDim, fontSize: 12, fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.color = S.textDim; e.currentTarget.style.borderColor = S.border; }}
            >
              Déconnecter
            </button>
          )}

          {collapsed && (
            <button
              onClick={onSignOut}
              title="Se déconnecter"
              style={{
                background: "none", border: `1px solid ${S.border}`,
                borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                color: S.textDim, fontSize: 14,
              }}
            >
              ⏻
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
