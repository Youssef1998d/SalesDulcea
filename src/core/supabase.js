import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fztfqkwphcqtowlpqauy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGZxa3dwaGNxdG93bHBxYXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTk2ODMsImV4cCI6MjA5NjQ3NTY4M30.6Ik8_iZovHznLbR5VDSdpdsR4TE2To3i2w4ljv1Ax5w";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
