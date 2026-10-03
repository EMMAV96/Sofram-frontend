import { ResidentSelector } from '../components/residentes/ResidentSelector';
import { NavIcon } from '../components/NavIcon';
import { usePdfDownload } from '../components/reportes/usePdfDownload';
import { useState } from 'react';
import { descargarReporteActividad, descargarReporteClinico, descargarReporteOcupacion } from '../api/reportesApi';
import { listarActividades } from '../api/actividadesApi';
import { listarResidentes } from '../api/residentesApi';
import { useAuth } from '../auth/AuthContext';
import { canViewReporteActividad, canViewReporteClinico, canViewReporteOcupacion, canViewReportes } from '../auth/reportesPermissions';
import { cardStyle, inputStyle, primaryStyle, ErrorNotice, useApiResource } from '../components/residentes/shared';


function DownloadFeedback({ state }: { state: ReturnType<typeof usePdfDownload> }) {
  return <>
    {state.error && <ErrorNotice message={state.error} />}
    {state.success && <p role="status" className="rounded-lg px-3 py-2 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>PDF generado. Descarga iniciada.</p>}
  </>;
}

function ReporteClinico() {
  const residentes = useApiResource(listarResidentes, 'reportes-residentes');
  const [selected, setSelected] = useState('');
  const download = usePdfDownload();
  const selectedResident = residentes.data?.find(r => String(r.id) === selected);

  return <section className="rounded-xl p-6 space-y-4" style={cardStyle}>
    <div className="flex items-start gap-4 mb-5">
      <div aria-hidden="true" className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'rgba(27,67,50,0.1)' }}><NavIcon name="historia-clinica" size={26} /></div>
      <div>
        <h3 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>Reporte Clínico Individual</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Información clínica del residente, antecedentes, evoluciones, tratamientos y atenciones médicas en PDF.</p>
      </div>
    </div>
    {residentes.loading ? <p role="status" className="text-sm">Cargando residentes…</p>
      : residentes.error ? <ErrorNotice message={residentes.error} retry={residentes.reload} />
      : !residentes.data?.length ? <p className="text-sm">No hay residentes disponibles.</p>
      : <ResidentSelector residentes={residentes.data ?? []} value={selected} onChange={id => { setSelected(id); download.reset(); }} disabled={download.loading} />}
    <DownloadFeedback state={download} />
    <button type="button" disabled={download.loading || residentes.loading || !!residentes.error || !selectedResident}
      onClick={() => { if (selectedResident) void download.run(signal => descargarReporteClinico(selectedResident.id, signal), `reporte-clinico-residente-${selectedResident.id}.pdf`); }}
      className="w-full py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" style={primaryStyle}>
      {download.loading ? 'Generando…' : 'Descargar PDF'}
    </button>
  </section>;
}

function ReporteOcupacion() {
  const download = usePdfDownload();
  return <section className="rounded-xl p-6 space-y-4" style={cardStyle}>
    <div className="flex items-start gap-4 mb-5">
      <div aria-hidden="true" className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'rgba(201,168,76,0.15)' }}><NavIcon name="habitaciones" size={26} /></div>
      <div>
        <h3 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>Reporte de Ocupación</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Capacidad, ocupación actual, cupos disponibles, porcentaje general y detalle por habitación en PDF.</p>
      </div>
    </div>
    <DownloadFeedback state={download} />
    <button type="button" disabled={download.loading} onClick={() => void download.run(descargarReporteOcupacion, 'reporte-ocupacion.pdf')}
      className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
      {download.loading ? 'Generando…' : 'Descargar PDF'}
    </button>
  </section>;
}

function ReporteActividades() {
  const actividades = useApiResource(listarActividades, 'reportes-actividades');
  const [selected, setSelected] = useState('');
  const download = usePdfDownload();
  const actividad = actividades.data?.find(a => String(a.id) === selected);
  return <section className="rounded-xl p-6 space-y-4" style={cardStyle}>
    <h3 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>Reportes de actividades y talleres</h3>
    <p className="text-sm text-muted-foreground">Seleccione una actividad para descargar su reporte, incluidos los registros históricos.</p>
    {actividades.loading ? <p role="status">Cargando actividades…</p> : actividades.error ? <ErrorNotice message={actividades.error} retry={actividades.reload} /> : !actividades.data?.length ? <p>No hay actividades registradas.</p> : <>
      <label htmlFor="reporte-actividad" className="block text-sm font-medium">Actividad</label>
      <select id="reporte-actividad" value={selected} disabled={download.loading} onChange={event => { setSelected(event.target.value); download.reset(); }} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
        <option value="">Seleccione una actividad</option>
        {actividades.data.map(a => <option key={a.id} value={a.id}>{[a.taller?.trim(), a.nombre, a.tipo, a.estado].filter(Boolean).join(' · ')}</option>)}
      </select>
      {actividad && <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
        {actividad.taller?.trim() && <p className="font-semibold">{actividad.taller}</p>}
        <p>{actividad.nombre}</p><p>{actividad.tipo} · {actividad.estado}</p>
        {actividad.estado === 'ELIMINADA' && <p style={{ color: 'var(--danger)' }}>Registro histórico</p>}
      </div>}
    </>}
    <DownloadFeedback state={download} />
    <button type="button" disabled={download.loading || actividades.loading || !!actividades.error || !actividad} onClick={() => { if (actividad) void download.run(signal => descargarReporteActividad(actividad.id, signal), `reporte-actividad-${actividad.id}.pdf`); }} className="w-full py-3 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{download.loading ? 'Generando…' : 'Descargar reporte'}</button>
  </section>;
}

export function ReportesPage() {
  const { user } = useAuth();
  if (!canViewReportes(user?.rol)) return <div className="rounded-xl p-6" style={cardStyle}>No hay reportes disponibles para su rol.</div>;
  return <div className="space-y-6">
    <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Documentos e informes disponibles según su perfil.</p>
    <div className={`grid grid-cols-1 ${user?.rol === 'TERAPISTA_OCUPACIONAL' ? '' : 'lg:grid-cols-2'} gap-5 items-start`}>
      {canViewReporteActividad(user?.rol) && <ReporteActividades key={`actividades-${user?.id}`} />}
      {canViewReporteClinico(user?.rol) && <ReporteClinico key={user?.id} />}
      {canViewReporteOcupacion(user?.rol) && <ReporteOcupacion key={user?.id} />}
    </div>
  </div>;
}
