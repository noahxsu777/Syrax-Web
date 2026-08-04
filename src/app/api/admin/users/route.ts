import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAuthError, adminAuthResponse, requireAdmin } from "@/lib/auth/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { await requireAdmin(); } catch (error) { return authResponse(error); }
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (query.length === 1) return NextResponse.json({ error: "Escribe al menos 2 caracteres." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const matches: User[] = [];
    let page = 1;

    while (page <= 10 && matches.length < 20) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      matches.push(...data.users.filter((user) => {
        if (!query) return true;
        const name = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "");
        return [user.id, user.email, user.phone, name].some((value) => value?.toLowerCase().includes(query));
      }));
      if (data.users.length < 1000 || page * 1000 >= (data.total ?? 0)) break;
      page += 1;
    }

    return NextResponse.json({ users: matches.slice(0, query ? 20 : 50).map(publicUser) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to search Supabase users", error);
    return NextResponse.json({ error: "No fue posible buscar usuarios." }, { status: 500 });
  }
}

const updateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("edit"), id: z.string().uuid(), name: z.string().trim().min(1).max(100), email: z.string().email() }),
  z.object({ action: z.enum(["ban", "unban"]), id: z.string().uuid() }),
]);

export async function PATCH(request: Request) {
  try {
    const { user: actor, admin } = await requireAdmin();
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    const current = await admin.auth.admin.getUserById(parsed.data.id);
    if (current.error) throw current.error;
    const attributes = parsed.data.action === "edit" ? { email: parsed.data.email, user_metadata: { ...current.data.user.user_metadata, full_name: parsed.data.name } } : { ban_duration: parsed.data.action === "ban" ? "876000h" : "none" };
    const { error } = await admin.auth.admin.updateUserById(parsed.data.id, attributes);
    if (error) throw error;
    await admin.from("audit_logs").insert({ actor_id: actor.id, action: `user_${parsed.data.action}`, resource_type: "auth_user", resource_id: parsed.data.id });
    return NextResponse.json({ updated: true });
  } catch (error) { if (error instanceof AdminAuthError) return authResponse(error); console.error("Unable to update user", error); return NextResponse.json({ error: "No fue posible actualizar el usuario." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const { user: actor, role, admin } = await requireAdmin();
    if (role !== "superadmin") return NextResponse.json({ error: "Solo un superadmin puede eliminar usuarios." }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Usuario inválido." }, { status: 400 });
    if (id === actor.id) return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 409 });
    await admin.from("audit_logs").insert({ actor_id: actor.id, action: "user_deleted", resource_type: "auth_user", resource_id: id });
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (error) { if (error instanceof AdminAuthError) return authResponse(error); console.error("Unable to delete user", error); return NextResponse.json({ error: "No fue posible eliminar el usuario." }, { status: 500 }); }
}

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "Sin nombre"),
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at),
    verified: user.app_metadata?.verified === true,
    bannedUntil: user.banned_until ?? null,
  };
}

function authResponse(error: unknown) { return adminAuthResponse(error); }
