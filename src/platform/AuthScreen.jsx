import { useState } from "react";
import { useTheme } from "../core/theme";
import { EBLogo } from "../components/layout/EBLogo";
import { Input, Btn, Pills } from "../components/ui";
import { supabase } from "../core/supabase";

const ACCOUNT_TYPES = [
  { id:"agent",         label:"Agent terrain",     permissions:["orders"] },
  { id:"stock_manager", label:"Responsable stock", permissions:["orders","stock_management"] },
];

export function AuthScreen({ onAuth }) {
  const T = useTheme();
  const [mode,        setMode]        = useState("login");
  const [email,       setEmail]       = useState("");
  const [pass,        setPass]        = useState("");
  const [name,        setName]        = useState("");
  const [phone,       setPhone]       = useState("");
  const [accountType, setAccountType] = useState("agent");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [ok,          setOk]          = useState(null);

  async function submit() {
    setError(null); setOk(null);
    if (!email || !pass) { setError("Email et mot de passe requis."); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        onAuth(data.user);
      } else {
        if (!name.trim()) { setError("Nom requis."); setLoading(false); return; }
        const type = ACCOUNT_TYPES.find(t => t.id === accountType);
        const { data: org } = await supabase.from("organizations").select("id").eq("active", true).limit(1).single();
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        const { error: agentError } = await supabase.from("agents").insert([{
          id: data.user.id, full_name: name.trim(), phone, org_id: org?.id || null,
          role: type.id, permissions: type.permissions, status: "pending",
        }]);
        if (agentError) throw agentError;
        setOk("Compte créé. En attente d'activation par votre responsable.");
        setMode("login");
      }
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <EBLogo size="lg" />
        <div style={{ marginTop:16, fontSize:13, color:T.textSub, letterSpacing:1 }}>SALES NETWORK</div>
        <div style={{ marginTop:8, fontSize:12, color:T.textDim }}>Construisez votre équipe. Conquérez votre territoire.</div>
      </div>

      {/* Card */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:18, padding:"28px 24px" }}>
        {/* Mode toggle */}
        <div style={{ display:"flex", background:T.surfaceHi, borderRadius:10, padding:3, marginBottom:24 }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={()=>{setMode(m);setError(null);setOk(null);}} style={{
              flex:1, padding:"9px", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, transition:"all 0.2s",
              background:mode===m?T.accent:"transparent",
              color:mode===m?T.accentText:T.textSub,
            }}>{m==="login"?"Connexion":"Créer un compte"}</button>
          ))}
        </div>

        {mode === "signup" && <>
          <Input label="Nom complet" value={name} onChange={setName} placeholder="Votre nom" />
          <Input label="Téléphone"   value={phone} onChange={setPhone} placeholder="+216 XX XXX XXX" />
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Type de compte</div>
            <Pills options={ACCOUNT_TYPES.map(t => t.label)} value={ACCOUNT_TYPES.find(t => t.id === accountType)?.label}
              onChange={label => setAccountType(ACCOUNT_TYPES.find(t => t.label === label).id)} />
          </div>
        </>}
        <Input label="Email"       value={email} onChange={setEmail} placeholder="vous@email.com" type="email" />
        <Input label="Mot de passe" value={pass} onChange={setPass}  placeholder="••••••••"       type="password" />

        {error && <div style={{ background:"#1f0a0a", border:`1px solid ${T.danger}44`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.danger, marginBottom:12 }}>{error}</div>}
        {ok    && <div style={{ background:"#0a1f14", border:`1px solid ${T.success}44`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.success, marginBottom:12 }}>{ok}</div>}

        <Btn style={{ width:"100%", marginTop:4 }} onClick={submit} disabled={loading}>
          {loading ? "..." : mode==="login" ? "Se connecter →" : "Créer mon compte →"}
        </Btn>
      </div>

      <div style={{ textAlign:"center", marginTop:24, fontSize:11, color:T.textDim }}>
        East Blue Sales Network · Tunis, Méditerranée
      </div>
    </div>
  );
}
