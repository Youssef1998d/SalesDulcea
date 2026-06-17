import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Btn, SectionTitle, EmptyState, Input } from "../../../components/ui";

export function ProductsTab({ products, agentProducts, onSave, onArchive }) {
  const T = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name: "", price: "", unit: "" });
  const [editId,   setEditId]   = useState(null);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function startEdit(p) {
    setForm({ name: p.name, price: p.price, unit: p.unit || "" });
    setEditId(p.id);
    setShowForm(true);
  }

  async function submit() {
    if (!form.name || !form.price) return;
    await onSave({ name: form.name.trim(), price: Number(form.price), unit: form.unit }, editId);
    setForm({ name: "", price: "", unit: "" }); setEditId(null); setShowForm(false);
  }

  return (
    <div>
      <Btn style={{ width: "100%", marginBottom: 16 }}
        onClick={() => { setEditId(null); setForm({ name: "", price: "", unit: "" }); setShowForm(s => !s); }}>
        {showForm ? "✕ Annuler" : "+ Nouveau produit"}
      </Btn>

      {showForm && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "18px 16px", marginBottom: 16,
          boxShadow: T.shadow,
        }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: T.gold, letterSpacing: 2, marginBottom: 16 }}>
            {editId ? "MODIFIER LE PRODUIT" : "NOUVEAU PRODUIT"}
          </div>
          <Input label="Nom *"              value={form.name}  onChange={v => setF("name", v)}  placeholder="Ex: Frappé Café" />
          <Input label="Prix unitaire (DT)" value={form.price} onChange={v => setF("price", v)} placeholder="20" type="number" />
          <Input label="Unité"              value={form.unit}  onChange={v => setF("unit", v)}  placeholder="0.9kg, 1L..." />
          <Btn style={{ width: "100%" }} onClick={submit}>{editId ? "Mettre à jour" : "Ajouter le produit"}</Btn>
        </div>
      )}

      <SectionTitle>Catalogue · {products.length} produits</SectionTitle>
      {products.length === 0 && <EmptyState icon="📦" title="Aucun produit" sub="Ajoutez vos premiers produits au catalogue" />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {products.map(p => (
          <div key={p.id} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "16px",
            boxShadow: T.shadow,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: T.gold, letterSpacing: 1, marginBottom: 4 }}>
              {p.price} DT
            </div>
            {p.unit && <div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>Unité: {p.unit}</div>}
            <div style={{ fontSize: 12, color: T.textDim, marginBottom: 12 }}>
              Assigné à {agentProducts.filter(ap => ap.product_id === p.id).length} agent(s)
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm" variant="ghost"  onClick={() => startEdit(p)}>✎ Modifier</Btn>
              <Btn size="sm" variant="danger" onClick={() => { if (window.confirm("Archiver ?")) onArchive(p.id); }}>Archiver</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
