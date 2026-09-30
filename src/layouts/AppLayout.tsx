import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router';
import { SoframIcon } from '../components/Logo';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const currentTitle = ROUTE_TITLES[location.pathname] ?? 'SOFRAM';

  function handleLogout() {
    logout();
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col h-full shrink-0 overflow-y-auto"
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--primary)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <SoframIcon size={42} />
          <div>
            <div style={{ color: '#F7F5F0', fontFamily: 'Lora, serif', fontWeight: 700, fontSize: 18, letterSpacing: '0.06em' }}>SOFRAM</div>
            <div style={{ color: 'var(--accent)', fontSize: 9, fontWeight: 500, letterSpacing: '0.05em', lineHeight: 1.3 }}>
              RESIDENCIA<br/>ADULTOS MAYORES
            </div>
          </div>
        </div>

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
                    ? 'text-white'
                    : 'text-green-200 hover:text-white hover:bg-white/10'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'rgba(201,168,76,0.2)', borderLeft: '3px solid var(--accent)', paddingLeft: 9 }
                  : {}
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Version */}
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>v1.0.0 · 2026</p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="shrink-0 flex items-center justify-between px-6 h-14"
          style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h1 style={{ fontFamily: 'Lora, serif', fontWeight: 600, fontSize: 18, color: 'var(--primary)', lineHeight: 1 }}>
              {currentTitle}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ background: 'var(--primary)' }}
                >
                  A
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)', lineHeight: 1.2 }}>{typeof user?.username === 'string' ? user.username : 'Usuario'}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user?.rol}</p>
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
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50" style={{ color: 'var(--foreground)' }}>
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
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
