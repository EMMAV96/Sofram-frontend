import { useRef, useState, type FormEvent } from 'react';
import { crearParticipacion, actualizarAsistencia, type ActividadResponse, type ParticipacionActividadResponse } from '../../api/actividadesApi';
import type { ResidenteResponse } from '../../api/residentesApi';
import { useAuth } from '../../auth/AuthContext';
import { canManageParticipaciones } from '../../auth/actividadesPermissions';
import { ResidenteModal as Modal } from '../residentes/ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, inputStyle, primaryStyle } from '../residentes/shared';

type Props = { actividad: ActividadResponse; onClose: () => void; onSaved: () => void } & (
  { mode: 'crear'; residentes: ResidenteResponse[]; participaciones: ParticipacionActividadResponse[]; fecha?: string }
  | { mode: 'asistencia'; participacion: ParticipacionActividadResponse; residente?: ResidenteResponse }
);
export function ParticipacionModal(props: Props) {
  const { user } = useAuth();
  const allowed = canManageParticipaciones(user?.rol);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const elegibles = props.mode === 'crear' ? props.residentes.filter(r => r.fechaEgreso === null && !props.participaciones.some(p => p.residenteId === r.id)) : [];
  const full = props.mode === 'crear' && props.participaciones.length >= props.actividad.cupoMaximo;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed || busy || submitting.current || full) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const validation: Record<string, string> = {};
    if (!value('estado')) validation.estado = 'Ingrese un estado.';
    else if (value('estado').length > 50) validation.estado = 'Máximo 50 caracteres.';
    if (value('observaciones').length > 1000) validation.observaciones = 'Máximo 1000 caracteres.';
    if (props.mode === 'crear') {
      if (!elegibles.some(r => r.id === Number(value('residenteId')))) validation.residenteId = 'Seleccione un residente no egresado y sin inscripción previa.';
      if (!value('fecha')) validation.fecha = 'Ingrese una fecha.';
    }
    setError(''); setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true; setBusy(true);
    try {
      if (props.mode === 'crear') await crearParticipacion({ actividadId: props.actividad.id, residenteId: Number(value('residenteId')), fecha: value('fecha'), asistencia: false, estado: value('estado'), observaciones: value('observaciones') || null });
      else await actualizarAsistencia(props.participacion.id, { asistencia: data.get('asistencia') === 'on', estado: value('estado'), observaciones: value('observaciones') || null });
      props.onSaved();
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (!allowed) return null;
  return <Modal title={props.mode === 'crear' ? 'Agregar participante' : 'Actualizar asistencia'} busy={busy} onClose={props.onClose}>
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm font-medium">{props.actividad.nombre}</p>
      {error && <ErrorNotice message={error} />}
      {full && <p role="status">Cupo completo</p>}
      <fieldset disabled={busy} className="space-y-4">
        {props.mode === 'crear' ? <>
          <div><label htmlFor="participante-residente" className="block text-xs font-medium mb-1">Residente *</label>
            <select id="participante-residente" name="residenteId" required defaultValue="" aria-invalid={!!errors.residenteId} aria-describedby={errors.residenteId ? 'residenteId-error' : undefined} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
              <option value="">Seleccione un residente</option>{elegibles.map(r => <option key={r.id} value={r.id}>{r.apellido}, {r.nombre} — DNI {r.dni}</option>)}
            </select>
            {elegibles.length === 0 && <p className="text-sm">No hay residentes disponibles para agregar.</p>}
            {errors.residenteId && <p id="residenteId-error" className="text-xs text-red-700">{errors.residenteId}</p>}
          </div>
          <div><label htmlFor="participante-fecha" className="block text-xs font-medium mb-1">Fecha *</label>
            <input id="participante-fecha" name="fecha" type="date" required defaultValue={props.fecha ?? ''} aria-invalid={!!errors.fecha} aria-describedby={errors.fecha ? 'fecha-error' : undefined} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            {errors.fecha && <p id="fecha-error" className="text-xs text-red-700">{errors.fecha}</p>}
          </div>
          <p className="text-xs">La inscripción inicial se registra sin asistencia.</p>
        </> : <>
          <p className="text-sm">{props.residente ? `${props.residente.apellido}, ${props.residente.nombre} — DNI ${props.residente.dni}` : `Residente #${props.participacion.residenteId}`}</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="asistencia" defaultChecked={props.participacion.asistencia} />Asistió</label>
          {errors.asistencia && <p className="text-xs text-red-700">{errors.asistencia}</p>}
        </>}
        <div><label htmlFor="participante-estado" className="block text-xs font-medium mb-1">Estado *</label>
          <input id="participante-estado" name="estado" required maxLength={50} defaultValue={props.mode === 'crear' ? 'INSCRIPTO' : props.participacion.estado} aria-invalid={!!errors.estado} aria-describedby={errors.estado ? 'estado-error' : undefined} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          {errors.estado && <p id="estado-error" className="text-xs text-red-700">{errors.estado}</p>}
        </div>
        <div><label htmlFor="participante-observaciones" className="block text-xs font-medium mb-1">Observaciones</label>
          <textarea id="participante-observaciones" name="observaciones" rows={3} maxLength={1000} defaultValue={props.mode === 'asistencia' ? props.participacion.observaciones ?? '' : ''} aria-invalid={!!errors.observaciones} aria-describedby={errors.observaciones ? 'observaciones-error' : undefined} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          {errors.observaciones && <p id="observaciones-error" className="text-xs text-red-700">{errors.observaciones}</p>}
        </div>
      </fieldset>
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={props.onClose} className="px-4 py-2 rounded-lg text-sm" style={inputStyle}>Cancelar</button><button type="submit" disabled={busy || full || (props.mode === 'crear' && !elegibles.length)} className="px-4 py-2 rounded-lg text-sm disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : 'Guardar'}</button></div>
    </form>
  </Modal>;
}
