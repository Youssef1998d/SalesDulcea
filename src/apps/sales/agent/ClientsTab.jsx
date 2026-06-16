import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Card, Badge, Btn, SectionTitle, EmptyState, StatGrid, Input, Pills } from "../../../components/ui";
import { daysUntil, reorderStatus, fmtS } from "../../../core/utils";

const CLIENT_TYPES = ["Café","Restaurant","Hôtel","Grossiste","Autre"];

const emptyForm = {
  name:"", type:CLIENT_TYPES[0], phone:"", address:"",
  first_order_date:"", last_order_date:"", last_order_amount:"",
  reorder_cycle_days:35, commission_rate:8, notes:"",
};

export function ClientsTab({ clients, loading, onSave, onDelete, onReorder }) {
  const T = useTheme();
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  function startEdit(c) {
    setForm({ name:c.name, type:c.type||CLIENT_TYPES[0], phone:c.phone||"", address:c.address||"", first_order_date:c.first_order_date||"", last_order_date:c.last_order_date||"", last_order_amount:c.last_order_amount||"", reorder_cycle_days:c.reorder_cycle_days||35, commission_rate:c.commission_rate||8, notes:c.notes||"" });
    setEditId(c.id);
    setShowForm(true);
  }

  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, first_order_date:form.first_order_date||null, last_order_date:form.last_order_date||null, last_order_amount:form.last_order_amount?Number(form.last_order_amount):null, reorder_cycle_days:Number(form.reorder_cycle_days)||35, commission_rate:Number(form.commission_rate)||8 };
      await onSave(payload, editId);
      setForm(emptyForm); setEditId(null); setShowForm(false);
    } finally { setSaving(false); }
  }

  const urgent = clients.filter(c=>{const d=daysUntil(c.last_order_date,c.reorder_cycle_days);return d!==null&&d<=5;});
  const totalComm = clients.reduce((s,c)=>!c.last_order_amount||!c.commission_rate?s:s+(c.last_order_amount*c.commission_rate/100),0);

  return (
    <div>
      <StatGrid stats={[{label:"Clients actifs",value:clients.length},{label:"Commission / cycle",value:`${fmtS(totalComm)} DT`,accent:true}]} />

      {urgent.length > 0 && (
        <div style={{ background:"#1f0a0a", border:`1px solid ${T.danger}44`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:T.danger, display:"flex", alignItems:"center", gap:8 }}>
          <span>🔴</span> {urgent.length} client(s) à recontacter cette semaine
        </div>
      )}

      <Btn style={{ width:"100%", marginBottom:16 }} onClick={()=>{setEditId(null);setForm(emptyForm);setShowForm(s=>!s);}}>
        {showForm ? "✕ Annuler" : "+ Nouveau client"}
      </Btn>

      {showForm && (
        <Card>
          <SectionTitle>{editId ? "Modifier le client" : "Nouveau client"}</SectionTitle>
          <Input label="Nom *" value={form.name} onChange={v=>setF("name",v)} placeholder="Café El Amal..." />
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:7 }}>Type</div>
            <Pills options={CLIENT_TYPES} value={form.type} onChange={v=>setF("type",v)} />
          </div>
          <Input label="Téléphone"   value={form.phone}   onChange={v=>setF("phone",v)}   placeholder="+216 XX XXX XXX" />
          <Input label="Zone / Adresse" value={form.address} onChange={v=>setF("address",v)} placeholder="Lac, Centre-ville..." />
          <Input label="Date première commande" value={form.first_order_date} onChange={v=>setF("first_order_date",v)} type="date" />
          <Input label="Date dernière commande" value={form.last_order_date}  onChange={v=>setF("last_order_date",v)}  type="date" />
          <Input label="Montant dernière commande (DT)" value={form.last_order_amount} onChange={v=>setF("last_order_amount",v)} placeholder="250" type="number" />
          <Input label="Cycle réapprovisionnement (jours)" value={form.reorder_cycle_days} onChange={v=>setF("reorder_cycle_days",v)} type="number" hint="Jours entre chaque commande (ex: 35)" />
          <Input label="Taux commission (%)" value={form.commission_rate} onChange={v=>setF("commission_rate",v)} type="number" />
          <Input label="Notes" value={form.notes} onChange={v=>setF("notes",v)} placeholder="Préférences, infos utiles..." />
          <Btn style={{ width:"100%" }} onClick={submit} disabled={saving}>{saving?"Enregistrement...":editId?"Mettre à jour":"Ajouter le client"}</Btn>
        </Card>
      )}

      {loading && <EmptyState icon="⚓" title="Chargement..." />}
      {!loading && clients.length === 0 && !showForm && <EmptyState icon="🏪" title="Aucun client" sub="Ajoutez vos premiers clients pour suivre vos commissions" />}

      {clients.map(c => {
        const days   = daysUntil(c.last_order_date, c.reorder_cycle_days);
        const status = reorderStatus(days, T);
        const proj   = c.last_order_amount && c.commission_rate ? (c.last_order_amount*c.commission_rate/100).toFixed(2) : null;
        return (
          <Card key={c.id} accent={status.color}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{c.name}</div>
              <Badge color={status.color}>{status.label}</Badge>
            </div>
            <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>{c.type&&`${c.type} · `}{c.address&&`📍 ${c.address}`}</div>
            {c.phone && <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>📞 {c.phone}</div>}
            <div style={{ display:"flex", gap:16, margin:"8px 0" }}>
              {c.last_order_amount && <div style={{ fontSize:12 }}><span style={{ color:T.textDim }}>Cmd: </span><span style={{ color:T.text }}>{c.last_order_amount} DT</span></div>}
              {proj && <div style={{ fontSize:12 }}><span style={{ color:T.textDim }}>Commission: </span><span style={{ color:T.gold, fontWeight:700 }}>{proj} DT</span></div>}
            </div>
            {c.last_order_date && <div style={{ fontSize:11, color:T.textDim, marginBottom:6 }}>Dernière commande: {new Date(c.last_order_date).toLocaleDateString("fr-FR")}</div>}
            {c.notes && <div style={{ fontSize:12, color:T.textSub, fontStyle:"italic", marginBottom:8 }}>"{c.notes}"</div>}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Btn size="sm" variant="success" onClick={()=>onReorder(c)}>✓ Nouvelle commande</Btn>
              <Btn size="sm" variant="ghost"   onClick={()=>startEdit(c)}>✎</Btn>
              <Btn size="sm" variant="danger"  onClick={()=>onDelete(c.id)}>✕</Btn>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
