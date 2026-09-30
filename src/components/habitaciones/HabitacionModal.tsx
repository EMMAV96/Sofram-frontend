import { useRef, useState, type FormEvent } from 'react';
import { actualizarHabitacion, crearHabitacion, obtenerHabitacion, type HabitacionResponse, type HabitacionRequest } from '../../api/habitacionesApi';
import { useAuth } from '../../auth/AuthContext';
import { habitacionesPermissions } from '../../auth/habitacionesPermissions';
import { ResidenteModal as Modal } from '../residentes/ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, inputStyle, primaryStyle, useApiResource } from '../residentes/shared';

export type HabitacionModalAction = { mode: 'crear' } | { mode: 'ver' | 'editar'; id: number };

export function HabitacionModal({ action, onClose, onSaved }: { action: HabitacionModalAction; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const { canRead, canWrite } = habitacionesPermissions(user?.rol);
  const id = action.mode === 'crear' ? undefined : action.id;
  const allowed = action.mode === 'ver' ? canRead : canWrite;
  const detail = useApiResource(signal => obtenerHabitacion(id!, signal), `habitacion-${id}`, allowed && id !== undefined);
  const [busy, setBusy] = useState(false);

  if (!allowed) return null;
  return <Modal title={action.mode === 'crear' ? 'Nueva habitación' : action.mode === 'editar' ? 'Editar habitación' : 'Detalle de habitación'} busy={busy} onClose={onClose}>
    {id !== undefined && detail.loading ? <p role="status">Cargando habitación…</p>
      : detail.error ? <ErrorNotice message={detail.error} retry={detail.reload} />
      : action.mode === 'ver' && detail.data ? <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Número', detail.data.numero], ['Tipo', detail.data.tipo ?? '—'], ['Estado', detail.data.estado],
            ['Capacidad', detail.data.capacidad], ['Ocupación actual', detail.data.ocupacionActual], ['Cupos disponibles', detail.data.cuposDisponibles],
          ].map(([label, value]) => <div key={label}>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
            <p className="text-sm font-medium break-words">{value}</p>
          </div>)}
        </div>
        <div className="flex justify-end mt-6"><button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}>Cerrar</button></div>
      </> : action.mode !== 'ver' && (action.mode === 'crear' || detail.data) ? <HabitacionForm habitacion={detail.data} onClose={onClose} onSaved={onSaved} busy={busy} setBusy={setBusy} /> : null}
  </Modal>;
}

function HabitacionForm({ habitacion, onClose, onSaved, busy, setBusy }: { habitacion?: HabitacionResponse; onClose: () => void; onSaved: () => void; busy: boolean; setBusy: (value: boolean) => void }) {
  const { user } = useAuth();
  const { canWrite } = habitacionesPermissions(user?.rol);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const minCapacidad = Math.max(1, habitacion?.ocupacionActual ?? 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite || submitting.current) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const request: HabitacionRequest = { numero: value('numero'), capacidad: Number(value('capacidad')), tipo: value('tipo') || null, estado: value('estado') };
    const validation: Record<string, string> = {};
    if (!request.numero) validation.numero = 'Ingrese el número de habitación.';
    else if (request.numero.length > 20) validation.numero = 'El número admite hasta 20 caracteres.';
    if (!Number.isInteger(request.capacidad) || request.capacidad < minCapacidad) validation.capacidad = `La capacidad debe ser un entero mayor o igual a ${minCapacidad}.`;
    if (request.tipo && request.tipo.length > 50) validation.tipo = 'El tipo admite hasta 50 caracteres.';
    if (!request.estado) validation.estado = 'Ingrese el estado.';
    else if (request.estado.length > 30) validation.estado = 'El estado admite hasta 30 caracteres.';
    setError(''); setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true; setBusy(true);
    try {
      if (habitacion) await actualizarHabitacion(habitacion.id, request);
      else await crearHabitacion(request);
      onSaved();
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-4">
    {error && <ErrorNotice message={error} />}
    <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        { name: 'numero', label: 'Número', required: true, maxLength: 20, value: habitacion?.numero ?? '' },
        { name: 'capacidad', label: 'Capacidad', required: true, type: 'number', min: minCapacidad, step: 1, value: habitacion?.capacidad ?? '' },
        { name: 'tipo', label: 'Tipo', maxLength: 50, value: habitacion?.tipo ?? '' },
        { name: 'estado', label: 'Estado', required: true, maxLength: 30, value: habitacion?.estado ?? '' },
      ].map(field => <div key={field.name}>
        <label htmlFor={`habitacion-${field.name}`} className="block text-xs font-medium mb-1">{field.label}{field.required ? ' *' : ''}</label>
        <input id={`habitacion-${field.name}`} name={field.name} type={field.type ?? 'text'} required={field.required} maxLength={field.maxLength} min={field.min} step={field.step} defaultValue={field.value}
          aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `habitacion-${field.name}-error` : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
        {errors[field.name] && <p id={`habitacion-${field.name}-error`} className="text-xs text-red-700 mt-1">{errors[field.name]}</p>}
      </div>)}
    </fieldset>
    {habitacion && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Ocupación actual: {habitacion.ocupacionActual}. Cupos disponibles: {habitacion.cuposDisponibles}.</p>}
    <div className="flex justify-end gap-3 mt-6">
      <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}>Cancelar</button>
      <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : 'Guardar habitación'}</button>
    </div>
  </form>;
}
