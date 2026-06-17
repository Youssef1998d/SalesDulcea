import { jsPDF } from "jspdf";
import { fmtMoney, fmtDateFr } from "../core/invoiceConstants";
import { qrDataUrl } from "./qr";

// Load a remote image into a data URL + natural size (logo).
async function loadImage(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });
    const fmt = blob.type.includes("png") ? "PNG" : blob.type.includes("jpeg") ? "JPEG" : "PNG";
    return { dataUrl, ...dims, fmt };
  } catch { return null; }
}
function fitBox(img, maxW, maxH) {
  if (!img || !img.w || !img.h) return { w: maxW, h: maxH };
  const ratio = Math.min(maxW / img.w, maxH / img.h);
  return { w: img.w * ratio, h: img.h * ratio };
}

// Build a French "Bon de commande" (purchase order) PDF carrying the QR that
// tracks the order's cycle. Returns a Blob.
//   order : { po_number, created_at, qr_token, client_name/phone/address,
//             agent_name, lines:[{ product_name, quantity, unit_price }] }
//   org   : organization row
export async function buildPoPdf(order, org) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210, M = 16;
  const accent = "#0a1628", gold = "#b8922a", grey = "#666666", line = "#dddddd";

  const [logo, qr] = await Promise.all([
    loadImage(org?.logo_url),
    qrDataUrl(order.qr_token, 220),
  ]);

  let y = M;

  // Header — company (left)
  if (logo) {
    const { w, h } = fitBox(logo, 38, 22);
    doc.addImage(logo.dataUrl, logo.fmt, M, y, w, h);
  }
  const cx = logo ? M + 42 : M;
  doc.setTextColor(accent); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text(org?.company_name || org?.name || "Société", cx, y + 6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(grey);
  let cy = y + 11;
  [org?.address, org?.phone ? `Tél : ${org.phone}` : null, org?.email ? `Email : ${org.email}` : null]
    .filter(Boolean).forEach(l => { doc.text(String(l), cx, cy); cy += 4.5; });

  // Header — title box (right)
  const boxW = 58, boxX = PW - M - boxW;
  doc.setFillColor(accent);
  doc.roundedRect(boxX, y, boxW, 26, 2, 2, "F");
  doc.setTextColor("#ffffff"); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text("BON DE COMMANDE", boxX + boxW / 2, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(`N° : ${order.po_number || "—"}`, boxX + boxW / 2, y + 15, { align: "center" });
  doc.text(`Date : ${fmtDateFr(order.created_at)}`, boxX + boxW / 2, y + 20, { align: "center" });

  y = Math.max(cy, y + 26) + 8;
  doc.setDrawColor(line); doc.line(M, y, PW - M, y); y += 7;

  // Client + agent
  doc.setTextColor(gold); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("CLIENT", M, y);
  doc.text("AGENT", PW / 2 + 6, y);
  y += 6;
  doc.setTextColor("#222222"); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(order.client_name || "—", M, y);
  doc.text(order.agent_name || "—", PW / 2 + 6, y);
  y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(grey);
  [order.client_address ? `Adresse : ${order.client_address}` : null,
   order.client_phone ? `Téléphone : ${order.client_phone}` : null]
    .filter(Boolean).forEach(l => { doc.text(String(l), M, y); y += 4.5; });
  y += 6;

  // Product table
  const cMontant = PW - M;
  const headerY = y;
  doc.setFillColor(accent); doc.rect(M, headerY - 5, PW - 2 * M, 8, "F");
  doc.setTextColor("#ffffff"); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
  doc.text("Produit", M + 2, headerY);
  doc.text("Quantité", 120, headerY);
  doc.text("Prix Unitaire", 142, headerY);
  doc.text("Montant", cMontant - 2, headerY, { align: "right" });
  y = headerY + 7;
  doc.setFont("helvetica", "normal"); doc.setTextColor("#222222"); doc.setFontSize(9.5);
  let total = 0;
  (order.lines || []).forEach((l, i) => {
    const lineTotal = Number(l.quantity) * Number(l.unit_price);
    total += lineTotal;
    if (i % 2 === 1) { doc.setFillColor("#f5f7fa"); doc.rect(M, y - 4, PW - 2 * M, 7, "F"); }
    doc.text(String(l.product_name || ""), M + 2, y);
    doc.text(String(Number(l.quantity)), 120, y);
    doc.text(`${fmtMoney(l.unit_price)} DT`, 142, y);
    doc.text(`${fmtMoney(lineTotal)} DT`, cMontant - 2, y, { align: "right" });
    y += 7;
  });
  doc.setDrawColor(line); doc.line(M, y - 2, PW - M, y - 2); y += 6;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(accent);
  doc.text("Total", PW - M - 60, y);
  doc.text(`${fmtMoney(total)} DT`, cMontant, y, { align: "right" });

  // QR — scan to follow the order's cycle
  const qy = Math.max(y + 16, 232);
  if (qr) doc.addImage(qr, "PNG", M, qy, 34, 34);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(grey);
  doc.text("Scannez ce code pour suivre", M + 40, qy + 12);
  doc.text("le cycle de la commande.", M + 40, qy + 17);
  doc.setFontSize(8); doc.setTextColor("#999999");
  doc.text(`Réf : ${order.qr_token}`, M + 40, qy + 23);

  doc.setDrawColor(line); doc.line(M, 285, PW - M, 285);
  doc.setFontSize(8); doc.setTextColor(grey);
  doc.text("Bon de commande généré par East Blue Sales Platform", PW / 2, 290, { align: "center" });

  return doc.output("blob");
}
