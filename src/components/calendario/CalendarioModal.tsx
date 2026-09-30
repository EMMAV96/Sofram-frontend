import { useRef, useState, type FormEvent } from 'react';
import * as api from '../../api/calendariosApi';
import { useAuth } from '../../auth/AuthContext';
import { canCreateCalendario, canCreateDetalleCalendario } from '../../auth/calendarioPermissions';
import { ResidenteModal as Modal } from '../residentes/ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, inputStyle, primaryStyle } from '../residentes/shared';

type Props = { onClose: () => void } & (
  { mode: 'calendario'; onSaved: (calendario: api.CalendarioResponse) => void }
  | { mode: 'detalle'; calendario: api.CalendarioResponse; onSaved: (detalle: api.DetalleCalendarioResponse) => void }
);
type Field = { name: string; label: string; type?: string; max?: number; min?: number };
const calendarFields: Field[] = [{ name: 'nombre', label: 'Nombre', max: 150 }, { name: 'periodo', label: 'Período', max: 100 }, { name: 'anio', label: 'Año', type: 'number', min: 2000 }, { name: 'estado', label: 'Estado', max: 50 }];
const detailFields: Field[] = [{ name: 'fecha', label: 'Fecha', type: 'date' }, { name: 'horaInicio', label: 'Hora de inicio', type: 'time' }, { name: 'horaFin', label: 'Hora de fin', type: 'time' }, { name: 'estado', label: 'Estado', max: 50 }];
const normalizeTime = (value: string) => value.length === 5 ? `${value}:00` : value;

export function CalendarioModal(props: Props) {
  const { user } = useAuth();
  const allowed = props.mode === 'calendario' ? canCreateCalendario(user?.rol) : canCreateDetalleCalendario(user?.rol);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fields = props.mode === 'calendario' ? calendarFields : detailFields;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed || submitting.current) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const validation: Record<string, string> = {};
    for (const field of fields) {
      if (!value(field.name)) validation[field.name] = 'Este campo es obligatorio.';
      else if (field.max && value(field.name).length > field.max) validation[field.name] = `Máximo ${field.max} caracteres.`;
    }
    const anio = Number(value('anio'));
    const horaInicio = normalizeTime(value('horaInicio'));
    const horaFin = normalizeTime(value('horaFin'));
    if (props.mode === 'calendario' && (!Number.isInteger(anio) || anio < 2000)) validation.anio = 'Ingrese un año entero mayor o igual a 2000.';
    if (props.mode === 'detalle' && horaInicio && horaFin && horaFin <= horaInicio) validation.horaFin = 'La hora de fin debe ser posterior a la hora de inicio';
    setError(''); setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true; setBusy(true);
    try {
      if (props.mode === 'calendario') props.onSaved(await api.crearCalendario({ nombre: value('nombre'), periodo: value('periodo'), anio, estado: value('estado') }));
      else props.onSaved(await api.crearDetalle(props.calendario.id, { fecha: value('fecha'), horaInicio, horaFin, estado: value('estado') }));
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (!allowed) return null;
  return <Modal title={props.mode === 'calendario' ? 'Nuevo calendario' : 'Agregar detalle'} busy={busy} onClose={props.onClose}>
    <form onSubmit={submit} className="space-y-4">
      {props.mode === 'detalle' && <p className="rounded-lg p-3 text-sm" style={{ background: 'var(--muted)' }}>{props.calendario.nombre} · {props.calendario.periodo} · {props.calendario.anio}</p>}
      {error && <ErrorNotice message={error} />}
      <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(field => <div key={field.name}>
          <label htmlFor={`calendario-${field.name}`} className="block text-xs font-medium mb-1">{field.label} *</label>
          <input id={`calendario-${field.name}`} name={field.name} type={field.type ?? 'text'} required maxLength={field.max} min={field.min} step={field.type === 'time' || field.type === 'number' ? 1 : undefined}
            aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `calendario-${field.name}-error` : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          {errors[field.name] && <p id={`calendario-${field.name}-error`} className="text-xs text-red-700 mt-1">{errors[field.name]}</p>}
        </div>)}
      </fieldset>
      <div className="flex justify-end gap-3">
        <button type="button" disabled={busy} onClick={props.onClose} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}>Cancelar</button>
        <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  </Modal>;
}
