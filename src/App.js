import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://fztfqkwphcqtowlpqauy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGZxa3dwaGNxdG93bHBxYXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTk2ODMsImV4cCI6MjA5NjQ3NTY4M30.6Ik8_iZovHznLbR5VDSdpdsR4TE2To3i2w4ljv1Ax5w";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Constants ───────────────────────────────────────────────────────────────
const AGENT_ID = "youssef_friend_v1";

const PRODUCTS = [
  { id: "frappe_cafe", name: "Frappé Café", price: 20, unit: "0.9kg" },
  { id: "frappe_neutre", name: "Frappé Neutre", price: 15, unit: "0.9kg" },
  { id: "icetea", name: "Ice Tea", price: 19, unit: "1L" },
  { id: "chicoree", name: "Chicorée Café", price: 9.96, unit: "300g" },
  { id: "choco", name: "Chocolat Chaud", price: 11.9, unit: "1kg" },
];

const OUTCOMES = ["Vendu", "Intéressé", "Revenir", "Refus"];
const CONTACTS = ["Propriétaire", "Manager", "Employé"];
const CLIENT_TYPES = ["Café", "Restaurant", "Hôtel", "Grossiste", "Autre"];

const OUTCOME_COLOR = {
  Vendu: "#4ade80",
  Intéressé: "#facc15",
  Revenir: "#60a5fa",
  Refus: "#f87171",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n) { return Number(n).toFixed(3); }
function fmtShort(n) { return Number(n).toFixed(2); }
function emptyLine() {
  return { id: Date.now() + Math.random(), productId: PRODUCTS[0].id, boxes: 1, freePots: 0 };
}
function calcVisitFinancials(lines) {
  let gross = 0, investment = 0;
  (lines || []).forEach(l => {
    const p = PRODUCTS.find(p => p.id === l.productId);
    if (!p) return;
    gross += p.price * 12 * Number(l.boxes || 0);
    investment += p.price * Number(l.freePots || 0);
  });
  return { gross, investment, net: gross - investment };
}

function getDaysUntilReorder(lastOrderDate, cycleDays) {
  if (!lastOrderDate) return null;
  const last = new Date(lastOrderDate);
  const nextOrder = new Date(last.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  const today = new Date();
  return Math.ceil((nextOrder - today) / (1000 * 60 * 60 * 24));
}

function getReorderStatus(days) {
  if (days === null) return { label: "Pas encore commandé", color: "#8a7a60" };
  if (days < 0) return { label: `En retard de ${Math.abs(days)}j`, color: "#f87171" };
  if (days <= 5) return { label: `Recommander dans ${days}j`, color: "#facc15" };
  if (days <= 14) return { label: `Dans ${days}j`, color: "#60a5fa" };
  return { label: `Dans ${days}j`, color: "#4ade80" };
}

function exportCSV(visits) {
  const rows = [
    ["Date", "Heure", "Café", "Zone", "Contact", "Produits", "Boxes", "Pots offerts", "Brut (DT)", "Investissement (DT)", "Net (DT)", "Résultat", "Note"]
  ];
  visits.forEach(v => {
    const fin = calcVisitFinancials(v.lines);
    const prodNames = (v.lines || []).map(l => PRODUCTS.find(p => p.id === l.productId)?.name || "").join(" | ");
    const totalBoxes = (v.lines || []).reduce((s, l) => s + Number(l.boxes || 0), 0);
    const totalFree = (v.lines || []).reduce((s, l) => s + Number(l.freePots || 0), 0);
    const d = new Date(v.ts);
    rows.push([
      d.toLocaleDateString("fr-FR"),
      `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`,
      v.business, v.zone || "", v.contact,
      prodNames, totalBoxes, totalFree,
      fmt(fin.gross), fmt(fin.investment), fmt(fin.net),
      v.outcome, v.note || ""
    ]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dulcea_ventes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("log");

  // ── Visits state (Supabase) ──
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [form, setForm] = useState({
    business: "", zone: "", contact: CONTACTS[0],
    lines: [emptyLine()], outcome: OUTCOMES[0], note: ""
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Clients state (Supabase) ──
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "", type: CLIENT_TYPES[0], phone: "",
    address: "", first_order_date: "", last_order_date: "",
    last_order_amount: "", reorder_cycle_days: 35,
    commission_rate: 8, notes: ""
  });
  const [clientSaving, setClientSaving] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // ── Load visits from Supabase ──
  const loadVisits = useCallback(async () => {
    setVisitsLoading(true);
    try {
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .eq("agent_id", AGENT_ID)
        .order("ts", { ascending: false });
      if (error) throw error;
      setVisits(data || []);
    } catch (e) {
      console.error("Error loading visits:", e);
    } finally {
      setVisitsLoading(false);
    }
  }, []);

  // ── Load clients from Supabase ──
  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("agent_id", AGENT_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (e) {
      console.error("Error loading clients:", e);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => { loadVisits(); loadClients(); }, [loadVisits, loadClients]);

  // ── Visit form handlers ──
  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function updateLine(id, key, val) {
    setForm(f => ({ ...f, lines: f.lines.map(l => l.id === id ? { ...l, [key]: val } : l) }));
  }
  function addLine() { setForm(f => ({ ...f, lines: [...f.lines, emptyLine()] })); }
  function removeLine(id) {
    setForm(f => ({ ...f, lines: f.lines.length > 1 ? f.lines.filter(l => l.id !== id) : f.lines }));
  }

  async function logVisit() {
    if (!form.business.trim()) return;
    setSaving(true);
    const now = new Date();
    const payload = {
      id: Date.now(),
      agent_id: AGENT_ID,
      ts: now.toISOString(),
      hour: now.getHours(),
      business: form.business.trim(),
      zone: form.zone,
      contact: form.contact,
      lines: form.lines.map(l => ({ productId: l.productId, boxes: Number(l.boxes), freePots: Number(l.freePots) })),
      outcome: form.outcome,
      note: form.note,
    };
    try {
      const { error } = await supabase.from("visits").insert([payload]);
      if (error) throw error;
      await loadVisits();
      setForm({ business: "", zone: "", contact: CONTACTS[0], lines: [emptyLine()], outcome: OUTCOMES[0], note: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      alert("Erreur lors de l'enregistrement: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function convertVisit(id) {
    await supabase.from("visits").update({ outcome: "Vendu" }).eq("id", id);
    await loadVisits();
  }

  async function deleteVisit(id) {
    await supabase.from("visits").delete().eq("id", id);
    await loadVisits();
  }

  // ── Client form handlers ──
  function setCF(k, v) { setClientForm(f => ({ ...f, [k]: v })); }

  async function saveClient() {
    if (!clientForm.name.trim()) return;
    setClientSaving(true);
    try {
      const payload = {
        agent_id: AGENT_ID,
        name: clientForm.name.trim(),
        type: clientForm.type,
        phone: clientForm.phone,
        address: clientForm.address,
        first_order_date: clientForm.first_order_date || null,
        last_order_date: clientForm.last_order_date || null,
        last_order_amount: clientForm.last_order_amount ? Number(clientForm.last_order_amount) : null,
        reorder_cycle_days: Number(clientForm.reorder_cycle_days) || 35,
        commission_rate: Number(clientForm.commission_rate) || 8,
        notes: clientForm.notes,
      };
      if (editingClient) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editingClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert([payload]);
        if (error) throw error;
      }
      setClientForm({
        name: "", type: CLIENT_TYPES[0], phone: "",
        address: "", first_order_date: "", last_order_date: "",
        last_order_amount: "", reorder_cycle_days: 35,
        commission_rate: 8, notes: ""
      });
      setShowAddClient(false);
      setEditingClient(null);
      await loadClients();
    } catch (e) {
      alert("Erreur lors de la sauvegarde: " + e.message);
    } finally {
      setClientSaving(false);
    }
  }

  async function deleteClient(id) {
    if (!window.confirm("Supprimer ce client ?")) return;
    await supabase.from("clients").delete().eq("id", id);
    await loadClients();
  }

  async function recordReorder(client) {
    const today = new Date().toISOString().slice(0, 10);
    const amount = window.prompt(`Montant de la commande (DT) pour ${client.name} ?`);
    if (!amount) return;
    await supabase.from("clients").update({
      last_order_date: today,
      last_order_amount: Number(amount),
    }).eq("id", client.id);
    await loadClients();
  }

  function startEditClient(client) {
    setClientForm({
      name: client.name,
      type: client.type || CLIENT_TYPES[0],
      phone: client.phone || "",
      address: client.address || "",
      first_order_date: client.first_order_date || "",
      last_order_date: client.last_order_date || "",
      last_order_amount: client.last_order_amount || "",
      reorder_cycle_days: client.reorder_cycle_days || 35,
      commission_rate: client.commission_rate || 8,
      notes: client.notes || "",
    });
    setEditingClient(client);
    setShowAddClient(true);
  }

  // ── Stats ──
  const sold = visits.filter(v => v.outcome === "Vendu");
  const followups = visits.filter(v => v.outcome === "Intéressé" || v.outcome === "Revenir");
  const total = visits.length;
  const convRate = total ? Math.round((sold.length / total) * 100) : 0;
  let totalGross = 0, totalInvestment = 0, totalBoxes = 0;
  sold.forEach(v => {
    const f = calcVisitFinancials(v.lines);
    totalGross += f.gross;
    totalInvestment += f.investment;
    (v.lines || []).forEach(l => { totalBoxes += Number(l.boxes || 0); });
  });
  visits.filter(v => v.outcome !== "Vendu").forEach(v => {
    totalInvestment += calcVisitFinancials(v.lines).investment;
  });
  const totalNet = totalGross - totalInvestment;

  const prodBoxes = {};
  sold.forEach(v => (v.lines || []).forEach(l => {
    prodBoxes[l.productId] = (prodBoxes[l.productId] || 0) + Number(l.boxes || 0);
  }));
  const bestProd = Object.entries(prodBoxes).sort((a, b) => b[1] - a[1])[0];
  const bestProdName = bestProd ? PRODUCTS.find(p => p.id === bestProd[0])?.name : null;
  const contactCount = {};
  sold.forEach(v => { contactCount[v.contact] = (contactCount[v.contact] || 0) + 1; });
  const bestContact = Object.entries(contactCount).sort((a, b) => b[1] - a[1])[0];
  const hourCount = {};
  sold.forEach(v => { const slot = `${v.hour}h-${v.hour + 1}h`; hourCount[slot] = (hourCount[slot] || 0) + 1; });
  const bestHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
  const zoneFollowups = {};
  followups.forEach(v => { if (v.zone) zoneFollowups[v.zone] = (zoneFollowups[v.zone] || 0) + 1; });
  const bestZone = Object.entries(zoneFollowups).sort((a, b) => b[1] - a[1])[0];
  const todayStr = new Date().toDateString();
  const todayVisits = visits.filter(v => new Date(v.ts).toDateString() === todayStr).length;
  const todaySales = sold.filter(v => new Date(v.ts).toDateString() === todayStr).length;
  const formFinancials = calcVisitFinancials(form.lines);

  // ── Client stats ──
  const urgentClients = clients.filter(c => {
    const days = getDaysUntilReorder(c.last_order_date, c.reorder_cycle_days);
    return days !== null && days <= 5;
  });
  const totalProjectedCommission = clients.reduce((sum, c) => {
    if (!c.last_order_amount || !c.commission_rate) return sum;
    return sum + (c.last_order_amount * c.commission_rate / 100);
  }, 0);

  const tabs = [
    { id: "log", label: "📋 Log" },
    { id: "followup", label: `🔁 (${followups.length})` },
    { id: "clients", label: `👥 Clients${urgentClients.length > 0 ? " 🔴" : ""}` },
    { id: "dash", label: "📊 Stats" },
    { id: "nba", label: "🎯 Action" },
  ];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div>
          <span style={S.logo}>Dulcéa</span>
          <span style={S.sub}>Sales Tracker</span>
        </div>
        {visits.length > 0 && (
          <button style={S.exportBtn} onClick={() => exportCSV(visits)}>⬇ CSV</button>
        )}
      </div>

      <div style={S.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={S.body}>

        {/* ── LOG TAB ── */}
        {tab === "log" && (
          <div>
            <Row label="Café / Shop">
              <input style={S.input} placeholder="Nom du café" value={form.business}
                onChange={e => setF("business", e.target.value)} />
            </Row>
            <Row label="Zone">
              <input style={S.input} placeholder="Ex: Centre-ville, Lac..." value={form.zone}
                onChange={e => setF("zone", e.target.value)} />
            </Row>
            <Row label="Contact">
              <div style={S.pills}>
                {CONTACTS.map(c => (
                  <button key={c} style={{ ...S.pill, ...(form.contact === c ? S.pillActive : {}) }}
                    onClick={() => setF("contact", c)}>{c}</button>
                ))}
              </div>
            </Row>
            <div style={S.label}>Produits</div>
            {form.lines.map(line => (
              <div key={line.id} style={S.lineBox}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                  <select style={{ ...S.select, flex: 1 }} value={line.productId}
                    onChange={e => updateLine(line.id, "productId", e.target.value)}>
                    {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {form.lines.length > 1 && (
                    <button style={S.removeBtn} onClick={() => removeLine(line.id)}>✕</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={S.microLabel}>Boxes vendues</div>
                    <input style={S.inputSm} type="number" min="0" value={line.boxes}
                      onChange={e => updateLine(line.id, "boxes", e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.microLabel}>Pots offerts 🎁</div>
                    <input style={S.inputSm} type="number" min="0" value={line.freePots}
                      onChange={e => updateLine(line.id, "freePots", e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.microLabel}>Valeur</div>
                    <div style={S.lineVal}>
                      {fmt((PRODUCTS.find(p => p.id === line.productId)?.price || 0) * 12 * Number(line.boxes || 0))} DT
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button style={S.addLineBtn} onClick={addLine}>+ Ajouter un produit</button>
            {(formFinancials.gross > 0 || formFinancials.investment > 0) && (
              <div style={S.previewBox}>
                <FinRow label="Brut" value={`${fmt(formFinancials.gross)} DT`} />
                <FinRow label="Investissement" value={`- ${fmt(formFinancials.investment)} DT`} color="#f87171" />
                <FinRow label="Net" value={`${fmt(formFinancials.net)} DT`} bold accent />
              </div>
            )}
            <Row label="Résultat">
              <div style={S.pills}>
                {OUTCOMES.map(o => (
                  <button key={o} style={{
                    ...S.pill,
                    ...(form.outcome === o ? { background: OUTCOME_COLOR[o], color: "#111", borderColor: OUTCOME_COLOR[o] } : {})
                  }} onClick={() => setF("outcome", o)}>{o}</button>
                ))}
              </div>
            </Row>
            <Row label="Note">
              <input style={S.input} placeholder="Optionnel..." value={form.note}
                onChange={e => setF("note", e.target.value)} />
            </Row>
            <button style={{ ...S.btn, ...(saved ? S.btnSaved : {}), opacity: saving ? 0.7 : 1 }}
              onClick={logVisit} disabled={saving}>
              {saving ? "Enregistrement..." : saved ? "✓ Enregistré !" : "Enregistrer la visite"}
            </button>

            {visitsLoading && <div style={S.empty}>Chargement des visites...</div>}
            {!visitsLoading && visits.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={S.sectionTitle}>Visites récentes</div>
                {visits.slice(0, 5).map(v => (
                  <VisitCard key={v.id} v={v} onDelete={() => deleteVisit(v.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FOLLOWUP TAB ── */}
        {tab === "followup" && (
          <div>
            <div style={S.sectionTitle}>À relancer ({followups.length})</div>
            {visitsLoading && <div style={S.empty}>Chargement...</div>}
            {!visitsLoading && followups.length === 0 && <div style={S.empty}>Aucune relance en attente 🎉</div>}
            {followups.map(v => (
              <div key={v.id} style={S.card}>
                <div style={S.cardTop}>
                  <span style={S.bizName}>{v.business}</span>
                  <span style={{ ...S.badge, background: OUTCOME_COLOR[v.outcome] }}>{v.outcome}</span>
                </div>
                <div style={S.cardMeta}>{v.zone && `📍 ${v.zone} · `}{v.contact}</div>
                <div style={S.cardMeta}>
                  {(v.lines || []).map(l => {
                    const p = PRODUCTS.find(p => p.id === l.productId);
                    return p ? `${p.name}${Number(l.freePots) > 0 ? ` (+${l.freePots}🎁)` : ""}` : "";
                  }).filter(Boolean).join(" · ")}
                </div>
                {v.note && <div style={S.note}>"{v.note}"</div>}
                <div style={S.cardMeta}>{new Date(v.ts).toLocaleDateString("fr-FR")}</div>
                <div style={S.cardActions}>
                  <button style={S.btnSm} onClick={() => convertVisit(v.id)}>✓ Vendu</button>
                  <button style={{ ...S.btnSm, background: "#333" }} onClick={() => deleteVisit(v.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CLIENTS TAB ── */}
        {tab === "clients" && (
          <div>
            <div style={S.grid2}>
              <StatBox label="Clients actifs" value={clients.length} />
              <StatBox label="Commission / cycle" value={`${fmtShort(totalProjectedCommission)} DT`} accent />
            </div>
            {urgentClients.length > 0 && (
              <div style={S.urgentBanner}>
                🔴 {urgentClients.length} client(s) à recontacter cette semaine
              </div>
            )}
            <button style={{ ...S.btn, marginBottom: 16 }}
              onClick={() => { setEditingClient(null); setShowAddClient(s => !s); }}>
              {showAddClient ? "✕ Annuler" : "+ Nouveau client"}
            </button>
            {showAddClient && (
              <div style={S.clientFormBox}>
                <div style={S.sectionTitle}>{editingClient ? "Modifier le client" : "Nouveau client"}</div>
                <Row label="Nom du client *">
                  <input style={S.input} placeholder="Café El Amal..." value={clientForm.name}
                    onChange={e => setCF("name", e.target.value)} />
                </Row>
                <Row label="Type">
                  <div style={S.pills}>
                    {CLIENT_TYPES.map(t => (
                      <button key={t} style={{ ...S.pill, ...(clientForm.type === t ? S.pillActive : {}) }}
                        onClick={() => setCF("type", t)}>{t}</button>
                    ))}
                  </div>
                </Row>
                <Row label="Téléphone">
                  <input style={S.input} placeholder="+216 XX XXX XXX" value={clientForm.phone}
                    onChange={e => setCF("phone", e.target.value)} />
                </Row>
                <Row label="Adresse / Zone">
                  <input style={S.input} placeholder="Lac, Centre-ville..." value={clientForm.address}
                    onChange={e => setCF("address", e.target.value)} />
                </Row>
                <Row label="Date première commande">
                  <input style={S.input} type="date" value={clientForm.first_order_date}
                    onChange={e => setCF("first_order_date", e.target.value)} />
                </Row>
                <Row label="Date dernière commande">
                  <input style={S.input} type="date" value={clientForm.last_order_date}
                    onChange={e => setCF("last_order_date", e.target.value)} />
                </Row>
                <Row label="Montant dernière commande (DT)">
                  <input style={S.input} type="number" placeholder="Ex: 250" value={clientForm.last_order_amount}
                    onChange={e => setCF("last_order_amount", e.target.value)} />
                </Row>
                <Row label="Cycle réapprovisionnement (jours)">
                  <input style={S.input} type="number" value={clientForm.reorder_cycle_days}
                    onChange={e => setCF("reorder_cycle_days", e.target.value)} />
                  <div style={{ fontSize: 11, color: "#8a7a60", marginTop: 4 }}>Jours entre chaque commande (ex: 35)</div>
                </Row>
                <Row label="Taux commission (%)">
                  <input style={S.input} type="number" value={clientForm.commission_rate}
                    onChange={e => setCF("commission_rate", e.target.value)} />
                </Row>
                <Row label="Notes">
                  <input style={S.input} placeholder="Préférences, infos utiles..." value={clientForm.notes}
                    onChange={e => setCF("notes", e.target.value)} />
                </Row>
                <button style={{ ...S.btn, opacity: clientSaving ? 0.6 : 1 }}
                  onClick={saveClient} disabled={clientSaving}>
                  {clientSaving ? "Enregistrement..." : editingClient ? "Mettre à jour" : "Ajouter le client"}
                </button>
              </div>
            )}
            {clientsLoading && <div style={S.empty}>Chargement des clients...</div>}
            {!clientsLoading && clients.length === 0 && !showAddClient && (
              <div style={S.empty}>Aucun client encore. Ajoutez votre premier client ci-dessus.</div>
            )}
            {clients.map(c => {
              const daysLeft = getDaysUntilReorder(c.last_order_date, c.reorder_cycle_days);
              const status = getReorderStatus(daysLeft);
              const projectedCommission = c.last_order_amount && c.commission_rate
                ? (c.last_order_amount * c.commission_rate / 100).toFixed(2) : null;
              return (
                <div key={c.id} style={{ ...S.card, borderLeft: `3px solid ${status.color}` }}>
                  <div style={S.cardTop}>
                    <span style={S.bizName}>{c.name}</span>
                    <span style={{ ...S.badge, background: "#2d1f0a", color: status.color, border: `1px solid ${status.color}` }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={S.cardMeta}>{c.type && `${c.type} · `}{c.address && `📍 ${c.address}`}</div>
                  {c.phone && <div style={S.cardMeta}>📞 {c.phone}</div>}
                  <div style={{ display: "flex", gap: 16, marginTop: 6, marginBottom: 4 }}>
                    {c.last_order_amount && (
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: "#8a7a60" }}>Dernière cmd: </span>
                        <span style={{ color: "#e8d5b0" }}>{c.last_order_amount} DT</span>
                      </div>
                    )}
                    {projectedCommission && (
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: "#8a7a60" }}>Commission: </span>
                        <span style={{ color: "#c8a96e", fontWeight: 700 }}>{projectedCommission} DT</span>
                      </div>
                    )}
                  </div>
                  {c.last_order_date && (
                    <div style={S.cardMeta}>
                      Dernière commande: {new Date(c.last_order_date).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                  {c.notes && <div style={S.note}>"{c.notes}"</div>}
                  <div style={S.cardActions}>
                    <button style={S.btnSm} onClick={() => recordReorder(c)}>✓ Nouvelle commande</button>
                    <button style={{ ...S.btnSm, background: "#2d2a1a", color: "#c8a96e" }}
                      onClick={() => startEditClient(c)}>✎ Modifier</button>
                    <button style={{ ...S.btnSm, background: "#2d1a1a", color: "#f87171" }}
                      onClick={() => deleteClient(c.id)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DASH TAB ── */}
        {tab === "dash" && (
          <div>
            {visitsLoading ? <div style={S.empty}>Chargement...</div> : (
              <>
                <div style={S.grid2}>
                  <StatBox label="Visites totales" value={total} />
                  <StatBox label="Ventes" value={sold.length} />
                  <StatBox label="Taux conv." value={`${convRate}%`} accent />
                  <StatBox label="Boxes vendues" value={fmtShort(totalBoxes)} />
                </div>
                <div style={S.sectionTitle}>Financier</div>
                <div style={S.finBlock}>
                  <FinRow label="CA brut" value={`${fmt(totalGross)} DT`} />
                  <FinRow label="Investissement (échantillons)" value={`- ${fmt(totalInvestment)} DT`} color="#f87171" />
                  <FinRow label="Revenu net" value={`${fmt(totalNet)} DT`} bold accent />
                </div>
                <div style={S.sectionTitle}>Aujourd'hui</div>
                <div style={S.grid2}>
                  <StatBox label="Visites" value={todayVisits} />
                  <StatBox label="Ventes" value={todaySales} />
                </div>
                {bestProdName && <InfoLine icon="🏆" label="Meilleur produit" value={bestProdName} />}
                {bestContact && <InfoLine icon="🤝" label="Meilleur contact" value={bestContact[0]} />}
                {bestHour && <InfoLine icon="⏰" label="Meilleure heure" value={bestHour[0]} />}
                {bestZone && <InfoLine icon="📍" label="Zone + relances" value={`${bestZone[0]} (${bestZone[1]})`} />}
                {visits.length > 0 && (
                  <button style={{ ...S.btn, marginTop: 20 }} onClick={() => exportCSV(visits)}>
                    ⬇ Exporter en CSV
                  </button>
                )}
                {total === 0 && <div style={S.empty}>Enregistrez vos premières visites pour voir les stats.</div>}
              </>
            )}
          </div>
        )}

        {/* ── NBA TAB ── */}
        {tab === "nba" && (
          <div>
            <div style={S.sectionTitle}>Prochaine meilleure action</div>
            {total === 0 && <div style={S.empty}>Commencez à logger vos visites pour obtenir des recommandations.</div>}
            {urgentClients.length > 0 && (
              <NBACard icon="🔴" title="Clients à recontacter"
                text={`${urgentClients.map(c => c.name).join(", ")} — commande attendue bientôt. Appelez-les aujourd'hui.`} />
            )}
            {followups.length > 0 && (
              <NBACard icon="🔁" title="Priorité relance"
                text={`${followups.length} prospect(s) à relancer.${bestZone ? ` Zone "${bestZone[0]}" prioritaire (${bestZone[1]} relances).` : ""}`} />
            )}
            {bestProdName && (
              <NBACard icon="🛒" title="Pitcher en premier"
                text={`Commencez avec le ${bestProdName} — c'est votre meilleur produit en volume de boxes.`} />
            )}
            {bestContact && (
              <NBACard icon="🎯" title="Bon interlocuteur"
                text={`Vos meilleures ventes se font avec un(e) ${bestContact[0]}. Demandez à lui parler dès l'entrée.`} />
            )}
            {bestHour && (
              <NBACard icon="⏰" title="Meilleur créneau"
                text={`Vous closez le mieux entre ${bestHour[0]}. Planifiez vos visites à ce moment.`} />
            )}
            {totalInvestment > 0 && totalGross > 0 && (
              <NBACard icon="🎁" title="Retour sur échantillons"
                text={`Vous avez investi ${fmt(totalInvestment)} DT pour ${fmt(totalGross)} DT de CA brut — soit ${fmtShort((totalInvestment / totalGross) * 100)}% du brut. ${(totalInvestment / totalGross) > 0.1 ? "Surveillez ce ratio." : "Bon ratio ✓"}`} />
            )}
            {convRate < 30 && total >= 5 && (
              <NBACard icon="💡" title="Conseil conversion"
                text={`Taux à ${convRate}%. Proposez un pot d'essai gratuit pour lever les freins.`} />
            )}
            {convRate >= 50 && total >= 5 && (
              <NBACard icon="🚀" title="Vous êtes en forme !"
                text={`${convRate}% de conversion — excellent ! Augmentez votre volume de visites quotidiennes.`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Row({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={S.label}>{label}</div>
      {children}
    </div>
  );
}

function FinRow({ label, value, color, bold, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #2d1f0a", fontSize: 13 }}>
      <span style={{ color: "#8a7a60" }}>{label}</span>
      <span style={{ color: accent ? "#c8a96e" : (color || "#e8d5b0"), fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function VisitCard({ v, onDelete }) {
  const fin = calcVisitFinancials(v.lines);
  return (
    <div style={{ ...S.card, marginBottom: 8 }}>
      <div style={S.cardTop}>
        <span style={S.bizName}>{v.business}</span>
        <span style={{ ...S.badge, background: OUTCOME_COLOR[v.outcome] }}>{v.outcome}</span>
      </div>
      <div style={S.cardMeta}>{v.zone && `📍 ${v.zone} · `}{v.contact}</div>
      <div style={S.cardMeta}>
        {(v.lines || []).map(l => {
          const p = PRODUCTS.find(p => p.id === l.productId);
          return p ? `${p.name} ×${l.boxes}${Number(l.freePots) > 0 ? ` (+${l.freePots}🎁)` : ""}` : "";
        }).filter(Boolean).join(" · ")}
      </div>
      {fin.gross > 0 && (
        <div style={{ fontSize: 12, color: "#c8a96e", marginBottom: 4 }}>
          Brut: {fmt(fin.gross)} · Net: {fmt(fin.net)} DT
          {fin.investment > 0 && <span style={{ color: "#f87171" }}> · -{fmt(fin.investment)} DT</span>}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={S.cardMeta}>{new Date(v.ts).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
        <button style={{ ...S.btnSm, background: "#2a2a2a", fontSize: 11, padding: "3px 8px" }} onClick={onDelete}>✕</button>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div style={{ ...S.statBox, ...(accent ? S.statBoxAccent : {}) }}>
      <div style={S.statVal}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

function InfoLine({ icon, label, value }) {
  return (
    <div style={S.infoLine}>
      <span>{icon} {label}</span>
      <span style={{ color: "#e8d5b0", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function NBACard({ icon, title, text }) {
  return (
    <div style={S.nbaCard}>
      <div style={S.nbaIcon}>{icon}</div>
      <div>
        <div style={S.nbaTitle}>{title}</div>
        <div style={S.nbaText}>{text}</div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "'Georgia', serif", background: "#1a1208", minHeight: "100vh", color: "#f0e6d0", maxWidth: 480, margin: "0 auto" },
  header: { background: "linear-gradient(135deg, #2d1f0a, #1a1208)", padding: "18px 20px 12px", borderBottom: "1px solid #3d2e14", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 22, fontWeight: 700, color: "#e8d5b0", letterSpacing: 1 },
  sub: { fontSize: 12, color: "#8a7a60", marginLeft: 10 },
  exportBtn: { background: "none", border: "1px solid #c8a96e", color: "#c8a96e", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  tabs: { display: "flex", background: "#231808", borderBottom: "1px solid #3d2e14", overflowX: "auto" },
  tab: { flex: 1, padding: "10px 4px", fontSize: 11, background: "none", border: "none", color: "#8a7a60", cursor: "pointer", whiteSpace: "nowrap" },
  tabActive: { color: "#e8d5b0", borderBottom: "2px solid #c8a96e", background: "#2d1f0a" },
  body: { padding: "16px" },
  sectionTitle: { fontSize: 13, color: "#c8a96e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginTop: 16 },
  label: { fontSize: 12, color: "#8a7a60", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 },
  microLabel: { fontSize: 10, color: "#6a5a40", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { width: "100%", background: "#2d1f0a", border: "1px solid #3d2e14", borderRadius: 8, padding: "10px 12px", color: "#f0e6d0", fontSize: 14, boxSizing: "border-box", fontFamily: "Georgia, serif" },
  inputSm: { width: "100%", background: "#2d1f0a", border: "1px solid #3d2e14", borderRadius: 6, padding: "7px 10px", color: "#f0e6d0", fontSize: 14, boxSizing: "border-box", fontFamily: "Georgia, serif" },
  select: { background: "#2d1f0a", border: "1px solid #3d2e14", borderRadius: 8, padding: "10px 12px", color: "#f0e6d0", fontSize: 13, boxSizing: "border-box", fontFamily: "Georgia, serif" },
  lineBox: { background: "#231808", border: "1px solid #3d2e14", borderRadius: 10, padding: "12px", marginBottom: 8 },
  lineVal: { padding: "7px 0", fontSize: 13, color: "#c8a96e", fontWeight: 600 },
  removeBtn: { background: "#3d1a1a", border: "none", color: "#f87171", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 },
  addLineBtn: { width: "100%", padding: "9px", background: "none", border: "1px dashed #3d2e14", borderRadius: 8, color: "#8a7a60", cursor: "pointer", fontSize: 13, marginBottom: 12 },
  previewBox: { background: "#2d1f0a", border: "1px solid #3d2e14", borderRadius: 10, padding: "10px 14px", marginBottom: 14 },
  finBlock: { background: "#2d1f0a", border: "1px solid #3d2e14", borderRadius: 10, padding: "10px 14px", marginBottom: 16 },
  pills: { display: "flex", flexWrap: "wrap", gap: 6 },
  pill: { padding: "6px 12px", borderRadius: 20, border: "1px solid #3d2e14", background: "#2d1f0a", color: "#8a7a60", cursor: "pointer", fontSize: 12 },
  pillActive: { background: "#c8a96e", color: "#1a1208", borderColor: "#c8a96e" },
  btn: { width: "100%", padding: "13px", background: "#c8a96e", color: "#1a1208", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Georgia, serif" },
  btnSaved: { background: "#4ade80", color: "#111" },
  btnSm: { padding: "6px 12px", background: "#c8a96e", color: "#1a1208", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  card: { background: "#2d1f0a", border: "1px solid #3d2e14", borderRadius: 10, padding: "12px 14px", marginBottom: 10 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  bizName: { fontWeight: 700, fontSize: 15, color: "#e8d5b0" },
  badge: { fontSize: 11, padding: "2px 8px", borderRadius: 10, color: "#111", fontWeight: 600 },
  cardMeta: { fontSize: 12, color: "#8a7a60", marginBottom: 4 },
  cardActions: { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" },
  note: { fontSize: 12, color: "#c8a96e", fontStyle: "italic", marginBottom: 4 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 },
  statBox: { background: "#2d1f0a", border: "1px solid #3d2e14", borderRadius: 10, padding: "14px", textAlign: "center" },
  statBoxAccent: { background: "#3d2a08", borderColor: "#c8a96e" },
  statVal: { fontSize: 24, fontWeight: 700, color: "#e8d5b0" },
  statLabel: { fontSize: 11, color: "#8a7a60", marginTop: 2 },
  infoLine: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2d1f0a", fontSize: 13, color: "#8a7a60" },
  nbaCard: { display: "flex", gap: 14, background: "#2d1f0a", border: "1px solid #3d2e14", borderRadius: 12, padding: "14px", marginBottom: 12, alignItems: "flex-start" },
  nbaIcon: { fontSize: 24, minWidth: 32 },
  nbaTitle: { fontWeight: 700, color: "#e8d5b0", fontSize: 14, marginBottom: 4 },
  nbaText: { fontSize: 13, color: "#8a7a60", lineHeight: 1.5 },
  empty: { color: "#8a7a60", fontSize: 13, textAlign: "center", padding: "30px 0" },
  clientFormBox: { background: "#231808", border: "1px solid #3d2e14", borderRadius: 12, padding: "16px", marginBottom: 16 },
  urgentBanner: { background: "#3d1a0a", border: "1px solid #f87171", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#f87171" },
};