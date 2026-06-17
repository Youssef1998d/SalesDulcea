import { useTheme } from "../core/theme";
import { Btn } from "../components/ui";

export function PendingScreen({ status, onSignOut }) {
  const T        = useTheme();
  const rejected = status === "rejected";

  return (
    <div style={{
      background: T.bg, minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32, textAlign: "center",
    }}>
      <div style={{ fontSize: 56, marginBottom: 24, lineHeight: 1 }}>{rejected ? "⛔" : "⚓"}</div>

      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 28, color: T.text, letterSpacing: 4,
        marginBottom: 8,
      }}>
        EAST BLUE
      </div>

      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 16, color: rejected ? T.danger : T.accent,
        letterSpacing: 2, marginBottom: 20,
      }}>
        {rejected ? "COMPTE REFUSÉ" : "EN ATTENTE D'ACTIVATION"}
      </div>

      <div style={{
        fontSize: 14, color: T.textSub, lineHeight: 1.8,
        maxWidth: 300,
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: "20px 24px",
        boxShadow: T.shadow,
        marginBottom: 28,
      }}>
        {rejected
          ? "Votre demande a été refusée. Contactez votre responsable pour plus d'informations."
          : "Votre compte est en cours d'examen. Votre responsable vous activera bientôt."}
      </div>

      <Btn variant="ghost" onClick={onSignOut}>Se déconnecter</Btn>
    </div>
  );
}
