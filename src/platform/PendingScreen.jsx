import { useTheme } from "../core/theme";
import { EBLogo } from "../components/layout/EBLogo";
import { Btn } from "../components/ui";

export function PendingScreen({ status, onSignOut }) {
  const T = useTheme();
  const rejected = status === "rejected";
  return (
    <div style={{
      background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:32, textAlign:"center",
    }}>
      <div style={{ fontSize:48, marginBottom:20 }}>{rejected ? "⛔" : "⚓"}</div>
      <EBLogo size="md" />
      <div style={{ marginTop:24, fontSize:18, fontWeight:700, color:T.text }}>
        {rejected ? "Compte refusé" : "En attente d'activation"}
      </div>
      <div style={{ marginTop:12, fontSize:13, color:T.textSub, lineHeight:1.8, maxWidth:280 }}>
        {rejected
          ? "Votre demande a été refusée. Contactez votre responsable pour plus d'informations."
          : "Votre compte est en cours d'examen. Votre responsable vous activera bientôt."}
      </div>
      <Btn variant="ghost" style={{ marginTop:32 }} onClick={onSignOut}>Se déconnecter</Btn>
    </div>
  );
}
