import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) throw new AdminAuthError("Debes iniciar sesión.", 401);
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("admin_profiles").select("role").eq("user_id", data.user.id).single();
  if (profileError || !profile || !["admin", "superadmin"].includes(profile.role)) throw new AdminAuthError("No tienes permisos administrativos.", 403);
  return { user: data.user, role: profile.role as "admin" | "superadmin", admin };
}

export class AdminAuthError extends Error { constructor(message: string, public status: number) { super(message); } }
