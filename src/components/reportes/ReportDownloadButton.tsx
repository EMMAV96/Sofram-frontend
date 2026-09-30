import { useAuth } from '../../auth/AuthContext';
import { canViewReporteClinico, canViewReporteOcupacion } from '../../auth/reportesPermissions';
import { descargarReporteClinico, descargarReporteOcupacion } from '../../api/reportesApi';
import { usePdfDownload } from './usePdfDownload';
import { ErrorNotice, inputStyle } from '../residentes/shared';

export function ReportDownloadButton({ residenteId }: { residenteId?: number }) {
  const { user } = useAuth();
  const state = usePdfDownload();
  const clinical = residenteId !== undefined;
  if (!(clinical ? canViewReporteClinico(user?.rol) : canViewReporteOcupacion(user?.rol))) return null;
  return <div className="space-y-2">
    <button type="button" disabled={state.loading} className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={inputStyle}
      onClick={() => void state.run(signal => clinical ? descargarReporteClinico(residenteId, signal) : descargarReporteOcupacion(signal), clinical ? `reporte-clinico-residente-${residenteId}.pdf` : 'reporte-ocupacion.pdf')}>
      {state.loading ? 'Generando…' : clinical ? 'Reporte clínico' : 'Reporte de ocupación'}
    </button>
    {state.error && <ErrorNotice message={state.error} />}
    {state.success && <p role="status" className="text-xs text-primary">Descarga iniciada.</p>}
  </div>;
}
