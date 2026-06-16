import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Card, Btn, Badge, Input, SectionTitle, EmptyState } from "../../../components/ui";

export function StockBatchesTab({ stock, products, loading, onAdd, onUpdate, onRemove }) {
  const T = useTheme();
  const [form,  setForm]  = useState({ product_id:"", quantity:"", batch_label:"", is_future:false, expected_date:"", notes:"" });
  const [error, setError] = useState(null);

  async function submit() {
    if (!form.product_id || !form.quantity) return;
    setError(null);
    try {
      await onAdd({
        product_id: form.product_id,
        quantity: Number(form.quantity),
        batch_label: form.batch_label || null,
        is_future: form.is_future,
        expected_date: form.is_future ? (form.expected_date || null) : null,
        notes: form.notes || null,
      });
      setForm({ product_id:"", quantity:"", batch_label:"", is_future:false, expected_date:"", notes:"" });
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <SectionTitle>Nouveau lot</SectionTitle>
      <Card>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Produit</div>
          <select
            value={form.product_id}
            onChange={e => setForm({ ...form, product_id:e.target.value })}
            style={{ width:"100%", background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:9, padding:"11px 13px", color:T.text, fontSize:14 }}
          >
            <option value="">Sélectionner...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Input label="Quantité" type="number" value={form.quantity} onChange={v => setForm({ ...form, quantity:v })} />
        <Input label="Label du lot" value={form.batch_label} onChange={v => setForm({ ...form, batch_label:v })} placeholder="ex: Lot Juin" />
        <div onClick={() => setForm({ ...form, is_future:!form.is_future })} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, cursor:"pointer" }}>
          <div style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${T.border}`, background:form.is_future?T.accent:"transparent" }} />
          <span style={{ fontSize:13, color:T.textSub }}>Stock futur (à venir)</span>
        </div>
        {form.is_future && <Input label="Date d'arrivée prévue" type="date" value={form.expected_date} onChange={v => setForm({ ...form, expected_date:v })} />}
        {error && <div style={{ background:"#1f0a0a", border:`1px solid ${T.danger}44`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.danger, marginBottom:12 }}>{error}</div>}
        <Btn onClick={submit} style={{ width:"100%" }}>Ajouter le lot</Btn>
      </Card>

      <SectionTitle>Lots existants</SectionTitle>
      {loading && <EmptyState icon="📦" title="Chargement..." />}
      {!loading && !stock.length && <EmptyState icon="📦" title="Aucun lot" />}
      {stock.map(s => (
        <Card key={s.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{s.products?.name}</div>
              <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>
                {s.quantity} {s.products?.unit} {s.batch_label ? `· ${s.batch_label}` : ""}
              </div>
              {s.is_future && (
                <div style={{ marginTop:4 }}>
                  <Badge color={T.info}>Incoming — {s.expected_date ? new Date(s.expected_date).toLocaleDateString("fr-FR") : "?"}</Badge>
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {s.is_future && (
                <Btn size="sm" variant="success" onClick={() => onUpdate(s.id, { is_future:false, expected_date:null })}>Reçu</Btn>
              )}
              <Btn size="sm" variant="danger" onClick={() => onRemove(s.id)}>Suppr.</Btn>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
