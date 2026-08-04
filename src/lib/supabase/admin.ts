import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  // Keep compatibility with the variable name initially configured in Vercel.
  const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLEY_KEY)?.trim();
  if (!url || !serviceRole) throw new Error("Falta configurar Supabase en el servidor.");
  return createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
}
