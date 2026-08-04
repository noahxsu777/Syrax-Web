"use client";

import { Check, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type AdminTool = "users" | "verifications" | null;

type UserResult = { id: string; email: string | null; phone: string | null; name: string; createdAt: string; lastSignInAt: string | null; emailConfirmed: boolean; verified: boolean };
type Verification = { id: number; user_id: string; document_type: string; document_url: string | null; submitted_at: string; user: { email: string | null; name: string } | null };

export function AdminTools({ tool, query, onClose }: { tool: AdminTool; query: string; onClose: () => void }) {
  if (!tool) return null;
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={19}/></button>{tool === "users" ? <UserSearch initialQuery={query}/> : <VerificationQueue/>}</section></div>;
}

function UserSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [status, setStatus] = useState("");

  const search = useCallback(async (value: string) => {
    await Promise.resolve();
    if (value.trim().length < 2) return setStatus("Escribe al menos 2 caracteres.");
    setStatus("Buscando…");
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(value)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) return setStatus(body.error ?? "Error al buscar.");
    setUsers(body.users);
    setStatus(body.users.length ? "" : "No se encontraron usuarios.");
  }, []);

  useEffect(() => {
    if (initialQuery.trim().length < 2) return;
    const controller = new AbortController();
    fetch(`/api/admin/users?q=${encodeURIComponent(initialQuery)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => { if (ok) { setUsers(body.users); setStatus(body.users.length ? "" : "No se encontraron usuarios."); } else setStatus(body.error ?? "Error al buscar."); })
      .catch((error: Error) => { if (error.name !== "AbortError") setStatus("Error al buscar."); });
    return () => controller.abort();
  }, [initialQuery]);

  return <><div className="modal-heading"><span className="quick-icon violet"><Search size={19}/></span><div><h2>Buscar usuarios</h2><p>Busca por nombre, correo, teléfono o ID.</p></div></div><form className="modal-search" onSubmit={(event) => { event.preventDefault(); void search(query); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, correo, teléfono o UUID" autoFocus/><button type="submit">Buscar</button></form>{status && <p className="tool-status">{status}</p>}<div className="user-results">{users.map((user) => <article className="user-result" key={user.id}><span className="user-avatar">{initials(user.name)}</span><div><strong>{user.name}</strong><p>{user.email ?? user.phone ?? user.id}</p><small>Creado {new Date(user.createdAt).toLocaleDateString("es-CO")}</small></div><span className={user.verified ? "verification-pill approved" : "verification-pill"}>{user.verified ? <><Check size={12}/> Verificado</> : "Sin verificar"}</span></article>)}</div></>;
}

function VerificationQueue() {
  const [requests, setRequests] = useState<Verification[]>([]);
  const [status, setStatus] = useState("Cargando…");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/verifications", { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => { if (ok) { setRequests(body.requests); setStatus(body.requests.length ? "" : "No hay verificaciones pendientes."); } else setStatus(body.error ?? "No fue posible cargar las verificaciones."); })
      .catch((error: Error) => { if (error.name !== "AbortError") setStatus("No fue posible cargar las verificaciones."); });
    return () => controller.abort();
  }, []);

  async function review(id: number, decision: "approved" | "rejected") {
    setStatus("Guardando decisión…");
    const response = await fetch("/api/admin/verifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: decision }) });
    const body = await response.json();
    if (!response.ok) return setStatus(body.error ?? "No fue posible actualizar.");
    setRequests((current) => current.filter((request) => request.id !== id));
    setStatus("Decisión guardada.");
  }

  return <><div className="modal-heading"><span className="quick-icon blue"><ShieldCheck size={19}/></span><div><h2>Verificar cuentas</h2><p>Solicitudes pendientes en Supabase.</p></div></div>{status && <p className="tool-status">{status}</p>}<div className="verification-list">{requests.map((request) => <article className="verification-item" key={request.id}><div><strong>{request.user?.name ?? "Usuario"}</strong><p>{request.user?.email ?? request.user_id}</p><small>{request.document_type} · {new Date(request.submitted_at).toLocaleDateString("es-CO")}</small>{request.document_url && <a href={request.document_url} target="_blank" rel="noreferrer">Ver documento</a>}</div><div className="review-actions"><button className="reject-button" onClick={() => void review(request.id, "rejected")}>Rechazar</button><button className="approve-button" onClick={() => void review(request.id, "approved")}><Check size={14}/> Aprobar</button></div></article>)}</div></>;
}

function initials(name: string) { return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U"; }
