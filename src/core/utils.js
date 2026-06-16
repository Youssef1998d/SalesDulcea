export const fmt  = n => Number(n).toFixed(3);
export const fmtS = n => Number(n).toFixed(2);

export const emptyLine = products => ({
  id:        Date.now() + Math.random(),
  productId: products[0]?.id || "",
  boxes:     1,
  freePots:  0,
});

export function calcFin(lines, products) {
  let gross = 0, inv = 0;
  (lines || []).forEach(l => {
    const p = products.find(p => p.id === l.productId);
    if (!p) return;
    gross += p.price * 12 * Number(l.boxes || 0);
    inv   += p.price * Number(l.freePots || 0);
  });
  return { gross, inv, net: gross - inv };
}

export function daysUntil(date, cycle) {
  if (!date) return null;
  const next = new Date(new Date(date).getTime() + cycle * 86400000);
  return Math.ceil((next - new Date()) / 86400000);
}

export function reorderStatus(days, T) {
  if (days === null) return { label: "Pas de commande",       color: T.textDim };
  if (days < 0)      return { label: `Retard ${Math.abs(days)}j`, color: T.danger };
  if (days <= 5)     return { label: `Rappeler dans ${days}j`,    color: T.warning };
  if (days <= 14)    return { label: `Dans ${days}j`,             color: T.info };
  return                    { label: `Dans ${days}j`,             color: T.success };
}

export function exportCSV(visits, products, filename = "eastblue") {
  const rows = [["Date","Heure","Point de vente","Zone","Contact","Produits","Boxes","Pots offerts","Brut DT","Invest. DT","Net DT","Résultat","Note"]];
  visits.forEach(v => {
    const f = calcFin(v.lines, products);
    const d = new Date(v.ts);
    rows.push([
      d.toLocaleDateString("fr-FR"),
      `${d.getHours()}h${String(d.getMinutes()).padStart(2,"0")}`,
      v.business, v.zone || "", v.contact,
      (v.lines||[]).map(l=>products.find(p=>p.id===l.productId)?.name||"").join("|"),
      (v.lines||[]).reduce((s,l)=>s+Number(l.boxes||0),0),
      (v.lines||[]).reduce((s,l)=>s+Number(l.freePots||0),0),
      fmt(f.gross), fmt(f.inv), fmt(f.net), v.outcome, v.note||"",
    ]);
  });
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
