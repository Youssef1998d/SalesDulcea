import { useTheme } from "../../core/theme";

export function EBLogo({ size = "md" }) {
  const T  = useTheme();
  const sz = size === "lg" ? 42 : size === "sm" ? 18 : 26;
  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      <div style={{
        fontFamily:"'Bebas Neue',sans-serif",
        fontSize:sz, color:T.text, letterSpacing:3, lineHeight:1,
      }}>
        EAST BLUE
      </div>
      <div style={{
        position:"absolute", bottom:-3, left:0, right:0, height:2,
        background:`linear-gradient(90deg,${T.accent},${T.gold})`,
        borderRadius:2,
        animation:"wave 3s ease-in-out infinite",
        transformOrigin:"left",
      }} />
    </div>
  );
}
