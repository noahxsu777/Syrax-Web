"use client";

import {
  Activity,
  Bell,
  ChevronDown,
  CircleCheck,
  Cloud,
  KeyRound,
  LayoutDashboard,
  Menu,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminTools, type AdminTool } from "./admin-tools";
import { AdminSection } from "./admin-sections";

const nav = [
  { label: "Resumen", icon: LayoutDashboard },
  { label: "Usuarios", icon: UsersRound, badge: "12" },
  { label: "Verificaciones", icon: ShieldCheck, badge: "5" },
  { label: "Lives y salas", icon: Radio },
  { label: "Contenido nuevo", icon: Sparkles, badge: "Nuevo" },
  { label: "Funciones", icon: SlidersHorizontal },
  { label: "Servicios", icon: Cloud },
  { label: "Notificaciones", icon: Bell },
  { label: "Mantenimiento", icon: Wrench },
  { label: "Auditoría", icon: Activity },
];

type DashboardData = {
  stats: { totalUsers: number; activeUsers: number; adminCount: number; enabledFeatures: number };
  signups: { date: string; value: number }[];
  activities: { id: number; action: string; resource_type: string; resource_id: string | null; created_at: string }[];
  generatedAt: string;
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Resumen");
  const [maintenance, setMaintenance] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [adminTool, setAdminTool] = useState<AdminTool>(null);
  const [userQuery, setUserQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/dashboard", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "No fue posible cargar Supabase.");
        return body as DashboardData;
      })
      .then(setDashboard)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setLoadError(error.message);
      });
    return () => controller.abort();
  }, []);

  const chartPoints = useMemo(() => {
    const values = dashboard?.signups.map((item) => item.value) ?? [];
    const max = Math.max(...values, 1);
    return values.map((value, index) => ({ x: index * (700 / 6), y: 210 - (value / max) * 170 }));
  }, [dashboard]);

  const chartLine = chartPoints.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark">V</span><div><strong>ZyraxCloud</strong><small>ADMIN</small></div></div>
        <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú"><X size={20}/></button>
        <nav>
          <p className="nav-label">PLATAFORMA</p>
          {nav.slice(0, 5).map((item) => <NavItem key={item.label} {...item} active={active === item.label} onClick={() => { setActive(item.label); setSidebarOpen(false); }}/>) }
          <p className="nav-label second">SISTEMA</p>
          {nav.slice(5).map((item) => <NavItem key={item.label} {...item} active={active === item.label} onClick={() => { setActive(item.label); setSidebarOpen(false); }}/>) }
        </nav>
        <div className="sidebar-footer">
          <div className="status-line"><span className="pulse"/>Todos los sistemas operativos</div>
          <small>Vibra Admin v1.0.0</small>
        </div>
      </aside>
      {sidebarOpen && <button className="backdrop" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)}/>}

      <main className="main">
        <header>
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Menu/></button>
          <form className="search" onSubmit={(event) => { event.preventDefault(); setAdminTool("users"); }}><Search size={18}/><input aria-label="Buscar usuarios" value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Buscar usuarios..."/><kbd>⌘ K</kbd></form>
          <div className="header-actions">
            <button className="icon-button" aria-label="Notificaciones"><Bell size={19}/><span className="notification-dot"/></button>
            <span className="divider"/>
            <button className="profile"><span>ZA</span><div><strong>Zyrax Admin</strong><small>Superadmin</small></div><ChevronDown size={16}/></button>
          </div>
        </header>

        <section className="content">
          {loadError && <div className="data-error" role="alert">{loadError}</div>}
          {active === "Resumen" ? <>
          <div className="welcome"><div><p>LUNES, 3 DE AGOSTO</p><h1>Buen día, Zyrax Admin <span>✦</span></h1><h2>Esto es lo que está pasando en Vibra.</h2></div><button className="primary"><Settings size={17}/> Configuración</button></div>

          <div className="stats-grid">
            <Stat label="Usuarios totales" value={formatNumber(dashboard?.stats.totalUsers)} delta="Supabase Auth" note="total registrado" icon={UsersRound} tone="violet" />
            <Stat label="Usuarios activos" value={formatNumber(dashboard?.stats.activeUsers)} delta="Últimos 30 días" note="con inicio de sesión" icon={Activity} tone="blue" />
            <Stat label="Administradores" value={formatNumber(dashboard?.stats.adminCount)} delta="Acceso interno" note="perfiles admin" icon={ShieldCheck} tone="pink" />
            <Stat label="Funciones activas" value={formatNumber(dashboard?.stats.enabledFeatures)} delta="Feature flags" note="habilitadas ahora" icon={SlidersHorizontal} tone="amber" />
          </div>

          <div className="dashboard-grid">
            <section className="panel overview-panel">
              <div className="panel-title"><div><h3>Nuevos usuarios</h3><p>Registros de Supabase Auth durante los últimos 7 días</p></div><button className="select-button">Últimos 7 días <ChevronDown size={15}/></button></div>
              <div className="chart-wrap">
                <div className="y-axis"><span>8k</span><span>6k</span><span>4k</span><span>2k</span><span>0</span></div>
                <div className="chart">
                  <svg viewBox="0 0 700 220" role="img" aria-label="Actividad semanal de usuarios">
                    <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7357e8" stopOpacity=".28"/><stop offset="100%" stopColor="#7357e8" stopOpacity="0"/></linearGradient></defs>
                    <path className="grid-lines" d="M0 20H700M0 70H700M0 120H700M0 170H700M0 220H700"/>
                    {chartLine && <path className="area" d={`${chartLine} L700 220 L0 220Z`}/>} 
                    {chartLine && <path className="line" d={chartLine}/>} 
                    {chartPoints.map(({ x, y }) => <circle key={x} cx={x} cy={y} r="5"/>)}
                  </svg>
                  <div className="x-axis"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
                </div>
              </div>
            </section>

            <section className="panel quick-panel">
              <div className="panel-title"><div><h3>Acciones rápidas</h3><p>Atajos de administración</p></div></div>
              <div className="quick-grid">
                <Quick icon={UsersRound} label="Buscar usuario" tone="violet" onClick={() => setAdminTool("users")} />
                <Quick icon={ShieldCheck} label="Ver verificaciones" tone="blue" onClick={() => setAdminTool("verifications")} />
                <Quick icon={Bell} label="Enviar aviso" tone="pink" />
                <Quick icon={KeyRound} label="Gestionar claves" tone="amber" />
              </div>
              <div className="maintenance-row"><div><span className="quick-icon red"><Wrench size={18}/></span><div><strong>Modo mantenimiento</strong><small>Bloquea temporalmente el acceso</small></div></div><button className={`toggle ${maintenance ? "on" : ""}`} onClick={() => setMaintenance(!maintenance)} aria-pressed={maintenance}><span/></button></div>
            </section>

            <section className="panel activity-panel">
              <div className="panel-title"><div><h3>Actividad reciente</h3><p>Últimos cambios en la plataforma</p></div><button className="text-button">Ver auditoría →</button></div>
              <div className="activity-list">{dashboard?.activities.length ? dashboard.activities.map((item, index) => <div className="activity-item" key={item.id}><span className={`activity-icon ${["violet", "pink", "amber", "blue"][index % 4]}`}><Activity size={17}/></span><div><strong>{humanize(item.action)}</strong><p>{humanize(item.resource_type)}{item.resource_id ? ` · ${item.resource_id}` : ""}</p></div><time>{relativeTime(item.created_at)}</time></div>) : <p className="empty-state">{dashboard ? "Aún no hay registros de auditoría." : "Cargando actividad…"}</p>}</div>
            </section>

            <section className="panel services-panel">
              <div className="panel-title"><div><h3>Estado de servicios</h3><p>Conexiones e integraciones</p></div><button className="icon-button"><Settings size={17}/></button></div>
              <Service name="Supabase" detail={dashboard ? `Sincronizado ${relativeTime(dashboard.generatedAt)}` : "Conectando…"} color="#3ecf8e" connected={Boolean(dashboard)} />
              <Service name="ZEGOCLOUD" detail="Streaming y salas" color="#5568ff" />
              <Service name="GIPHY" detail="Contenido multimedia" color="#ff4f92" />
              <div className="secure-note"><ShieldCheck size={17}/><span>Las credenciales se almacenan cifradas y nunca se muestran completas.</span></div>
            </section>
          </div>
          </> : <AdminSection section={active}/>} 
        </section>
      </main>
      <AdminTools tool={adminTool} query={userQuery} onClose={() => setAdminTool(null)} />
    </div>
  );
}

function NavItem({ label, icon: Icon, badge, active, onClick }: { label: string; icon: typeof LayoutDashboard; badge?: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}><Icon size={19}/><span>{label}</span>{badge && <b>{badge}</b>}</button>;
}
function Stat({ label, value, delta, note, icon: Icon, tone, live }: { label:string; value:string; delta:string; note:string; icon:typeof UsersRound; tone:string; live?:boolean }) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}><Icon size={22}/></span><span className="dots">•••</span></div><p>{label}</p><strong className="stat-value">{value}</strong><div className="stat-note"><span className={live ? "live-pill" : "positive"}>{live && <i/>}{delta}</span> {note}</div></article>;
}
function Quick({ icon: Icon, label, tone, onClick }: {icon:typeof UsersRound; label:string; tone:string;onClick?:()=>void}) { return <button className="quick-action" onClick={onClick}><span className={`quick-icon ${tone}`}><Icon size={19}/></span><span>{label}</span><b>›</b></button> }
function Service({name, detail, color, connected = true}:{name:string;detail:string;color:string;connected?:boolean}) { return <div className="service"><span className="service-logo" style={{background: color}}>{name[0]}</span><div><strong>{name}</strong><small>{detail}</small></div><span className={connected ? "connected" : "disconnected"}><CircleCheck size={14}/> {connected ? "Conectado" : "Pendiente"}</span></div> }

function formatNumber(value?: number) {
  return value === undefined ? "—" : new Intl.NumberFormat("es-CO").format(value);
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Ahora";
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  return `Hace ${Math.floor(seconds / 86400)} d`;
}
