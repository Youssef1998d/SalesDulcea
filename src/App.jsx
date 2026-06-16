import { useEffect } from "react";
import { ThemeContext, buildTheme } from "./core/theme";
import { useAuth } from "./hooks/useAuth";
import { AuthScreen }   from "./platform/AuthScreen";
import { PendingScreen } from "./platform/PendingScreen";
import { AgentApp, KAMApp } from "./apps/sales";

// ─── Loading Splash ───────────────────────────────────────────────────────────
function LoadingScreen() {
  const T = buildTheme(null);
  return (
    <div style={{ background:T.bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:T.text, letterSpacing:4 }}>EAST BLUE</div>
      <div style={{ fontSize:12, color:T.textDim, animation:"pulse 1.5s infinite" }}>Chargement...</div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, agent, org, loading, logout } = useAuth();

  // Build theme from org config — East Blue navy base + org accent
  const theme = buildTheme(org);

  if (loading) return <ThemeContext.Provider value={theme}><LoadingScreen /></ThemeContext.Provider>;

  return (
    <ThemeContext.Provider value={theme}>
      {/* Not logged in */}
      {!user && <AuthScreen onAuth={() => {}} />}

      {/* Logged in but no agent profile yet */}
      {user && !agent && <PendingScreen status="pending" onSignOut={logout} />}

      {/* Pending approval */}
      {user && agent && agent.status === "pending" && <PendingScreen status="pending" onSignOut={logout} />}

      {/* Rejected */}
      {user && agent && agent.status === "rejected" && <PendingScreen status="rejected" onSignOut={logout} />}

      {/* KAM dashboard */}
      {user && agent && agent.status === "active" && agent.role === "kam" && (
        <KAMApp user={user} agent={agent} onSignOut={logout} />
      )}

      {/* Agent app */}
      {user && agent && agent.status === "active" && agent.role === "agent" && (
        <AgentApp user={user} agent={agent} onSignOut={logout} />
      )}
    </ThemeContext.Provider>
  );
}
