import { useState, useEffect } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { useStock } from "../../../hooks/useStock";
import { useOrders } from "../../../hooks/useOrders";
import { supabase } from "../../../core/supabase";
import { StockBatchesTab } from "./StockBatchesTab";
import { ManagerOrdersTab } from "./ManagerOrdersTab";

export function StockManagerApp({ user, agent, onSignOut, onThemeToggle, themeMode }) {
  const [tab,      setTab]      = useState("orders");
  const [products, setProducts] = useState([]);

  const { stock,  loading: sLoad, load: loadStock,  addBatch, updateBatch, removeBatch } = useStock(agent.org_id);
  const { orders, loading: oLoad, load: loadOrders, confirmOrder, rejectOrder, markShipped, markDelivered } = useOrders({ orgId: agent.org_id });

  useEffect(() => {
    loadStock();
    loadOrders();
    supabase.from("products").select("*").eq("active", true).order("name").then(({ data }) => setProducts(data || []));
  }, []);

  async function handleConfirm(orderId, lines) {
    await confirmOrder(orderId, lines, user.id);
    await loadStock();
  }

  const pendingCount = orders.filter(o => o.status === "pending").length;

  const tabs = [
    { id: "orders", icon: "🧾", label: "Commandes", badge: pendingCount },
    { id: "stock",  icon: "📦", label: "Stock",     badge: 0 },
  ];

  return (
    <AppShell
      tabs={tabs}
      active={tab}
      onChange={setTab}
      agent={agent}
      onSignOut={onSignOut}
      onThemeToggle={onThemeToggle}
      themeMode={themeMode}
    >
      {tab === "orders" && (
        <ManagerOrdersTab
          orders={orders}
          stock={stock}
          loading={oLoad}
          onConfirm={handleConfirm}
          onReject={id => rejectOrder(id, user.id)}
          onShip={markShipped}
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
    </AppShell>
  );
}
