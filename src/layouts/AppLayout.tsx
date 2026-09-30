import { SoframLogo } from '../components/Logo';
import { NavIcon } from '../components/NavIcon';
import { ResidenteModal } from '../components/residentes/ResidenteModal';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { habitacionesPermissions } from '../auth/habitacionesPermissions';
import { historiasClinicasPermissions } from '../auth/historiasClinicasPermissions';
import { gestionMedicaPermissions } from '../auth/gestionMedicaPermissions';
import { canAccessPersonal } from '../auth/personalPermissions';
import { canViewReportes } from '../auth/reportesPermissions';
import { canViewAuditoria } from '../auth/auditoriaPermissions';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/residentes', label: 'Residentes', icon: '👥' },
  { path: '/habitaciones', label: 'Habitaciones', icon: '🏠' },
  { path: '/historia-clinica', label: 'Historia Clínica', icon: '📋' },
  { path: '/gestion-medica', label: 'Gestión Médica', icon: '⚕️' },
  { path: '/personal', label: 'Personal', icon: '👤' },
  { path: '/calendario', label: 'Calendario', icon: '📅' },
  { path: '/actividades', label: 'Actividades', icon: '🎯' },
  { path: '/reportes', label: 'Reportes', icon: '📊' },
  { path: '/auditoria', label: 'Auditoría', icon: '🔍' },
];

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/residentes': 'Residentes',
  '/habitaciones': 'Habitaciones',
  '/historia-clinica': 'Historia Clínica',
  '/gestion-medica': 'Gestión Médica',
  '/personal': 'Personal',
  '/calendario': 'Calendario',
  '/actividades': 'Actividades',
  '/reportes': 'Reportes',
  '/auditoria': 'Auditoría',
};

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => { setSidebarOpen(false); setUserMenuOpen(false); }, [location.pathname]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSidebarOpen(false); setUserMenuOpen(false); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const { user, logout } = useAuth();

  const currentTitle = ROUTE_TITLES[location.pathname] ?? 'SOFRAM';

  function handleLogout() {
    logout();
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {sidebarOpen && <button aria-label="Cerrar navegación" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Sidebar */}
      <aside
        id="main-navigation" className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col h-full shrink-0 overflow-y-auto transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--primary)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="px-5 py-6 text-white border-b border-white/15"><SoframLogo size={76} textColor="var(--primary-foreground)" /></div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          {NAV_ITEMS.filter(item => (item.path !== '/habitaciones' || habitacionesPermissions(user?.rol).canRead)
            && (item.path !== '/historia-clinica' || historiasClinicasPermissions(user?.rol).canRead)
            && (item.path !== '/gestion-medica' || gestionMedicaPermissions(user?.rol).canAccess)
            && (item.path !== '/personal' || canAccessPersonal(user?.rol))
            && (item.path !== '/reportes' || canViewReportes(user?.rol))
            && (item.path !== '/auditoria' || canViewAuditoria(user?.rol))).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-white/15 border-l-2 border-accent'
                    : 'text-green-200 hover:text-white hover:bg-white/10'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'rgba(201,168,76,0.2)', borderLeft: '3px solid var(--accent)', paddingLeft: 9 }
                  : {}
              }
            >
              <NavIcon name={item.path.slice(1)} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Version */}
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>v1.0.0 · 2026</p>
        </div>
      </aside>

      {profileOpen && <ResidenteModal title="Mi perfil" busy={false} onClose={() => setProfileOpen(false)}>
        <dl className="grid gap-4">{[['Usuario', user?.username], ['Rol', user?.rol], ['ID de usuario', user?.id], ['ID de empleado', user?.empleadoId]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value ?? '—'}</dd></div>)}</dl>
      </ResidenteModal>}
      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="institutional-header shrink-0 flex items-center justify-between px-3 sm:px-6 h-18"
          style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <button type="button" className="lg:hidden p-2" aria-label="Abrir navegación" aria-controls="main-navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>☰</button>
            <h1 style={{ fontFamily: 'Lora, serif', fontWeight: 600, fontSize: 18, color: 'var(--primary)', lineHeight: 1 }}>
              {currentTitle}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* User menu */}
            <div className="relative">
              <button
                aria-expanded={userMenuOpen} aria-label="Menú de usuario" onKeyDown={e => { if (e.key === 'Escape') setUserMenuOpen(false); }} onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ background: 'var(--primary)' }}
                >
                  {user?.username?.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left max-w-36 sm:max-w-64">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)', lineHeight: 1.2 }}>{typeof user?.username === 'string' ? user.username : 'Usuario'}</p>
                  <p className="text-xs truncate" title={user?.rol} style={{ color: 'var(--muted-foreground)' }}>{user?.rol}</p>
                </div>
                <svg className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg py-1 z-50"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <button onClick={() => { setUserMenuOpen(false); setProfileOpen(true); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50" style={{ color: 'var(--foreground)' }}>
                    Mi perfil
                  </button>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                    style={{ color: '#DC2626' }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
