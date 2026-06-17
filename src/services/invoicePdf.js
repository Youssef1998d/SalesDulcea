import { jsPDF } from "jspdf";
import { fmtMoney, fmtDateFr } from "../core/invoiceConstants";

// ─── Image helpers ────────────────────────────────────────────────────────────
// Load a remote image (logo / stamp) into a base64 data URL + natural size so it
// can be embedded into the PDF without distortion.
async function loadImage(url) {
  if (!url) return null;
  try {
    const res  = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror   = reject;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });
    const fmt = blob.type.includes("png") ? "PNG"
              : blob.type.includes("jpeg") || blob.type.includes("jpg") ? "JPEG"
              : "PNG";
    return { dataUrl, ...dims, fmt };
  } catch {
    return null;
  }
}

// Fit an image inside a max box, preserving aspect ratio. Returns mm dimensions.
function fitBox(img, maxW, maxH) {
  if (!img || !img.w || !img.h) return { w: maxW, h: maxH };
  const ratio = Math.min(maxW / img.w, maxH / img.h);
  return { w: img.w * ratio, h: img.h * ratio };
}

// ─── PDF builder ──────────────────────────────────────────────────────────────
// Produces a professional, fully-French A4 invoice and returns a Blob.
//   invoice : { invoice_number, issue_date, subtotal, tax_rate, tax_amount,
//               total_amount, client_name, client_address, client_phone,
//               client_tax_id, client_entity_type, status }
//   lines   : [{ product_name, quantity, unit_price, line_total }]
//   org     : organization row (company_name, address, phone, email,
//             tax_identification_number, logo_url, stamp_url)
export async function buildInvoicePdf(invoice, lines, org) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210;            // page width
  const M  = 16;             // margin
  const accent = "#0a1628";  // East Blue navy
  const gold   = "#b8922a";
  const grey   = "#666666";
  const line   = "#dddddd";

  const [logo, stamp] = await Promise.all([
    loadImage(org?.logo_url),
    loadImage(org?.stamp_url),
  ]);

  let y = M;

  // ── Header: company (left) ──────────────────────────────────────────────────
  if (logo) {
    const { w, h } = fitBox(logo, 38, 22);
    doc.addImage(logo.dataUrl, logo.fmt, M, y, w, h);
  }
  const companyTextX = logo ? M + 42 : M;
  doc.setTextColor(accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(org?.company_name || org?.name || "Société", companyTextX, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(grey);
  let cy = y + 11;
  const companyLines = [
    org?.address,
    org?.phone        ? `Tél : ${org.phone}` : null,
    org?.email        ? `Email : ${org.email}` : null,
    org?.tax_identification_number ? `Matricule fiscal : ${org.tax_identification_number}` : null,
  ].filter(Boolean);
  companyLines.forEach(l => { doc.text(String(l), companyTextX, cy); cy += 4.5; });

  // ── Header: FACTURE box (right) ─────────────────────────────────────────────
  const boxW = 58, boxX = PW - M - boxW, boxY = y;
  doc.setFillColor(accent);
  doc.roundedRect(boxX, boxY, boxW, 26, 2, 2, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FACTURE", boxX + boxW / 2, boxY + 9, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`N° Facture : ${invoice.invoice_number}`, boxX + boxW / 2, boxY + 16, { align: "center" });
  doc.text(`Date : ${fmtDateFr(invoice.issue_date)}`, boxX + boxW / 2, boxY + 21, { align: "center" });

  y = Math.max(cy, boxY + 26) + 8;

  // ── Client section ──────────────────────────────────────────────────────────
  doc.setDrawColor(line);
  doc.line(M, y, PW - M, y);
  y += 7;

  doc.setTextColor(gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CLIENT", M, y);
  y += 6;

  doc.setTextColor("#222222");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(invoice.client_name || "—", M, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(grey);
  const clientLines = [
    invoice.client_address ? `Adresse : ${invoice.client_address}` : null,
    invoice.client_phone   ? `Téléphone : ${invoice.client_phone}` : null,
    invoice.client_tax_id  ? `Matricule Fiscal : ${invoice.client_tax_id}` : null,
  ].filter(Boolean);
  clientLines.forEach(l => { doc.text(String(l), M, y); y += 4.5; });
  y += 6;

  // ── Product table ───────────────────────────────────────────────────────────
  const cols = {
    produit:  M,
    qte:      120,
    pu:       142,
    montant:  PW - M, // right-aligned
  };
  const headerY = y;
  doc.setFillColor(accent);
  doc.rect(M, headerY - 5, PW - 2 * M, 8, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Produit",       cols.produit + 2, headerY);
  doc.text("Quantité",      cols.qte,         headerY, { align: "left" });
  doc.text("Prix Unitaire", cols.pu,          headerY, { align: "left" });
  doc.text("Montant",       cols.montant - 2, headerY, { align: "right" });
  y = headerY + 7;

  doc.setFont("helvetica", "normal");
  doc.setTextColor("#222222");
  doc.setFontSize(9.5);

  (lines || []).forEach((l, i) => {
    if (y > 250) { doc.addPage(); y = M + 6; }
    if (i % 2 === 1) {
      doc.setFillColor("#f5f7fa");
      doc.rect(M, y - 4, PW - 2 * M, 7, "F");
    }
    const name = doc.splitTextToSize(String(l.product_name || ""), cols.qte - cols.produit - 6);
    doc.text(name[0] || "", cols.produit + 2, y);
    doc.text(String(Number(l.quantity)),       cols.qte,         y, { align: "left" });
    doc.text(`${fmtMoney(l.unit_price)} DT`,    cols.pu,          y, { align: "left" });
    doc.text(`${fmtMoney(l.line_total)} DT`,    cols.montant - 2, y, { align: "right" });
    y += 7;
  });

  doc.setDrawColor(line);
  doc.line(M, y - 2, PW - M, y - 2);
  y += 6;

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totX = PW - M - 70;
  const valX = PW - M;
  const totalRow = (label, value, bold = false, color = "#222222") => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(color);
    doc.text(label, totX, y);
    doc.text(value, valX, y, { align: "right" });
    y += bold ? 7 : 6;
  };
  totalRow("Sous-total", `${fmtMoney(invoice.subtotal)} DT`);
  totalRow(`TVA (${Number(invoice.tax_rate || 0)}%)`, `${fmtMoney(invoice.tax_amount)} DT`);
  doc.setDrawColor(line);
  doc.line(totX, y - 2, valX, y - 2);
  y += 3;
  totalRow("Total TTC", `${fmtMoney(invoice.total_amount)} DT`, true, accent);

  // ── Footer: stamp ───────────────────────────────────────────────────────────
  y = Math.max(y + 10, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(grey);
  doc.text("Cachet de l'entreprise", PW - M - 50, y);
  if (stamp) {
    const { w, h } = fitBox(stamp, 40, 28);
    doc.addImage(stamp.dataUrl, stamp.fmt, PW - M - 50, y + 3, w, h);
  }

  // ── Footer line ─────────────────────────────────────────────────────────────
  doc.setDrawColor(line);
  doc.line(M, 285, PW - M, 285);
  doc.setFontSize(8);
  doc.setTextColor(grey);
  doc.text("Facture générée par East Blue Sales Platform", PW / 2, 290, { align: "center" });

  return doc.output("blob");
}
