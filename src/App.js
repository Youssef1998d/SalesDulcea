import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fztfqkwphcqtowlpqauy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGZxa3dwaGNxdG93bHBxYXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTk2ODMsImV4cCI6MjA5NjQ3NTY4M30.6Ik8_iZovHznLbR5VDSdpdsR4TE2To3i2w4ljv1Ax5w";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:"#0a1628", surface:"#0f2347", surfaceHi:"#162d5a", border:"#1a3a6b",
  accent:"#2e7dd4", accentHi:"#5298e8", gold:"#f0c040", goldDim:"#b8922a",
  text:"#e8f4ff", textSub:"#7eb8f7", textDim:"#3a5a8a",
  success:"#34d399", warning:"#fbbf24", danger:"#f87171", info:"#60a5fa",
};

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body { margin:0; background:${T.bg}; }
  input,select,textarea,button { font-family:'Inter',sans-serif; }
  input[type=number]::-webkit-inner-spin-button { opacity:0.4; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:${T.bg}; }
  ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:4px; }
  @keyframes wave { 0%,100%{transform:scaleX(0.6) translateX(-10px);opacity:0.4} 50%{transform:scaleX(1) translateX(0);opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .eb-card { animation:fadeUp 0.2s ease forwards; }
  .eb-btn:active { transform:scale(0.97); }
`;
document.head.appendChild(globalStyle);

// ─── Constants ────────────────────────────────────────────────────────────────
const OUTCOMES  = ["Vendu","Intéressé","Revenir","Refus"];
const CONTACTS  = ["Propriétaire","Manager","Employé"];
const CLIENT_TYPES = ["Café","Restaurant","Hôtel","Grossiste","Autre"];
const OUTCOME_COLOR = { Vendu:T.success, Intéressé:T.warning, Revenir:T.info, Refus:T.danger };
const OUTCOME_ICON  = { Vendu:"✓", Intéressé:"◎", Revenir:"↺", Refus:"✕" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = n => Number(n).toFixed(3);
const fmtS = n => Number(n).toFixed(2);
const emptyLine = ps => ({ id:Date.now()+Math.random(), productId:ps[0]?.id||"", boxes:1, freePots:0 });

function calcFin(lines, products) {
  let gross=0, inv=0;
  (lines||[]).forEach(l => {
    const p = products.find(p=>p.id===l.productId);
    if (!p) return;
    gross += p.price*12*Number(l.boxes||0);
    inv   += p.price*Number(l.freePots||0);
  });
  return { gross, inv, net:gross-inv };
}

function daysUntil(date, cycle) {
  if (!date) return null;
  const next = new Date(new Date(date).getTime()+cycle*86400000);
  return Math.ceil((next-new Date())/86400000);
}

function reorderStatus(days) {
  if (days===null) return { label:"Pas de commande", color:T.textDim };
  if (days<0)   return { label:`Retard ${Math.abs(days)}j`, color:T.danger };
  if (days<=5)  return { label:`Rappeler dans ${days}j`,    color:T.warning };
  if (days<=14) return { label:`Dans ${days}j`,             color:T.info };
  return              { label:`Dans ${days}j`,               color:T.success };
}

function exportCSV(visits, products) {
  const rows=[["Date","Heure","Point de vente","Zone","Contact","Produits","Boxes","Pots offerts","Brut DT","Invest. DT","Net DT","Résultat","Note"]];
  visits.forEach(v=>{
    const f=calcFin(v.lines,products); const d=new Date(v.ts);
    rows.push([d.toLocaleDateString("fr-FR"),`${d.getHours()}h${String(d.getMinutes()).padStart(2,"0")}`,v.business,v.zone||"",v.contact,(v.lines||[]).map(l=>products.find(p=>p.id===l.productId)?.name||"").join("|"),(v.lines||[]).reduce((s,l)=>s+Number(l.boxes||0),0),(v.lines||[]).reduce((s,l)=>s+Number(l.freePots||0),0),fmt(f.gross),fmt(f.inv),fmt(f.net),v.outcome,v.note||""]);
  });
  const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
  const a=document.createElement("a"); a.href=url; a.download=`eastblue_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Insert sales rows for a sold visit ──────────────────────────────────────
async function insertSales(visitId, agentId, lines, products) {
  const rows = (lines||[])
    .filter(l => Number(l.boxes||0) > 0)
    .map(l => {
      const p   = products.find(p=>p.id===l.productId);
      if (!p) return null;
      const gross  = p.price * 12 * Number(l.boxes);
      const inv    = p.price * Number(l.freePots||0);
      const net    = gross - inv;
      const rate   = p.commission_rate || 8;
      return {
        visit_id:           visitId,
        agent_id:           agentId,
        product_id:         p.id,
        product_name:       p.name,
        boxes:              Number(l.boxes),
        free_pots:          Number(l.freePots||0),
        unit_price:         p.price,
        gross_amount:       gross,
        investment_amount:  inv,
        net_amount:         net,
        commission_rate:    rate,
        commission_earned:  net * rate / 100,
      };
    }).filter(Boolean);
  if (rows.length > 0) await supabase.from("sales").insert(rows);
}

// ─── Design Components ────────────────────────────────────────────────────────
function EBLogo({ size="md", subtitle="" }) {
  const sz = size==="lg"?42:size==="sm"?18:26;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ position:"relative" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:sz, color:T.text, letterSpacing:3, lineHeight:1 }}>EAST BLUE</div>
        <div style={{ position:"absolute", bottom:-3, left:0, right:0, height:2, background:`linear-gradient(90deg,${T.accent},${T.gold})`, borderRadius:2, animation:"wave 3s ease-in-out infinite", transformOrigin:"left" }} />
      </div>
      {subtitle && <div style={{ fontSize:10, color:T.textSub, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginLeft:4 }}>{subtitle}</div>}
    </div>
  );
}

function Card({ children, accent, style={} }) {
  return (
    <div className="eb-card" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, borderLeft:accent?`3px solid ${accent}`:undefined, ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, variant="primary", size="md", style={} }) {
  const base = { display:"flex", alignItems:"center", justifyContent:"center", gap:6, border:"none", borderRadius:10, cursor:disabled?"not-allowed":"pointer", fontFamily:"'Inter',sans-serif", fontWeight:600, transition:"all 0.15s", opacity:disabled?0.6:1, ...style };
  const v = {
    primary:{ background:T.accent,   color:"#fff",    fontSize:size==="sm"?12:14, padding:size==="sm"?"7px 14px":"13px 20px" },
    gold:   { background:T.gold,     color:"#0a1628", fontSize:size==="sm"?12:14, padding:size==="sm"?"7px 14px":"13px 20px" },
    ghost:  { background:"transparent", color:T.textSub, border:`1px solid ${T.border}`, fontSize:size==="sm"?12:14, padding:size==="sm"?"6px 13px":"12px 19px" },
    danger: { background:"#1f0a0a", color:T.danger,  border:`1px solid ${T.danger}`, fontSize:size==="sm"?12:14, padding:size==="sm"?"6px 13px":"12px 19px" },
    success:{ background:"#0a1f14", color:T.success, border:`1px solid ${T.success}`, fontSize:size==="sm"?12:14, padding:size==="sm"?"6px 13px":"12px 19px" },
  };
  return <button className="eb-btn" style={{ ...base, ...v[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, value, onChange, placeholder, type="text", hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{label}</div>}
      <input style={{ width:"100%", background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:9, padding:"11px 13px", color:T.text, fontSize:14, outline:"none" }}
        type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border} />
      {hint && <div style={{ fontSize:11, color:T.textDim, marginTop:4 }}>{hint}</div>}
    </div>
  );
}

function Pills({ options, value, onChange, colorMap={} }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
      {options.map(o=>{
        const col=colorMap[o], active=value===o;
        return (
          <button key={o} className="eb-btn" onClick={()=>onChange(o)} style={{
            padding:"7px 14px", borderRadius:20, border:`1.5px solid ${active?(col||T.accent):T.border}`,
            background:active?(col||T.accent)+"22":"transparent", color:active?(col||T.accent):T.textSub,
            fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s"
          }}>{o}</button>
        );
      })}
    </div>
  );
}

function StatGrid({ stats }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
      {stats.map(s=>(
        <div key={s.label} style={{ background:s.accent?T.surfaceHi:T.surface, border:`1px solid ${s.accent?T.accent:T.border}`, borderRadius:12, padding:"14px 12px", textAlign:"center" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:s.accent?T.accent:T.text, letterSpacing:1 }}>{s.value}</div>
          <div style={{ fontSize:11, color:T.textSub, marginTop:2, fontWeight:500 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.gold, letterSpacing:2, marginBottom:12, marginTop:20, borderBottom:`1px solid ${T.border}`, paddingBottom:6 }}>{children}</div>;
}

function Badge({ children, color }) {
  return <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:color+"22", color, fontWeight:700, border:`1px solid ${color}44` }}>{children}</span>;
}

function FinBlock({ gross, inv, net }) {
  return (
    <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
      {[["Brut",`${fmt(gross)} DT`,T.textSub],["Investissement",`- ${fmt(inv)} DT`,T.danger],["Net",`${fmt(net)} DT`,T.gold]].map(([l,v,c])=>(
        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
          <span style={{ color:T.textDim }}>{l}</span>
          <span style={{ color:c, fontWeight:l==="Net"?700:400 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:6 }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:T.textSub }}>{sub}</div>}
    </div>
  );
}

function NBACard({ icon, title, text }) {
  return (
    <Card style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
      <div style={{ fontSize:26, minWidth:36, marginTop:2 }}>{icon}</div>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:13, color:T.textSub, lineHeight:1.6 }}>{text}</div>
      </div>
    </Card>
  );
}

function BottomBar({ tabs, active, onChange }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:T.surface, borderTop:`1px solid ${T.border}`, display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
      {tabs.map(t=>{
        const on=active===t.id;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)} style={{ flex:1, padding:"10px 4px 8px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, position:"relative" }}>
            {t.badge>0 && <div style={{ position:"absolute", top:6, right:"50%", transform:"translateX(12px)", background:T.danger, color:"#fff", fontSize:9, fontWeight:700, borderRadius:10, padding:"1px 5px", minWidth:16, textAlign:"center" }}>{t.badge}</div>}
            <div style={{ fontSize:20 }}>{t.icon}</div>
            <div style={{ fontSize:9, fontWeight:on?700:500, color:on?T.accent:T.textDim, letterSpacing:0.5, textTransform:"uppercase" }}>{t.label}</div>
            {on && <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:2, background:T.accent, borderRadius:"0 0 2px 2px" }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode,setMode]=[useState("login"),v=>setMode(v)][1]&&useState("login");
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [name,setName]=useState(""); const [phone,setPhone]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState(null); const [ok,setOk]=useState(null);
  const [md,setMd]=useState("login");

  async function submit() {
    setError(null); setOk(null);
    if (!email||!pass){setError("Email et mot de passe requis.");return;}
    setLoading(true);
    try {
      if (md==="login") {
        const {data,error}=await supabase.auth.signInWithPassword({email,password:pass});
        if (error) throw error; onAuth(data.user);
      } else {
        if (!name.trim()){setError("Nom requis.");setLoading(false);return;}
        const {data,error}=await supabase.auth.signUp({email,password:pass});
        if (error) throw error;
        await supabase.from("agents").insert([{id:data.user.id,full_name:name.trim(),phone,role:"agent",status:"pending"}]);
        setOk("Compte créé. En attente d'activation par votre responsable.");
        setMd("login");
      }
    } catch(e){setError(e.message);}
    finally{setLoading(false);}
  }

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <EBLogo size="lg" />
        <div style={{ marginTop:16, fontSize:13, color:T.textSub, letterSpacing:1 }}>SALES NETWORK</div>
        <div style={{ marginTop:8, fontSize:12, color:T.textDim }}>Construisez votre équipe. Conquérez votre territoire.</div>
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:18, padding:"28px 24px" }}>
        <div style={{ display:"flex", background:T.surfaceHi, borderRadius:10, padding:3, marginBottom:24 }}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMd(m);setError(null);setOk(null);}} style={{ flex:1, padding:"9px", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, transition:"all 0.2s", background:md===m?T.accent:"transparent", color:md===m?"#fff":T.textSub }}>
              {m==="login"?"Connexion":"Créer un compte"}
            </button>
          ))}
        </div>
        {md==="signup"&&<><Input label="Nom complet" value={name} onChange={setName} placeholder="Votre nom" /><Input label="Téléphone" value={phone} onChange={setPhone} placeholder="+216 XX XXX XXX" /></>}
        <Input label="Email" value={email} onChange={setEmail} placeholder="vous@email.com" type="email" />
        <Input label="Mot de passe" value={pass} onChange={setPass} placeholder="••••••••" type="password" />
        {error&&<div style={{ background:"#1f0a0a", border:`1px solid ${T.danger}44`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.danger, marginBottom:12 }}>{error}</div>}
        {ok&&<div style={{ background:"#0a1f14", border:`1px solid ${T.success}44`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.success, marginBottom:12 }}>{ok}</div>}
        <Btn style={{ width:"100%", marginTop:4 }} onClick={submit} disabled={loading}>{loading?"...":md==="login"?"Se connecter →":"Créer mon compte →"}</Btn>
      </div>
      <div style={{ textAlign:"center", marginTop:24, fontSize:11, color:T.textDim }}>East Blue Sales Network · Tunis, Méditerranée</div>
    </div>
  );
}

function PendingScreen({ status, onSignOut }) {
  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:20 }}>{status==="rejected"?"⛔":"⚓"}</div>
      <EBLogo size="md" />
      <div style={{ marginTop:24, fontSize:18, fontWeight:700, color:T.text }}>{status==="rejected"?"Compte refusé":"En attente d'activation"}</div>
      <div style={{ marginTop:12, fontSize:13, color:T.textSub, lineHeight:1.8, maxWidth:280 }}>
        {status==="rejected"?"Votre demande a été refusée. Contactez votre responsable.":"Votre compte est en cours d'examen. Votre responsable vous activera bientôt."}
      </div>
      <Btn variant="ghost" style={{ marginTop:32 }} onClick={onSignOut}>Se déconnecter</Btn>
    </div>
  );
}

// ─── KAM App ──────────────────────────────────────────────────────────────────
function KAMApp({ user, onSignOut }) {
  const [tab,setTab]               = useState("agents");
  const [agents,setAgents]         = useState([]);
  const [products,setProducts]     = useState([]);
  const [allVisits,setAllVisits]   = useState([]);
  const [allClients,setAllClients] = useState([]);
  const [allSales,setAllSales]     = useState([]);
  const [agentProducts,setAP]      = useState([]);
  const [loading,setLoading]       = useState(false);
  const [showPF,setShowPF]         = useState(false);
  const [pf,setPF]                 = useState({name:"",price:"",unit:""});
  const [editP,setEditP]           = useState(null);
  // assignment modal
  const [assignAgent,setAssignAgent] = useState(null);

  const loadAll = useCallback(async()=>{
    setLoading(true);
    const [ag,pr,vi,cl,sa,ap]=await Promise.all([
      supabase.from("agents").select("*").order("created_at",{ascending:false}),
      supabase.from("products").select("*").eq("active",true).order("name"),
      supabase.from("visits").select("*").order("ts",{ascending:false}),
      supabase.from("clients").select("*").order("created_at",{ascending:false}),
      supabase.from("sales").select("*").order("created_at",{ascending:false}),
      supabase.from("agent_products").select("*"),
    ]);
    setAgents(ag.data||[]); setProducts(pr.data||[]); setAllVisits(vi.data||[]);
    setAllClients(cl.data||[]); setAllSales(sa.data||[]); setAP(ap.data||[]);
    setLoading(false);
  },[]);

  useEffect(()=>{loadAll();},[loadAll]);

  async function approve(id){await supabase.from("agents").update({status:"active"}).eq("id",id);loadAll();}
  async function reject(id) {await supabase.from("agents").update({status:"rejected"}).eq("id",id);loadAll();}
  async function removeAgent(id){if(!window.confirm("Supprimer ?"))return;await supabase.from("agents").delete().eq("id",id);loadAll();}

  async function saveProd(){
    if(!pf.name||!pf.price)return;
    const p={name:pf.name.trim(),price:Number(pf.price),unit:pf.unit,active:true};
    if(editP) await supabase.from("products").update(p).eq("id",editP.id);
    else await supabase.from("products").insert([p]);
    setPF({name:"",price:"",unit:""}); setEditP(null); setShowPF(false); loadAll();
  }

  async function toggleProd(agentId, productId){
    const ex=agentProducts.find(ap=>ap.agent_id===agentId&&ap.product_id===productId);
    if(ex) await supabase.from("agent_products").delete().eq("id",ex.id);
    else   await supabase.from("agent_products").insert([{agent_id:agentId,product_id:productId,commission_rate:8}]);
    loadAll();
  }

  async function setCommissionRate(agentId, productId, rate){
    const ex=agentProducts.find(ap=>ap.agent_id===agentId&&ap.product_id===productId);
    if(!ex) return;
    await supabase.from("agent_products").update({commission_rate:Number(rate)}).eq("id",ex.id);
    loadAll();
  }

  function agentStats(id){
    const v=allVisits.filter(v=>v.agent_id===id), s=v.filter(v=>v.outcome==="Vendu");
    const sales=allSales.filter(s=>s.agent_id===id);
    const gmv=sales.reduce((a,s)=>a+Number(s.gross_amount||0),0);
    const comm=sales.reduce((a,s)=>a+Number(s.commission_earned||0),0);
    return {visits:v.length,sold:s.length,clients:allClients.filter(c=>c.agent_id===id).length,gmv,comm,conv:v.length?Math.round(s.length/v.length*100):0};
  }

  const pending=agents.filter(a=>a.status==="pending");
  const active=agents.filter(a=>a.status==="active"&&a.role==="agent");

  // Product sales summary
  const productSales = products.map(p=>{
    const rows=allSales.filter(s=>s.product_id===p.id);
    return { ...p, totalBoxes:rows.reduce((a,s)=>a+Number(s.boxes||0),0), totalGross:rows.reduce((a,s)=>a+Number(s.gross_amount||0),0), totalComm:rows.reduce((a,s)=>a+Number(s.commission_earned||0),0) };
  }).filter(p=>p.totalBoxes>0);

  const kamTabs=[
    {id:"agents",  icon:"👥", label:"Équipe",  badge:pending.length},
    {id:"products",icon:"📦", label:"Produits", badge:0},
    {id:"overview",icon:"📊", label:"Overview", badge:0},
    {id:"sales",   icon:"💰", label:"Ventes",   badge:0},
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", fontFamily:"'Inter',sans-serif", color:T.text, paddingBottom:80 }}>
      <div style={{ background:`linear-gradient(135deg,${T.surface},${T.bg})`, padding:"18px 20px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <EBLogo subtitle="KAM" />
        <Btn variant="ghost" size="sm" onClick={onSignOut}>Déconnexion</Btn>
      </div>

      {/* Assignment Modal */}
      {assignAgent && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"18px 18px 0 0", padding:"24px 20px", width:"100%", maxWidth:480, maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:T.gold, letterSpacing:2 }}>PRODUITS — {assignAgent.full_name}</div>
              <button onClick={()=>setAssignAgent(null)} style={{ background:"none", border:"none", color:T.textSub, fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            {products.length===0 && <EmptyState icon="📦" title="Aucun produit" sub="Ajoutez des produits d'abord" />}
            {products.map(p=>{
              const ap=agentProducts.find(a=>a.agent_id===assignAgent.id&&a.product_id===p.id);
              const assigned=!!ap;
              return (
                <div key={p.id} style={{ background:T.surfaceHi, border:`1px solid ${assigned?T.accent:T.border}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:assigned?10:0 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color:assigned?T.accent:T.text }}>{p.name}</div>
                      <div style={{ fontSize:11, color:T.textDim }}>{p.price} DT · {p.unit}</div>
                    </div>
                    <button className="eb-btn" onClick={()=>toggleProd(assignAgent.id,p.id)} style={{
                      padding:"6px 14px", borderRadius:20, border:`1.5px solid ${assigned?T.accent:T.border}`,
                      background:assigned?T.accent+"22":"transparent", color:assigned?T.accent:T.textSub,
                      fontSize:12, fontWeight:600, cursor:"pointer"
                    }}>{assigned?"✓ Assigné":"+ Assigner"}</button>
                  </div>
                  {assigned && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                      <div style={{ fontSize:11, color:T.textDim }}>Commission %</div>
                      <input type="number" min="0" max="100"
                        defaultValue={ap.commission_rate||8}
                        onBlur={e=>setCommissionRate(assignAgent.id,p.id,e.target.value)}
                        style={{ width:64, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:"5px 8px", color:T.gold, fontSize:13, fontWeight:700, outline:"none" }} />
                      <div style={{ fontSize:11, color:T.textDim }}>% sur les ventes nettes</div>
                    </div>
                  )}
                </div>
              );
            })}
            <Btn style={{ width:"100%", marginTop:8 }} onClick={()=>setAssignAgent(null)}>Fermer</Btn>
          </div>
        </div>
      )}

      <div style={{ padding:"16px 16px 0" }}>
        {loading && <EmptyState icon="⚓" title="Chargement..." sub="Récupération des données" />}

        {/* AGENTS */}
        {tab==="agents" && !loading && <>
          {pending.length>0 && <>
            <SectionTitle>Demandes en attente · {pending.length}</SectionTitle>
            {pending.map(a=>(
              <Card key={a.id} accent={T.warning}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{a.full_name}</div>
                    {a.phone&&<div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>📞 {a.phone}</div>}
                    <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>Inscrit le {new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <Badge color={T.warning}>En attente</Badge>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn size="sm" variant="success" onClick={()=>approve(a.id)}>✓ Approuver</Btn>
                  <Btn size="sm" variant="danger"  onClick={()=>reject(a.id)}>✕ Rejeter</Btn>
                </div>
              </Card>
            ))}
          </>}
          <SectionTitle>Agents actifs · {active.length}</SectionTitle>
          {active.length===0 && <EmptyState icon="🌊" title="Aucun agent actif" sub="Approuvez des demandes pour constituer votre équipe" />}
          {active.map(a=>{
            const st=agentStats(a.id);
            const assigned=agentProducts.filter(ap=>ap.agent_id===a.id);
            return (
              <Card key={a.id} accent={T.success}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{a.full_name}</div>
                    {a.phone&&<div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>📞 {a.phone}</div>}
                  </div>
                  <Badge color={T.success}>Actif</Badge>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
                  {[["Visites",st.visits],["Ventes",st.sold],[`${st.conv}%`,"Conv."],[`${fmtS(st.gmv)} DT`,"GMV"]].map(([v,l])=>(
                    <div key={l} style={{ background:T.surfaceHi, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.text }}>{v}</div>
                      <div style={{ fontSize:10, color:T.textDim }}>{l}</div>
                    </div>
                  ))}
                </div>
                {/* Product assignment summary */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>
                    Produits assignés ({assigned.length})
                  </div>
                  {assigned.length===0
                    ? <div style={{ fontSize:12, color:T.textDim, fontStyle:"italic" }}>Aucun produit assigné</div>
                    : <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {assigned.map(ap=>{
                          const p=products.find(p=>p.id===ap.product_id);
                          return p ? <span key={ap.id} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:T.accent+"22", color:T.accent, border:`1px solid ${T.accent}44` }}>{p.name} · {ap.commission_rate}%</span> : null;
                        })}
                      </div>
                  }
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Btn size="sm" variant="primary" onClick={()=>setAssignAgent(a)}>📦 Gérer produits</Btn>
                  <Btn size="sm" variant="danger"  onClick={()=>removeAgent(a.id)}>Supprimer</Btn>
                </div>
              </Card>
            );
          })}
        </>}

        {/* PRODUCTS */}
        {tab==="products" && !loading && <>
          <Btn style={{ width:"100%", marginBottom:16, marginTop:8 }} onClick={()=>{setEditP(null);setPF({name:"",price:"",unit:""});setShowPF(s=>!s);}}>
            {showPF?"✕ Annuler":"+ Nouveau produit"}
          </Btn>
          {showPF && (
            <Card>
              <SectionTitle>{editP?"Modifier le produit":"Nouveau produit"}</SectionTitle>
              <Input label="Nom *" value={pf.name} onChange={v=>setPF(f=>({...f,name:v}))} placeholder="Ex: Frappé Café" />
              <Input label="Prix unitaire (DT)" value={pf.price} onChange={v=>setPF(f=>({...f,price:v}))} placeholder="20" type="number" />
              <Input label="Unité" value={pf.unit} onChange={v=>setPF(f=>({...f,unit:v}))} placeholder="0.9kg, 1L..." />
              <Btn style={{ width:"100%" }} onClick={saveProd}>{editP?"Mettre à jour":"Ajouter le produit"}</Btn>
            </Card>
          )}
          <SectionTitle>Catalogue · {products.length} produits</SectionTitle>
          {products.length===0 && <EmptyState icon="📦" title="Aucun produit" sub="Ajoutez vos premiers produits au catalogue" />}
          {products.map(p=>(
            <Card key={p.id}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:T.gold }}>{p.price} DT</div>
              </div>
              {p.unit&&<div style={{ fontSize:12, color:T.textSub, marginBottom:6 }}>Unité: {p.unit}</div>}
              <div style={{ fontSize:12, color:T.textDim, marginBottom:10 }}>
                Assigné à {agentProducts.filter(ap=>ap.product_id===p.id).length} agent(s)
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn size="sm" variant="ghost" onClick={()=>{setEditP(p);setPF({name:p.name,price:p.price,unit:p.unit||""});setShowPF(true);}}>✎ Modifier</Btn>
                <Btn size="sm" variant="danger" onClick={async()=>{if(!window.confirm("Archiver ?"))return;await supabase.from("products").update({active:false}).eq("id",p.id);loadAll();}}>Archiver</Btn>
              </div>
            </Card>
          ))}
        </>}

        {/* OVERVIEW */}
        {tab==="overview" && !loading && <>
          <SectionTitle>Vue globale</SectionTitle>
          {(()=>{
            const totalGMV=allSales.reduce((a,s)=>a+Number(s.gross_amount||0),0);
            const totalComm=allSales.reduce((a,s)=>a+Number(s.commission_earned||0),0);
            return <>
              <StatGrid stats={[{label:"Agents actifs",value:active.length},{label:"Visites totales",value:allVisits.length},{label:"Ventes totales",value:allSales.length,accent:true},{label:"GMV total DT",value:fmtS(totalGMV),accent:true}]} />
              <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
                  <span style={{ color:T.textDim }}>Commissions agents totales</span>
                  <span style={{ color:T.gold, fontWeight:700 }}>{fmtS(totalComm)} DT</span>
                </div>
              </div>
            </>;
          })()}
          <SectionTitle>Performance par agent</SectionTitle>
          {active.length===0 && <EmptyState icon="🌊" title="Aucun agent actif" />}
          {active.map(a=>{
            const st=agentStats(a.id);
            return (
              <Card key={a.id}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontWeight:700 }}>{a.full_name}</div>
                  <Badge color={st.conv>=50?T.success:st.conv>=30?T.warning:T.danger}>{st.conv}% conv.</Badge>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                  {[["Visites",st.visits],["Ventes",st.sold],["Clients",st.clients],[`${fmtS(st.gmv)} DT`,"GMV"]].map(([v,l])=>(
                    <div key={l} style={{ background:T.surfaceHi, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.text }}>{v}</div>
                      <div style={{ fontSize:10, color:T.textDim }}>{l}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </>}

        {/* SALES */}
        {tab==="sales" && !loading && <>
          <SectionTitle>Ventes par produit</SectionTitle>
          {productSales.length===0 && <EmptyState icon="💰" title="Aucune vente enregistrée" sub="Les ventes apparaîtront ici quand des agents logueront des visites vendues" />}
          {productSales.map(p=>(
            <Card key={p.id}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:T.gold }}>{fmtS(p.totalGross)} DT</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                {[["Boxes",fmtS(p.totalBoxes)],["CA brut DT",fmtS(p.totalGross)],["Commissions DT",fmtS(p.totalComm)]].map(([l,v])=>(
                  <div key={l} style={{ background:T.surfaceHi, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.text }}>{v}</div>
                    <div style={{ fontSize:10, color:T.textDim }}>{l}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <SectionTitle>Dernières ventes</SectionTitle>
          {allSales.length===0 && <EmptyState icon="📋" title="Aucune vente" />}
          {allSales.slice(0,20).map(s=>{
            const ag=agents.find(a=>a.id===s.agent_id);
            return (
              <Card key={s.id}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{s.product_name}</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.gold }}>{fmtS(s.gross_amount)} DT</div>
                </div>
                <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>
                  {ag?.full_name||"Agent"} · {s.boxes} boxes
                </div>
                <div style={{ display:"flex", gap:12, fontSize:11, color:T.textDim }}>
                  <span>Commission: <span style={{ color:T.gold }}>{fmtS(s.commission_earned)} DT</span></span>
                  <span>{new Date(s.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </Card>
            );
          })}
        </>}
      </div>
      <BottomBar tabs={kamTabs} active={tab} onChange={setTab} />
    </div>
  );
}

// ─── Agent App ────────────────────────────────────────────────────────────────
function AgentApp({ user, agent, onSignOut }) {
  const [tab,setTab]         = useState("log");
  const [products,setProducts] = useState([]);
  const [visits,setVisits]   = useState([]);
  const [clients,setClients] = useState([]);
  const [vLoad,setVLoad]     = useState(false);
  const [cLoad,setCLoad]     = useState(false);
  const [form,setForm]       = useState(null);
  const [saving,setSaving]   = useState(false);
  const [saved,setSaved]     = useState(false);

  const emptyClientForm={name:"",type:CLIENT_TYPES[0],phone:"",address:"",first_order_date:"",last_order_date:"",last_order_amount:"",reorder_cycle_days:35,commission_rate:8,notes:""};
  const [showCF,setShowCF]   = useState(false);
  const [cf,setCF_]          = useState(emptyClientForm);
  const [cfSaving,setCFS]    = useState(false);
  const [editC,setEditC]     = useState(null);
  const setCF=(k,v)=>setCF_(f=>({...f,[k]:v}));

  const loadProds=useCallback(async()=>{
    const {data}=await supabase.from("agent_products").select("product_id,commission_rate,products(*)").eq("agent_id",user.id);
    const ps=(data||[]).map(ap=>({...ap.products,commission_rate:ap.commission_rate}));
    setProducts(ps);
    setForm(f=>f||{business:"",zone:"",contact:CONTACTS[0],lines:[emptyLine(ps)],outcome:OUTCOMES[0],note:""});
  },[user.id]);

  const loadVisits=useCallback(async()=>{
    setVLoad(true);
    const {data}=await supabase.from("visits").select("*").eq("agent_id",user.id).order("ts",{ascending:false});
    setVisits(data||[]); setVLoad(false);
  },[user.id]);

  const loadClients=useCallback(async()=>{
    setCLoad(true);
    const {data}=await supabase.from("clients").select("*").eq("agent_id",user.id).order("created_at",{ascending:false});
    setClients(data||[]); setCLoad(false);
  },[user.id]);

  useEffect(()=>{loadProds();loadVisits();loadClients();},[loadProds,loadVisits,loadClients]);

  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updLine=(id,k,v)=>setForm(f=>({...f,lines:f.lines.map(l=>l.id===id?{...l,[k]:v}:l)}));
  const addLine=()=>setForm(f=>({...f,lines:[...f.lines,emptyLine(products)]}));
  const rmLine=id=>setForm(f=>({...f,lines:f.lines.length>1?f.lines.filter(l=>l.id!==id):f.lines}));

  async function logVisit(){
    if(!form?.business.trim())return;
    setSaving(true);
    const now=new Date();
    const visitId=Date.now();
    try {
      const payload={id:visitId,agent_id:user.id,ts:now.toISOString(),hour:now.getHours(),business:form.business.trim(),zone:form.zone,contact:form.contact,lines:form.lines.map(l=>({productId:l.productId,boxes:Number(l.boxes),freePots:Number(l.freePots)})),outcome:form.outcome,note:form.note};
      const {error}=await supabase.from("visits").insert([payload]);
      if(error) throw error;
      // Insert sales rows if outcome is Vendu
      if(form.outcome==="Vendu"){
        await insertSales(visitId, user.id, form.lines, products);
      }
      await loadVisits();
      setForm({business:"",zone:"",contact:CONTACTS[0],lines:[emptyLine(products)],outcome:OUTCOMES[0],note:""});
      setSaved(true); setTimeout(()=>setSaved(false),2000);
    } catch(e){alert("Erreur: "+e.message);}
    finally{setSaving(false);}
  }

  async function convertV(id,lines){
    await supabase.from("visits").update({outcome:"Vendu"}).eq("id",id).eq("agent_id",user.id);
    // Insert sales for converted visit
    await insertSales(id, user.id, lines, products);
    loadVisits();
  }

  async function deleteV(id){await supabase.from("visits").delete().eq("id",id).eq("agent_id",user.id);loadVisits();}

  async function saveClient(){
    if(!cf.name.trim())return; setCFS(true);
    try{
      const p={agent_id:user.id,name:cf.name.trim(),type:cf.type,phone:cf.phone,address:cf.address,first_order_date:cf.first_order_date||null,last_order_date:cf.last_order_date||null,last_order_amount:cf.last_order_amount?Number(cf.last_order_amount):null,reorder_cycle_days:Number(cf.reorder_cycle_days)||35,commission_rate:Number(cf.commission_rate)||8,notes:cf.notes};
      if(editC) await supabase.from("clients").update(p).eq("id",editC.id).eq("agent_id",user.id);
      else await supabase.from("clients").insert([p]);
      setCF_(emptyClientForm); setShowCF(false); setEditC(null); loadClients();
    }catch(e){alert("Erreur: "+e.message);}
    finally{setCFS(false);}
  }

  async function delClient(id){if(!window.confirm("Supprimer ?"))return;await supabase.from("clients").delete().eq("id",id).eq("agent_id",user.id);loadClients();}
  async function reorder(c){const amt=window.prompt(`Montant (DT) — ${c.name} ?`);if(!amt)return;await supabase.from("clients").update({last_order_date:new Date().toISOString().slice(0,10),last_order_amount:Number(amt)}).eq("id",c.id).eq("agent_id",user.id);loadClients();}
  function editClient(c){setCF_({name:c.name,type:c.type||CLIENT_TYPES[0],phone:c.phone||"",address:c.address||"",first_order_date:c.first_order_date||"",last_order_date:c.last_order_date||"",last_order_amount:c.last_order_amount||"",reorder_cycle_days:c.reorder_cycle_days||35,commission_rate:c.commission_rate||8,notes:c.notes||""});setEditC(c);setShowCF(true);}

  const sold=visits.filter(v=>v.outcome==="Vendu");
  const followups=visits.filter(v=>v.outcome==="Intéressé"||v.outcome==="Revenir");
  const total=visits.length;
  const convRate=total?Math.round(sold.length/total*100):0;
  let tGross=0,tInv=0,tBoxes=0;
  sold.forEach(v=>{const f=calcFin(v.lines,products);tGross+=f.gross;tInv+=f.inv;(v.lines||[]).forEach(l=>{tBoxes+=Number(l.boxes||0);});});
  visits.filter(v=>v.outcome!=="Vendu").forEach(v=>{tInv+=calcFin(v.lines,products).inv;});
  const urgentClients=clients.filter(c=>{const d=daysUntil(c.last_order_date,c.reorder_cycle_days);return d!==null&&d<=5;});
  const totalComm=clients.reduce((s,c)=>!c.last_order_amount||!c.commission_rate?s:s+(c.last_order_amount*c.commission_rate/100),0);
  const formFin=form?calcFin(form.lines,products):{gross:0,inv:0,net:0};
  const todayStr=new Date().toDateString();

  const agentTabs=[
    {id:"log",     icon:"📋",label:"Log",    badge:0},
    {id:"followup",icon:"🔁",label:"Relances",badge:followups.length},
    {id:"clients", icon:"👥",label:"Clients", badge:urgentClients.length},
    {id:"dash",    icon:"📊",label:"Stats",   badge:0},
    {id:"nba",     icon:"🎯",label:"Action",  badge:0},
  ];

  if(!form) return <div style={{ background:T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ color:T.textSub }}>Chargement...</div></div>;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", fontFamily:"'Inter',sans-serif", color:T.text, paddingBottom:90 }}>
      <div style={{ background:`linear-gradient(135deg,${T.surface},${T.bg})`, padding:"16px 20px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div><EBLogo size="sm" /><div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{agent?.full_name}</div></div>
        <div style={{ display:"flex", gap:8 }}>
          {visits.length>0&&<Btn size="sm" variant="ghost" onClick={()=>exportCSV(visits,products)}>⬇ CSV</Btn>}
          <Btn size="sm" variant="ghost" onClick={onSignOut}>Déco</Btn>
        </div>
      </div>

      <div style={{ padding:"16px 16px 0" }}>

        {/* LOG */}
        {tab==="log"&&<>
          <Input label="Point de vente" value={form.business} onChange={v=>setF("business",v)} placeholder="Café, restaurant, grossiste..." />
          <Input label="Zone" value={form.zone} onChange={v=>setF("zone",v)} placeholder="Aouina, Lac, Ennasr..." />
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:7 }}>Contact</div>
            <Pills options={CONTACTS} value={form.contact} onChange={v=>setF("contact",v)} />
          </div>
          <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Produits</div>
          {products.length===0&&<div style={{ background:T.surfaceHi, border:`1px dashed ${T.border}`, borderRadius:10, padding:"16px", textAlign:"center", fontSize:13, color:T.textDim, marginBottom:12 }}>Aucun produit assigné. Contactez votre responsable.</div>}
          {form.lines.map(line=>(
            <div key={line.id} style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:12, padding:"13px", marginBottom:8 }}>
              <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:10 }}>
                <select style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 11px", color:T.text, fontSize:13, outline:"none" }}
                  value={line.productId} onChange={e=>updLine(line.id,"productId",e.target.value)}>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name} — {p.price} DT</option>)}
                </select>
                {form.lines.length>1&&<button onClick={()=>rmLine(line.id)} style={{ background:"#1f0a0a", border:"none", color:T.danger, borderRadius:8, padding:"8px 11px", cursor:"pointer" }}>✕</button>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[["Boxes vendues","boxes"],["Pots offerts 🎁","freePots"]].map(([lbl,key])=>(
                  <div key={key}>
                    <div style={{ fontSize:10, color:T.textDim, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>{lbl}</div>
                    <input style={{ width:"100%", background:T.surface, border:`1px solid ${T.border}`, borderRadius:7, padding:"8px 10px", color:T.text, fontSize:14, outline:"none" }}
                      type="number" min="0" value={line[key]} onChange={e=>updLine(line.id,key,e.target.value)} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize:10, color:T.textDim, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>Valeur</div>
                  <div style={{ padding:"8px 0", fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.gold }}>{fmt((products.find(p=>p.id===line.productId)?.price||0)*12*Number(line.boxes||0))} DT</div>
                </div>
              </div>
            </div>
          ))}
          {products.length>0&&<button onClick={addLine} style={{ width:"100%", padding:"9px", background:"none", border:`1px dashed ${T.border}`, borderRadius:10, color:T.textDim, cursor:"pointer", fontSize:13, marginBottom:12 }}>+ Ajouter un produit</button>}
          {(formFin.gross>0||formFin.inv>0)&&<FinBlock gross={formFin.gross} inv={formFin.inv} net={formFin.net} />}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:7 }}>Résultat</div>
            <Pills options={OUTCOMES} value={form.outcome} onChange={v=>setF("outcome",v)} colorMap={OUTCOME_COLOR} />
          </div>
          <Input label="Note" value={form.note} onChange={v=>setF("note",v)} placeholder="Optionnel..." />
          <button className="eb-btn" onClick={logVisit} disabled={saving} style={{ width:"100%", padding:"14px", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:saving?"not-allowed":"pointer", background:saved?T.success:T.accent, color:"#fff", opacity:saving?0.7:1 }}>
            {saving?"Enregistrement...":saved?"✓ Visite enregistrée !":"Enregistrer la visite"}
          </button>
          {!vLoad&&visits.length>0&&<>
            <SectionTitle>Visites récentes</SectionTitle>
            {visits.slice(0,5).map(v=><AgentVisitCard key={v.id} v={v} products={products} onDelete={()=>deleteV(v.id)} onConvert={()=>convertV(v.id,v.lines)} />)}
          </>}
        </>}

        {/* FOLLOWUP */}
        {tab==="followup"&&<>
          <SectionTitle>À relancer · {followups.length}</SectionTitle>
          {vLoad&&<EmptyState icon="⚓" title="Chargement..." />}
          {!vLoad&&followups.length===0&&<EmptyState icon="🎉" title="Aucune relance" sub="Tous vos prospects ont été traités" />}
          {followups.map(v=>(
            <Card key={v.id} accent={OUTCOME_COLOR[v.outcome]}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{v.business}</div>
                <Badge color={OUTCOME_COLOR[v.outcome]}>{OUTCOME_ICON[v.outcome]} {v.outcome}</Badge>
              </div>
              <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>{v.zone&&`📍 ${v.zone} · `}{v.contact}</div>
              <div style={{ fontSize:12, color:T.textDim, marginBottom:6 }}>{(v.lines||[]).map(l=>{const p=products.find(p=>p.id===l.productId);return p?`${p.name}${Number(l.freePots)>0?` (+${l.freePots}🎁)`:""}`:"";}).filter(Boolean).join(" · ")}</div>
              {v.note&&<div style={{ fontSize:12, color:T.textSub, fontStyle:"italic", marginBottom:8 }}>"{v.note}"</div>}
              <div style={{ fontSize:11, color:T.textDim, marginBottom:10 }}>{new Date(v.ts).toLocaleDateString("fr-FR")}</div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn size="sm" variant="success" onClick={()=>convertV(v.id,v.lines)}>✓ Vendu</Btn>
                <Btn size="sm" variant="danger" onClick={()=>deleteV(v.id)}>Supprimer</Btn>
              </div>
            </Card>
          ))}
        </>}

        {/* CLIENTS */}
        {tab==="clients"&&<>
          <StatGrid stats={[{label:"Clients actifs",value:clients.length},{label:"Commission / cycle",value:`${fmtS(totalComm)} DT`,accent:true}]} />
          {urgentClients.length>0&&<div style={{ background:"#1f0a0a", border:`1px solid ${T.danger}44`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:T.danger, display:"flex", alignItems:"center", gap:8 }}><span>🔴</span>{urgentClients.length} client(s) à recontacter cette semaine</div>}
          <Btn style={{ width:"100%", marginBottom:16 }} onClick={()=>{setEditC(null);setCF_(emptyClientForm);setShowCF(s=>!s);}}>{showCF?"✕ Annuler":"+ Nouveau client"}</Btn>
          {showCF&&<Card>
            <SectionTitle>{editC?"Modifier le client":"Nouveau client"}</SectionTitle>
            <Input label="Nom *" value={cf.name} onChange={v=>setCF("name",v)} placeholder="Café El Amal..." />
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:7 }}>Type</div>
              <Pills options={CLIENT_TYPES} value={cf.type} onChange={v=>setCF("type",v)} />
            </div>
            <Input label="Téléphone" value={cf.phone} onChange={v=>setCF("phone",v)} placeholder="+216 XX XXX XXX" />
            <Input label="Zone / Adresse" value={cf.address} onChange={v=>setCF("address",v)} placeholder="Lac, Centre-ville..." />
            <Input label="Date première commande" value={cf.first_order_date} onChange={v=>setCF("first_order_date",v)} type="date" />
            <Input label="Date dernière commande" value={cf.last_order_date} onChange={v=>setCF("last_order_date",v)} type="date" />
            <Input label="Montant dernière commande (DT)" value={cf.last_order_amount} onChange={v=>setCF("last_order_amount",v)} placeholder="250" type="number" />
            <Input label="Cycle réapprovisionnement (jours)" value={cf.reorder_cycle_days} onChange={v=>setCF("reorder_cycle_days",v)} type="number" hint="Jours entre chaque commande (ex: 35)" />
            <Input label="Taux commission (%)" value={cf.commission_rate} onChange={v=>setCF("commission_rate",v)} type="number" />
            <Input label="Notes" value={cf.notes} onChange={v=>setCF("notes",v)} placeholder="Préférences, infos utiles..." />
            <Btn style={{ width:"100%" }} onClick={saveClient} disabled={cfSaving}>{cfSaving?"Enregistrement...":editC?"Mettre à jour":"Ajouter le client"}</Btn>
          </Card>}
          {cLoad&&<EmptyState icon="⚓" title="Chargement..." />}
          {!cLoad&&clients.length===0&&!showCF&&<EmptyState icon="🏪" title="Aucun client" sub="Ajoutez vos premiers clients pour suivre vos commissions" />}
          {clients.map(c=>{
            const days=daysUntil(c.last_order_date,c.reorder_cycle_days);
            const status=reorderStatus(days);
            const proj=c.last_order_amount&&c.commission_rate?(c.last_order_amount*c.commission_rate/100).toFixed(2):null;
            return (
              <Card key={c.id} accent={status.color}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{c.name}</div>
                  <Badge color={status.color}>{status.label}</Badge>
                </div>
                <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>{c.type&&`${c.type} · `}{c.address&&`📍 ${c.address}`}</div>
                {c.phone&&<div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>📞 {c.phone}</div>}
                <div style={{ display:"flex", gap:16, margin:"8px 0" }}>
                  {c.last_order_amount&&<div style={{ fontSize:12 }}><span style={{ color:T.textDim }}>Cmd: </span><span style={{ color:T.text }}>{c.last_order_amount} DT</span></div>}
                  {proj&&<div style={{ fontSize:12 }}><span style={{ color:T.textDim }}>Commission: </span><span style={{ color:T.gold, fontWeight:700 }}>{proj} DT</span></div>}
                </div>
                {c.last_order_date&&<div style={{ fontSize:11, color:T.textDim, marginBottom:6 }}>Dernière commande: {new Date(c.last_order_date).toLocaleDateString("fr-FR")}</div>}
                {c.notes&&<div style={{ fontSize:12, color:T.textSub, fontStyle:"italic", marginBottom:8 }}>"{c.notes}"</div>}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Btn size="sm" variant="success" onClick={()=>reorder(c)}>✓ Nouvelle commande</Btn>
                  <Btn size="sm" variant="ghost" onClick={()=>editClient(c)}>✎</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>delClient(c.id)}>✕</Btn>
                </div>
              </Card>
            );
          })}
        </>}

        {/* DASH */}
        {tab==="dash"&&<>
          {vLoad?<EmptyState icon="⚓" title="Chargement..." />:<>
            <StatGrid stats={[{label:"Visites totales",value:total},{label:"Ventes",value:sold.length},{label:"Taux conv.",value:`${convRate}%`,accent:true},{label:"Boxes vendues",value:fmtS(tBoxes)}]} />
            <SectionTitle>Financier</SectionTitle>
            <FinBlock gross={tGross} inv={tInv} net={tGross-tInv} />
            <SectionTitle>Aujourd'hui</SectionTitle>
            <StatGrid stats={[{label:"Visites",value:visits.filter(v=>new Date(v.ts).toDateString()===todayStr).length},{label:"Ventes",value:sold.filter(v=>new Date(v.ts).toDateString()===todayStr).length}]} />
            {visits.length>0&&<Btn style={{ width:"100%", marginTop:8 }} variant="ghost" onClick={()=>exportCSV(visits,products)}>⬇ Exporter CSV</Btn>}
          </>}
        </>}

        {/* NBA */}
        {tab==="nba"&&<>
          <SectionTitle>Prochaine action</SectionTitle>
          {total===0&&<EmptyState icon="🗺️" title="Commencez à logger" sub="Vos recommandations apparaîtront ici" />}
          {urgentClients.length>0&&<NBACard icon="🔴" title="Clients à recontacter" text={`${urgentClients.map(c=>c.name).join(", ")} — commande attendue bientôt.`} />}
          {followups.length>0&&<NBACard icon="🔁" title="Relancer vos prospects" text={`${followups.length} prospect(s) en attente. Ne laissez pas refroidir l'intérêt.`} />}
          {convRate<30&&total>=5&&<NBACard icon="💡" title="Améliorer la conversion" text={`Taux à ${convRate}%. Proposez un pot d'essai pour lever les freins.`} />}
          {convRate>=50&&total>=5&&<NBACard icon="🚀" title="Vous êtes en forme !" text={`${convRate}% de conversion — augmentez votre volume de visites.`} />}
          {tInv>0&&tGross>0&&<NBACard icon="🎁" title="Retour sur échantillons" text={`${fmtS(tInv/tGross*100)}% du CA brut en échantillons. ${tInv/tGross>0.1?"Surveillez ce ratio.":"Excellent ratio ✓"}`} />}
        </>}
      </div>
      <BottomBar tabs={agentTabs} active={tab} onChange={setTab} />
    </div>
  );
}

function AgentVisitCard({ v, products, onDelete, onConvert }) {
  const fin=calcFin(v.lines,products);
  return (
    <Card accent={OUTCOME_COLOR[v.outcome]}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
        <div style={{ fontWeight:700, fontSize:14 }}>{v.business}</div>
        <Badge color={OUTCOME_COLOR[v.outcome]}>{OUTCOME_ICON[v.outcome]} {v.outcome}</Badge>
      </div>
      <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>{v.zone&&`📍 ${v.zone} · `}{v.contact}</div>
      <div style={{ fontSize:12, color:T.textDim, marginBottom:fin.gross>0?6:0 }}>{(v.lines||[]).map(l=>{const p=products.find(p=>p.id===l.productId);return p?`${p.name} ×${l.boxes}${Number(l.freePots)>0?` (+${l.freePots}🎁)`:""}`:"";}).filter(Boolean).join(" · ")}</div>
      {fin.gross>0&&<div style={{ fontSize:12, color:T.gold, marginBottom:6 }}>Brut: {fmt(fin.gross)} · Net: {fmt(fin.net)} DT{fin.inv>0&&<span style={{ color:T.danger }}> · -{fmt(fin.inv)} DT</span>}</div>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:11, color:T.textDim }}>{new Date(v.ts).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}</div>
        <div style={{ display:"flex", gap:6 }}>
          {v.outcome!=="Vendu"&&<Btn size="sm" variant="success" onClick={onConvert}>✓</Btn>}
          <button onClick={onDelete} style={{ background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:13, padding:"4px 8px" }}>✕</button>
        </div>
      </div>
    </Card>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]   = useState(null);
  const [agent,setAgent] = useState(null);
  const [loading,setLoading] = useState(true);

  async function loadAgent(uid){
    const {data}=await supabase.from("agents").select("*").eq("id",uid).single();
    setAgent(data||null); setLoading(false);
  }

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      if(data.session?.user){setUser(data.session.user);loadAgent(data.session.user.id);}
      else setLoading(false);
    });
    const {data:l}=supabase.auth.onAuthStateChange((_,s)=>{
      if(s?.user){setUser(s.user);loadAgent(s.user.id);}
      else{setUser(null);setAgent(null);setLoading(false);}
    });
    return ()=>l.subscription.unsubscribe();
  },[]);

  async function signOut(){await supabase.auth.signOut();setUser(null);setAgent(null);}

  if(loading) return (
    <div style={{ background:T.bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <EBLogo size="md" />
      <div style={{ fontSize:12, color:T.textDim, animation:"pulse 1.5s infinite" }}>Chargement...</div>
    </div>
  );

  if(!user) return <AuthScreen onAuth={u=>{setUser(u);loadAgent(u.id);}} />;
  if(!agent||agent.status==="pending") return <PendingScreen status="pending" onSignOut={signOut} />;
  if(agent.status==="rejected") return <PendingScreen status="rejected" onSignOut={signOut} />;
  if(agent.role==="kam") return <KAMApp user={user} agent={agent} onSignOut={signOut} />;
  return <AgentApp user={user} agent={agent} onSignOut={signOut} />;
}