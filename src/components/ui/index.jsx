import { useTheme } from "../../core/theme";

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, disabled, variant = "primary", size = "md", style = {} }) {
  const T = useTheme();
  const base = {
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    border:"none", borderRadius:10, cursor:disabled?"not-allowed":"pointer",
    fontFamily:"'Inter',sans-serif", fontWeight:600,
    transition:"all 0.15s", opacity:disabled?0.6:1, ...style,
  };
  const p  = size==="sm" ? "7px 14px" : "13px 20px";
  const gp = size==="sm" ? "6px 13px" : "12px 19px";
  const fs = size==="sm" ? 12 : 14;
  const variants = {
    primary: { background:T.accent,    color:T.accentText, fontSize:fs, padding:p },
    gold:    { background:T.gold,      color:"#0a1628",    fontSize:fs, padding:p },
    ghost:   { background:"transparent", color:T.textSub, border:`1px solid ${T.border}`, fontSize:fs, padding:gp },
    danger:  { background:"#1f0a0a",   color:T.danger,  border:`1px solid ${T.danger}`,  fontSize:fs, padding:gp },
    success: { background:"#0a1f14",   color:T.success, border:`1px solid ${T.success}`, fontSize:fs, padding:gp },
  };
  return <button className="eb-btn" style={{...base,...variants[variant]}} onClick={onClick} disabled={disabled}>{children}</button>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, accent, style = {} }) {
  const T = useTheme();
  return (
    <div className="eb-card" style={{
      background:T.surface, border:`1px solid ${T.border}`, borderRadius:14,
      padding:"14px 16px", marginBottom:10,
      borderLeft:accent?`3px solid ${accent}`:undefined, ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type="text", hint }) {
  const T = useTheme();
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{label}</div>}
      <input
        style={{ width:"100%", background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:9, padding:"11px 13px", color:T.text, fontSize:14, outline:"none" }}
        type={type} value={value} placeholder={placeholder}
        onChange={e=>onChange(e.target.value)}
        onFocus={e=>e.target.style.borderColor=T.accent}
        onBlur={e=>e.target.style.borderColor=T.border}
      />
      {hint && <div style={{ fontSize:11, color:T.textDim, marginTop:4 }}>{hint}</div>}
    </div>
  );
}

// ─── Pills ────────────────────────────────────────────────────────────────────
export function Pills({ options, value, onChange, colorMap = {} }) {
  const T = useTheme();
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
      {options.map(o => {
        const col    = colorMap[o];
        const active = value === o;
        return (
          <button key={o} className="eb-btn" onClick={()=>onChange(o)} style={{
            padding:"7px 14px", borderRadius:20,
            border:`1.5px solid ${active?(col||T.accent):T.border}`,
            background:active?(col||T.accent)+"22":"transparent",
            color:active?(col||T.accent):T.textSub,
            fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s",
          }}>{o}</button>
        );
      })}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color }) {
  return (
    <span style={{
      fontSize:11, padding:"3px 9px", borderRadius:20,
      background:color+"22", color, fontWeight:700, border:`1px solid ${color}44`,
    }}>{children}</span>
  );
}

// ─── StatGrid ─────────────────────────────────────────────────────────────────
export function StatGrid({ stats }) {
  const T = useTheme();
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background:s.accent?T.surfaceHi:T.surface,
          border:`1px solid ${s.accent?T.accent:T.border}`,
          borderRadius:12, padding:"14px 12px", textAlign:"center",
        }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:s.accent?T.accent:T.text, letterSpacing:1 }}>{s.value}</div>
          <div style={{ fontSize:11, color:T.textSub, marginTop:2, fontWeight:500 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  const T = useTheme();
  return (
    <div style={{
      fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.gold,
      letterSpacing:2, marginBottom:12, marginTop:20,
      borderBottom:`1px solid ${T.border}`, paddingBottom:6,
    }}>{children}</div>
  );
}

// ─── FinBlock ─────────────────────────────────────────────────────────────────
export function FinBlock({ gross, inv, net }) {
  const T   = useTheme();
  const fmt = n => Number(n).toFixed(3);
  return (
    <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
      {[["Brut",`${fmt(gross)} DT`,T.textSub],["Investissement",`- ${fmt(inv)} DT`,T.danger],["Net",`${fmt(net)} DT`,T.gold]].map(([l,v,c])=>(
        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
          <span style={{ color:T.textDim }}>{l}</span>
          <span style={{ color:c, fontWeight:l==="Net"?700:400 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }) {
  const T = useTheme();
  return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:6 }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:T.textSub }}>{sub}</div>}
    </div>
  );
}

// ─── NBACard ──────────────────────────────────────────────────────────────────
export function NBACard({ icon, title, text }) {
  const T = useTheme();
  return (
    <Card style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
      <div style={{ fontSize:26, minWidth:36, marginTop:2 }}>{icon}</div>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:13, color:T.textSub, lineHeight:1.6 }}>{text}</div>
      </div>
    </Card>
  );
}
