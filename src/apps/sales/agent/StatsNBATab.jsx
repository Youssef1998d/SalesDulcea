import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { SectionTitle, FinBlock, EmptyState, NBACard, Btn, Sparkline } from "../../../components/ui";
import { fmtS, exportCSV } from "../../../core/utils";

const PERIODS = ["Aujourd'hui", "Cette semaine", "Tout"];

export function StatsTab({ visits, sold, convRate, tGross, tInv, tBoxes, todayVisits, todaySales, products }) {
  const T      = useTheme();
  const [period, setPeriod] = useState("Tout");

  // Build 7-day visit sparkline
  const now  = new Date();
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
  const sparkData = days7.map(ds => visits.filter(v => new Date(v.ts).toDateString() === ds).length);

  // Per-period filter
  const filteredVisits = visits.filter(v => {
    if (period === "Aujourd'hui") return new Date(v.ts).toDateString() === now.toDateString();
    if (period === "Cette semaine") {
      const d = new Date(v.ts);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return d >= weekStart;
    }
    return true;
  });
  const filteredSold = filteredVisits.filter(v => v.outcome === "Vendu");
  const filteredRate = filteredVisits.length ? Math.round(filteredSold.length / filteredVisits.length * 100) : 0;

  // Best hour
  const hourCounts = {};
  visits.forEach(v => { hourCounts[v.hour] = (hourCounts[v.hour] || 0) + 1; });
  const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Best zone
  const zoneCounts = {};
  sold.forEach(v => { if (v.zone) zoneCounts[v.zone] = (zoneCounts[v.zone] || 0) + 1; });
  const bestZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Best contact
  const contactCounts = {};
  sold.forEach(v => { if (v.contact) contactCounts[v.contact] = (contactCounts[v.contact] || 0) + 1; });
  const bestContact = Object.entries(contactCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div>
      {/* Today's hero numbers */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 12, marginBottom: 20,
      }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.accent}`,
          borderRadius: 14, padding: "18px 16px",
          boxShadow: T.shadow,
        }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, color: T.accent, lineHeight: 1, letterSpacing: 1 }}>
            {todayVisits}
          </div>
          <div style={{ fontSize: 11, color: T.textSub, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
            Visites aujourd'hui
          </div>
        </div>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.success}`,
          borderRadius: 14, padding: "18px 16px",
          boxShadow: T.shadow,
        }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, color: T.success, lineHeight: 1, letterSpacing: 1 }}>
            {todaySales}
          </div>
          <div style={{ fontSize: 11, color: T.textSub, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
            Ventes aujourd'hui
          </div>
        </div>
      </div>

      {/* 7-day sparkline */}
      {sparkData.some(v => v > 0) && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "14px 16px", marginBottom: 16,
          boxShadow: T.shadow,
        }}>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            7 derniers jours
          </div>
          <Sparkline data={sparkData} color={T.accent} height={48} width={300} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d, i) => (
              <div key={i} style={{ fontSize: 9, color: T.textDim, textAlign: "center", flex: 1 }}>{d}</div>
            ))}
          </div>
        </div>
      )}

      {/* Insight chips */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { icon: "⏰", label: "Meilleure heure", value: bestHour !== undefined ? `${bestHour}h` : "—" },
          { icon: "🤝", label: "Meilleur contact", value: bestContact || "—" },
          { icon: "📍", label: "Meilleure zone",   value: bestZone || "—" },
        ].map(chip => (
          <div key={chip.label} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "10px 10px",
            textAlign: "center", boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{chip.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{chip.value}</div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
              {chip.label}
            </div>
          </div>
        ))}
      </div>

      {/* Period filter */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 7 }}>
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${period === p ? T.accent : T.border}`,
                background: period === p ? T.accent + "22" : "transparent",
                color: period === p ? T.accent : T.textSub,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Financial summary */}
      <SectionTitle>Financier · {period}</SectionTitle>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: "16px", marginBottom: 16,
        boxShadow: T.shadow,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            ["Visites", filteredVisits.length, T.text],
            ["Ventes",  filteredSold.length,   T.success],
            [`${filteredRate}%`, "Conv.", T.accent],
          ].map(([v, l, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: c, letterSpacing: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
            </div>
          ))}
        </div>
        <FinBlock
          gross={period === "Tout" ? tGross : filteredSold.reduce((s, v) => { let g = 0; (v.lines || []).forEach(l => { const p = products.find(p => p.id === l.productId); if (p) g += p.price * 12 * Number(l.boxes || 0); }); return s + g; }, 0)}
          inv={period === "Tout" ? tInv : 0}
          net={period === "Tout" ? tGross - tInv : 0}
        />
      </div>

      {visits.length > 0 && (
        <Btn style={{ width: "100%" }} variant="ghost" onClick={() => exportCSV(visits, products)}>
          ⬇ Exporter CSV
        </Btn>
      )}
    </div>
  );
}

export function NBATab({ total, urgentClients, followups, convRate, tInv, tGross, fmtS: fmtSProp }) {
  const T  = useTheme();
  const fs = fmtSProp || fmtS;
  return (
    <div>
      <SectionTitle>Prochaine action</SectionTitle>
      {total === 0 && (
        <EmptyState icon="🗺️" title="Commencez à logger" sub="Vos recommandations personnalisées apparaîtront ici" />
      )}
      {urgentClients.length > 0 && (
        <NBACard icon="🔴" title="Clients à recontacter" text={`${urgentClients.map(c => c.name).join(", ")} — commande attendue bientôt.`} />
      )}
      {followups.length > 0 && (
        <NBACard icon="🔁" title="Relancer vos prospects" text={`${followups.length} prospect(s) en attente. Ne laissez pas refroidir l'intérêt.`} />
      )}
      {convRate < 30 && total >= 5 && (
        <NBACard icon="💡" title="Améliorer la conversion" text={`Taux à ${convRate}%. Proposez un pot d'essai pour lever les freins.`} />
      )}
      {convRate >= 50 && total >= 5 && (
        <NBACard icon="🚀" title="Vous êtes en forme !" text={`${convRate}% de conversion — augmentez votre volume de visites.`} />
      )}
      {tInv > 0 && tGross > 0 && (
        <NBACard icon="🎁" title="Retour sur échantillons" text={`${fs(tInv / tGross * 100)}% du CA brut en échantillons. ${tInv / tGross > 0.1 ? "Surveillez ce ratio." : "Excellent ratio ✓"}`} />
      )}
    </div>
  );
}
