import { useTheme } from "../../../core/theme";
import { Pills, Btn, FinBlock, SectionTitle, EmptyState, Badge } from "../../../components/ui";
import { fmt, emptyLine, calcFin } from "../../../core/utils";

const OUTCOMES = ["Vendu", "Intéressé", "Revenir", "Refus"];
const CONTACTS = ["Propriétaire", "Manager", "Employé"];
const OUTCOME_COLOR = { Vendu: "#34d399", Intéressé: "#fbbf24", Revenir: "#60a5fa", Refus: "#f87171" };
const OUTCOME_ICON  = { Vendu: "✓", Intéressé: "◎", Revenir: "↺", Refus: "✕" };

export function LogTab({ form, setForm, products, onSubmit, saving, saved, visits, onDeleteVisit, onConvertVisit }) {
  const T    = useTheme();
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updLine = (id, k, v) => setForm(f => ({ ...f, lines: f.lines.map(l => l.id === id ? { ...l, [k]: v } : l) }));
  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, emptyLine(products)] }));
  const rmLine  = id => setForm(f => ({ ...f, lines: f.lines.length > 1 ? f.lines.filter(l => l.id !== id) : f.lines }));

  const formFin = calcFin(form.lines, products);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Business name — large, autofocus */}
      <div style={{ marginBottom: 20 }}>
        <input
          autoFocus
          value={form.business}
          onChange={e => setF("business", e.target.value)}
          placeholder="Nom du point de vente..."
          style={{
            width: "100%", background: "transparent",
            border: "none", borderBottom: `2px solid ${form.business ? T.accent : T.border}`,
            padding: "10px 0", color: T.text, fontSize: 20, fontWeight: 600,
            outline: "none", transition: "border-color 0.15s",
          }}
          onFocus={e => e.target.style.borderBottomColor = T.accent}
          onBlur={e => e.target.style.borderBottomColor = form.business ? T.accent : T.border}
        />
      </div>

      {/* Zone */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Zone</div>
        <input
          value={form.zone}
          onChange={e => setF("zone", e.target.value)}
          placeholder="Aouina, Lac, Ennasr..."
          style={{
            width: "100%", background: "transparent",
            border: "none", borderBottom: `1.5px solid ${T.border}`,
            padding: "9px 0", color: T.text, fontSize: 15, outline: "none",
          }}
          onFocus={e => e.target.style.borderBottomColor = T.accent}
          onBlur={e => e.target.style.borderBottomColor = T.border}
        />
      </div>

      {/* Contact type */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Contact</div>
        <Pills options={CONTACTS} value={form.contact} onChange={v => setF("contact", v)} />
      </div>

      {/* Products */}
      <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Produits</div>

      {products.length === 0 ? (
        <div style={{
          background: T.surfaceHi, border: `1px dashed ${T.border}`,
          borderRadius: 12, padding: "18px", textAlign: "center",
          fontSize: 13, color: T.textDim, marginBottom: 16,
        }}>
          Aucun produit assigné. Contactez votre responsable.
        </div>
      ) : (
        <>
          {form.lines.map(line => {
            const prod = products.find(p => p.id === line.productId);
            const lineVal = (prod?.price || 0) * 12 * Number(line.boxes || 0);
            return (
              <div key={line.id} style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: "14px", marginBottom: 10,
                boxShadow: T.shadow,
              }}>
                {/* Product select + remove */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, minWidth: 0 }}>
                  <select
                    value={line.productId}
                    onChange={e => updLine(line.id, "productId", e.target.value)}
                    style={{
                      flex: 1, minWidth: 0, background: T.surfaceHi,
                      border: `1px solid ${T.border}`, borderRadius: 9,
                      padding: "9px 11px", color: T.text, fontSize: 13, outline: "none",
                    }}
                  >
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price} DT</option>)}
                  </select>
                  {form.lines.length > 1 && (
                    <button
                      onClick={() => rmLine(line.id)}
                      style={{
                        background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5",
                        border: `1px solid ${T.danger}44`,
                        color: T.danger, borderRadius: 8, padding: "8px 11px",
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quantities — compact fields (not stretched edge to edge) */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[["Boxes", "boxes"], ["Pots offerts 🎁", "freePots"]].map(([lbl, key]) => (
                    <div key={key} style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: T.textDim, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{lbl}</div>
                      <input
                        type="number" min="0"
                        value={line[key]}
                        onChange={e => updLine(line.id, key, e.target.value)}
                        style={{
                          width: 96, minWidth: 0, background: T.surfaceHi,
                          border: `1px solid ${T.border}`, borderRadius: 8,
                          padding: "9px 10px", color: T.text, fontSize: 15,
                          fontWeight: 600, outline: "none", textAlign: "center",
                        }}
                        onFocus={e => e.target.style.borderColor = T.accent}
                        onBlur={e => e.target.style.borderColor = T.border}
                      />
                    </div>
                  ))}
                </div>

                {/* Line value — its own row so a long amount can't overflow */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12, gap: 10 }}>
                  <span style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Valeur</span>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
                    color: lineVal > 0 ? T.gold : T.textDim,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {lineVal > 0 ? `${fmt(lineVal)} DT` : "—"}
                  </span>
                </div>
              </div>
            );
          })}

          <button
            onClick={addLine}
            style={{
              width: "100%", padding: "11px",
              background: "none", border: `1.5px dashed ${T.border}`,
              borderRadius: 12, color: T.textDim, cursor: "pointer",
              fontSize: 13, marginBottom: 16,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}
          >
            + Ajouter un produit
          </button>
        </>
      )}

      {/* Live financial summary — fades in when gross > 0 */}
      {formFin.gross > 0 && (
        <div style={{ animation: "scaleIn 0.2s ease" }}>
          <FinBlock gross={formFin.gross} inv={formFin.inv} net={formFin.net} />
        </div>
      )}

      {/* Outcome */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Résultat</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {OUTCOMES.map(o => {
            const on  = form.outcome === o;
            const col = OUTCOME_COLOR[o];
            return (
              <button
                key={o}
                type="button"
                onClick={() => setF("outcome", o)}
                style={{
                  padding: "12px 10px", borderRadius: 12,
                  border: `1.5px solid ${on ? col : T.border}`,
                  background: on ? col + "22" : "transparent",
                  color: on ? col : T.textSub,
                  fontSize: 14, fontWeight: on ? 700 : 500,
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <span>{OUTCOME_ICON[o]}</span> {o}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Note</div>
        <input
          value={form.note}
          onChange={e => setF("note", e.target.value)}
          placeholder="Optionnel..."
          style={{
            width: "100%", background: "transparent",
            border: "none", borderBottom: `1.5px solid ${T.border}`,
            padding: "9px 0", color: T.text, fontSize: 14, outline: "none",
          }}
          onFocus={e => e.target.style.borderBottomColor = T.accent}
          onBlur={e => e.target.style.borderBottomColor = T.border}
        />
      </div>

      {/* Save button — fixed feel, full width */}
      <button
        className="eb-btn"
        onClick={onSubmit}
        disabled={saving}
        style={{
          width: "100%", padding: "16px", border: "none", borderRadius: 14,
          fontSize: 15, fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          background: saved ? T.success : T.accent,
          color: saved ? "#0a1628" : T.accentText,
          opacity: saving ? 0.7 : 1,
          marginBottom: 24,
          boxShadow: saved ? `0 4px 16px ${T.success}44` : `0 4px 16px ${T.accent}44`,
        }}
      >
        {saving ? "Enregistrement..." : saved ? "✓ Visite enregistrée !" : "Enregistrer la visite →"}
      </button>

      {/* Recent visits */}
      {visits.length > 0 && (
        <>
          <SectionTitle>Visites récentes</SectionTitle>
          {visits.slice(0, 6).map(v => (
            <VisitCard
              key={v.id}
              v={v}
              products={products}
              onDelete={() => onDeleteVisit(v.id)}
              onConvert={() => onConvertVisit(v.id, v.lines)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function VisitCard({ v, products, onDelete, onConvert }) {
  const T   = useTheme();
  const fin = calcFin(v.lines, products);
  const col = OUTCOME_COLOR[v.outcome] || T.textDim;

  return (
    <div className="eb-card" style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${col}`,
      borderRadius: 14, padding: "13px 15px", marginBottom: 9,
      boxShadow: T.shadow,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{v.business}</div>
        <Badge color={col}>{OUTCOME_ICON[v.outcome]} {v.outcome}</Badge>
      </div>
      <div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>
        {v.zone && `📍 ${v.zone} · `}{v.contact}
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: fin.gross > 0 ? 6 : 0 }}>
        {(v.lines || []).map(l => {
          const p = products.find(p => p.id === l.productId);
          return p ? `${p.name} ×${l.boxes}${Number(l.freePots) > 0 ? ` (+${l.freePots}🎁)` : ""}` : "";
        }).filter(Boolean).join(" · ")}
      </div>
      {fin.gross > 0 && (
        <div style={{ fontSize: 12, color: T.gold, marginBottom: 8, fontWeight: 600 }}>
          {fmt(fin.gross)} DT brut · {fmt(fin.net)} DT net
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: T.textDim }}>
          {new Date(v.ts).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {v.outcome !== "Vendu" && (
            <button
              onClick={onConvert}
              style={{
                background: T.mode === "dark" ? "#0a1f14" : "#f0fff8",
                border: `1px solid ${T.success}44`, color: T.success,
                borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}
            >
              ✓ Vendu
            </button>
          )}
          <button
            onClick={onDelete}
            style={{
              background: "none", border: "none",
              color: T.textDim, cursor: "pointer", fontSize: 13, padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
