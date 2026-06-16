import { useTheme } from "../../core/theme";

export function BottomBar({ tabs, active, onChange }) {
  const T = useTheme();
  return (
    <div style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:480,
      background:T.surface, borderTop:`1px solid ${T.border}`,
      display:"flex", zIndex:100,
      paddingBottom:"env(safe-area-inset-bottom,0px)",
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)} style={{
            flex:1, padding:"10px 4px 8px", background:"none", border:"none",
            cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, position:"relative",
          }}>
            {t.badge > 0 && (
              <div style={{
                position:"absolute", top:6, right:"50%", transform:"translateX(12px)",
                background:T.danger, color:"#fff",
                fontSize:9, fontWeight:700, borderRadius:10, padding:"1px 5px", minWidth:16, textAlign:"center",
              }}>{t.badge}</div>
            )}
            <div style={{ fontSize:20 }}>{t.icon}</div>
            <div style={{
              fontSize:9, fontWeight:on?700:500,
              color:on?T.accent:T.textDim,
              letterSpacing:0.5, textTransform:"uppercase",
            }}>{t.label}</div>
            {on && <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:2, background:T.accent, borderRadius:"0 0 2px 2px" }} />}
          </button>
        );
      })}
    </div>
  );
}
