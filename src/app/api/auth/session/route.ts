import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/auth/admin";
export async function GET() { try { const { user, role } = await requireAdmin(); return NextResponse.json({ authenticated: true, email: user.email, role }); } catch (error) { const status = error instanceof AdminAuthError ? error.status : 500; return NextResponse.json({ authenticated: false }, { status }); } }
