import { useRef, useState, type FormEvent } from 'react';
import { cambiarEstado, listarEstados } from '../../api/residentesApi';
import { ResidenteModal } from './ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, inputStyle, primaryStyle, useApiResource, useResidentesPermissions } from './shared';

export function CambioEstadoModal({ residenteId, onClose, onSaved }: { residenteId: number; onClose: () => void; onSaved: () => void }) {
  const { canWrite } = useResidentesPermissions();
  const estados = useApiResource(listarEstados, 'estados', canWrite);
  const [estadoId, setEstadoId] = useState('');
  const [fechaCambio, setFechaCambio] = useState('');
  const [observacion, setObservacion] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite || submitting.current || !estadoId || !fechaCambio || !estados.data?.length) return;
    submitting.current = true;
    setBusy(true); setError(''); setErrors({});
    try {
      await cambiarEstado(residenteId, { estadoId: Number(estadoId), fechaCambio, observacion: observacion.trim() || null });
      onSaved();
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }

  if (!canWrite) return null;
  return <ResidenteModal title="Cambiar estado" busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorNotice message={error} />}
      {estados.loading && <p role="status" className="text-sm">Cargando estados…</p>}
      {estados.error && <ErrorNotice message={estados.error} retry={estados.reload} />}
      {estados.data?.length === 0 && <p role="status">No hay estados disponibles.</p>}
      <fieldset disabled={busy} className="space-y-4">
        <div><label htmlFor="estadoId" className="block text-xs font-medium mb-1">Estado *</label>
          <select id="estadoId" required value={estadoId} onChange={event => setEstadoId(event.target.value)} aria-invalid={!!errors.estadoId} aria-describedby={errors.estadoId ? 'estadoId-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione un estado</option>
            {estados.data?.map(estado => <option key={estado.id} value={estado.id}>{estado.nombre}</option>)}
          </select>
          {errors.estadoId && <p id="estadoId-error" className="text-xs text-red-700 mt-1">{errors.estadoId}</p>}
        </div>
        <div><label htmlFor="fechaCambio" className="block text-xs font-medium mb-1">Fecha de cambio *</label>
          <input id="fechaCambio" type="date" required value={fechaCambio} onChange={event => setFechaCambio(event.target.value)} aria-invalid={!!errors.fechaCambio} aria-describedby={errors.fechaCambio ? 'fechaCambio-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          {errors.fechaCambio && <p id="fechaCambio-error" className="text-xs text-red-700 mt-1">{errors.fechaCambio}</p>}
        </div>
        <div><label htmlFor="observacion" className="block text-xs font-medium mb-1">Observación</label>
          <textarea id="observacion" value={observacion} onChange={event => setObservacion(event.target.value)} aria-invalid={!!errors.observacion} aria-describedby={errors.observacion ? 'observacion-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          {errors.observacion && <p id="observacion-error" className="text-xs text-red-700 mt-1">{errors.observacion}</p>}
        </div>
      </fieldset>
      <div className="flex justify-end gap-3 mt-6">
        <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}>Cancelar</button>
        <button disabled={busy || estados.loading || !!estados.error || !estados.data?.length} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : 'Guardar estado'}</button>
      </div>
    </form>
  </ResidenteModal>;
}
