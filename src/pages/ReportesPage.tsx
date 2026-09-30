import { ResidentSelector } from '../components/residentes/ResidentSelector';
import { NavIcon } from '../components/NavIcon';
import { usePdfDownload } from '../components/reportes/usePdfDownload';
import { useState } from 'react';
import { descargarReporteClinico, descargarReporteOcupacion } from '../api/reportesApi';
import { listarResidentes } from '../api/residentesApi';
import { useAuth } from '../auth/AuthContext';
import { canViewReporteClinico, canViewReporteOcupacion, canViewReportes } from '../auth/reportesPermissions';
import { cardStyle, primaryStyle, ErrorNotice, useApiResource } from '../components/residentes/shared';


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

export function ReportesPage() {
  const { user } = useAuth();
  if (!canViewReportes(user?.rol)) return <div className="rounded-xl p-6" style={cardStyle}>No hay reportes disponibles para su rol.</div>;
  return <div className="space-y-6">
    <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Documentos e informes disponibles según su perfil.</p>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {canViewReporteClinico(user?.rol) && <ReporteClinico key={user?.id} />}
      {canViewReporteOcupacion(user?.rol) && <ReporteOcupacion key={user?.id} />}
    </div>
  </div>;
}
