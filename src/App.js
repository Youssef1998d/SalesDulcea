import { useState, useEffect } from "react";

const PRODUCTS = [
  { id: "frappe_cafe", name: "Frappé Café", price: 20, unit: "0.9kg" },
  { id: "frappe_neutre", name: "Frappé Neutre", price: 15, unit: "0.9kg" },
  { id: "icetea", name: "Ice Tea", price: 19, unit: "1L" },
  { id: "chicoree", name: "Chicorée Café", price: 9.96, unit: "300g" },
  { id: "choco", name: "Chocolat Chaud", price: 11.9, unit: "1kg" },
];

const OUTCOMES = ["Vendu", "Intéressé", "Revenir", "Refus"];
const CONTACTS = ["Propriétaire", "Manager", "Employé"];
const OUTCOME_COLOR = {
  Vendu: "#4ade80", Intéressé: "#facc15", Revenir: "#60a5fa", Refus: "#f87171",
};

const STORAGE_KEY = "dulcea_visits_v2";

function loadVisits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveVisits(visits) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visits)); } catch {}
}

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

export default function App() {
  const [tab, setTab] = useState("log");
  const [visits, setVisits] = useState(() => loadVisits());

  const [form, setForm] = useState({
    business: "", zone: "", contact: CONTACTS[0],
    lines: [emptyLine()], outcome: OUTCOMES[0], note: ""
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => { saveVisits(visits); }, [visits]);

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function updateLine(id, key, val) {
    setForm(f => ({ ...f, lines: f.lines.map(l => l.id === id ? { ...l, [key]: val } : l) }));
  }
  function addLine() { setForm(f => ({ ...f, lines: [...f.lines, emptyLine()] })); }
  function removeLine(id) {
    setForm(f => ({ ...f, lines: f.lines.length > 1 ? f.lines.filter(l => l.id !== id) : f.lines }));
  }

  function logVisit() {
    if (!form.business.trim()) return;
    const v = { ...form, id: Date.now(), ts: new Date().toISOString(), hour: new Date().getHours() };
    setVisits(prev => [v, ...prev]);
    setForm({ business: "", zone: "", contact: CONTACTS[0], lines: [emptyLine()], outcome: OUTCOMES[0], note: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function convert(id) {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, outcome: "Vendu" } : v));
  }
  function deleteVisit(id) {
    setVisits(prev => prev.filter(v => v.id !== id));
  }

  // Stats
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

  const today = new Date().toDateString();
  const todayVisits = visits.filter(v => new Date(v.ts).toDateString() === today).length;
  const todaySales = sold.filter(v => new Date(v.ts).toDateString() === today).length;

  const formFinancials = calcVisitFinancials(form.lines);

  const tabs = [
    { id: "log", label: "📋 Log" },
    { id: "followup", label: `🔁 (${followups.length})` },
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
            <button style={{ ...S.btn, ...(saved ? S.btnSaved : {}) }} onClick={logVisit}>
              {saved ? "✓ Enregistré !" : "Enregistrer la visite"}
            </button>

            {visits.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={S.sectionTitle}>Visites récentes</div>
                {visits.slice(0, 5).map(v => (
                  <VisitCard key={v.id} v={v} onDelete={() => deleteVisit(v.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "followup" && (
          <div>
            <div style={S.sectionTitle}>À relancer ({followups.length})</div>
            {followups.length === 0 && <div style={S.empty}>Aucune relance en attente 🎉</div>}
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
                  <button style={S.btnSm} onClick={() => convert(v.id)}>✓ Vendu</button>
                  <button style={{ ...S.btnSm, background: "#333" }} onClick={() => deleteVisit(v.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "dash" && (
          <div>
            <div style={S.grid2}>
              <StatBox label="Visites totales" value={total} />
              <StatBox label="Ventes" value={sold.length} />
              <StatBox label="Taux conv." value={`${convRate}%`} accent />
              <StatBox label="Boxes vendues" value={totalBoxes} />
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
          </div>
        )}

        {tab === "nba" && (
          <div>
            <div style={S.sectionTitle}>Prochaine meilleure action</div>
            {total === 0 && <div style={S.empty}>Commencez à logger vos visites pour obtenir des recommandations.</div>}
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
                text={`Taux à ${convRate}%. Proposez un pot d'essai gratuit pour lever les freins — votre investissement sera rentabilisé à la prochaine visite.`} />
            )}
            {convRate >= 50 && total >= 5 && (
              <NBACard icon="🚀" title="Vous êtes en forme !"
                text={`${convRate}% de conversion — excellent ! Augmentez votre volume de visites quotidiennes pour maximiser le CA net.`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

const S = {
  app: { fontFamily: "'Georgia', serif", background: "#1a1208", minHeight: "100vh", color: "#f0e6d0", maxWidth: 480, margin: "0 auto" },
  header: { background: "linear-gradient(135deg, #2d1f0a, #1a1208)", padding: "18px 20px 12px", borderBottom: "1px solid #3d2e14", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 22, fontWeight: 700, color: "#e8d5b0", letterSpacing: 1 },
  sub: { fontSize: 12, color: "#8a7a60", marginLeft: 10 },
  exportBtn: { background: "none", border: "1px solid #c8a96e", color: "#c8a96e", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  tabs: { display: "flex", background: "#231808", borderBottom: "1px solid #3d2e14" },
  tab: { flex: 1, padding: "10px 4px", fontSize: 12, background: "none", border: "none", color: "#8a7a60", cursor: "pointer" },
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
  cardActions: { display: "flex", gap: 8, marginTop: 8 },
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
};
