import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const updateSchema = z.object({ id: z.number().int().positive(), status: z.enum(["published", "hidden", "removed"]) });

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("content_items").select("id, user_id, type, title, media_url, thumbnail_url, status, created_at").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load content items", error);
    return NextResponse.json({ error: "No fue posible cargar el contenido nuevo. Ejecuta el esquema actualizado en Supabase." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("content_items").update({ status: parsed.data.status, reviewed_at: new Date().toISOString() }).eq("id", parsed.data.id);
    if (error) throw error;
    await supabase.from("audit_logs").insert({ action: `content_${parsed.data.status}`, resource_type: "content_item", resource_id: String(parsed.data.id), after_data: { status: parsed.data.status } });
    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("Unable to update content item", error);
    return NextResponse.json({ error: "No fue posible actualizar el contenido." }, { status: 500 });
  }
}
