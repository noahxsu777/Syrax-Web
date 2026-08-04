import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminAuthResponse, requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().max(500).optional(),
});

export async function GET() {
  try { await requireAdmin(); } catch (error) { return adminAuthResponse(error); }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("verification_requests").select("id, user_id, document_type, document_url, status, submitted_at").eq("status", "pending").order("submitted_at", { ascending: true }).limit(50);
    if (error) throw error;

    const requests = await Promise.all((data ?? []).map(async (item) => {
      const { data: userData } = await supabase.auth.admin.getUserById(item.user_id);
      return {
        ...item,
        user: userData.user ? {
          email: userData.user.email ?? null,
          name: String(userData.user.user_metadata?.full_name ?? userData.user.user_metadata?.name ?? "Sin nombre"),
        } : null,
      };
    }));

    return NextResponse.json({ requests }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load verification requests", error);
    return NextResponse.json({ error: "No fue posible cargar las verificaciones. Ejecuta el esquema actualizado en Supabase." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try { await requireAdmin(); } catch (error) { return adminAuthResponse(error); }
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data: current, error: readError } = await supabase.from("verification_requests").select("id, user_id, status").eq("id", parsed.data.id).single();
    if (readError || !current) throw readError ?? new Error("Solicitud no encontrada");
    if (current.status !== "pending") return NextResponse.json({ error: "Esta solicitud ya fue revisada." }, { status: 409 });

    const { error: updateError } = await supabase.from("verification_requests").update({
      status: parsed.data.status,
      review_note: parsed.data.reviewNote ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", current.id).eq("status", "pending");
    if (updateError) throw updateError;

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(current.user_id);
    if (userError) throw userError;
    const { error: authError } = await supabase.auth.admin.updateUserById(current.user_id, {
      app_metadata: { ...userData.user.app_metadata, verified: parsed.data.status === "approved" },
    });
    if (authError) throw authError;

    await supabase.from("audit_logs").insert({
      action: `verification_${parsed.data.status}`,
      resource_type: "verification_request",
      resource_id: String(current.id),
      before_data: { status: "pending" },
      after_data: { status: parsed.data.status },
    });

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("Unable to update verification request", error);
    return NextResponse.json({ error: "No fue posible actualizar la verificación." }, { status: 500 });
  }
}
