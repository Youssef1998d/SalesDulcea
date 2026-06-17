import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../core/theme";
import { useIsMobile } from "../../hooks/useIsMobile";

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, disabled, variant = "primary", size = "md", style: extStyle = {}, type = "button" }) {
  const T    = useTheme();
  const pad  = size === "sm" ? "7px 14px" : size === "lg" ? "15px 28px" : "12px 20px";
  const padG = size === "sm" ? "6px 13px" : size === "lg" ? "14px 27px" : "11px 19px";
  const fs   = size === "sm" ? 12 : size === "lg" ? 15 : 14;

  const variants = {
    primary: { background: T.accent,       color: T.accentText, padding: pad,  border: "none" },
    gold:    { background: T.gold,         color: "#0a1628",    padding: pad,  border: "none" },
    ghost:   { background: "transparent",  color: T.textSub,    padding: padG, border: `1px solid ${T.border}` },
    danger:  { background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5",
               color: T.danger,   padding: padG, border: `1px solid ${T.danger}44` },
    success: { background: T.mode === "dark" ? "#0a1f14" : "#f0fff8",
               color: T.success,  padding: padG, border: `1px solid ${T.success}44` },
    subtle:  { background: T.surfaceHi,    color: T.textSub,    padding: padG, border: `1px solid ${T.border}` },
  };

  return (
    <button
      type={type}
      className="eb-btn"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: fs,
        transition: "all 0.15s", opacity: disabled ? 0.55 : 1,
        ...variants[variant] || variants.primary,
        ...extStyle,
      }}
    >
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, accent, style: extStyle = {}, onClick, hover = false }) {
  const T      = useTheme();
  const [hov, setHov] = useState(false);

  return (
    <div
      className="eb-card"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:  (hover && hov) ? T.surfaceHi : T.surface,
        border:      `1px solid ${T.border}`,
        borderLeft:  accent ? `3px solid ${accent}` : `1px solid ${T.border}`,
        borderRadius: 14,
        padding:     "14px 16px",
        marginBottom: 10,
        boxShadow:   T.shadow,
        cursor:      onClick ? "pointer" : "default",
        transition:  "background 0.15s ease",
        ...extStyle,
      }}
    >
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = "text", inputMode, hint, autoFocus = false, style: extStyle = {} }) {
  const T      = useTheme();
  const mobile = useIsMobile();
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  const mobileStyle = {
    width: "100%", background: "transparent",
    border: "none", borderBottom: `1.5px solid ${focused ? T.accent : T.border}`,
    borderRadius: 0, padding: "10px 0",
    color: T.text, fontSize: 15, outline: "none",
    transition: "border-color 0.15s",
  };

  const desktopStyle = {
    width: "100%", background: T.surfaceHi,
    border: `1px solid ${focused ? T.accent : T.border}`,
    borderRadius: 9, padding: "11px 13px",
    color: T.text, fontSize: 14, outline: "none",
    boxShadow: focused ? `0 0 0 3px ${T.accent}22` : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={{ marginBottom: 16, ...extStyle }}>
      {label && (
        <div style={{
          fontSize: 11, color: focused ? T.accent : T.textSub,
          fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5,
          transition: "color 0.15s",
        }}>
          {label}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={mobile ? mobileStyle : desktopStyle}
      />
      {hint && <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ─── Pills ────────────────────────────────────────────────────────────────────
export function Pills({ options, value, onChange, colorMap = {} }) {
  const T = useTheme();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map(o => {
        const col    = colorMap[o];
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            className="eb-btn"
            onClick={() => onChange(o)}
            style={{
              padding: "8px 16px", borderRadius: 20,
              border:     `1.5px solid ${active ? (col || T.accent) : T.border}`,
              background: active ? (col || T.accent) + "22" : "transparent",
              color:      active ? (col || T.accent) : T.textSub,
              fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 11, padding: "3px 9px", borderRadius: 20,
      background: color + "22", color, fontWeight: 700, border: `1px solid ${color}44`,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

// ─── StatGrid ─────────────────────────────────────────────────────────────────
export function StatGrid({ stats }) {
  const T = useTheme();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
      {stats.map(s => (
        <div
          key={s.label}
          style={{
            background: s.accent ? T.surfaceHi : T.surface,
            border: `1px solid ${s.accent ? T.accent : T.border}`,
            borderLeft: `3px solid ${s.accent ? T.accent : T.border}`,
            borderRadius: 12, padding: "14px 14px",
            boxShadow: T.shadow,
          }}
        >
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 32, color: s.accent ? T.accent : T.text,
            letterSpacing: 1, lineHeight: 1,
          }}>
            {s.value}
          </div>
          <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card (desktop) ───────────────────────────────────────────────────────
export function KPICard({ value, label, sub, accent = false, icon }) {
  const T = useTheme();
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${accent ? T.accent : T.border}`,
      borderRadius: 14, padding: "20px 22px",
      boxShadow: T.shadow, flex: 1,
    }}>
      {icon && <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 40, color: accent ? T.accent : T.text,
        letterSpacing: 1, lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: T.textSub, marginTop: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  const T = useTheme();
  return (
    <div style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 14, color: T.gold,
      letterSpacing: 2, marginBottom: 12, marginTop: 24,
      borderBottom: `1px solid ${T.border}`, paddingBottom: 8,
      textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

// ─── FinBlock ─────────────────────────────────────────────────────────────────
export function FinBlock({ gross, inv, net }) {
  const T   = useTheme();
  const fmt = n => Number(n).toFixed(3);
  return (
    <div style={{
      background: T.surfaceHi, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "12px 16px", marginBottom: 16,
      animation: "scaleIn 0.2s ease",
    }}>
      {[["Brut", `${fmt(gross)} DT`, T.textSub], ["Investissement", `- ${fmt(inv)} DT`, T.danger], ["Net", `${fmt(net)} DT`, T.gold]].map(([l, v, c]) => (
        <div key={l} style={{
          display: "flex", justifyContent: "space-between",
          padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13,
        }}>
          <span style={{ color: T.textDim }}>{l}</span>
          <span style={{ color: c, fontWeight: l === "Net" ? 700 : 400 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action, onAction }) {
  const T = useTheme();
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>{sub}</div>}
      {action && onAction && (
        <Btn style={{ marginTop: 20 }} onClick={onAction}>{action}</Btn>
      )}
    </div>
  );
}

// ─── NBACard ──────────────────────────────────────────────────────────────────
export function NBACard({ icon, title, text }) {
  const T = useTheme();
  return (
    <Card style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: T.surfaceHi, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 22, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{text}</div>
      </div>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ height = 80, radius = 12, style: extStyle = {} }) {
  const T = useTheme();
  return (
    <div
      className="eb-shimmer"
      style={{
        height, borderRadius: radius,
        background: T.surfaceHi,
        marginBottom: 10, ...extStyle,
      }}
    />
  );
}

export function SkeletonList({ count = 3, height = 80 }) {
  return <>{Array.from({ length: count }).map((_, i) => <Skeleton key={i} height={height} />)}</>;
}

// ─── SuccessBanner ───────────────────────────────────────────────────────────
export function SuccessBanner({ message, visible }) {
  const T = useTheme();
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      zIndex: 1000, width: "100%", maxWidth: 480,
      background: T.success, color: "#0a1628",
      fontWeight: 700, fontSize: 14, textAlign: "center",
      padding: "14px 20px",
      animation: "slideDown 0.2s ease",
      boxShadow: "0 4px 16px rgba(52,211,153,0.4)",
    }}>
      ✓ {message}
    </div>
  );
}

// ─── SlidePanel ───────────────────────────────────────────────────────────────
export function SlidePanel({ open, onClose, title, children, width = 400 }) {
  const T = useTheme();

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.6)",
          animation: "fadeIn 0.2s ease",
        }}
      />
      {/* Panel */}
      <div style={{
        position: "relative", width, maxWidth: "90vw",
        background: T.surface, borderLeft: `1px solid ${T.border}`,
        height: "100%", overflowY: "auto",
        animation: "slideInRight 0.25s ease",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: T.gold, letterSpacing: 2 }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: T.textSub,
              fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, padding: "20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Modal (bottom sheet on mobile) ──────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  const T      = useTheme();
  const mobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      zIndex: 400, display: "flex",
      alignItems: mobile ? "flex-end" : "center",
      justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: mobile ? "18px 18px 0 0" : 18,
        padding: "24px 20px",
        width: "100%", maxWidth: mobile ? 480 : 520,
        maxHeight: "88vh", overflowY: "auto",
        animation: "scaleIn 0.2s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: T.gold, letterSpacing: 2 }}>
            {title}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textSub, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Inline commission editor used in sales tables ────────────────────────────
export function InlineEdit({ value, onSave, onCancel, suffix = "" }) {
  const T      = useTheme();
  const [val, setVal] = useState(String(value));
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);

  function handleKey(e) {
    if (e.key === "Enter")  onSave(val);
    if (e.key === "Escape") onCancel();
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input
        ref={ref}
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={handleKey}
        style={{
          width: 60, background: T.surfaceHi,
          border: `1.5px solid ${T.accent}`,
          borderRadius: 7, padding: "5px 8px",
          color: T.gold, fontSize: 14, fontWeight: 700, outline: "none", textAlign: "center",
        }}
      />
      {suffix && <span style={{ fontSize: 13, color: T.textSub }}>{suffix}</span>}
      <button onClick={() => onSave(val)} style={{ background: T.accent, color: T.accentText, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓</button>
      <button onClick={onCancel} style={{ background: "transparent", color: T.textDim, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
    </div>
  );
}

// ─── Sparkline (SVG) ─────────────────────────────────────────────────────────
export function Sparkline({ data, color, height = 40, width = 120 }) {
  const T = useTheme();
  const col = color || T.accent;
  if (!data || data.length < 2) return <div style={{ width, height }} />;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(" L ")}`;
  const fillD = `M 0,${height} L ${pts.join(" L ")} L ${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <path d={fillD} fill={col + "18"} />
      <path d={pathD} stroke={col} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar Chart (horizontal, relative) ────────────────────────────────────────
export function HBar({ value, max, color }) {
  const T   = useTheme();
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const col = color || T.accent;
  return (
    <div style={{ height: 6, background: T.surfaceHi, borderRadius: 4, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", width: `${pct}%`, background: col,
        borderRadius: 4, transition: "width 0.5s ease",
        minWidth: pct > 0 ? 4 : 0,
      }} />
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color, height = 8 }) {
  const T    = useTheme();
  const pct  = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const col  = color || T.accent;
  const low  = pct < 20;
  return (
    <div style={{ height, background: T.surfaceHi, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: low ? T.danger : col,
        borderRadius: height / 2, transition: "width 0.5s ease",
      }} />
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider() {
  const T = useTheme();
  return <div style={{ height: 1, background: T.border, margin: "16px 0" }} />;
}

// ─── SelectField ─────────────────────────────────────────────────────────────
export function SelectField({ label, value, onChange, children, style: extStyle = {} }) {
  const T      = useTheme();
  const mobile = useIsMobile();
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 16, ...extStyle }}>
      {label && (
        <div style={{
          fontSize: 11, color: focused ? T.accent : T.textSub,
          fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5,
          transition: "color 0.15s",
        }}>
          {label}
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: mobile ? "transparent" : T.surfaceHi,
          border: mobile ? "none" : `1px solid ${focused ? T.accent : T.border}`,
          borderBottom: mobile ? `1.5px solid ${focused ? T.accent : T.border}` : undefined,
          borderRadius: mobile ? 0 : 9,
          padding: mobile ? "10px 0" : "11px 13px",
          color: T.text, fontSize: mobile ? 15 : 14, outline: "none",
          boxShadow: (!mobile && focused) ? `0 0 0 3px ${T.accent}22` : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          cursor: "pointer",
        }}
      >
        {children}
      </select>
    </div>
  );
}
