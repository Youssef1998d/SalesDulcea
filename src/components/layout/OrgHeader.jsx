import { useTheme } from "../../core/theme";
import { EBLogo } from "./EBLogo";

/**
 * OrgHeader renders the organization's identity at the top of the app.
 *
 * If the org has a logo_url: show the logo image + org name.
 * If not: show the org name in the org's accent color using Bebas Neue.
 * Below both: "powered by EAST BLUE" in small text with the animated logo.
 *
 * The East Blue navy background always stays — only the accent and logo change.
 */
export function OrgHeader({ rightSlot }) {
  const T = useTheme();

  return (
    <div style={{
      background:`linear-gradient(135deg, ${T.surface}, ${T.bg})`,
      padding:"14px 20px 12px",
      borderBottom:`1px solid ${T.border}`,
      display:"flex",
      justifyContent:"space-between",
      alignItems:"center",
    }}>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {/* Org identity */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {T.orgLogo ? (
            <img
              src={T.orgLogo}
              alt={T.orgName}
              style={{ height:28, objectFit:"contain", borderRadius:4 }}
            />
          ) : (
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:22,
              color:T.accent,
              letterSpacing:2,
              lineHeight:1,
            }}>
              {T.orgName}
            </div>
          )}
        </div>

        {/* Powered by East Blue */}
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:9, color:T.textDim, letterSpacing:0.8, textTransform:"uppercase" }}>
            powered by
          </span>
          <EBLogo size="sm" />
        </div>
      </div>

      {/* Right slot: sign out button, CSV export, etc. */}
      {rightSlot && <div style={{ display:"flex", gap:8, alignItems:"center" }}>{rightSlot}</div>}
    </div>
  );
}
