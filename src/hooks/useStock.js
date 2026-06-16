import { useState, useCallback } from "react";
import { supabase } from "../core/supabase";

export function useStock(orgId) {
  const [stock,   setStock]   = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("stock")
      .select("*, products(*)")
      .eq("org_id", orgId)
      .order("expected_date", { ascending: true });
    setStock(data || []);
    setLoading(false);
  }, [orgId]);

  async function addBatch(payload) {
    await supabase.from("stock").insert([{ ...payload, org_id: orgId }]);
    await load();
  }

  async function updateBatch(id, changes) {
    await supabase.from("stock").update(changes).eq("id", id);
    await load();
  }

  async function removeBatch(id) {
    await supabase.from("stock").delete().eq("id", id);
    await load();
  }

  return { stock, loading, load, addBatch, updateBatch, removeBatch };
}
