import { useRef, useState, type FormEvent } from 'react';
import { egresarResidente, listarEstados, type ResidenteResponse } from '../../api/residentesApi';
import { ResidenteModal } from './ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, formatFecha, inputStyle, primaryStyle, useApiResource, useResidentesPermissions } from './shared';

export function EgresoResidenteModal({ residente, onClose, onSaved }: { residente: ResidenteResponse; onClose: () => void; onSaved: () => void }) {
  const { canWrite } = useResidentesPermissions();
  const permitido = canWrite && residente.fechaEgreso === null;
  const estados = useApiResource(listarEstados, 'estados-egreso', permitido);
  const [estadoId, setEstadoId] = useState('');
  const [fechaEgreso, setFechaEgreso] = useState('');
  const [observacion, setObservacion] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const catalogoListo = !estados.loading && !estados.error && !!estados.data?.length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!permitido || submitting.current || !catalogoListo) return;
    const validation: Record<string, string> = {};
    if (!estadoId) validation.estadoId = 'Seleccione un estado de egreso.';
    if (!fechaEgreso) validation.fechaEgreso = 'Ingrese la fecha de egreso.';
    else if (fechaEgreso < residente.fechaIngreso) validation.fechaEgreso = 'La fecha de egreso no puede ser anterior a la fecha de ingreso.';
    setError(''); setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true;
    setBusy(true);
    try {
      const nota = observacion.trim();
      await egresarResidente(residente.id, { fechaEgreso, estadoId: Number(estadoId), ...(nota ? { observacion: nota } : {}) });
      onSaved();
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }

  if (!permitido) return null;
  return <ResidenteModal title="Egresar residente" busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--muted)' }}>
        <p className="font-semibold">{residente.apellido}, {residente.nombre}</p>
        <p>DNI {residente.dni} · Ingreso: {formatFecha(residente.fechaIngreso)}</p>
      </div>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Confirme la fecha y el estado para registrar el egreso de este residente.</p>
      {error && <ErrorNotice message={error} />}
      {estados.loading && <p role="status" className="text-sm">Cargando estados…</p>}
      {estados.error && <ErrorNotice message={estados.error} retry={estados.reload} />}
      {estados.data?.length === 0 && <p role="status" className="text-sm">No hay estados disponibles.</p>}
      <fieldset disabled={busy} className="space-y-4">
        <div>
          <label htmlFor="egreso-fecha" className="block text-xs font-medium mb-1">Fecha de egreso *</label>
          <input id="egreso-fecha" type="date" required min={residente.fechaIngreso} value={fechaEgreso} onChange={event => setFechaEgreso(event.target.value)}
            aria-invalid={!!errors.fechaEgreso} aria-describedby={errors.fechaEgreso ? 'egreso-fecha-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          {errors.fechaEgreso && <p id="egreso-fecha-error" className="text-xs text-red-700 mt-1">{errors.fechaEgreso}</p>}
        </div>
        <div>
          <label htmlFor="egreso-estado" className="block text-xs font-medium mb-1">Estado de egreso *</label>
          <select id="egreso-estado" required disabled={!catalogoListo} value={estadoId} onChange={event => setEstadoId(event.target.value)}
            aria-invalid={!!errors.estadoId} aria-describedby={errors.estadoId ? 'egreso-estado-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione un estado</option>
            {estados.data?.map(estado => <option key={estado.id} value={estado.id}>{estado.nombre}</option>)}
          </select>
          {errors.estadoId && <p id="egreso-estado-error" className="text-xs text-red-700 mt-1">{errors.estadoId}</p>}
        </div>
        <div>
          <label htmlFor="egreso-observacion" className="block text-xs font-medium mb-1">Observación</label>
          <textarea id="egreso-observacion" value={observacion} onChange={event => setObservacion(event.target.value)}
            aria-invalid={!!errors.observacion} aria-describedby={errors.observacion ? 'egreso-observacion-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          {errors.observacion && <p id="egreso-observacion-error" className="text-xs text-red-700 mt-1">{errors.observacion}</p>}
        </div>
      </fieldset>
      <div className="flex justify-end gap-3 mt-6">
        <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}>Cancelar</button>
        <button type="submit" disabled={busy || !catalogoListo} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{busy ? 'Registrando egreso…' : 'Confirmar egreso'}</button>
      </div>
    </form>
  </ResidenteModal>;
}
