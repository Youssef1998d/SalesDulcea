import { useState, useCallback } from "react";
import { supabase } from "../core/supabase";

export function useOrders({ agentId = null, orgId = null } = {}) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);

  // Agent: own orders. Manager: all orders for the org.
  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    let q = supabase
      .from("orders")
      .select("*, order_lines(*, products(*), stock(*)), agents!orders_agent_id_fkey(full_name)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [agentId, orgId]);

  async function placeOrder(lines) {
    const { data: order, error } = await supabase
      .from("orders")
      .insert([{ agent_id: agentId, org_id: orgId, status: "pending" }])
      .select()
      .single();
    if (error) throw error;
    const rows = lines.map(l => ({
      order_id: order.id,
      product_id: l.productId,
      quantity_requested: Number(l.quantity),
      unit: l.unit || null,
    }));
    await supabase.from("order_lines").insert(rows);
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

  return { orders, loading, load, placeOrder, confirmOrder, rejectOrder, markDelivered };
}
