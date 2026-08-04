"use client";

import {
  Activity,
  Bell,
  ChevronDown,
  CircleCheck,
  CircleUserRound,
  Cloud,
  KeyRound,
  LayoutDashboard,
  Menu,
  MessageCircleMore,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { label: "Resumen", icon: LayoutDashboard },
  { label: "Usuarios", icon: UsersRound, badge: "12" },
  { label: "Verificaciones", icon: ShieldCheck, badge: "5" },
  { label: "Lives y salas", icon: Radio },
  { label: "Funciones", icon: SlidersHorizontal },
  { label: "Servicios", icon: Cloud },
  { label: "Notificaciones", icon: Bell },
  { label: "Mantenimiento", icon: Wrench },
  { label: "Auditoría", icon: Activity },
];

const activities = [
  { icon: CircleUserRound, tone: "violet", title: "Usuario verificado", detail: "@mafe_music fue aprobada por Camila", time: "Hace 4 min" },
  { icon: Radio, tone: "pink", title: "Live finalizado", detail: "Sala “Noches de Vibra” · 1.248 asistentes", time: "Hace 18 min" },
  { icon: KeyRound, tone: "amber", title: "Credencial actualizada", detail: "ZEGOCLOUD App Sign rotado por Santiago", time: "Hace 42 min" },
  { icon: MessageCircleMore, tone: "blue", title: "Notificación enviada", detail: "Mantenimiento programado · 18.420 destinatarios", time: "Hace 1 h" },
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Resumen");
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark">V</span><div><strong>ZyraxCloud</strong><small>ADMIN</small></div></div>
        <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú"><X size={20}/></button>
        <nav>
          <p className="nav-label">PLATAFORMA</p>
          {nav.slice(0, 4).map((item) => <NavItem key={item.label} {...item} active={active === item.label} onClick={() => { setActive(item.label); setSidebarOpen(false); }}/>) }
          <p className="nav-label second">SISTEMA</p>
          {nav.slice(4).map((item) => <NavItem key={item.label} {...item} active={active === item.label} onClick={() => { setActive(item.label); setSidebarOpen(false); }}/>) }
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
          <div className="search"><Search size={18}/><input aria-label="Buscar" placeholder="Buscar usuarios, salas o registros..."/><kbd>⌘ K</kbd></div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Notificaciones"><Bell size={19}/><span className="notification-dot"/></button>
            <span className="divider"/>
            <button className="profile"><span>CS</span><div><strong>Camila S.</strong><small>Superadmin</small></div><ChevronDown size={16}/></button>
          </div>
        </header>

        <section className="content">
          <div className="welcome"><div><p>LUNES, 3 DE AGOSTO</p><h1>Buen día, Camila <span>✦</span></h1><h2>Esto es lo que está pasando en Vibra.</h2></div><button className="primary"><Settings size={17}/> Configuración</button></div>

          <div className="stats-grid">
            <Stat label="Usuarios totales" value="24.892" delta="+8,4%" note="vs. mes anterior" icon={UsersRound} tone="violet" />
            <Stat label="Usuarios activos" value="7.306" delta="+12,1%" note="últimos 30 días" icon={Activity} tone="blue" />
            <Stat label="Lives ahora" value="38" delta="En vivo" note="2.841 espectadores" icon={Radio} tone="pink" live />
            <Stat label="Por verificar" value="12" delta="5 nuevas" note="desde ayer" icon={ShieldCheck} tone="amber" />
          </div>

          <div className="dashboard-grid">
            <section className="panel overview-panel">
              <div className="panel-title"><div><h3>Actividad de usuarios</h3><p>Usuarios activos durante los últimos 7 días</p></div><button className="select-button">Últimos 7 días <ChevronDown size={15}/></button></div>
              <div className="chart-wrap">
                <div className="y-axis"><span>8k</span><span>6k</span><span>4k</span><span>2k</span><span>0</span></div>
                <div className="chart">
                  <svg viewBox="0 0 700 220" role="img" aria-label="Actividad semanal de usuarios">
                    <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7357e8" stopOpacity=".28"/><stop offset="100%" stopColor="#7357e8" stopOpacity="0"/></linearGradient></defs>
                    <path className="grid-lines" d="M0 20H700M0 70H700M0 120H700M0 170H700M0 220H700"/>
                    <path className="area" d="M0 170 C45 155 70 163 110 135 S180 105 225 118 S295 85 340 96 S410 70 455 74 S525 54 570 66 S640 25 700 38 L700 220 L0 220Z"/>
                    <path className="line" d="M0 170 C45 155 70 163 110 135 S180 105 225 118 S295 85 340 96 S410 70 455 74 S525 54 570 66 S640 25 700 38"/>
                    {[['0','170'],['110','135'],['225','118'],['340','96'],['455','74'],['570','66'],['700','38']].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="5"/>)}
                  </svg>
                  <div className="x-axis"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
                </div>
              </div>
            </section>

            <section className="panel quick-panel">
              <div className="panel-title"><div><h3>Acciones rápidas</h3><p>Atajos de administración</p></div></div>
              <div className="quick-grid">
                <Quick icon={UsersRound} label="Buscar usuario" tone="violet" />
                <Quick icon={ShieldCheck} label="Ver verificaciones" tone="blue" />
                <Quick icon={Bell} label="Enviar aviso" tone="pink" />
                <Quick icon={KeyRound} label="Gestionar claves" tone="amber" />
              </div>
              <div className="maintenance-row"><div><span className="quick-icon red"><Wrench size={18}/></span><div><strong>Modo mantenimiento</strong><small>Bloquea temporalmente el acceso</small></div></div><button className={`toggle ${maintenance ? "on" : ""}`} onClick={() => setMaintenance(!maintenance)} aria-pressed={maintenance}><span/></button></div>
            </section>

            <section className="panel activity-panel">
              <div className="panel-title"><div><h3>Actividad reciente</h3><p>Últimos cambios en la plataforma</p></div><button className="text-button">Ver auditoría →</button></div>
              <div className="activity-list">{activities.map((item) => <div className="activity-item" key={item.title}><span className={`activity-icon ${item.tone}`}><item.icon size={17}/></span><div><strong>{item.title}</strong><p>{item.detail}</p></div><time>{item.time}</time></div>)}</div>
            </section>

            <section className="panel services-panel">
              <div className="panel-title"><div><h3>Estado de servicios</h3><p>Conexiones e integraciones</p></div><button className="icon-button"><Settings size={17}/></button></div>
              <Service name="Supabase" detail="Base de datos" color="#3ecf8e" />
              <Service name="ZEGOCLOUD" detail="Streaming y salas" color="#5568ff" />
              <Service name="GIPHY" detail="Contenido multimedia" color="#ff4f92" />
              <div className="secure-note"><ShieldCheck size={17}/><span>Las credenciales se almacenan cifradas y nunca se muestran completas.</span></div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function NavItem({ label, icon: Icon, badge, active, onClick }: { label: string; icon: typeof LayoutDashboard; badge?: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}><Icon size={19}/><span>{label}</span>{badge && <b>{badge}</b>}</button>;
}
function Stat({ label, value, delta, note, icon: Icon, tone, live }: { label:string; value:string; delta:string; note:string; icon:typeof UsersRound; tone:string; live?:boolean }) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}><Icon size={22}/></span><span className="dots">•••</span></div><p>{label}</p><strong className="stat-value">{value}</strong><div className="stat-note"><span className={live ? "live-pill" : "positive"}>{live && <i/>}{delta}</span> {note}</div></article>;
}
function Quick({ icon: Icon, label, tone }: {icon:typeof UsersRound; label:string; tone:string}) { return <button className="quick-action"><span className={`quick-icon ${tone}`}><Icon size={19}/></span><span>{label}</span><b>›</b></button> }
function Service({name, detail, color}:{name:string;detail:string;color:string}) { return <div className="service"><span className="service-logo" style={{background: color}}>{name[0]}</span><div><strong>{name}</strong><small>{detail}</small></div><span className="connected"><CircleCheck size={14}/> Conectado</span></div> }
