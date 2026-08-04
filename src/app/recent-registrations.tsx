"use client";

import { Monitor, Smartphone, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

type Registration = {
  id: number;
  user_id: string;
  ip_address: string | null;
  platform: "ios" | "android" | "web" | "desktop" | "unknown";
  app_version: string | null;
  created_at: string;
  user: { email: string | null; name: string } | null;
};

export function RecentRegistrations() {
  const [items, setItems] = useState<Registration[]>([]);
  const [message, setMessage] = useState("Cargando registros…");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/registrations", { cache: "no-store", signal: controller.signal })
      .then(async response => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => { if (ok) { setItems(body.registrations); setMessage(body.registrations.length ? "" : "Aún no hay eventos de registro."); } else setMessage(body.error); })
      .catch((error: Error) => { if (error.name !== "AbortError") setMessage("No fue posible cargar los registros."); });
    return () => controller.abort();
  }, []);

  return <section className="panel registrations-panel"><div className="panel-title"><div><h3>Nuevos usuarios registrados</h3><p>IP y plataforma capturadas al crear la cuenta</p></div><UserPlus size={18}/></div>{message && <p className="empty-state">{message}</p>}<div className="registration-table">{items.map(item => <div className="registration-row" key={item.id}><span className="registration-platform">{item.platform === "ios" || item.platform === "android" ? <Smartphone size={16}/> : <Monitor size={16}/>}</span><span><strong>{item.user?.name ?? "Usuario"}</strong><small>{item.user?.email ?? item.user_id}</small></span><span><strong>{platformLabel(item.platform)}</strong><small>{item.app_version ? `Versión ${item.app_version}` : "Versión desconocida"}</small></span><span><strong>{item.ip_address ?? "IP desconocida"}</strong><small>{relativeTime(item.created_at)}</small></span></div>)}</div></section>;
}

function platformLabel(value: Registration["platform"]) { return ({ ios: "iOS", android: "Android", web: "Web", desktop: "Escritorio", unknown: "Desconocida" })[value]; }
function relativeTime(value: string) { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "Ahora"; if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`; if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`; return `Hace ${Math.floor(seconds / 86400)} d`; }
