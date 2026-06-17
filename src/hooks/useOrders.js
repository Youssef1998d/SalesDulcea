import { useState, useCallback } from "react";
import { supabase } from "../core/supabase";
import { buildPoPdf } from "../services/poPdf";

const ORDER_SELECT =
  "*, order_lines(*, products(*), stock(*)), agents!orders_agent_id_fkey(full_name), clients(name, phone, address), invoice:invoices!orders_invoice_id_fkey(id, invoice_number, status, amount_paid, total_amount, pdf_url, created_at)";

export function useOrders({ agentId = null, orgId = null } = {}) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);

  // Agent: own orders. Manager: all orders for the org.
  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    let q = supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [agentId, orgId]);

  // Place an order for a specific client. Invoicing is deferred — the order
  // gets a sequential PO number and a QR token (for tracking + the printed box).
  async function placeOrder(clientId, lines) {
    const { data: poNumber, error: numErr } = await supabase.rpc("next_po_number", { p_org: orgId });
    if (numErr) throw numErr;
    const qrToken = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const { data: order, error } = await supabase
      .from("orders")
      .insert([{
        agent_id: agentId, org_id: orgId, client_id: clientId || null,
        status: "pending", po_number: poNumber, qr_token: qrToken,
      }])
      .select()
      .single();
    if (error) throw error;
    const rows = lines.map(l => ({
      order_id: order.id,
      product_id: l.productId,
      quantity_requested: Number(l.quantity),
      unit: l.unit || null,
    }));
    const { error: lineErr } = await supabase.from("order_lines").insert(rows);
    if (lineErr) throw lineErr;
    await load();
    return order;
  }

  // Generate (or regenerate) the printable Bon de commande PDF + QR, on demand.
  async function generatePoDocument(order, org) {
    const lines = (order.order_lines || []).map(l => ({
      product_name: l.products?.name || "Produit",
      quantity:     Number(l.quantity_confirmed ?? l.quantity_requested),
      unit_price:   Number(l.products?.price || 0),
    }));
    const blob = await buildPoPdf({
      po_number:      order.po_number,
      created_at:     order.created_at,
      qr_token:       order.qr_token,
      client_name:    order.clients?.name,
      client_phone:   order.clients?.phone,
      client_address: order.clients?.address,
      agent_name:     order.agents?.full_name,
      lines,
    }, org);
    const path = `${orgId}/po/${order.po_number}.pdf`;
    const { error } = await supabase.storage.from("invoices").upload(path, blob, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("invoices").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    await supabase.from("orders").update({ po_pdf_url: url }).eq("id", order.id);
    await load();
    return url;
  }

  // Look up an order by its QR token (for the in-app scanner), scoped to the org.
  async function findByQrToken(token) {
    const { data } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("org_id", orgId)
      .eq("qr_token", String(token).trim())
      .maybeSingle();
    return data || null;
  }

  // Mark an order shipped (Expédiée) — between confirmed and delivered.
  async function markShipped(orderId) {
    await supabase.from("orders").update({ status: "shipped", shipped_at: new Date().toISOString() }).eq("id", orderId);
    await load();
  }

  // Cancel (Annulée) an order — only while it has no active invoice.
  async function cancelOrder(orderId) {
    await supabase.from("orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", orderId);
    await load();
  }

  // Manager: confirm an order, assigning stock batches to each line and deducting quantities.
  async function confirmOrder(orderId, lineAllocations, confirmedBy) {
    for (const a of lineAllocations) {
      await supabase
        .from("order_lines")
        .update({ stock_id: a.stockId, quantity_confirmed: Number(a.quantityConfirmed) })
        .eq("id", a.lineId);
      if (a.stockId) {
        const { data: s } = await supabase.from("stock").select("quantity").eq("id", a.stockId).single();
        if (s) await supabase.from("stock").update({ quantity: s.quantity - Number(a.quantityConfirmed) }).eq("id", a.stockId);
      }
    }
    await supabase
      .from("orders")
      .update({ status: "confirmed", confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() })
      .eq("id", orderId);
    await load();
  }

  async function rejectOrder(orderId, confirmedBy) {
    await supabase
      .from("orders")
      .update({ status: "rejected", confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() })
      .eq("id", orderId);
    await load();
  }

  async function markDelivered(orderId) {
    await supabase.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", orderId);
    await load();
  }

  return {
    orders, loading, load, placeOrder, confirmOrder, rejectOrder,
    markShipped, markDelivered, cancelOrder, generatePoDocument, findByQrToken,
  };
}
