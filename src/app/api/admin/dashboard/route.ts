import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = createAdminClient();
    const users: User[] = [];
    let page = 1;
    let totalUsers = 0;

    while (page <= 10) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      totalUsers = data.total ?? data.users.length;
      users.push(...data.users);
      if (users.length >= totalUsers || data.users.length < 1000) break;
      page += 1;
    }

    const [{ count: adminCount, error: adminError }, { count: featureCount, error: featureError }, auditResult] = await Promise.all([
      supabase.from("admin_profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("feature_flags").select("key", { count: "exact", head: true }).eq("enabled", true),
      supabase.from("audit_logs").select("id, action, resource_type, resource_id, created_at").order("created_at", { ascending: false }).limit(4),
    ]);

    if (adminError) throw adminError;
    if (featureError) throw featureError;
    if (auditResult.error) throw auditResult.error;

    const now = Date.now();
    const activeUsers = users.filter((user) => {
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
      return lastSignIn >= now - 30 * DAY_MS;
    }).length;

    const signups = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now - (6 - index) * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        value: users.filter((user) => user.created_at.slice(0, 10) === key).length,
      };
    });

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          activeUsers,
          adminCount: adminCount ?? 0,
          enabledFeatures: featureCount ?? 0,
        },
        signups,
        activities: auditResult.data ?? [],
        generatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to load Supabase dashboard", error);
    return NextResponse.json(
      { error: "No fue posible cargar los datos de Supabase. Revisa las variables y el esquema en Vercel." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
