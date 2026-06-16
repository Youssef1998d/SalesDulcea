import { useState } from "react";
import { useTheme } from "../../../core/theme";
import { Card, Badge, Btn, SectionTitle, EmptyState } from "../../../components/ui";
import { fmtS } from "../../../core/utils";
import { supabase } from "../../../core/supabase";

const ROLE_LABEL = { agent:"Agent terrain", stock_manager:"Responsable stock" };
const PERMISSIONS = [
  { id:"orders",           label:"Commandes" },
  { id:"stock_management", label:"Gestion stock" },
];

export function AgentsTab({ agents, allVisits, allClients, allSales, products, agentProducts, onApprove, onReject, onRemove, onToggleProduct, onUpdateRole, onTogglePermission, onRefresh }) {
  const T = useTheme();
  const [assignAgent, setAssignAgent] = useState(null);

  // Bulk commission modal
  const [bulkModal,  setBulkModal]  = useState(null); // { agent, product, ap }
  const [bulkRate,   setBulkRate]   = useState("");
  const [bulkScope,  setBulkScope]  = useState("future");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDone,   setBulkDone]   = useState(false);

  const pending = agents.filter(a => a.status === "pending");
  const active  = agents.filter(a => a.status === "active" && (a.role === "agent" || a.role === "stock_manager"));

  function agentStats(id) {
    const v     = allVisits.filter(v => v.agent_id === id);
    const s     = v.filter(v => v.outcome === "Vendu");
    const sales = allSales.filter(s => s.agent_id === id);
    const gmv   = sales.reduce((a, s) => a + Number(s.gross_amount || 0), 0);
    return {
      visits: v.length, sold: s.length,
      clients: allClients.filter(c => c.agent_id === id).length,
      gmv, conv: v.length ? Math.round(s.length / v.length * 100) : 0,
    };
  }

  function openBulkModal(agent, productId) {
    const ap = agentProducts.find(a => a.agent_id === agent.id && a.product_id === productId);
    const p  = products.find(p => p.id === productId);
    setBulkModal({ agent, product: p, ap });
    setBulkRate(String(ap?.commission_rate || 8));
    setBulkScope("future");
    setBulkDone(false);
  }

  async function saveBulkCommission() {
    if (!bulkModal) return;
    setBulkSaving(true);
    const rate             = Number(bulkRate);
    const { agent, product, ap } = bulkModal;

    try {
      // 1. Always update agent_products rate for future sales
      if (ap) {
        await supabase.from("agent_products")
          .update({ commission_rate: rate })
          .eq("id", ap.id);
      }

      // 2. Update past sales based on scope
      if (bulkScope === "all") {
        // Update ALL past sales for this agent+product
        const rows = allSales.filter(s => s.agent_id === agent.id && s.product_id === product.id);
        for (const s of rows) {
          await supabase.from("sales").update({
            commission_rate:     rate,
            commission_earned:   s.net_amount * rate / 100,
            commission_override: false, // bulk reset clears individual overrides
          }).eq("id", s.id);
        }
      } else if (bulkScope === "non_override") {
        // Update only sales NOT manually overridden
        const rows = allSales.filter(s =>
          s.agent_id === agent.id &&
          s.product_id === product.id &&
          !s.commission_override
        );
        for (const s of rows) {
          await supabase.from("sales").update({
            commission_rate:   rate,
            commission_earned: s.net_amount * rate / 100,
          }).eq("id", s.id);
        }
      }
      // "future" = only update agent_products (done above), leave past untouched

      // 3. Log to commission_history
      await supabase.from("commission_history").insert([{
        agent_id:      agent.id,
        product_id:    product.id,
        old_rate:      ap?.commission_rate || null,
        new_rate:      rate,
        apply_to_past: bulkScope !== "future",
      }]);

      setBulkDone(true);
      onRefresh();
    } finally {
      setBulkSaving(false);
    }
  }

  // Impact preview — how much commission changes for this agent+product
  function impactPreview() {
    if (!bulkModal) return null;
    const { agent, product } = bulkModal;
    const rate    = Number(bulkRate);
    const rows    = allSales.filter(s => s.agent_id === agent.id && s.product_id === product.id);
    const affected = bulkScope === "all"          ? rows
                   : bulkScope === "non_override" ? rows.filter(s => !s.commission_override)
                   : [];
    if (affected.length === 0) return null;
    const currentComm = affected.reduce((a, s) => a + Number(s.commission_earned || 0), 0);
    const newComm     = affected.reduce((a, s) => a + s.net_amount * rate / 100, 0);
    const diff        = newComm - currentComm;
    return { affected: affected.length, currentComm, newComm, diff };
  }

  const scopeOptions = [
    { id:"future",       label:"Futures ventes uniquement",          sub:"Les ventes passées ne changent pas" },
    { id:"non_override", label:"Futures + passées (sauf modifiées)",  sub:"Respecte les commissions ajustées manuellement" },
    { id:"all",          label:"Toutes les ventes",                   sub:"Écrase toutes les commissions passées y compris les modifications manuelles" },
  ];

  const preview = impactPreview();

  return (
    <div>

      {/* ── Bulk commission modal ── */}
      {bulkModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"18px 18px 0 0", padding:"24px 20px", width:"100%", maxWidth:480, maxHeight:"88vh", overflowY:"auto" }}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:T.gold, letterSpacing:2 }}>MODIFIER COMMISSION</div>
              <button onClick={() => setBulkModal(null)} style={{ background:"none", border:"none", color:T.textSub, fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ fontSize:13, color:T.textSub, marginBottom:20 }}>
              {bulkModal.agent.full_name} · {bulkModal.product?.name}
            </div>

            {bulkDone ? (
              <div style={{ background:"#0a1f14", border:`1px solid ${T.success}44`, borderRadius:10, padding:"20px", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>✓</div>
                <div style={{ color:T.success, fontWeight:600, fontSize:15 }}>Commission mise à jour</div>
                <button onClick={() => setBulkModal(null)} style={{ marginTop:16, padding:"10px 24px", background:T.accent, color:T.accentText, border:"none", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
                  Fermer
                </button>
              </div>
            ) : (<>

              {/* Rate input */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Nouveau taux</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <input
                    type="number" min="0" max="100"
                    value={bulkRate}
                    onChange={e => setBulkRate(e.target.value)}
                    style={{ width:80, background:T.surfaceHi, border:`1px solid ${T.accent}`, borderRadius:9, padding:"11px 13px", color:T.gold, fontSize:22, fontWeight:700, outline:"none", textAlign:"center" }}
                  />
                  <div style={{ fontSize:20, color:T.textSub }}>%</div>
                  <div style={{ fontSize:12, color:T.textDim, lineHeight:1.6 }}>
                    Taux actuel<br />
                    <span style={{ color:T.text, fontWeight:600 }}>{bulkModal.ap?.commission_rate || 8}%</span>
                  </div>
                </div>
              </div>

              {/* Scope selection */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Appliquer à</div>
                {scopeOptions.map(o => (
                  <button key={o.id} onClick={() => setBulkScope(o.id)} style={{
                    width:"100%", padding:"12px 14px", marginBottom:8,
                    background: bulkScope === o.id ? T.accent+"22" : T.surfaceHi,
                    border: `1.5px solid ${bulkScope === o.id ? T.accent : T.border}`,
                    borderRadius:10, cursor:"pointer", textAlign:"left",
                  }}>
                    <div style={{ fontSize:13, fontWeight:600, color:bulkScope === o.id ? T.accent : T.text }}>{o.label}</div>
                    <div style={{ fontSize:11, color:T.textDim, marginTop:3 }}>{o.sub}</div>
                  </button>
                ))}
              </div>

              {/* Impact preview */}
              {preview && (
                <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Impact estimé</div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                    <span style={{ color:T.textDim }}>Ventes affectées</span>
                    <span style={{ color:T.text, fontWeight:600 }}>{preview.affected}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                    <span style={{ color:T.textDim }}>Commission actuelle</span>
                    <span style={{ color:T.text }}>{fmtS(preview.currentComm)} DT</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                    <span style={{ color:T.textDim }}>Nouvelle commission</span>
                    <span style={{ color:T.gold, fontWeight:700 }}>{fmtS(preview.newComm)} DT</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, borderTop:`1px solid ${T.border}`, paddingTop:6 }}>
                    <span style={{ color:T.textDim }}>Différence</span>
                    <span style={{ color: preview.diff >= 0 ? T.success : T.danger, fontWeight:700 }}>
                      {preview.diff >= 0 ? "+" : ""}{fmtS(preview.diff)} DT
                    </span>
                  </div>
                </div>
              )}

              {bulkScope !== "future" && !preview && (
                <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:13, color:T.textDim, textAlign:"center" }}>
                  Aucune vente passée à mettre à jour pour ce produit
                </div>
              )}

              <button
                onClick={saveBulkCommission}
                disabled={bulkSaving}
                style={{ width:"100%", padding:"13px", background:T.accent, color:T.accentText, border:"none", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer", opacity:bulkSaving?0.7:1 }}
              >
                {bulkSaving ? "Mise à jour..." : "Confirmer la modification"}
              </button>
            </>)}
          </div>
        </div>
      )}

      {/* ── Assignment modal ── */}
      {assignAgent && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"18px 18px 0 0", padding:"24px 20px", width:"100%", maxWidth:480, maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:T.gold, letterSpacing:2 }}>PRODUITS — {assignAgent.full_name}</div>
              <button onClick={() => setAssignAgent(null)} style={{ background:"none", border:"none", color:T.textSub, fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            {products.length === 0 && <EmptyState icon="📦" title="Aucun produit" sub="Ajoutez des produits d'abord" />}
            {products.map(p => {
              const ap       = agentProducts.find(a => a.agent_id === assignAgent.id && a.product_id === p.id);
              const assigned = !!ap;
              return (
                <div key={p.id} style={{ background:T.surfaceHi, border:`1px solid ${assigned?T.accent:T.border}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:assigned?10:0 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color:assigned?T.accent:T.text }}>{p.name}</div>
                      <div style={{ fontSize:11, color:T.textDim }}>{p.price} DT · {p.unit}</div>
                    </div>
                    <button className="eb-btn" onClick={() => onToggleProduct(assignAgent.id, p.id)} style={{
                      padding:"6px 14px", borderRadius:20,
                      border:`1.5px solid ${assigned?T.accent:T.border}`,
                      background:assigned?T.accent+"22":"transparent",
                      color:assigned?T.accent:T.textSub,
                      fontSize:12, fontWeight:600, cursor:"pointer",
                    }}>{assigned ? "✓ Assigné" : "+ Assigner"}</button>
                  </div>
                  {assigned && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <div style={{ fontSize:11, color:T.textDim }}>Taux actuel:</div>
                      <div style={{ fontSize:13, color:T.gold, fontWeight:700 }}>{ap.commission_rate}%</div>
                      <button
                        onClick={() => { setAssignAgent(null); openBulkModal(assignAgent, p.id); }}
                        style={{ marginLeft:"auto", padding:"5px 12px", background:T.accent+"22", border:`1px solid ${T.accent}44`, borderRadius:8, color:T.accent, fontSize:11, cursor:"pointer", fontWeight:600 }}
                      >
                        ✎ Modifier
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <Btn style={{ width:"100%", marginTop:8 }} onClick={() => setAssignAgent(null)}>Fermer</Btn>
          </div>
        </div>
      )}

      {/* ── Pending ── */}
      {pending.length > 0 && <>
        <SectionTitle>Demandes en attente · {pending.length}</SectionTitle>
        {pending.map(a => (
          <Card key={a.id} accent={T.warning}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{a.full_name}</div>
                {a.phone && <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>📞 {a.phone}</div>}
                <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>Inscrit le {new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
              <Badge color={T.warning}>En attente</Badge>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn size="sm" variant="success" onClick={() => onApprove(a.id)}>✓ Approuver</Btn>
              <Btn size="sm" variant="danger"  onClick={() => onReject(a.id)}>✕ Rejeter</Btn>
            </div>
          </Card>
        ))}
      </>}

      {/* ── Active agents ── */}
      <SectionTitle>Agents actifs · {active.length}</SectionTitle>
      {active.length === 0 && <EmptyState icon="🌊" title="Aucun agent actif" sub="Approuvez des demandes pour constituer votre équipe" />}
      {active.map(a => {
        const st       = agentStats(a.id);
        const assigned = agentProducts.filter(ap => ap.agent_id === a.id);
        return (
          <Card key={a.id} accent={T.success}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{a.full_name}</div>
                {a.phone && <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>📞 {a.phone}</div>}
              </div>
              <Badge color={T.success}>Actif</Badge>
            </div>

            {/* Role */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Rôle</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {Object.entries(ROLE_LABEL).map(([id, label]) => {
                  const on = a.role === id;
                  return (
                    <button key={id} className="eb-btn" onClick={() => onUpdateRole(a.id, id)} style={{
                      padding:"7px 14px", borderRadius:20,
                      border:`1.5px solid ${on?T.accent:T.border}`,
                      background:on?T.accent+"22":"transparent",
                      color:on?T.accent:T.textSub,
                      fontSize:12, fontWeight:600, cursor:"pointer",
                    }}>{label}</button>
                  );
                })}
              </div>
            </div>

            {/* Permissions */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Permissions</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {PERMISSIONS.map(p => {
                  const on = (a.permissions || []).includes(p.id);
                  return (
                    <button key={p.id} className="eb-btn" onClick={() => onTogglePermission(a.id, p.id)} style={{
                      padding:"7px 14px", borderRadius:20,
                      border:`1.5px solid ${on?T.gold:T.border}`,
                      background:on?T.gold+"22":"transparent",
                      color:on?T.gold:T.textSub,
                      fontSize:12, fontWeight:600, cursor:"pointer",
                    }}>{on?"✓ ":""}{p.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
              {[["Visites",st.visits],["Ventes",st.sold],[`${st.conv}%`,"Conv."],[`${fmtS(st.gmv)}`,"DT GMV"]].map(([v,l]) => (
                <div key={l} style={{ background:T.surfaceHi, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.text }}>{v}</div>
                  <div style={{ fontSize:10, color:T.textDim }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Assigned products — tap to open commission editor */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>
                Produits & commissions ({assigned.length})
              </div>
              {assigned.length === 0
                ? <div style={{ fontSize:12, color:T.textDim, fontStyle:"italic" }}>Aucun produit assigné</div>
                : <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {assigned.map(ap => {
                      const p = products.find(p => p.id === ap.product_id);
                      return p ? (
                        <button key={ap.id} onClick={() => openBulkModal(a, p.id)} style={{
                          fontSize:11, padding:"5px 12px", borderRadius:20,
                          background:T.accent+"22", color:T.accent,
                          border:`1px solid ${T.accent}44`, cursor:"pointer", fontWeight:600,
                        }}>
                          {p.name} · {ap.commission_rate}% ✎
                        </button>
                      ) : null;
                    })}
                  </div>
              }
            </div>

            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Btn size="sm" variant="primary" onClick={() => setAssignAgent(a)}>📦 Gérer produits</Btn>
              <Btn size="sm" variant="danger"  onClick={() => onRemove(a.id)}>Supprimer</Btn>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
