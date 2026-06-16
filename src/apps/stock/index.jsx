import { useTheme } from "../../core/theme";
import { EmptyState } from "../ui";

// Coming soon — shares theme engine, auth, and component library
export function ComingSoonApp({ name }) {
  const T = useTheme();
  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <EmptyState icon="🚧" title={name} sub="Module en cours de développement. Disponible bientôt." />
    </div>
  );
}
