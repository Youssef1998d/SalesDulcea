import { useTheme } from "../../../core/theme";
import { Input, Pills, Btn, FinBlock, SectionTitle, EmptyState, Card, Badge } from "../../ui";
import { fmt, emptyLine, calcFin } from "../../../core/utils";

const OUTCOMES = ["Vendu","Intéressé","Revenir","Refus"];
const CONTACTS = ["Propriétaire","Manager","Employé"];
const OUTCOME_COLOR = { Vendu:"#34d399", Intéressé:"#fbbf24", Revenir:"#60a5fa", Refus:"#f87171" };
const OUTCOME_ICON  = { Vendu:"✓", Intéressé:"◎", Revenir:"↺", Refus:"✕" };

export function LogTab({ form, setForm, products, onSubmit, saving, saved, visits, onDeleteVisit, onConvertVisit }) {
  const T = useTheme();

  const setF     = (k,v) => setForm(f=>({...f,[k]:v}));
  const updLine  = (id,k,v) => setForm(f=>({...f,lines:f.lines.map(l=>l.id===id?{...l,[k]:v}:l)}));
  const addLine  = () => setForm(f=>({...f,lines:[...f.lines,emptyLine(products)]}));
  const rmLine   = id => setForm(f=>({...f,lines:f.lines.length>1?f.lines.filter(l=>l.id!==id):f.lines}));
  const formFin  = calcFin(form.lines, products);

  return (
    <div>
      <Input label="Point de vente" value={form.business} onChange={v=>setF("business",v)} placeholder="Café, restaurant, grossiste..." />
      <Input label="Zone"           value={form.zone}     onChange={v=>setF("zone",v)}     placeholder="Aouina, Lac, Ennasr..." />

      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:7 }}>Contact</div>
        <Pills options={CONTACTS} value={form.contact} onChange={v=>setF("contact",v)} />
      </div>

      <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Produits</div>

      {products.length === 0
        ? <div style={{ background:T.surfaceHi, border:`1px dashed ${T.border}`, borderRadius:10, padding:"16px", textAlign:"center", fontSize:13, color:T.textDim, marginBottom:12 }}>Aucun produit assigné. Contactez votre responsable.</div>
        : <>
            {form.lines.map(line => (
              <div key={line.id} style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:12, padding:"13px", marginBottom:8 }}>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:10 }}>
                  <select
                    style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 11px", color:T.text, fontSize:13, outline:"none" }}
                    value={line.productId}
                    onChange={e=>updLine(line.id,"productId",e.target.value)}
                  >
                    {products.map(p=><option key={p.id} value={p.id}>{p.name} — {p.price} DT</option>)}
                  </select>
                  {form.lines.length > 1 && (
                    <button onClick={()=>rmLine(line.id)} style={{ background:"#1f0a0a", border:"none", color:T.danger, borderRadius:8, padding:"8px 11px", cursor:"pointer" }}>✕</button>
                  )}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[["Boxes vendues","boxes"],["Pots offerts 🎁","freePots"]].map(([lbl,key])=>(
                    <div key={key}>
                      <div style={{ fontSize:10, color:T.textDim, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>{lbl}</div>
                      <input
                        style={{ width:"100%", background:T.surface, border:`1px solid ${T.border}`, borderRadius:7, padding:"8px 10px", color:T.text, fontSize:14, outline:"none" }}
                        type="number" min="0" value={line[key]}
                        onChange={e=>updLine(line.id,key,e.target.value)}
                      />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize:10, color:T.textDim, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>Valeur</div>
                    <div style={{ padding:"8px 0", fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.gold }}>
                      {fmt((products.find(p=>p.id===line.productId)?.price||0)*12*Number(line.boxes||0))} DT
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addLine} style={{ width:"100%", padding:"9px", background:"none", border:`1px dashed ${T.border}`, borderRadius:10, color:T.textDim, cursor:"pointer", fontSize:13, marginBottom:12 }}>
              + Ajouter un produit
            </button>
          </>
      }

      {(formFin.gross > 0 || formFin.inv > 0) && <FinBlock gross={formFin.gross} inv={formFin.inv} net={formFin.net} />}

      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:7 }}>Résultat</div>
        <Pills options={OUTCOMES} value={form.outcome} onChange={v=>setF("outcome",v)} colorMap={OUTCOME_COLOR} />
      </div>

      <Input label="Note" value={form.note} onChange={v=>setF("note",v)} placeholder="Optionnel..." />

      <button className="eb-btn" onClick={onSubmit} disabled={saving} style={{
        width:"100%", padding:"14px", border:"none", borderRadius:12, fontSize:15, fontWeight:700,
        cursor:saving?"not-allowed":"pointer", transition:"all 0.2s",
        background:saved?"#34d399":T.accent, color:saved?"#0a1628":T.accentText,
        opacity:saving?0.7:1,
      }}>
        {saving ? "Enregistrement..." : saved ? "✓ Visite enregistrée !" : "Enregistrer la visite"}
      </button>

      {visits.length > 0 && <>
        <SectionTitle>Visites récentes</SectionTitle>
        {visits.slice(0,5).map(v=>(
          <VisitCard key={v.id} v={v} products={products} onDelete={()=>onDeleteVisit(v.id)} onConvert={()=>onConvertVisit(v.id,v.lines)} />
        ))}
      </>}
    </div>
  );
}

function VisitCard({ v, products, onDelete, onConvert }) {
  const T   = useTheme();
  const fin = calcFin(v.lines, products);
  return (
    <Card accent={OUTCOME_COLOR[v.outcome]}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
        <div style={{ fontWeight:700, fontSize:14 }}>{v.business}</div>
        <Badge color={OUTCOME_COLOR[v.outcome]}>{OUTCOME_ICON[v.outcome]} {v.outcome}</Badge>
      </div>
      <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>{v.zone&&`📍 ${v.zone} · `}{v.contact}</div>
      <div style={{ fontSize:12, color:T.textDim, marginBottom:fin.gross>0?6:0 }}>
        {(v.lines||[]).map(l=>{const p=products.find(p=>p.id===l.productId);return p?`${p.name} ×${l.boxes}${Number(l.freePots)>0?` (+${l.freePots}🎁)`:""}`:"";}).filter(Boolean).join(" · ")}
      </div>
      {fin.gross>0 && <div style={{ fontSize:12, color:T.gold, marginBottom:6 }}>Brut: {fmt(fin.gross)} · Net: {fmt(fin.net)} DT</div>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:11, color:T.textDim }}>{new Date(v.ts).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}</div>
        <div style={{ display:"flex", gap:6 }}>
          {v.outcome!=="Vendu" && <Btn size="sm" variant="success" onClick={onConvert}>✓</Btn>}
          <button onClick={onDelete} style={{ background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:13, padding:"4px 8px" }}>✕</button>
        </div>
      </div>
    </Card>
  );
}
