import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Badge, Btn, SectionTitle, EmptyState, SkeletonList, Input, Pills, Divider } from "../../../components/ui";
import { daysUntil, reorderStatus, fmtS } from "../../../core/utils";

const CLIENT_TYPES = ["Café", "Restaurant", "Hôtel", "Grossiste", "Autre"];

const emptyForm = {
  name: "", type: CLIENT_TYPES[0], phone: "", address: "",
  first_order_date: "", last_order_date: "", last_order_amount: "",
  reorder_cycle_days: 35, commission_rate: 8, notes: "",
};

export function ClientsTab({ clients, loading, onSave, onDelete, onReorder }) {
  const T = useTheme();
  const [showForm, setShowForm]   = useState(false);
  const [form,     setForm]       = useState(emptyForm);
  const [editId,   setEditId]     = useState(null);
  const [saving,   setSaving]     = useState(false);
  const [expanded, setExpanded]   = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function startEdit(c) {
    setForm({
      name: c.name, type: c.type || CLIENT_TYPES[0],
      phone: c.phone || "", address: c.address || "",
      first_order_date: c.first_order_date || "",
      last_order_date: c.last_order_date || "",
      last_order_amount: c.last_order_amount || "",
      reorder_cycle_days: c.reorder_cycle_days || 35,
      commission_rate: c.commission_rate || 8,
      notes: c.notes || "",
    });
    setEditId(c.id);
    setShowForm(true);
    setExpanded(null);
  }

  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        first_order_date:    form.first_order_date  || null,
        last_order_date:     form.last_order_date   || null,
        last_order_amount:   form.last_order_amount ? Number(form.last_order_amount) : null,
        reorder_cycle_days:  Number(form.reorder_cycle_days) || 35,
        commission_rate:     Number(form.commission_rate) || 8,
      }, editId);
      setForm(emptyForm); setEditId(null); setShowForm(false);
    } finally { setSaving(false); }
  }

  const totalComm = clients.reduce((s, c) =>
    !c.last_order_amount || !c.commission_rate ? s : s + (c.last_order_amount * c.commission_rate / 100), 0);

  // Sort by urgency
  const sorted = [...clients].sort((a, b) => {
    const da = daysUntil(a.last_order_date, a.reorder_cycle_days);
    const db = daysUntil(b.last_order_date, b.reorder_cycle_days);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });

  return (
    <div>
      {/* Sticky commission summary */}
      {clients.length > 0 && (
        <div style={{
          background: T.surfaceHi, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.gold}`,
          borderRadius: 12, padding: "12px 16px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
              Commission projetée / cycle
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: T.gold, letterSpacing: 1 }}>
              {fmtS(totalComm)} DT
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Clients actifs</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: T.text }}>{clients.length}</div>
          </div>
        </div>
      )}

      <Btn style={{ width: "100%", marginBottom: 16 }} onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(s => !s); }}>
        {showForm ? "✕ Annuler" : "+ Nouveau client"}
      </Btn>

      {showForm && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "18px 16px", marginBottom: 16,
          boxShadow: T.shadow,
        }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: T.gold, letterSpacing: 2, marginBottom: 16 }}>
            {editId ? "MODIFIER LE CLIENT" : "NOUVEAU CLIENT"}
          </div>
          <Input label="Nom *" value={form.name} onChange={v => setF("name", v)} placeholder="Café El Amal..." />
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Type</div>
            <Pills options={CLIENT_TYPES} value={form.type} onChange={v => setF("type", v)} />
          </div>
          <Input label="Téléphone"          value={form.phone}              onChange={v => setF("phone", v)}              placeholder="+216 XX XXX XXX" />
          <Input label="Zone / Adresse"     value={form.address}            onChange={v => setF("address", v)}            placeholder="Lac, Centre-ville..." />
          <Input label="Date première cmd"  value={form.first_order_date}   onChange={v => setF("first_order_date", v)}   type="date" />
          <Input label="Date dernière cmd"  value={form.last_order_date}    onChange={v => setF("last_order_date", v)}    type="date" />
          <Input label="Montant dernière cmd (DT)" value={form.last_order_amount} onChange={v => setF("last_order_amount", v)} placeholder="250" type="number" />
          <Input label="Cycle (jours)"      value={form.reorder_cycle_days} onChange={v => setF("reorder_cycle_days", v)} type="number" hint="Jours entre chaque commande (ex: 35)" />
          <Input label="Taux commission (%)" value={form.commission_rate}   onChange={v => setF("commission_rate", v)}    type="number" />
          <Input label="Notes"              value={form.notes}              onChange={v => setF("notes", v)}              placeholder="Infos utiles..." />
          <Btn style={{ width: "100%" }} onClick={submit} disabled={saving}>
            {saving ? "Enregistrement..." : editId ? "Mettre à jour" : "Ajouter le client"}
          </Btn>
        </div>
      )}

      {loading && <SkeletonList count={3} height={90} />}
      {!loading && clients.length === 0 && !showForm && (
        <EmptyState icon="🏪" title="Aucun client" sub="Ajoutez vos premiers clients pour suivre vos relances et commissions" action="+ Nouveau client" onAction={() => setShowForm(true)} />
      )}

      {sorted.map(c => {
        const days   = daysUntil(c.last_order_date, c.reorder_cycle_days);
        const status = reorderStatus(days, T);
        const proj   = c.last_order_amount && c.commission_rate
          ? (c.last_order_amount * c.commission_rate / 100).toFixed(2) : null;
        const isExpanded = expanded === c.id;

        return (
          <div
            key={c.id}
            className="eb-card"
            style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${status.color}`,
              borderRadius: 14, padding: "13px 15px", marginBottom: 9,
              boxShadow: T.shadow,
            }}
          >
            {/* Header row */}
            <div
              onClick={() => setExpanded(isExpanded ? null : c.id)}
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 3 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>
                  {c.type && `${c.type}`}{c.address && ` · 📍 ${c.address}`}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <Badge color={status.color}>{status.label}</Badge>
                {proj && (
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 700 }}>{proj} DT</div>
                )}
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      color: T.accent, fontSize: 14, fontWeight: 600,
                      textDecoration: "none", marginBottom: 10,
                    }}
                  >
                    📞 {c.phone}
                  </a>
                )}
                {c.last_order_date && (
                  <div style={{ fontSize: 12, color: T.textDim, marginBottom: 6 }}>
                    Dernière commande: {new Date(c.last_order_date).toLocaleDateString("fr-FR")}
                    {c.last_order_amount && ` · ${c.last_order_amount} DT`}
                  </div>
                )}
                {c.notes && (
                  <div style={{ fontSize: 12, color: T.textSub, fontStyle: "italic", marginBottom: 10 }}>
                    "{c.notes}"
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn size="sm" variant="success" onClick={() => onReorder(c)}>✓ Nouvelle commande</Btn>
                  <Btn size="sm" variant="ghost"   onClick={() => startEdit(c)}>✎ Modifier</Btn>
                  <Btn size="sm" variant="danger"  onClick={() => onDelete(c.id)}>Supprimer</Btn>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
