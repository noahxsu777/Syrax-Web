import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const updateSchema = z.object({ id: z.number().int().positive(), status: z.enum(["scheduled", "live", "ended", "cancelled"]) });

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("live_rooms").select("id, host_id, title, status, viewer_count, scheduled_at, started_at, ended_at, created_at").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ lives: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load live rooms", error);
    return NextResponse.json({ error: "No fue posible cargar lives y salas. Ejecuta el esquema actualizado en Supabase." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  try {
    const supabase = createAdminClient();
    const timestamps = parsed.data.status === "live" ? { started_at: new Date().toISOString() } : parsed.data.status === "ended" ? { ended_at: new Date().toISOString() } : {};
    const { error } = await supabase.from("live_rooms").update({ status: parsed.data.status, ...timestamps }).eq("id", parsed.data.id);
    if (error) throw error;
    await supabase.from("audit_logs").insert({ action: `live_${parsed.data.status}`, resource_type: "live_room", resource_id: String(parsed.data.id), after_data: { status: parsed.data.status } });
    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("Unable to update live room", error);
    return NextResponse.json({ error: "No fue posible actualizar la sala." }, { status: 500 });
  }
}
