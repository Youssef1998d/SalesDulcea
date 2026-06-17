import { useTheme } from "../../../core/theme";
import { Badge, Btn, SectionTitle, EmptyState, SkeletonList } from "../../../components/ui";

const OUTCOME_COLOR = { Vendu: "#34d399", Intéressé: "#fbbf24", Revenir: "#60a5fa", Refus: "#f87171" };
const OUTCOME_ICON  = { Vendu: "✓", Intéressé: "◎", Revenir: "↺", Refus: "✕" };

export function FollowupTab({ followups, products, loading, onConvert, onDelete }) {
  const T = useTheme();

  return (
    <div>
      <SectionTitle>À relancer · {followups.length}</SectionTitle>

      {loading && <SkeletonList count={3} height={90} />}

      {!loading && followups.length === 0 && (
        <EmptyState icon="🎉" title="Aucune relance en attente" sub="Tous vos prospects ont été traités" />
      )}

      {followups.map(v => {
        const col = OUTCOME_COLOR[v.outcome] || T.textDim;
        return (
          <div
            key={v.id}
            className="eb-card"
            style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${col}`,
              borderRadius: 14, padding: "13px 15px", marginBottom: 9,
              boxShadow: T.shadow,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{v.business}</div>
              <Badge color={col}>{OUTCOME_ICON[v.outcome]} {v.outcome}</Badge>
            </div>

            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>
              {v.zone && `📍 ${v.zone} · `}{v.contact}
            </div>

            <div style={{ fontSize: 12, color: T.textDim, marginBottom: v.note ? 4 : 8 }}>
              {(v.lines || []).map(l => {
                const p = products.find(p => p.id === l.productId);
                return p ? `${p.name}${Number(l.freePots) > 0 ? ` (+${l.freePots}🎁)` : ""}` : "";
              }).filter(Boolean).join(" · ")}
            </div>

            {v.note && (
              <div style={{ fontSize: 12, color: T.textSub, fontStyle: "italic", marginBottom: 8 }}>
                "{v.note}"
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, color: T.textDim }}>
                {new Date(v.ts).toLocaleDateString("fr-FR")}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="success" onClick={() => onConvert(v.id, v.lines)}>✓ Vendu</Btn>
                <Btn size="sm" variant="danger"  onClick={() => onDelete(v.id)}>Supprimer</Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
