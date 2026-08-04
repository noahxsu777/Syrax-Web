import "server-only";
import { z } from "zod";

const privateEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SECRETS_ENCRYPTION_KEY: z.string().min(32),
});

export function getPrivateEnv() {
  return privateEnvSchema.parse(process.env);
}
