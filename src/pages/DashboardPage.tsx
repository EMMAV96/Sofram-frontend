import { Link } from 'react-router';
import { listarResidentes } from '../api/residentesApi';
import { listarHabitaciones } from '../api/habitacionesApi';
import { listarEmpleados } from '../api/personalApi';
import { listarActividades } from '../api/actividadesApi';
import { listarAuditorias } from '../api/auditoriaApi';
import { useAuth } from '../auth/AuthContext';
import { USER_ROLES, type Role } from '../auth/roles';
import { habitacionesPermissions } from '../auth/habitacionesPermissions';
import { canAccessPersonal } from '../auth/personalPermissions';
import { canViewActividades } from '../auth/actividadesPermissions';
import { canViewAuditoria } from '../auth/auditoriaPermissions';
import { canViewReportes } from '../auth/reportesPermissions';
import { canViewCalendario } from '../auth/calendarioPermissions';
import { historiasClinicasPermissions } from '../auth/historiasClinicasPermissions';
import { gestionMedicaPermissions } from '../auth/gestionMedicaPermissions';
import { cardStyle, formatFecha } from '../components/residentes/shared';
import { DashboardPanel, DashboardStatCard, DistributionChart } from '../components/dashboard/DashboardWidgets';
import { useDashboardResource } from '../components/dashboard/useDashboardResource';
import { groupCounts, occupancySummary, recentResidents, localDateTime } from '../components/dashboard/dashboardData';

function DashboardContent({ role }: { role: Role }) {
  const therapist = role === 'TERAPISTA_OCUPACIONAL';
  const canResidents = USER_ROLES.includes(role);
  const canRooms = habitacionesPermissions(role).canRead;
  const canStaff = canAccessPersonal(role);
  const canActivities = canViewActividades(role);
  const canAudit = canViewAuditoria(role);
  const residents = useDashboardResource(listarResidentes, canResidents);
  const rooms = useDashboardResource(listarHabitaciones, canRooms);
  const staff = useDashboardResource(listarEmpleados, canStaff);
  const activities = useDashboardResource(listarActividades, canActivities);
  const audit = useDashboardResource(listarAuditorias, canAudit);
  const resources = [
    { enabled: canResidents, resource: residents }, { enabled: canRooms, resource: rooms },
    { enabled: canStaff, resource: staff }, { enabled: canActivities, resource: activities },
    { enabled: canAudit, resource: audit },
  ].filter(item => item.enabled);
  const loading = resources.some(item => item.resource.loading);
  const occupancy = occupancySummary(rooms.data);
  const latestResidents = recentResidents(residents.data);
  const quickActions = [
    { path: '/residentes', label: 'Residentes', enabled: canResidents },
    { path: '/habitaciones', label: 'Habitaciones', enabled: canRooms },
    { path: '/personal', label: 'Personal', enabled: canStaff },
    { path: '/historia-clinica', label: 'Historia Clínica', enabled: historiasClinicasPermissions(role).canRead },
    { path: '/gestion-medica', label: 'Gestión Médica', enabled: gestionMedicaPermissions(role).canAccess },
    { path: '/calendario', label: 'Calendario', enabled: canViewCalendario(role) },
    { path: '/actividades', label: 'Actividades', enabled: canActivities },
    { path: '/reportes', label: 'Reportes', enabled: canViewReportes(role) },
    { path: '/auditoria', label: 'Auditoría', enabled: canAudit },
  ].filter(item => item.enabled);

  return <div className="space-y-6 min-w-0">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{therapist ? 'Resumen de actividades y talleres para organizar su trabajo.' : 'Resumen de los registros disponibles para su perfil.'}</p>
      <button type="button" disabled={loading} onClick={() => resources.forEach(item => item.resource.reload())}
        className="px-4 py-2 rounded-lg text-sm disabled:opacity-50" style={cardStyle}>{loading ? 'Cargando…' : 'Actualizar'}</button>
    </div>
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${therapist ? '' : 'xl:grid-cols-5'} gap-4`}>
      {canResidents && <DashboardStatCard label="Residentes activos" value={residents.data.filter(r => r.fechaEgreso == null).length} sub={`Total registrados: ${residents.data.length}`} resource={residents} />}
      {canRooms && <>
        <DashboardStatCard label="Ocupación general" value={`${occupancy.percentage.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`} sub={`${occupancy.occupied} / ${occupancy.capacity} camas`} resource={rooms} />
        <DashboardStatCard label="Cupos disponibles" value={occupancy.available} resource={rooms} />
      </>}
      {canActivities && <DashboardStatCard label={therapist ? 'Actividades registradas' : 'Actividades cargadas'} value={activities.data.length} resource={activities} />}
      {canStaff && <DashboardStatCard label="Empleados activos" value={staff.data.filter(e => e.activo === true).length} resource={staff} />}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {canResidents && !therapist && <DashboardPanel title="Residentes por estado" resource={residents}>
        <DistributionChart data={groupCounts(residents.data.map(r => r.estadoActual), 'Sin estado')} />
      </DashboardPanel>}
      {canRooms && <DashboardPanel title="Ocupación de habitaciones" resource={rooms}>
        {!rooms.data.length ? <p className="text-sm">No hay habitaciones registradas.</p> : <ul className="max-h-80 overflow-y-auto space-y-4 pr-2">
          {rooms.data.map(room => <li key={room.id}>
            <div className="flex justify-between gap-3 text-sm mb-1"><span>Hab. {room.numero}</span><span>{room.ocupacionActual} / {room.capacidad}</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div className="h-full rounded-full" style={{ background: 'var(--primary)', width: `${room.capacidad > 0 ? Math.min(100, Math.max(0, room.ocupacionActual / room.capacidad * 100)) : 0}%` }} />
            </div>
          </li>)}
        </ul>}
      </DashboardPanel>}
      {canActivities && <>
        <DashboardPanel title="Actividades por tipo" resource={activities}><DistributionChart data={groupCounts(activities.data.map(a => a.tipo), 'Sin tipo')} /></DashboardPanel>
        <DashboardPanel title="Actividades por estado" resource={activities}><DistributionChart data={groupCounts(activities.data.map(a => a.estado), 'Sin estado')} /></DashboardPanel>
      </>}
    </div>
    {!therapist && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {canResidents && <DashboardPanel title="Últimos ingresos" resource={residents}>
        {!latestResidents.length ? <p className="text-sm">No hay ingresos con fecha válida.</p> : <ul className="space-y-3">
          {latestResidents.map(resident => <li key={resident.id} className="text-sm border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <p className="font-medium">{resident.apellido}, {resident.nombre}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{formatFecha(resident.fechaIngreso)}{resident.habitacionNumero ? ` · Hab. ${resident.habitacionNumero}` : ''}</p>
          </li>)}
        </ul>}
      </DashboardPanel>}
      {canAudit && <DashboardPanel title="Actividad reciente del sistema" resource={audit}>
        {!audit.data.length ? <p className="text-sm">No hay actividad registrada.</p> : <ul className="space-y-3">
          {audit.data.slice(0, 5).map(item => <li key={item.id} className="text-sm border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <p className="font-medium break-words">{item.accion} · {item.modulo}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{item.username} · {localDateTime(item.fechaHora)}</p>
            <p className="text-xs mt-2 whitespace-pre-wrap break-words">{item.detalle ?? '—'}</p>
          </li>)}
        </ul>}
      </DashboardPanel>}
    </div>}
    <section className="rounded-xl p-5" style={cardStyle}>
      <h3 className="mb-4 font-semibold" style={{ fontFamily: 'Lora, serif', color: 'var(--primary)' }}>Accesos rápidos</h3>
      <div className="flex flex-wrap gap-3">{quickActions.map(item => <Link key={item.path} to={item.path} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--muted)', color: 'var(--primary)' }}>{item.label}</Link>)}</div>
    </section>
  </div>;
}

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <DashboardContent key={`${user.id}-${user.rol}`} role={user.rol} />;
}
