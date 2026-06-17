import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Btn, Badge, SectionTitle, EmptyState, SkeletonList, ProgressBar } from "../../../components/ui";
import { useIsMobile } from "../../../hooks/useIsMobile";

export function StockBatchesTab({ stock, products, loading, onAdd, onUpdate, onRemove }) {
  const T      = useTheme();
  const mobile = useIsMobile();
  const [form,  setForm]  = useState({ product_id: "", quantity: "", batch_label: "", is_future: false, expected_date: "", notes: "" });
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function submit() {
    if (!form.product_id || !form.quantity) return;
    setError(null);
    try {
      await onAdd({
        product_id:    form.product_id,
        quantity:      Number(form.quantity),
        batch_label:   form.batch_label || null,
        is_future:     form.is_future,
        expected_date: form.is_future ? (form.expected_date || null) : null,
        notes:         form.notes || null,
      });
      setForm({ product_id: "", quantity: "", batch_label: "", is_future: false, expected_date: "", notes: "" });
      setShowForm(false);
    } catch (e) {
      setError(e.message);
    }
  }

  // Group stock by product
  const available = stock.filter(s => !s.is_future);
  const incoming  = stock.filter(s =>  s.is_future);

  // Find max quantity for progress bars
  const maxQty = Math.max(...available.map(s => Number(s.quantity)), 1);

  const inputStyle = {
    width: "100%",
    background: mobile ? "transparent" : T.surfaceHi,
    border: mobile ? "none" : `1px solid ${T.border}`,
    borderBottom: `1.5px solid ${T.border}`,
    borderRadius: mobile ? 0 : 9,
    padding: mobile ? "10px 0" : "10px 12px",
    color: T.text, fontSize: 14, outline: "none",
    marginBottom: 14,
  };

  return (
    <div>
      {/* Add batch button */}
      <Btn style={{ width: "100%", marginBottom: 16 }} onClick={() => { setShowForm(s => !s); setError(null); }}>
        {showForm ? "✕ Annuler" : "+ Nouveau lot de stock"}
      </Btn>

      {/* Add form */}
      {showForm && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "18px 16px", marginBottom: 20,
          boxShadow: T.shadow,
        }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: T.gold, letterSpacing: 2, marginBottom: 16 }}>
            NOUVEAU LOT
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Produit</div>
            <select
              value={form.product_id}
              onChange={e => setForm({ ...form, product_id: e.target.value })}
              style={{
                width: "100%", background: T.surfaceHi,
                border: `1px solid ${T.border}`, borderRadius: 9,
                padding: "10px 12px", color: T.text, fontSize: 14, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            >
              <option value="">Sélectionner...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Quantité</div>
            <input
              type="number" min="1"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              placeholder="ex: 500"
              style={inputStyle}
              onFocus={e => e.target.style.borderBottomColor = T.accent}
              onBlur={e => e.target.style.borderBottomColor = T.border}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Label du lot</div>
            <input
              type="text"
              value={form.batch_label}
              onChange={e => setForm({ ...form, batch_label: e.target.value })}
              placeholder="ex: Lot Juin"
              style={inputStyle}
              onFocus={e => e.target.style.borderBottomColor = T.accent}
              onBlur={e => e.target.style.borderBottomColor = T.border}
            />
          </div>

          {/* Future toggle */}
          <div
            onClick={() => setForm({ ...form, is_future: !form.is_future })}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, cursor: "pointer" }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              border: `1.5px solid ${form.is_future ? T.accent : T.border}`,
              background: form.is_future ? T.accent + "22" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {form.is_future && <div style={{ color: T.accent, fontSize: 12, fontWeight: 700 }}>✓</div>}
            </div>
            <span style={{ fontSize: 13, color: T.textSub }}>Stock futur (à venir)</span>
          </div>

          {form.is_future && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Date d'arrivée prévue</div>
              <input
                type="date"
                value={form.expected_date}
                onChange={e => setForm({ ...form, expected_date: e.target.value })}
                style={inputStyle}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5",
              border: `1px solid ${T.danger}44`,
              borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: T.danger, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <Btn onClick={submit} style={{ width: "100%" }}>Ajouter le lot</Btn>
        </div>
      )}

      {/* Stock disponible */}
      <SectionTitle>Stock disponible</SectionTitle>
      {loading && <SkeletonList count={3} height={80} />}
      {!loading && !available.length && (
        <EmptyState icon="📦" title="Aucun stock disponible" sub="Ajoutez des lots pour commencer" />
      )}

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, marginBottom: 8 }}>
        {available.map(s => {
          const qty = Number(s.quantity);
          const low = qty < 50;
          return (
            <div key={s.id} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${low ? T.danger : T.success}`,
              borderRadius: 14, padding: "14px 16px",
              boxShadow: T.shadow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{s.products?.name}</div>
                  {s.batch_label && <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{s.batch_label}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: low ? T.danger : T.text, lineHeight: 1 }}>
                    {qty}
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {s.products?.unit}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <ProgressBar value={qty} max={maxQty} color={low ? T.danger : T.success} />
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <Btn size="sm" variant="danger" onClick={() => onRemove(s.id)}>Suppr.</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock entrant */}
      {incoming.length > 0 && (
        <>
          <SectionTitle>Stock entrant · {incoming.length}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {incoming.map(s => (
              <div key={s.id} style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.info}`,
                borderRadius: 14, padding: "14px 16px",
                boxShadow: T.shadow,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{s.products?.name}</div>
                    {s.batch_label && <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{s.batch_label}</div>}
                    <div style={{ marginTop: 6 }}>
                      <Badge color={T.info}>
                        Arrivée {s.expected_date ? new Date(s.expected_date).toLocaleDateString("fr-FR") : "?"}
                      </Badge>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: T.info, lineHeight: 1 }}>
                      +{s.quantity}
                    </div>
                    <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase" }}>{s.products?.unit}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Btn size="sm" variant="success" onClick={() => onUpdate(s.id, { is_future: false, expected_date: null })}>✓ Reçu</Btn>
                  <Btn size="sm" variant="danger"  onClick={() => onRemove(s.id)}>Suppr.</Btn>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
