import { useState } from 'react';
import { obtenerActividad, listarParticipacionesPorActividad, type ActividadResponse, type ParticipacionActividadResponse } from '../../api/actividadesApi';
import { obtenerDetalle } from '../../api/calendariosApi';
import { listarResidentes } from '../../api/residentesApi';
import { listarEmpleados } from '../../api/personalApi';
import { useAuth } from '../../auth/AuthContext';
import { canViewActividades, canManageParticipaciones } from '../../auth/actividadesPermissions';
import { ParticipacionModal } from './ParticipacionModal';
import { ErrorNotice, cardStyle, formatFecha, inputStyle, primaryStyle, useApiResource } from '../residentes/shared';

export function ActividadDetalle({ actividadId }: { actividadId: number }) {
  const { user } = useAuth();
  const allowed = canViewActividades(user?.rol);
  const actividad = useApiResource(signal => obtenerActividad(actividadId, signal), `actividad-${actividadId}`, allowed);
  if (!allowed) return null;
  return <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
    {actividad.loading && <p role="status">Cargando actividad…</p>}
    {actividad.error && <ErrorNotice message={actividad.error} retry={actividad.reload} />}
    {actividad.data && <DatosActividad actividad={actividad.data} />}
  </div>;
}
function DatosActividad({ actividad }: { actividad: ActividadResponse }) {
  const { user } = useAuth();
  const allowed = canViewActividades(user?.rol);
  const detalle = useApiResource(signal => obtenerDetalle(actividad.detalleCalendarioId, signal), `contexto-${actividad.detalleCalendarioId}`, allowed);
  const empleados = useApiResource(listarEmpleados, 'responsable-actividad', allowed && user?.rol === 'ADMINISTRADOR');
  const empleado = empleados.data?.find(e => e.id === actividad.empleadoId);
  return <>
    <h3 style={{ fontFamily: 'Lora, serif', fontWeight: 600, fontSize: 16, color: 'var(--primary)' }}>{actividad.nombre}</h3>
    <div className="space-y-2 text-sm">
      <p className="whitespace-pre-wrap break-words">{actividad.descripcion || 'Sin descripción'}</p>
      <p>Tipo: {actividad.tipo}</p><p>Duración: {actividad.duracion}</p><p>Cupo máximo: {actividad.cupoMaximo}</p><p>Estado: {actividad.estado}</p>
      {user?.rol === 'ADMINISTRADOR' ? <>
        {empleados.loading && <p role="status">Cargando responsable…</p>}
        {empleados.error && <ErrorNotice message={empleados.error} retry={empleados.reload} />}
        {empleados.data && <p>Responsable: {empleado ? `${empleado.apellido}, ${empleado.nombre} — ${empleado.cargoNombre}` : `Empleado #${actividad.empleadoId}`}</p>}
      </> : user?.rol === 'TERAPISTA_OCUPACIONAL' && actividad.empleadoId === user.empleadoId ? <p>Actividad propia</p> : null}
    </div>
    {detalle.loading && <p role="status" className="text-sm">Cargando franja del calendario…</p>}
    {detalle.error && <ErrorNotice message={detalle.error} retry={detalle.reload} />}
    {detalle.data && <p className="text-sm">{formatFecha(detalle.data.fecha)} · {detalle.data.horaInicio} a {detalle.data.horaFin}</p>}
    {canManageParticipaciones(user?.rol) && <Participantes key={actividad.id} actividad={actividad} fecha={detalle.data?.fecha} />}
  </>;
}

function Participantes({ actividad, fecha }: { actividad: ActividadResponse; fecha?: string }) {
  const { user } = useAuth();
  const allowed = canManageParticipaciones(user?.rol);
  const participaciones = useApiResource(signal => listarParticipacionesPorActividad(actividad.id, signal), `participaciones-${actividad.id}`, allowed);
  const residentes = useApiResource(listarResidentes, 'residentes-participaciones', allowed);
  const [modal, setModal] = useState<'crear' | ParticipacionActividadResponse | null>(null);
  const [success, setSuccess] = useState('');
  if (!allowed) return null;
  const full = (participaciones.data?.length ?? 0) >= actividad.cupoMaximo;
  const ready = !!participaciones.data && !participaciones.loading && !participaciones.error;
  const residentsReady = !!residentes.data && !residentes.loading && !residentes.error;
  function saved() { setModal(null); setSuccess('Participación guardada correctamente.'); participaciones.reload(); }
  return <section className="space-y-3">
    <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Participantes</h4>
    {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
    {participaciones.loading && <p role="status" className="text-sm">Cargando participantes…</p>}
    {participaciones.error && <ErrorNotice message={participaciones.error} retry={participaciones.reload} />}
    {residentes.loading && <p role="status" className="text-sm">Cargando datos de residentes…</p>}
    {residentes.error && <ErrorNotice message={residentes.error} retry={residentes.reload} />}
    {ready && <>
      <p className="text-sm">Participantes: {participaciones.data!.length} / {actividad.cupoMaximo}</p>
      {full && <p className="text-sm font-medium">Cupo completo</p>}
      <button disabled={full || !residentsReady} onClick={() => { setSuccess(''); setModal('crear'); }} className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={primaryStyle}>Agregar participante</button>
      {participaciones.data!.length === 0 && <p className="text-sm">No hay participantes registrados.</p>}
      <div className="space-y-3">{participaciones.data!.map(p => {
        const residente = residentes.data?.find(r => r.id === p.residenteId);
        return <div key={p.id} className="rounded-lg p-3 text-xs space-y-1" style={{ border: '1px solid var(--border)' }}>
          <p className="font-medium">{residente ? `${residente.apellido}, ${residente.nombre}` : `Residente #${p.residenteId}`}</p>
          <p>DNI: {residente?.dni ?? 'No disponible'}</p><p>Fecha: {formatFecha(p.fecha)}</p><p>Estado: {p.estado}</p><p>Asistencia: {p.asistencia ? 'Sí' : 'No'}</p><p className="whitespace-pre-wrap break-words">Observaciones: {p.observaciones || '—'}</p>
          <button onClick={() => { setSuccess(''); setModal(p); }} className="px-2 py-1 rounded text-xs" style={inputStyle}>Actualizar asistencia</button>
        </div>;
      })}</div>
    </>}
    {modal === 'crear' && ready && residentsReady && <ParticipacionModal mode="crear" actividad={actividad} residentes={residentes.data!} participaciones={participaciones.data!} fecha={fecha} onClose={() => setModal(null)} onSaved={saved} />}
    {modal && modal !== 'crear' && <ParticipacionModal mode="asistencia" actividad={actividad} participacion={modal} residente={residentes.data?.find(r => r.id === modal.residenteId)} onClose={() => setModal(null)} onSaved={saved} />}
  </section>;
}
