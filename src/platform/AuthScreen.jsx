import { useState } from "react";
import { useTheme } from "../core/theme";
import { Btn } from "../components/ui";
import { supabase } from "../core/supabase";

const ACCOUNT_TYPES = [
  { id: "agent",         label: "Agent terrain",     permissions: ["orders"] },
  { id: "stock_manager", label: "Responsable stock",  permissions: ["orders", "stock_management"] },
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

  const inputStyle = (focused) => ({
    width: "100%", background: "transparent",
    border: "none", borderBottom: `1.5px solid ${focused ? T.accent : T.border}`,
    padding: "10px 0", color: T.text, fontSize: 15, outline: "none",
    transition: "border-color 0.15s",
  });

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
          id: data.user.id, full_name: name.trim(), phone,
          org_id: org?.id || null,
          role: type.id, permissions: type.permissions, status: "pending",
        }]);
        if (agentError) throw agentError;
        setOk("Compte créé. En attente d'activation par votre responsable.");
        setMode("login");
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      background: T.bg, minHeight: "100vh",
      display: "flex", flexDirection: "column",
      justifyContent: "center", padding: "32px 24px",
      maxWidth: 440, margin: "0 auto",
    }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 42, color: T.text, letterSpacing: 5, lineHeight: 1,
          marginBottom: 4,
        }}>
          EAST BLUE
        </div>
        <div style={{ position: "relative", height: 2, margin: "0 auto", width: 160, marginBottom: 16 }}>
          <div style={{
            height: 2, background: `linear-gradient(90deg, ${T.accent}, ${T.gold})`,
            borderRadius: 2, animation: "wave 3s ease-in-out infinite", transformOrigin: "left",
          }} />
        </div>
        <div style={{ fontSize: 12, color: T.textDim, letterSpacing: 2, textTransform: "uppercase" }}>
          Sales Network
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 20, padding: "28px 24px",
        boxShadow: T.shadowMd,
      }}>
        {/* Mode toggle */}
        <div style={{
          display: "flex", background: T.surfaceHi,
          borderRadius: 12, padding: 3, marginBottom: 28,
        }}>
          {[["login", "Connexion"], ["signup", "Créer un compte"]].map(([m, lbl]) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setOk(null); }}
              style={{
                flex: 1, padding: "10px", border: "none", borderRadius: 10,
                cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                background: mode === m ? T.accent : "transparent",
                color: mode === m ? T.accentText : T.textSub,
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Signup extra fields */}
        {mode === "signup" && (
          <>
            <FieldRow label="Nom complet">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" style={inputStyle(false)}
                onFocus={e => e.target.style.borderBottomColor = T.accent}
                onBlur={e => e.target.style.borderBottomColor = T.border} />
            </FieldRow>
            <FieldRow label="Téléphone">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 XX XXX XXX" style={inputStyle(false)}
                onFocus={e => e.target.style.borderBottomColor = T.accent}
                onBlur={e => e.target.style.borderBottomColor = T.border} />
            </FieldRow>
            <FieldRow label="Type de compte">
              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                {ACCOUNT_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAccountType(t.id)}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: 10,
                      border: `1.5px solid ${accountType === t.id ? T.accent : T.border}`,
                      background: accountType === t.id ? T.accent + "22" : "transparent",
                      color: accountType === t.id ? T.accent : T.textSub,
                      fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </FieldRow>
          </>
        )}

        <FieldRow label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" style={inputStyle(false)}
            onFocus={e => e.target.style.borderBottomColor = T.accent}
            onBlur={e => e.target.style.borderBottomColor = T.border} />
        </FieldRow>
        <FieldRow label="Mot de passe">
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={inputStyle(false)}
            onFocus={e => e.target.style.borderBottomColor = T.accent}
            onBlur={e => e.target.style.borderBottomColor = T.border} />
        </FieldRow>

        {error && (
          <div style={{
            background: T.mode === "dark" ? "#1f0a0a" : "#fff5f5",
            border: `1px solid ${T.danger}44`, borderRadius: 10,
            padding: "10px 14px", fontSize: 13, color: T.danger, marginBottom: 14,
            animation: "slideDown 0.2s ease",
          }}>
            {error}
          </div>
        )}
        {ok && (
          <div style={{
            background: T.mode === "dark" ? "#0a1f14" : "#f0fff8",
            border: `1px solid ${T.success}44`, borderRadius: 10,
            padding: "10px 14px", fontSize: 13, color: T.success, marginBottom: 14,
          }}>
            {ok}
          </div>
        )}

        <Btn
          size="lg"
          style={{ width: "100%", marginTop: 8, boxShadow: `0 4px 16px ${T.accent}44` }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? "..." : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
        </Btn>
      </div>

      <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: T.textDim }}>
        East Blue Sales Network · Tunis, Méditerranée
      </div>
    </div>
  );
}

function FieldRow({ label, children }) {
  const T = useTheme();
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, color: T.textSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
