import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.string().email(), password: z.string().min(6).max(200) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Credenciales inválidas." }, { status: 400 });
  const client = await createServerSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  const admin = createAdminClient();
  const { data: profile } = await admin.from("admin_profiles").select("role").eq("user_id", data.user.id).single();
  if (!profile || !["admin", "superadmin"].includes(profile.role)) { await client.auth.signOut(); return NextResponse.json({ error: "Esta cuenta no tiene acceso administrativo." }, { status: 403 }); }
  return NextResponse.json({ authenticated: true, email: data.user.email, role: profile.role });
}
