import { useState, useCallback } from "react";
import { supabase } from "../core/supabase";

export function useVisits(agentId) {
  const [visits,  setVisits]  = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    const { data } = await supabase
      .from("visits")
      .select("*")
      .eq("agent_id", agentId)
      .order("ts", { ascending: false });
    setVisits(data || []);
    setLoading(false);
  }, [agentId]);

  async function add(payload) {
    const { error } = await supabase.from("visits").insert([payload]);
    if (error) throw error;
    await load();
  }

  async function update(id, changes) {
    await supabase.from("visits").update(changes).eq("id", id).eq("agent_id", agentId);
    await load();
  }

  async function remove(id) {
    await supabase.from("visits").delete().eq("id", id).eq("agent_id", agentId);
    await load();
  }

  return { visits, loading, load, add, update, remove };
}
