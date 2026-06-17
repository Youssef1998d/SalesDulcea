// Invoice domain constants.
// DB / code use English keys; everything user- and PDF-facing is French.

export const INVOICE_STATUS = {
  draft:          { label: "Brouillon",            color: "textDim" },
  issued:         { label: "Émise",                color: "info"    },
  paid:           { label: "Payée",                color: "success" },
  partially_paid: { label: "Partiellement payée",  color: "warning" },
  cancelled:      { label: "Annulée",              color: "danger"  },
};

export const ENTITY_TYPES = {
  company:    "Société",
  individual: "Particulier",
};

// French two-decimal money formatting, e.g. 1 250,00 DT
export function fmtMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtMoneyDT(n) {
  return `${fmtMoney(n)} DT`;
}

export function fmtDateFr(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Derive a status from amounts when recording a payment.
export function statusFromPayment(totalAmount, amountPaid) {
  const total = Number(totalAmount || 0);
  const paid  = Number(amountPaid || 0);
  if (paid <= 0)        return "issued";
  if (paid >= total)    return "paid";
  return "partially_paid";
}
