import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Badge, Btn, SectionTitle, EmptyState, Modal } from "../../../components/ui";
import { fmtS } from "../../../core/utils";
import { supabase } from "../../../core/supabase";

const ROLE_LABEL = { agent: "Agent terrain", stock_manager: "Responsable stock" };
const PERMISSIONS = [
  { id: "orders",           label: "Commandes" },
  { id: "stock_management", label: "Gestion stock" },
];

export function AgentsTab({ agents, allVisits, allClients, allSales, products, agentProducts, onApprove, onReject, onRemove, onToggleProduct, onUpdateRole, onTogglePermission, onRefresh }) {
  const T = useTheme();
  const [assignAgent, setAssignAgent] = useState(null);
  const [bulkModal,   setBulkModal]   = useState(null);
  const [bulkRate,    setBulkRate]    = useState("");
  const [bulkScope,   setBulkScope]   = useState("future");
  const [bulkSaving,  setBulkSaving]  = useState(false);
  const [bulkDone,    setBulkDone]    = useState(false);

  const pending = agents.filter(a => a.status === "pending");
  const active  = agents.filter(a => a.status === "active" && (a.role === "agent" || a.role === "stock_manager"));

  function agentStats(id) {
    const v     = allVisits.filter(v => v.agent_id === id);
    const s     = v.filter(v => v.outcome === "Vendu");
    const sales = allSales.filter(s => s.agent_id === id);
    const gmv   = sales.reduce((a, s) => a + Number(s.gross_amount || 0), 0);
    return { visits: v.length, sold: s.length, clients: allClients.filter(c => c.agent_id === id).length, gmv, conv: v.length ? Math.round(s.length / v.length * 100) : 0 };
  }

  function openBulkModal(agent, productId) {
    const ap = agentProducts.find(a => a.agent_id === agent.id && a.product_id === productId);
    const p  = products.find(p => p.id === productId);
    setBulkModal({ agent, product: p, ap });
    setBulkRate(String(ap?.commission_rate || 8));
    setBulkScope("future"); setBulkDone(false);
  }

  async function saveBulkCommission() {
    if (!bulkModal) return;
    setBulkSaving(true);
    const rate = Number(bulkRate);
    const { agent, product, ap } = bulkModal;
    try {
      if (ap) await supabase.from("agent_products").update({ commission_rate: rate }).eq("id", ap.id);
      if (bulkScope === "all") {
        const rows = allSales.filter(s => s.agent_id === agent.id && s.product_id === product.id);
        for (const s of rows) await supabase.from("sales").update({ commission_rate: rate, commission_earned: s.net_amount * rate / 100, commission_override: false }).eq("id", s.id);
      } else if (bulkScope === "non_override") {
        const rows = allSales.filter(s => s.agent_id === agent.id && s.product_id === product.id && !s.commission_override);
        for (const s of rows) await supabase.from("sales").update({ commission_rate: rate, commission_earned: s.net_amount * rate / 100 }).eq("id", s.id);
      }
      await supabase.from("commission_history").insert([{ agent_id: agent.id, product_id: product.id, old_rate: ap?.commission_rate || null, new_rate: rate, apply_to_past: bulkScope !== "future" }]);
      setBulkDone(true);
      onRefresh();
    } finally { setBulkSaving(false); }
  }

  function impactPreview() {
    if (!bulkModal) return null;
    const { agent, product } = bulkModal;
    const rate    = Number(bulkRate);
    const rows    = allSales.filter(s => s.agent_id === agent.id && s.product_id === product.id);
    const affected = bulkScope === "all" ? rows : bulkScope === "non_override" ? rows.filter(s => !s.commission_override) : [];
    if (!affected.length) return null;
    const currentComm = affected.reduce((a, s) => a + Number(s.commission_earned || 0), 0);
    const newComm     = affected.reduce((a, s) => a + s.net_amount * rate / 100, 0);
    return { affected: affected.length, currentComm, newComm, diff: newComm - currentComm };
  }

  const scopeOptions = [
    { id: "future",       label: "Futures ventes uniquement",         sub: "Les ventes passées ne changent pas" },
    { id: "non_override", label: "Futures + passées (sauf modifiées)", sub: "Respecte les commissions ajustées manuellement" },
    { id: "all",          label: "Toutes les ventes",                  sub: "Écrase toutes les commissions passées" },
  ];

  const preview = impactPreview();

  return (
    <div>
      {/* Commission modal */}
      <Modal open={!!bulkModal} onClose={() => setBulkModal(null)} title="MODIFIER COMMISSION">
        {bulkModal && (
          <>
            <div style={{ fontSize: 13, color: useTheme().textSub, marginBottom: 20 }}>
              {bulkModal.agent.full_name} · {bulkModal.product?.name}
            </div>
            {bulkDone ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
                <div style={{ color: useTheme().success, fontWeight: 600, fontSize: 15 }}>Commission mise à jour</div>
                <Btn style={{ marginTop: 16 }} onClick={() => setBulkModal(null)}>Fermer</Btn>
              </div>
            ) : (
              <CommissionModalBody
                bulkRate={bulkRate} setBulkRate={setBulkRate}
                bulkScope={bulkScope} setBulkScope={setBulkScope}
                scopeOptions={scopeOptions} preview={preview}
                bulkModal={bulkModal} bulkSaving={bulkSaving}
                onSave={saveBulkCommission}
              />
            )}
          </>
        )}
      </Modal>

      {/* Assignment modal */}
      <Modal open={!!assignAgent} onClose={() => setAssignAgent(null)} title={assignAgent ? `PRODUITS — ${assignAgent.full_name}` : ""}>
        {assignAgent && (
          <AgentAssignModal
            agent={assignAgent}
            products={products}
            agentProducts={agentProducts}
            onToggle={onToggleProduct}
            onOpenCommission={(a, pid) => { setAssignAgent(null); openBulkModal(a, pid); }}
          />
        )}
      </Modal>

      {/* Pending */}
      {pending.length > 0 && (
        <>
          <SectionTitle>Demandes en attente · {pending.length}</SectionTitle>
          {pending.map(a => (
            <div key={a.id} style={{
              background: useTheme().surface, border: `1px solid ${useTheme().border}`,
              borderLeft: `3px solid ${useTheme().warning}`,
              borderRadius: 14, padding: "14px 16px", marginBottom: 9,
              boxShadow: useTheme().shadow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: useTheme().text }}>{a.full_name}</div>
                  {a.phone && <div style={{ fontSize: 12, color: useTheme().textSub, marginTop: 2 }}>📞 {a.phone}</div>}
                  <div style={{ fontSize: 11, color: useTheme().textDim, marginTop: 2 }}>
                    Inscrit le {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <Badge color={useTheme().warning}>En attente</Badge>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="success" onClick={() => onApprove(a.id)}>✓ Approuver</Btn>
                <Btn size="sm" variant="danger"  onClick={() => onReject(a.id)}>✕ Rejeter</Btn>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Active agents */}
      <SectionTitle>Agents actifs · {active.length}</SectionTitle>
      {active.length === 0 && <EmptyState icon="🌊" title="Aucun agent actif" sub="Approuvez des demandes pour constituer votre équipe" />}
      {active.map(a => {
        const st       = agentStats(a.id);
        const assigned = agentProducts.filter(ap => ap.agent_id === a.id);
        return (
          <AgentCard
            key={a.id} a={a} st={st} assigned={assigned} products={products}
            onRemove={onRemove} onSetAssign={setAssignAgent}
            onUpdateRole={onUpdateRole} onTogglePerm={onTogglePermission}
            onOpenCommission={openBulkModal}
          />
        );
      })}
    </div>
  );
}

// Extracted card to keep the main component clean
function AgentCard({ a, st, assigned, products, onRemove, onSetAssign, onUpdateRole, onTogglePerm, onOpenCommission }) {
  const T = useTheme();
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${T.success}`,
      borderRadius: 14, padding: "16px", marginBottom: 10,
      boxShadow: T.shadow,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{a.full_name}</div>
          {a.phone && <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>📞 {a.phone}</div>}
        </div>
        <Badge color={T.success}>Actif</Badge>
      </div>

      {/* Role pills */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Rôle</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {Object.entries(ROLE_LABEL).map(([id, label]) => {
            const on = a.role === id;
            return (
              <button key={id} type="button" className="eb-btn" onClick={() => onUpdateRole(a.id, id)} style={{
                padding: "7px 14px", borderRadius: 20,
                border: `1.5px solid ${on ? T.accent : T.border}`,
                background: on ? T.accent + "22" : "transparent",
                color: on ? T.accent : T.textSub,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* Permission pills */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Permissions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {PERMISSIONS.map(p => {
            const on = (a.permissions || []).includes(p.id);
            return (
              <button key={p.id} type="button" className="eb-btn" onClick={() => onTogglePerm(a.id, p.id)} style={{
                padding: "7px 14px", borderRadius: 20,
                border: `1.5px solid ${on ? T.gold : T.border}`,
                background: on ? T.gold + "22" : "transparent",
                color: on ? T.gold : T.textSub,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>{on ? "✓ " : ""}{p.label}</button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
        {[["Visites", st.visits], ["Ventes", st.sold], [`${st.conv}%`, "Conv."], [`${fmtS(st.gmv)}`, "DT GMV"]].map(([v, l]) => (
          <div key={l} style={{ background: T.surfaceHi, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: T.text }}>{v}</div>
            <div style={{ fontSize: 10, color: T.textDim }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Assigned products */}
      {assigned.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Produits & commissions
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {assigned.map(ap => {
              const p = products.find(p => p.id === ap.product_id);
              return p ? (
                <button key={ap.id} onClick={() => onOpenCommission(a, p.id)} style={{
                  fontSize: 11, padding: "5px 12px", borderRadius: 20,
                  background: T.accent + "22", color: T.accent,
                  border: `1px solid ${T.accent}44`, cursor: "pointer", fontWeight: 600,
                }}>
                  {p.name} · {ap.commission_rate}% ✎
                </button>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn size="sm" variant="primary" onClick={() => onSetAssign(a)}>📦 Gérer produits</Btn>
        <Btn size="sm" variant="danger"  onClick={() => onRemove(a.id)}>Supprimer</Btn>
      </div>
    </div>
  );
}

function CommissionModalBody({ bulkRate, setBulkRate, bulkScope, setBulkScope, scopeOptions, preview, bulkModal, bulkSaving, onSave }) {
  const T = useTheme();
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Nouveau taux</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="number" min="0" max="100"
            value={bulkRate}
            onChange={e => setBulkRate(e.target.value)}
            style={{
              width: 80, background: T.surfaceHi, border: `1px solid ${T.accent}`,
              borderRadius: 9, padding: "11px 13px",
              color: T.gold, fontSize: 22, fontWeight: 700, outline: "none", textAlign: "center",
            }}
          />
          <div style={{ fontSize: 18, color: T.textSub }}>%</div>
          <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>
            Taux actuel<br />
            <span style={{ color: T.text, fontWeight: 600 }}>{bulkModal.ap?.commission_rate || 8}%</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Appliquer à</div>
        {scopeOptions.map(o => (
          <button key={o.id} type="button" onClick={() => setBulkScope(o.id)} style={{
            width: "100%", padding: "12px 14px", marginBottom: 8,
            background: bulkScope === o.id ? T.accent + "22" : T.surfaceHi,
            border: `1.5px solid ${bulkScope === o.id ? T.accent : T.border}`,
            borderRadius: 10, cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: bulkScope === o.id ? T.accent : T.text }}>{o.label}</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>{o.sub}</div>
          </button>
        ))}
      </div>

      {preview && (
        <div style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Impact estimé</div>
          {[
            ["Ventes affectées", preview.affected, T.text],
            ["Commission actuelle", `${fmtS(preview.currentComm)} DT`, T.text],
            ["Nouvelle commission", `${fmtS(preview.newComm)} DT`, T.gold],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: T.textDim }}>{l}</span>
              <span style={{ color: c, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
            <span style={{ color: T.textDim }}>Différence</span>
            <span style={{ color: preview.diff >= 0 ? T.success : T.danger, fontWeight: 700 }}>
              {preview.diff >= 0 ? "+" : ""}{fmtS(preview.diff)} DT
            </span>
          </div>
        </div>
      )}

      <Btn style={{ width: "100%" }} disabled={bulkSaving} onClick={onSave}>
        {bulkSaving ? "Mise à jour..." : "Confirmer la modification"}
      </Btn>
    </>
  );
}

function AgentAssignModal({ agent, products, agentProducts, onToggle, onOpenCommission }) {
  const T = useTheme();
  return (
    <>
      {products.length === 0 && <EmptyState icon="📦" title="Aucun produit" sub="Ajoutez des produits d'abord" />}
      {products.map(p => {
        const ap       = agentProducts.find(a => a.agent_id === agent.id && a.product_id === p.id);
        const assigned = !!ap;
        return (
          <div key={p.id} style={{
            background: T.surfaceHi,
            border: `1px solid ${assigned ? T.accent : T.border}`,
            borderRadius: 12, padding: "12px 14px", marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: assigned ? 10 : 0 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: assigned ? T.accent : T.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.textDim }}>{p.price} DT · {p.unit}</div>
              </div>
              <button type="button" className="eb-btn" onClick={() => onToggle(agent.id, p.id)} style={{
                padding: "6px 14px", borderRadius: 20,
                border: `1.5px solid ${assigned ? T.accent : T.border}`,
                background: assigned ? T.accent + "22" : "transparent",
                color: assigned ? T.accent : T.textSub,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {assigned ? "✓ Assigné" : "+ Assigner"}
              </button>
            </div>
            {assigned && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 11, color: T.textDim }}>Taux actuel:</div>
                <div style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{ap.commission_rate}%</div>
                <button
                  onClick={() => onOpenCommission(agent, p.id)}
                  style={{
                    marginLeft: "auto", padding: "5px 12px",
                    background: T.accent + "22", border: `1px solid ${T.accent}44`,
                    borderRadius: 8, color: T.accent, fontSize: 11, cursor: "pointer", fontWeight: 600,
                  }}
                >
                  ✎ Modifier
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
