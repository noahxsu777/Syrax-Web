import { NextResponse } from "next/server";

export async function GET() {
  // TODO: validar aquí la sesión y el rol admin antes de consultar servicios.
  return NextResponse.json({ status: "ok", services: { supabase: "configured", zegocloud: "configured", giphy: "configured" } });
}
