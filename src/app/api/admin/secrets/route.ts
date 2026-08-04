import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  service: z.enum(["zegocloud", "giphy"]),
  value: z.string().min(12).max(4096),
});

export async function PUT(request: Request) {
  // TODO: 1) validar sesión + MFA + rol superadmin; 2) cifrar con AES-GCM/KMS;
  // 3) guardar solo el ciphertext; 4) registrar actor/fecha/IP en audit_logs.
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  return NextResponse.json({ updated: true, service: parsed.data.service, masked: "••••••••••••" });
}
