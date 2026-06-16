import { useState, useCallback } from "react";
import { supabase } from "../core/supabase";

export function useClients(agentId) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }, [agentId]);

  async function save(payload, existingId = null) {
    const p = { agent_id: agentId, ...payload };
    if (existingId) {
      const { error } = await supabase.from("clients").update(p).eq("id", existingId).eq("agent_id", agentId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("clients").insert([p]);
      if (error) throw error;
    }
    await load();
  }

  async function remove(id) {
    await supabase.from("clients").delete().eq("id", id).eq("agent_id", agentId);
    await load();
  }

  async function recordReorder(id, amount) {
    await supabase.from("clients").update({
      last_order_date:   new Date().toISOString().slice(0, 10),
      last_order_amount: Number(amount),
    }).eq("id", id).eq("agent_id", agentId);
    await load();
  }

  return { clients, loading, load, save, remove, recordReorder };
}
