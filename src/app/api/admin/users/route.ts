import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
  };
}
