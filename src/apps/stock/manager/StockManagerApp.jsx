import { useState, useEffect } from "react";
import { useTheme } from "../../../core/theme";
import { OrgHeader } from "../../../components/layout/OrgHeader";
import { BottomBar } from "../../../components/layout/BottomBar";
import { Btn } from "../../../components/ui";
import { useStock } from "../../../hooks/useStock";
import { useOrders } from "../../../hooks/useOrders";
import { supabase } from "../../../core/supabase";
import { StockBatchesTab } from "./StockBatchesTab";
import { ManagerOrdersTab } from "./ManagerOrdersTab";

export function StockManagerApp({ user, agent, onSignOut }) {
  const T = useTheme();
  const [tab, setTab] = useState("orders");
  const [products, setProducts] = useState([]);

  const { stock,  loading:sLoad, load:loadStock,  addBatch, updateBatch, removeBatch } = useStock(agent.org_id);
  const { orders, loading:oLoad, load:loadOrders, confirmOrder, rejectOrder, markDelivered } = useOrders({ orgId: agent.org_id });

  useEffect(() => {
    loadStock();
    loadOrders();
    supabase.from("products").select("*").eq("active", true).order("name").then(({ data }) => setProducts(data || []));
  }, []);

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const tabs = [
    { id:"orders", icon:"🧾", label:"Commandes", badge:pendingCount },
    { id:"stock",  icon:"📦", label:"Stock",     badge:0 },
  ];

  async function handleConfirm(orderId, lines) {
    await confirmOrder(orderId, lines, user.id);
    await loadStock();
  }

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", fontFamily:"'Inter',sans-serif", color:T.text, paddingBottom:90 }}>
      <OrgHeader rightSlot={<Btn size="sm" variant="ghost" onClick={onSignOut}>Déco</Btn>} />

      <div style={{ padding:"16px 16px 0" }}>
        {tab === "orders" && (
          <ManagerOrdersTab
            orders={orders}
            stock={stock}
            loading={oLoad}
            onConfirm={handleConfirm}
            onReject={id => rejectOrder(id, user.id)}
            onDeliver={markDelivered}
          />
        )}
        {tab === "stock" && (
          <StockBatchesTab
            stock={stock}
            products={products}
            loading={sLoad}
            onAdd={addBatch}
            onUpdate={updateBatch}
            onRemove={removeBatch}
          />
        )}
      </div>

      <BottomBar tabs={tabs} active={tab} onChange={setTab} />
    </div>
  );
}
