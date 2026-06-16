import { supabase } from "./supabase";

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password, profile) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  await supabase.from("agents").insert([{
    id:        data.user.id,
    full_name: profile.name,
    phone:     profile.phone || null,
    role:      "agent",
    status:    "pending",
  }]);
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => data.subscription.unsubscribe();
}
