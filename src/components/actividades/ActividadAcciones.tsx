import { useRef, useState } from 'react';
import { eliminarActividad, type ActividadResponse } from '../../api/actividadesApi';
import { descargarReporteActividad } from '../../api/reportesApi';
import { useAuth } from '../../auth/AuthContext';
import { canCreateActividad } from '../../auth/actividadesPermissions';
import { canViewReporteActividad } from '../../auth/reportesPermissions';
import { usePdfDownload } from '../reportes/usePdfDownload';
import { ResidenteModal } from '../residentes/ResidenteModal';
import { ErrorNotice, errorMessage, inputStyle, primaryStyle } from '../residentes/shared';
import { ActividadModal } from './ActividadModal';

export function ActividadAcciones({ actividad, onUpdated, onDeleted }: {
  actividad: ActividadResponse; onUpdated: () => void; onDeleted: () => void;
}) {
  const { user } = useAuth();
  const allowed = canCreateActividad(user?.rol);
  const [mode, setMode] = useState<'editar' | 'eliminar' | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const download = usePdfDownload();
  async function remove() {
    if (!allowed || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try { await eliminarActividad(actividad.id); setMode(null); onDeleted(); }
    catch (error: unknown) { setError(errorMessage(error)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      {allowed && <>
        <button type="button" onClick={() => setMode('editar')} className="px-3 py-2 rounded-lg text-sm" style={inputStyle}>Editar actividad</button>
        {actividad.estado !== 'ELIMINADA' && <button type="button" onClick={() => { setError(''); setMode('eliminar'); }} className="px-3 py-2 rounded-lg text-sm" style={{ ...inputStyle, color: 'var(--danger)' }}>Eliminar actividad</button>}
      </>}
      {canViewReporteActividad(user?.rol) && <button type="button" disabled={download.loading} onClick={() => void download.run(signal => descargarReporteActividad(actividad.id, signal), `reporte-actividad-${actividad.id}.pdf`)} className="px-3 py-2 rounded-lg text-sm disabled:opacity-50" style={primaryStyle}>{download.loading ? 'Generando…' : 'Descargar reporte'}</button>}
    </div>
    {download.error && <ErrorNotice message={download.error} />}
    {download.success && <p role="status" className="text-sm">Descarga del reporte iniciada.</p>}
    {mode === 'editar' && allowed && <ActividadModal actividad={actividad} onClose={() => setMode(null)} onSaved={() => { setMode(null); onUpdated(); }} />}
    {mode === 'eliminar' && allowed && <ResidenteModal title="¿Eliminar esta actividad?" busy={busy} onClose={() => setMode(null)}>
      <div className="space-y-4">
        <p className="font-medium">{actividad.nombre}</p>
        <p className="text-sm">Si existen participantes o asistencias, se conservará el registro histórico y la actividad quedará en estado ELIMINADA. Sin participaciones, se borrará.</p>
        {error && <ErrorNotice message={error} />}
        <div className="flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={() => setMode(null)} className="px-4 py-2 rounded-lg text-sm" style={inputStyle}>Cancelar</button>
          <button type="button" disabled={busy} onClick={() => void remove()} className="px-4 py-2 rounded-lg text-sm disabled:opacity-50" style={{ background: 'var(--danger)', color: 'white' }}>{busy ? 'Eliminando…' : 'Eliminar actividad'}</button>
        </div>
      </div>
    </ResidenteModal>}
  </div>;
}
