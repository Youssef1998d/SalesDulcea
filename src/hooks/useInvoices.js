import { useState, useCallback } from "react";
import { supabase } from "../core/supabase";
import { buildInvoicePdf } from "../services/invoicePdf";
import { statusFromPayment } from "../core/invoiceConstants";

const STAMP_MISSING_MSG =
  "Impossible de générer la facture. Veuillez configurer le cachet de l'entreprise.";

export function useInvoices({ orgId = null, agentId = null } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(false);

  // Agent: own invoices. Manager (no agentId): all invoices for the org.
  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    let q = supabase
      .from("invoices")
      .select("*, invoice_lines(*), clients(name), agents!invoices_created_by_fkey(full_name), purchase_orders:orders!orders_invoice_id_fkey(id, po_number, qr_token, status)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (agentId) q = q.eq("created_by", agentId);
    const { data } = await q;
    setInvoices(data || []);
    setLoading(false);
  }, [orgId, agentId]);

  // Upload the PDF blob to the `invoices` bucket and return its public URL.
  async function uploadPdf(invoiceNumber, blob) {
    const path = `${orgId}/${invoiceNumber}.pdf`;
    const { error } = await supabase.storage
      .from("invoices")
      .upload(path, blob, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("invoices").getPublicUrl(path);
    return data.publicUrl;
  }

  // ── Full generation workflow ───────────────────────────────────────────────
  // An invoice aggregates one or more purchase orders that share the same client
  // and agent. params: { org, client, orders:[order with order_lines+products],
  //                       taxRate?, createdBy }
  async function createInvoice({ org, client, orders, taxRate = null, createdBy }) {
    // 1. Validate ----------------------------------------------------------------
    if (!client)                       throw new Error("Aucun client sélectionné.");
    if (!orders || orders.length === 0) throw new Error("Aucune commande sélectionnée.");
    if (!org?.stamp_url)               throw new Error(STAMP_MISSING_MSG);

    const sameClient = orders.every(o => o.client_id === orders[0].client_id);
    const sameAgent  = orders.every(o => o.agent_id  === orders[0].agent_id);
    if (!sameClient || !sameAgent)
      throw new Error("Les commandes doivent avoir le même client et le même agent.");
    if (orders.some(o => o.invoice_id))
      throw new Error("Une commande sélectionnée est déjà facturée.");

    // 2. Aggregate lines from every PO (snapshot product name + unit price) ------
    const normalized = [];
    orders.forEach(o => {
      (o.order_lines || []).forEach(l => {
        const qty = Number(l.quantity_confirmed ?? l.quantity_requested);
        if (qty > 0) normalized.push({
          product_id:   l.product_id || null,
          product_name: l.products?.name || "Produit",
          quantity:     qty,
          unit_price:   Number(l.products?.price || 0),
          line_total:   qty * Number(l.products?.price || 0),
        });
      });
    });
    if (normalized.length === 0) throw new Error("Aucun produit à facturer.");

    const rate     = Number(taxRate != null ? taxRate : org?.tax_rate || 0);
    const subtotal = normalized.reduce((s, l) => s + l.line_total, 0);
    const taxAmt   = subtotal * rate / 100;
    const total    = subtotal + taxAmt;

    // 3. Sequential number -------------------------------------------------------
    const { data: invoiceNumber, error: numErr } =
      await supabase.rpc("next_invoice_number", { p_org: orgId });
    if (numErr) throw numErr;

    // 4. Invoice record (agent = the PO initiator) ------------------------------
    const { data: invoice, error: insErr } = await supabase
      .from("invoices")
      .insert([{
        organization_id:    orgId,
        invoice_number:     invoiceNumber,
        client_id:          client.id || null,
        issue_date:         new Date().toISOString().slice(0, 10),
        subtotal,
        tax_rate:           rate,
        tax_amount:         taxAmt,
        total_amount:       total,
        amount_paid:        0,
        status:             "issued",
        client_name:        client.name,
        client_address:     client.address || null,
        client_phone:       client.phone || null,
        client_tax_id:      client.tax_identification_number || null,
        client_entity_type: client.entity_type || "company",
        created_by:         createdBy,
      }])
      .select()
      .single();
    if (insErr) throw insErr;

    // 5. Invoice lines -----------------------------------------------------------
    const { error: lineErr } = await supabase
      .from("invoice_lines")
      .insert(normalized.map(l => ({ ...l, invoice_id: invoice.id })));
    if (lineErr) throw lineErr;

    // 6. Link the purchase orders to this invoice --------------------------------
    const { error: linkErr } = await supabase
      .from("orders")
      .update({ invoice_id: invoice.id })
      .in("id", orders.map(o => o.id));
    if (linkErr) throw linkErr;

    // 7. PDF (with each PO's QR) + upload + save URL ----------------------------
    const poTokens = orders.map(o => ({ po_number: o.po_number, qr_token: o.qr_token }));
    const blob   = await buildInvoicePdf(invoice, normalized, org, poTokens);
    const pdfUrl = await uploadPdf(invoiceNumber, blob);
    await supabase.from("invoices").update({ pdf_url: pdfUrl }).eq("id", invoice.id);

    await load();
    return { ...invoice, pdf_url: pdfUrl, invoice_lines: normalized, purchase_orders: poTokens };
  }

  // ── Regenerate the PDF for an existing invoice (manager) ───────────────────
  async function regeneratePdf(invoice, org) {
    if (!org?.stamp_url) throw new Error(STAMP_MISSING_MSG);
    const { data: lines } = await supabase
      .from("invoice_lines").select("*").eq("invoice_id", invoice.id);
    const { data: pos } = await supabase
      .from("orders").select("po_number, qr_token").eq("invoice_id", invoice.id);
    const blob   = await buildInvoicePdf(invoice, lines || [], org, pos || []);
    const pdfUrl = await uploadPdf(invoice.invoice_number, blob);
    await supabase.from("invoices").update({ pdf_url: pdfUrl }).eq("id", invoice.id);
    await load();
    return pdfUrl;
  }

  // ── Record a payment ───────────────────────────────────────────────────────
  async function recordPayment(invoice, amount) {
    const add = Number(amount);
    if (!isFinite(add) || add <= 0) throw new Error("Montant de paiement invalide.");
    const paid   = Number(invoice.amount_paid || 0) + add;
    const status = statusFromPayment(invoice.total_amount, paid);
    const { error } = await supabase.from("invoices")
      .update({ amount_paid: paid, status })
      .eq("id", invoice.id);
    if (error) throw error;
    await load();
    return { amount_paid: paid, status };
  }

  // ── Cancel an invoice (manager) ────────────────────────────────────────────
  async function cancelInvoice(invoiceId) {
    await supabase.from("invoices").update({ status: "cancelled" }).eq("id", invoiceId);
    await load();
  }

  return { invoices, loading, load, createInvoice, regeneratePdf, recordPayment, cancelInvoice };
}
