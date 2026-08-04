import { NextResponse } from "next/server";
import { adminAuthResponse, requireAdmin } from "@/lib/auth/admin";

export async function GET() {
  try { await requireAdmin(); } catch (error) { return adminAuthResponse(error); }
  // TODO: validar aquí la sesión y el rol admin antes de consultar servicios.
  return NextResponse.json({ status: "ok", services: { supabase: "configured", zegocloud: "configured", giphy: "configured" } });
}
