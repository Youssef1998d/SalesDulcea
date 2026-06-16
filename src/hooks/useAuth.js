import { useState, useEffect } from "react";
import { supabase } from "../core/supabase";

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [agent,   setAgent]   = useState(null);
  const [org,     setOrg]     = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAgent(uid) {
    const { data: agentData } = await supabase
      .from("agents")
      .select("*, organizations(*)")
      .eq("id", uid)
      .single();
    setAgent(agentData || null);
    setOrg(agentData?.organizations || null);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        loadAgent(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user);
        loadAgent(session.user.id);
      } else {
        setUser(null);
        setAgent(null);
        setOrg(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setAgent(null);
    setOrg(null);
  }

  return { user, agent, org, loading, logout };
}
