"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("noahxdc12@gmail.com"); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setMessage(""); const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); const body = await response.json(); setLoading(false); if (!response.ok) return setMessage(body.error ?? "No fue posible iniciar sesión."); onSuccess(); }
  return <main className="login-screen"><form className="login-card" onSubmit={submit}><span className="login-mark"><ShieldCheck size={27}/></span><h1>Zyrax Admin</h1><p>Acceso seguro al centro de administración.</p><label>Correo administrativo<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email"/></label><label>Contraseña<input type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password"/></label>{message && <div className="login-error">{message}</div>}<button disabled={loading}><LockKeyhole size={16}/>{loading ? "Ingresando…" : "Iniciar sesión"}</button></form></main>;
}
