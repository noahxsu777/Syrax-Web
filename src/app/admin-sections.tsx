"use client";

import { Check, Eye, Radio, Search, ShieldCheck, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type User = { id: string; email: string | null; phone: string | null; name: string; createdAt: string; lastSignInAt: string | null; emailConfirmed: boolean; verified: boolean; bannedUntil: string | null };
type Verification = { id: number; user_id: string; document_type: string; document_url: string | null; submitted_at: string; user: { email: string | null; name: string } | null };
type Live = { id: number; host_id: string; title: string; status: "scheduled" | "live" | "ended" | "cancelled"; viewer_count: number; scheduled_at: string | null; created_at: string };
type ContentItem = { id: number; user_id: string; type: string; title: string | null; media_url: string | null; thumbnail_url: string | null; status: "published" | "hidden" | "removed"; created_at: string };

export function AdminSection({ section }: { section: string }) {
  if (section === "Usuarios") return <UsersSection/>;
  if (section === "Verificaciones") return <VerificationsSection/>;
  if (section === "Lives y salas") return <LivesSection/>;
  if (section === "Contenido nuevo") return <ContentSection/>;
  return <PlaceholderSection title={section}/>;
}

function SectionHeader({ title, description, icon: Icon }: { title: string; description: string; icon: typeof UsersRound }) {
  return <div className="section-heading"><span className="section-icon"><Icon size={22}/></span><div><h1>{title}</h1><p>{description}</p></div></div>;
}

function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Cargando usuarios…");
  const load = useCallback(async (search = "") => {
    setMessage("Cargando usuarios…");
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) return setMessage(body.error ?? "No fue posible cargar usuarios.");
    setUsers(body.users); setMessage(body.users.length ? "" : "No se encontraron usuarios.");
  }, []);
  async function updateUser(user: User, action: "edit" | "ban" | "unban") { let payload: Record<string, string> = { id: user.id, action }; if (action === "edit") { const name = window.prompt("Nombre del usuario", user.name); if (!name) return; const email = window.prompt("Correo del usuario", user.email ?? ""); if (!email) return; payload = { ...payload, name, email }; } else if (!window.confirm(action === "ban" ? `¿Banear a ${user.name}?` : `¿Desbanear a ${user.name}?`)) return; setMessage("Guardando cambios…"); const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json(); if (!response.ok) return setMessage(body.error); await load(query); }
  async function deleteUser(user: User) { if (!window.confirm(`Esta acción eliminará permanentemente a ${user.name}. ¿Continuar?`)) return; if (!window.confirm("Confirmación final: esta acción no se puede deshacer.")) return; setMessage("Eliminando usuario…"); const response = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: "DELETE" }); const body = await response.json(); if (!response.ok) return setMessage(body.error); await load(query); }
  useEffect(() => { fetch("/api/admin/users", { cache: "no-store" }).then(async response => ({ ok: response.ok, body: await response.json() })).then(({ ok, body }) => { if (ok) { setUsers(body.users); setMessage(body.users.length ? "" : "No hay usuarios."); } else setMessage(body.error); }).catch(() => setMessage("No fue posible cargar usuarios.")); }, []);
  return <><SectionHeader title="Usuarios" description="Usuarios registrados en Supabase Auth." icon={UsersRound}/><section className="section-panel"><form className="section-search" onSubmit={(event) => { event.preventDefault(); void load(query); }}><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nombre, correo, teléfono o ID"/><button>Buscar</button></form>{message && <p className="section-message">{message}</p>}<div className="data-table"><div className="data-row data-head"><span>Usuario</span><span>Registro</span><span>Último acceso</span><span>Estado</span><span>Acciones</span></div>{users.map(user => { const banned = Boolean(user.bannedUntil && new Date(user.bannedUntil) > new Date()); return <div className="data-row" key={user.id}><span><strong>{user.name}</strong><small>{user.email ?? user.phone ?? user.id}</small></span><span>{shortDate(user.createdAt)}</span><span>{user.lastSignInAt ? relativeTime(user.lastSignInAt) : "Nunca"}</span><span><b className={`status-badge ${banned ? "danger" : user.verified ? "success" : "neutral"}`}>{banned ? "Baneado" : user.verified ? "Verificado" : "Activo"}</b></span><span className="user-actions"><button onClick={() => void updateUser(user, "edit")}>Editar</button><button className={banned ? "unban" : "ban"} onClick={() => void updateUser(user, banned ? "unban" : "ban")}>{banned ? "Desbanear" : "Banear"}</button><button className="delete" onClick={() => void deleteUser(user)}>Eliminar</button></span></div>; })}</div></section></>;
}

function VerificationsSection() {
  const [items, setItems] = useState<Verification[]>([]); const [message, setMessage] = useState("Cargando verificaciones…");
  useEffect(() => { fetch("/api/admin/verifications", { cache: "no-store" }).then(async response => ({ ok: response.ok, body: await response.json() })).then(({ ok, body }) => { if (ok) { setItems(body.requests); setMessage(body.requests.length ? "" : "No hay verificaciones pendientes."); } else setMessage(body.error); }).catch(() => setMessage("No fue posible cargar verificaciones.")); }, []);
  async function review(id: number, status: "approved" | "rejected") { setMessage("Guardando…"); const response = await fetch("/api/admin/verifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); const body = await response.json(); if (!response.ok) return setMessage(body.error); setItems(current => current.filter(item => item.id !== id)); setMessage("Decisión guardada."); }
  return <><SectionHeader title="Verificaciones" description="Revisa documentos y aprueba cuentas." icon={ShieldCheck}/><section className="section-panel">{message && <p className="section-message">{message}</p>}<div className="review-list">{items.map(item => <article className="review-card" key={item.id}><span className="section-icon small"><ShieldCheck size={17}/></span><div><strong>{item.user?.name ?? "Usuario"}</strong><p>{item.user?.email ?? item.user_id}</p><small>{item.document_type} · enviada {relativeTime(item.submitted_at)}</small>{item.document_url && <a href={item.document_url} target="_blank" rel="noreferrer"><Eye size={13}/> Ver documento</a>}</div><div className="row-actions"><button className="danger-action" onClick={() => void review(item.id, "rejected")}>Rechazar</button><button className="primary-action" onClick={() => void review(item.id, "approved")}><Check size={14}/> Aprobar</button></div></article>)}</div></section></>;
}

function LivesSection() {
  const [items, setItems] = useState<Live[]>([]); const [message, setMessage] = useState("Cargando lives…");
  const load = useCallback(() => fetch("/api/admin/lives", { cache: "no-store" }).then(async response => ({ ok: response.ok, body: await response.json() })).then(({ ok, body }) => { if (ok) { setItems(body.lives); setMessage(body.lives.length ? "" : "No hay lives o salas registradas."); } else setMessage(body.error); }).catch(() => setMessage("No fue posible cargar lives.")), []);
  useEffect(() => { void load(); }, [load]);
  async function update(id: number, status: Live["status"]) { setMessage("Actualizando sala…"); const response = await fetch("/api/admin/lives", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); const body = await response.json(); if (!response.ok) return setMessage(body.error); await load(); }
  return <><SectionHeader title="Lives y salas" description="Controla transmisiones activas y programadas." icon={Radio}/><div className="section-cards">{["live", "scheduled", "ended"].map(status => <article className="mini-stat" key={status}><strong>{items.filter(item => item.status === status).length}</strong><span>{status === "live" ? "En vivo" : status === "scheduled" ? "Programadas" : "Finalizadas"}</span></article>)}</div><section className="section-panel">{message && <p className="section-message">{message}</p>}<div className="review-list">{items.map(item => <article className="review-card" key={item.id}><span className={`live-dot ${item.status}`}/><div><strong>{item.title}</strong><p>{item.viewer_count} espectadores · {labelStatus(item.status)}</p><small>{item.scheduled_at ? shortDate(item.scheduled_at) : shortDate(item.created_at)}</small></div><div className="row-actions">{item.status === "scheduled" && <button className="primary-action" onClick={() => void update(item.id, "live")}>Iniciar</button>}{item.status === "live" && <button className="danger-action" onClick={() => void update(item.id, "ended")}>Finalizar</button>}</div></article>)}</div></section></>;
}

function ContentSection() {
  const [items, setItems] = useState<ContentItem[]>([]); const [message, setMessage] = useState("Cargando contenido…");
  const load = useCallback(() => fetch("/api/admin/content", { cache: "no-store" }).then(async response => ({ ok: response.ok, body: await response.json() })).then(({ ok, body }) => { if (ok) { setItems(body.items); setMessage(body.items.length ? "" : "Todavía no hay contenido nuevo."); } else setMessage(body.error); }).catch(() => setMessage("No fue posible cargar contenido.")), []);
  useEffect(() => { void load(); }, [load]);
  async function update(id: number, status: ContentItem["status"]) { setMessage("Actualizando contenido…"); const response = await fetch("/api/admin/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); const body = await response.json(); if (!response.ok) return setMessage(body.error); await load(); }
  return <><SectionHeader title="Contenido nuevo" description="Todo lo que los usuarios suben, ordenado desde lo más reciente." icon={Eye}/><section className="section-panel">{message && <p className="section-message">{message}</p>}<div className="content-grid">{items.map(item => <article className="content-card" key={item.id}>{item.thumbnail_url ? <div className="content-thumbnail" style={{ backgroundImage: `url(${item.thumbnail_url})` }}/> : <div className="content-placeholder"><Eye size={24}/></div>}<div><span className="content-type">{item.type}</span><strong>{item.title ?? "Contenido sin título"}</strong><small>{relativeTime(item.created_at)} · {labelStatus(item.status)}</small><div className="row-actions">{item.media_url && <a href={item.media_url} target="_blank" rel="noreferrer">Abrir</a>}<button className="danger-action" onClick={() => void update(item.id, item.status === "hidden" ? "published" : "hidden")}>{item.status === "hidden" ? "Publicar" : "Ocultar"}</button></div></div></article>)}</div></section></>;
}

function PlaceholderSection({ title }: { title: string }) { return <><SectionHeader title={title} description="Este módulo estará disponible próximamente." icon={UsersRound}/><section className="section-panel"><p className="section-message">Sin datos para mostrar.</p></section></>; }
function shortDate(value: string) { return new Date(value).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); }
function relativeTime(value: string) { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "Ahora"; if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`; if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`; return `Hace ${Math.floor(seconds / 86400)} d`; }
function labelStatus(value: string) { return ({ live: "En vivo", scheduled: "Programada", ended: "Finalizada", cancelled: "Cancelada", published: "Publicado", hidden: "Oculto", removed: "Eliminado" } as Record<string, string>)[value] ?? value; }
