import { useTheme } from "../../../core/theme";
import { SectionTitle, EmptyState, KPICard, HBar, Badge } from "../../../components/ui";
import { fmtS } from "../../../core/utils";
import { useIsMobile } from "../../../hooks/useIsMobile";

export function OverviewTab({ agents, allVisits, allClients, allSales }) {
  const T      = useTheme();
  const mobile = useIsMobile();
  const active = agents.filter(a => a.status === "active" && a.role === "agent");

  const totalGMV    = allSales.reduce((a, s) => a + Number(s.gross_amount || 0), 0);
  const totalComm   = allSales.reduce((a, s) => a + Number(s.commission_earned || 0), 0);
  const soldCount   = allVisits.filter(v => v.outcome === "Vendu").length;
  const totalVisits = allVisits.length;
  const avgConv     = totalVisits ? Math.round(soldCount / totalVisits * 100) : 0;

  function agentStats(id) {
    const v     = allVisits.filter(v => v.agent_id === id);
    const s     = v.filter(v => v.outcome === "Vendu");
    const sales = allSales.filter(s => s.agent_id === id);
    const gmv   = sales.reduce((a, s) => a + Number(s.gross_amount || 0), 0);
    return {
      visits: v.length, sold: s.length,
      clients: allClients.filter(c => c.agent_id === id).length,
      gmv, conv: v.length ? Math.round(s.length / v.length * 100) : 0,
    };
  }

  const agentRows = active.map(a => ({ ...a, stats: agentStats(a.id) }))
    .sort((a, b) => b.stats.gmv - a.stats.gmv);
  const maxGMV = agentRows.length > 0 ? agentRows[0].stats.gmv : 1;

  // Top products
  const productRevenue = {};
  allSales.forEach(s => {
    if (!s.product_name) return;
    productRevenue[s.product_name] = (productRevenue[s.product_name] || 0) + Number(s.gross_amount || 0);
  });
  const topProducts = Object.entries(productRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxProd = topProducts.length > 0 ? topProducts[0][1] : 1;

  return (
    <div>
      {/* KPI Strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: 12, marginBottom: 28,
      }}>
        <KPICard value={`${fmtS(totalGMV)} DT`} label="GMV Total"      accent icon="dollar-sign" />
        <KPICard value={active.length}            label="Agents actifs"        icon="users" />
        <KPICard value={`${avgConv}%`}            label="Conv. moyenne" accent icon="trending-up" />
        <KPICard value={`${fmtS(totalComm)} DT`}  label="Commissions"          icon="award" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "3fr 2fr", gap: 20 }}>
        {/* Agent performance table */}
        <div>
          <SectionTitle>Performance agents</SectionTitle>
          {agentRows.length === 0 && <EmptyState icon="🌊" title="Aucun agent actif" />}
          {agentRows.map(a => (
            <div
              key={a.id}
              style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: "14px 16px", marginBottom: 8,
                boxShadow: T.shadow,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{a.full_name}</div>
                <Badge color={a.stats.conv >= 50 ? T.success : a.stats.conv >= 30 ? T.warning : T.danger}>
                  {a.stats.conv}% conv.
                </Badge>
              </div>

              {/* GMV bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <HBar value={a.stats.gmv} max={maxGMV} color={T.accent} />
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: T.gold, minWidth: 70, textAlign: "right" }}>
                  {fmtS(a.stats.gmv)} DT
                </div>
              </div>

              {/* Mini stats */}
              <div style={{ display: "flex", gap: 16 }}>
                {[["Visites", a.stats.visits], ["Ventes", a.stats.sold], ["Clients", a.stats.clients]].map(([l, v]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: T.text }}>{v}</div>
                    <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Top products */}
        <div>
          <SectionTitle>Top produits</SectionTitle>
          {topProducts.length === 0 && <EmptyState icon="📦" title="Aucune vente" />}
          {topProducts.map(([name, rev]) => (
            <div key={name} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "12px 14px", marginBottom: 8,
              boxShadow: T.shadow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div>
                <div style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{fmtS(rev)} DT</div>
              </div>
              <HBar value={rev} max={maxProd} color={T.gold} />
            </div>
          ))}

          {/* Commissions total */}
          <div style={{
            background: T.surfaceHi, border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${T.gold}`,
            borderRadius: 12, padding: "14px 16px", marginTop: 16,
          }}>
            <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              Commissions agents totales
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: T.gold }}>
              {fmtS(totalComm)} DT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
