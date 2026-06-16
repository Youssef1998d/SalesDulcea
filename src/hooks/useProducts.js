import { useState, useCallback } from "react";
import { supabase } from "../core/supabase";

export function useProducts(agentId = null) {
  const [products,       setProducts]       = useState([]);
  const [allProducts,    setAllProducts]    = useState([]);
  const [agentProducts,  setAgentProducts]  = useState([]);
  const [loading,        setLoading]        = useState(false);

  // For agents: load only assigned products
  const loadAssigned = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    const { data } = await supabase
      .from("agent_products")
      .select("product_id, commission_rate, products(*)")
      .eq("agent_id", agentId);
    const ps = (data || []).map(ap => ({ ...ap.products, commission_rate: ap.commission_rate }));
    setProducts(ps);
    setLoading(false);
  }, [agentId]);

  // For KAM: load all products + assignment map
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [pr, ap] = await Promise.all([
      supabase.from("products").select("*").eq("active", true).order("name"),
      supabase.from("agent_products").select("*"),
    ]);
    setAllProducts(pr.data || []);
    setAgentProducts(ap.data || []);
    setLoading(false);
  }, []);

  async function save(payload, existingId = null) {
    const p = { ...payload, active: true };
    if (existingId) await supabase.from("products").update(p).eq("id", existingId);
    else await supabase.from("products").insert([p]);
    await loadAll();
  }

  async function archive(id) {
    await supabase.from("products").update({ active: false }).eq("id", id);
    await loadAll();
  }

  async function toggleAssignment(agentId, productId) {
    const ex = agentProducts.find(ap => ap.agent_id === agentId && ap.product_id === productId);
    if (ex) await supabase.from("agent_products").delete().eq("id", ex.id);
    else    await supabase.from("agent_products").insert([{ agent_id: agentId, product_id: productId, commission_rate: 8 }]);
    await loadAll();
  }

  async function setCommission(agentId, productId, rate) {
    const ex = agentProducts.find(ap => ap.agent_id === agentId && ap.product_id === productId);
    if (!ex) return;
    await supabase.from("agent_products").update({ commission_rate: Number(rate) }).eq("id", ex.id);
    await loadAll();
  }

  return { products, allProducts, agentProducts, loading, loadAssigned, loadAll, save, archive, toggleAssignment, setCommission };
}
