import { useState, useCallback } from "react";
import { supabase } from "../core/supabase";

export function useSales() {
  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (agentId = null) => {
    setLoading(true);
    let q = supabase.from("sales").select("*").order("created_at", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data } = await q;
    setSales(data || []);
    setLoading(false);
  }, []);

  async function insertFromVisit(visitId, agentId, lines, products) {
    const rows = (lines || [])
      .filter(l => Number(l.boxes || 0) > 0)
      .map(l => {
        const p     = products.find(p => p.id === l.productId);
        if (!p) return null;
        const gross = p.price * 12 * Number(l.boxes);
        const inv   = p.price * Number(l.freePots || 0);
        const net   = gross - inv;
        const rate  = p.commission_rate || 8;
        return {
          visit_id:           visitId,
          agent_id:           agentId,
          product_id:         p.id,
          product_name:       p.name,
          boxes:              Number(l.boxes),
          free_pots:          Number(l.freePots || 0),
          unit_price:         p.price,
          gross_amount:       gross,
          investment_amount:  inv,
          net_amount:         net,
          commission_rate:    rate,
          commission_earned:  net * rate / 100,
        };
      }).filter(Boolean);

    if (rows.length > 0) {
      const { error } = await supabase.from("sales").insert(rows);
      if (error) throw error;
    }
  }

  return { sales, loading, load, insertFromVisit };
}
