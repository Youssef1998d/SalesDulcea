import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Card, Btn, SectionTitle, EmptyState, Input } from "../../../components/ui";

export function ProductsTab({ products, agentProducts, onSave, onArchive }) {
  const T = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name:"", price:"", unit:"" });
  const [editId,   setEditId]   = useState(null);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  function startEdit(p) {
    setForm({ name:p.name, price:p.price, unit:p.unit||"" });
    setEditId(p.id);
    setShowForm(true);
  }

  async function submit() {
    if (!form.name || !form.price) return;
    await onSave({ name:form.name.trim(), price:Number(form.price), unit:form.unit }, editId);
    setForm({ name:"", price:"", unit:"" }); setEditId(null); setShowForm(false);
  }

  return (
    <div>
      <Btn style={{ width:"100%", marginBottom:16, marginTop:8 }}
        onClick={()=>{ setEditId(null); setForm({name:"",price:"",unit:""}); setShowForm(s=>!s); }}>
        {showForm ? "✕ Annuler" : "+ Nouveau produit"}
      </Btn>

      {showForm && (
        <Card>
          <SectionTitle>{editId ? "Modifier le produit" : "Nouveau produit"}</SectionTitle>
          <Input label="Nom *"              value={form.name}  onChange={v=>setF("name",v)}  placeholder="Ex: Frappé Café" />
          <Input label="Prix unitaire (DT)" value={form.price} onChange={v=>setF("price",v)} placeholder="20" type="number" />
          <Input label="Unité"              value={form.unit}  onChange={v=>setF("unit",v)}  placeholder="0.9kg, 1L..." />
          <Btn style={{ width:"100%" }} onClick={submit}>{editId ? "Mettre à jour" : "Ajouter le produit"}</Btn>
        </Card>
      )}

      <SectionTitle>Catalogue · {products.length} produits</SectionTitle>
      {products.length === 0 && <EmptyState icon="📦" title="Aucun produit" sub="Ajoutez vos premiers produits au catalogue" />}

      {products.map(p => (
        <Card key={p.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:T.gold }}>{p.price} DT</div>
          </div>
          {p.unit && <div style={{ fontSize:12, color:T.textSub, marginBottom:6 }}>Unité: {p.unit}</div>}
          <div style={{ fontSize:12, color:T.textDim, marginBottom:10 }}>
            Assigné à {agentProducts.filter(ap=>ap.product_id===p.id).length} agent(s)
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn size="sm" variant="ghost"  onClick={()=>startEdit(p)}>✎ Modifier</Btn>
            <Btn size="sm" variant="danger" onClick={()=>{ if(window.confirm("Archiver ?")) onArchive(p.id); }}>Archiver</Btn>
          </div>
        </Card>
      ))}
    </div>
  );
}
