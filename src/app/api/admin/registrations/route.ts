import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminAuthResponse, requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const registrationSchema = z.object({
  platform: z.enum(["ios", "android", "web", "desktop", "unknown"]).default("unknown"),
  appVersion: z.string().trim().max(50).optional(),
});

export async function GET() {
  try { await requireAdmin(); } catch (error) { return adminAuthResponse(error); }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("user_registration_events").select("id, user_id, ip_address, platform, app_version, created_at").order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    const registrations = await Promise.all((data ?? []).map(async (event) => {
      const { data: userData } = await supabase.auth.admin.getUserById(event.user_id);
      return { ...event, user: userData.user ? { email: userData.user.email ?? null, name: String(userData.user.user_metadata?.full_name ?? userData.user.user_metadata?.name ?? "Sin nombre") } : null };
    }));
    return NextResponse.json({ registrations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load registration events", error);
    return NextResponse.json({ error: "No fue posible cargar los registros recientes. Ejecuta el esquema actualizado en Supabase." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = registrationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = forwarded || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const { error } = await supabase.from("user_registration_events").upsert({
      user_id: userData.user.id,
      ip_address: ipAddress,
      ip_hash: ipAddress ? createHash("sha256").update(ipAddress).digest("hex") : null,
      platform: parsed.data.platform,
      app_version: parsed.data.appVersion ?? null,
      user_agent: userAgent.slice(0, 500),
    }, { onConflict: "user_id" });
    if (error) throw error;
    return NextResponse.json({ recorded: true }, { status: 201 });
  } catch (error) {
    console.error("Unable to record registration event", error);
    return NextResponse.json({ error: "No fue posible registrar el evento." }, { status: 500 });
  }
}
