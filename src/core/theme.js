import { EB } from "./tokens";

/**
 * Determines if a hex color is perceptually light.
 */
function isLight(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

/**
 * Builds a full theme from an org config.
 * East Blue navy is always the base.
 * The org's primary_color replaces the accent.
 * Text on accent buttons is auto-computed for contrast.
 */
export function buildTheme(org) {
  const accent = org?.primary_color || "#2e7dd4"; // fallback to EB blue

  return {
    ...EB,
    accent,
    accentHi:   accent + "dd",
    accentDim:  accent + "22",
    accentText: isLight(accent) ? "#0a1628" : "#ffffff",

    // Org identity
    orgName:    org?.name || "East Blue",
    orgLogo:    org?.logo_url || null,
    orgColor:   accent,
  };
}

/**
 * React context for theme — consumed by all components.
 */
import { createContext, useContext } from "react";

export const ThemeContext = createContext(buildTheme(null));
export const useTheme = () => useContext(ThemeContext);
