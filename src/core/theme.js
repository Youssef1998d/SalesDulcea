import { createContext, useContext } from "react";

function isLight(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

const DARK = {
  bg:        "#0a1628",
  surface:   "#0f2347",
  surfaceHi: "#162d5a",
  border:    "#1a3a6b",
  text:      "#e8f4ff",
  textSub:   "#7eb8f7",
  textDim:   "#3a5a8a",
};

const LIGHT = {
  bg:        "#f0f4f8",
  surface:   "#ffffff",
  surfaceHi: "#f8fafc",
  border:    "#e2e8f0",
  text:      "#0f172a",
  textSub:   "#475569",
  textDim:   "#94a3b8",
};

const SHARED = {
  gold:    "#f0c040",
  goldDim: "#b8922a",
  success: "#34d399",
  warning: "#fbbf24",
  danger:  "#f87171",
  info:    "#60a5fa",
};

export function buildTheme(org, mode = "dark") {
  const accent = org?.primary_color || "#2e7dd4";
  const base   = mode === "light" ? LIGHT : DARK;

  return {
    ...base,
    ...SHARED,
    accent,
    accentHi:   accent + "dd",
    accentDim:  accent + "22",
    accentText: isLight(accent) ? "#0a1628" : "#ffffff",
    orgName:    org?.name     || "East Blue",
    orgLogo:    org?.logo_url || null,
    orgColor:   accent,
    mode,
    // Shadow tokens
    shadow:     mode === "light"
                  ? "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)"
                  : "0 1px 3px rgba(0,0,0,0.4)",
    shadowMd:   mode === "light"
                  ? "0 4px 16px rgba(0,0,0,0.10)"
                  : "0 4px 16px rgba(0,0,0,0.5)",
  };
}

export const ThemeContext = createContext(buildTheme(null, "dark"));
export const useTheme = () => useContext(ThemeContext);
