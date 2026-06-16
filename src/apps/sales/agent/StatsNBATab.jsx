import { useTheme } from "../../../core/theme";
import { StatGrid, SectionTitle, FinBlock, EmptyState, NBACard, Btn } from "../../../components/ui";
import { fmtS, exportCSV } from "../../../core/utils";

export function StatsTab({ visits, sold, convRate, tGross, tInv, tBoxes, todayVisits, todaySales, products }) {
  const T = useTheme();
  return (
    <div>
      <StatGrid stats={[
        { label:"Visites totales", value:visits.length },
        { label:"Ventes",          value:sold.length },
        { label:"Taux conv.",      value:`${convRate}%`, accent:true },
        { label:"Boxes vendues",   value:fmtS(tBoxes) },
      ]} />
      <SectionTitle>Financier</SectionTitle>
      <FinBlock gross={tGross} inv={tInv} net={tGross - tInv} />
      <SectionTitle>Aujourd'hui</SectionTitle>
      <StatGrid stats={[
        { label:"Visites", value:todayVisits },
        { label:"Ventes",  value:todaySales },
      ]} />
      {visits.length > 0 && (
        <Btn style={{ width:"100%", marginTop:8 }} variant="ghost" onClick={()=>exportCSV(visits, products)}>
          ⬇ Exporter CSV
        </Btn>
      )}
    </div>
  );
}

export function NBATab({ total, urgentClients, followups, convRate, tInv, tGross, fmtS: fmtSProp }) {
  const T = useTheme();
  const fs = fmtSProp || fmtS;
  return (
    <div>
      <SectionTitle>Prochaine action</SectionTitle>
      {total === 0 && <EmptyState icon="🗺️" title="Commencez à logger" sub="Vos recommandations apparaîtront ici" />}
      {urgentClients.length > 0 && <NBACard icon="🔴" title="Clients à recontacter" text={`${urgentClients.map(c=>c.name).join(", ")} — commande attendue bientôt.`} />}
      {followups.length > 0 && <NBACard icon="🔁" title="Relancer vos prospects" text={`${followups.length} prospect(s) en attente. Ne laissez pas refroidir l'intérêt.`} />}
      {convRate < 30 && total >= 5 && <NBACard icon="💡" title="Améliorer la conversion" text={`Taux à ${convRate}%. Proposez un pot d'essai pour lever les freins.`} />}
      {convRate >= 50 && total >= 5 && <NBACard icon="🚀" title="Vous êtes en forme !" text={`${convRate}% de conversion — augmentez votre volume de visites.`} />}
      {tInv > 0 && tGross > 0 && <NBACard icon="🎁" title="Retour sur échantillons" text={`${fs(tInv/tGross*100)}% du CA brut en échantillons. ${tInv/tGross>0.1?"Surveillez ce ratio.":"Excellent ratio ✓"}`} />}
    </div>
  );
}
