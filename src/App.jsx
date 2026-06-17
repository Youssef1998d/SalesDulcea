import { useState, useEffect } from "react";
import { ThemeContext, buildTheme } from "./core/theme";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./core/supabase";
import { AuthScreen }   from "./platform/AuthScreen";
import { PendingScreen } from "./platform/PendingScreen";
import { AgentApp, KAMApp } from "./apps/sales";
import { StockManagerApp } from "./apps/stock";
import { ErrorBoundary } from "./components/ErrorBoundary";

function LoadingScreen() {
  const T = buildTheme(null, "dark");
  return (
    <div style={{
      background: T.bg, minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: T.text, letterSpacing: 4 }}>
        EAST BLUE
      </div>
      <div style={{ fontSize: 12, color: T.textDim, animation: "pulse 1.5s infinite" }}>
        Chargement...
      </div>
    </div>
  );
}

export default function App() {
  const { user, agent, org, loading, logout } = useAuth();

  // Theme mode — localStorage is source of truth; fallback to agent.theme or 'dark'
  const [themeMode, setThemeMode] = useState(() => {
    try { return localStorage.getItem("eb_theme") || "dark"; } catch { return "dark"; }
  });

  // When agent loads and localStorage has no preference, sync from DB
  useEffect(() => {
    if (agent?.theme) {
      try {
        const stored = localStorage.getItem("eb_theme");
        if (!stored) {
          setThemeMode(agent.theme);
          localStorage.setItem("eb_theme", agent.theme);
        }
      } catch {}
    }
  }, [agent]);

  function handleThemeToggle() {
    const next = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    try { localStorage.setItem("eb_theme", next); } catch {}
    // Apply smooth CSS transition class
    document.body.classList.add("theme-transition");
    setTimeout(() => document.body.classList.remove("theme-transition"), 300);
    // Persist preference to DB (fire and forget)
    if (user) {
      supabase.from("agents").update({ theme: next }).eq("id", user.id).then(() => {});
    }
  }

  const theme = buildTheme(org, themeMode);

  // Update body background immediately on theme change
  document.body.style.background = theme.bg;

  return (
    <ThemeContext.Provider value={theme}>
      <ErrorBoundary>
      {loading && <LoadingScreen />}

      {!loading && !user && (
        <AuthScreen onAuth={() => {}} />
      )}

      {!loading && user && !agent && (
        <PendingScreen status="pending" onSignOut={logout} />
      )}

      {!loading && user && agent && agent.status === "pending" && (
        <PendingScreen status="pending" onSignOut={logout} />
      )}

      {!loading && user && agent && agent.status === "rejected" && (
        <PendingScreen status="rejected" onSignOut={logout} />
      )}

      {!loading && user && agent && agent.status === "active" && agent.role === "kam" && (
        <KAMApp
          user={user}
          agent={agent}
          onSignOut={logout}
          onThemeToggle={handleThemeToggle}
          themeMode={themeMode}
        />
      )}

      {!loading && user && agent && agent.status === "active" && agent.role === "agent" && (
        <AgentApp
          user={user}
          agent={agent}
          onSignOut={logout}
          onThemeToggle={handleThemeToggle}
          themeMode={themeMode}
        />
      )}

      {!loading && user && agent && agent.status === "active" && agent.role === "stock_manager" && (
        <StockManagerApp
          user={user}
          agent={agent}
          onSignOut={logout}
          onThemeToggle={handleThemeToggle}
          themeMode={themeMode}
        />
      )}
      </ErrorBoundary>
    </ThemeContext.Provider>
  );
}
