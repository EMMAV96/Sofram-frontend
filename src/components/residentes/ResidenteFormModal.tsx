import { useRef, useState, type FormEvent } from 'react';
import { listarHabitaciones } from '../../api/habitacionesApi';
import { actualizarResidente, crearResidente, listarEstados, obtenerResidente, type ResidenteUpdateRequest } from '../../api/residentesApi';
import { ResidenteModal } from './ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, inputStyle, primaryStyle, useApiResource, useResidentesPermissions } from './shared';

const fields = [
  { name: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
  { name: 'apellido', label: 'Apellido', required: true, maxLength: 100 },
  { name: 'dni', label: 'DNI', required: true, maxLength: 20 },
  { name: 'fechaNacimiento', label: 'Fecha de nacimiento', required: true, type: 'date' },
  { name: 'direccion', label: 'Dirección', maxLength: 255 },
  { name: 'telefono', label: 'Teléfono', maxLength: 30 },
  { name: 'email', label: 'Email', type: 'email', maxLength: 150 },
  { name: 'telefonoEmergencia', label: 'Teléfono de emergencia', maxLength: 30 },
  { name: 'familiarACargo', label: 'Familiar a cargo', maxLength: 150 },
  { name: 'fechaIngreso', label: 'Fecha de ingreso', required: true, type: 'date' },
  { name: 'fechaEgreso', label: 'Fecha de egreso', type: 'date' },
  { name: 'obraSocial', label: 'Obra social', maxLength: 100 },
] satisfies { name: keyof ResidenteUpdateRequest; label: string; required?: boolean; type?: string; maxLength?: number }[];

export function ResidenteFormModal({ residenteId, onClose, onSaved }: { residenteId?: number; onClose: () => void; onSaved: () => void }) {
  const { canWrite } = useResidentesPermissions();
  const current = useApiResource(signal => obtenerResidente(residenteId!, signal), `editar-${residenteId}`, canWrite && residenteId !== undefined);
  const estados = useApiResource(listarEstados, 'estados', canWrite && residenteId === undefined);
  const habitaciones = useApiResource(listarHabitaciones, 'habitaciones', canWrite);
  const [selectedHabitacion, setSelectedHabitacion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const editing = residenteId !== undefined;
  const habitacionActual = current.data?.habitacionId;
  const opcionesHabitaciones = (habitaciones.data ?? []).filter(h => h.cuposDisponibles > 0 || (editing && h.id === habitacionActual));
  // Conservar la habitación real del residente aunque el catálogo no la incluya.
  const mostrarActual = editing && current.data && !opcionesHabitaciones.some(h => h.id === habitacionActual);
  const habitacionValue = selectedHabitacion ?? (habitacionActual !== undefined ? String(habitacionActual) : '');
  const catalogosListos = !habitaciones.loading && !habitaciones.error && !!habitaciones.data
    && (opcionesHabitaciones.length > 0 || !!mostrarActual)
    && (editing ? !!current.data && !current.loading && !current.error : !estados.loading && !estados.error && !!estados.data?.length);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite || submitting.current || !catalogosListos) return;
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();
    const validation: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && !value(field.name)) validation[field.name] = 'Este campo es obligatorio.';
    }
    if (!value('habitacionId')) validation.habitacionId = 'Seleccione una habitación.';
    if (!editing && !value('estadoInicialId')) validation.estadoInicialId = 'Seleccione un estado inicial.';
    if (Object.keys(validation).length) { setErrors(validation); return; }
    const body: ResidenteUpdateRequest = {
      nombre: value('nombre'), apellido: value('apellido'), dni: value('dni'),
      fechaNacimiento: value('fechaNacimiento'), direccion: value('direccion') || null,
      telefono: value('telefono') || null, email: value('email') || null,
      telefonoEmergencia: value('telefonoEmergencia') || null, familiarACargo: value('familiarACargo') || null,
      fechaIngreso: value('fechaIngreso'), fechaEgreso: value('fechaEgreso') || null,
      obraSocial: value('obraSocial') || null, habitacionId: Number(value('habitacionId')),
    };
    submitting.current = true;
    setBusy(true); setError(''); setErrors({});
    try {
      if (residenteId !== undefined) await actualizarResidente(residenteId, body);
      else await crearResidente({ ...body, estadoInicialId: Number(value('estadoInicialId')) });
      onSaved();
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }

  if (!canWrite) return null;
  return <ResidenteModal title={editing ? 'Editar residente' : 'Nuevo residente'} busy={busy} onClose={onClose}>
    {editing && current.loading ? <p role="status">Cargando residente…</p> : editing && current.error ? <ErrorNotice message={current.error} retry={current.reload} /> : (
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorNotice message={error} />}
        <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(field => <div key={field.name}>
            <label htmlFor={field.name} className="block text-xs font-medium mb-1">{field.label}{field.required ? ' *' : ''}</label>
            <input id={field.name} name={field.name} type={field.type ?? 'text'} required={field.required} maxLength={field.maxLength}
              defaultValue={current.data?.[field.name] ?? ''} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            {errors[field.name] && <p id={`${field.name}-error`} className="text-xs text-red-700 mt-1">{errors[field.name]}</p>}
          </div>)}
          <div>
            <label htmlFor="habitacionId" className="block text-xs font-medium mb-1">Habitación *</label>
            <select id="habitacionId" name="habitacionId" disabled={habitaciones.loading || !!habitaciones.error} required
              value={habitacionValue} onChange={event => setSelectedHabitacion(event.target.value)}
              aria-invalid={!!errors.habitacionId} aria-describedby={errors.habitacionId ? 'habitacionId-error' : undefined}
              className="w-full px-3 py-2.5 rounded-lg text-sm disabled:opacity-60" style={inputStyle}>
              <option value="">Seleccione una habitación</option>
              {mostrarActual && <option value={current.data!.habitacionId}>Habitación {current.data!.habitacionNumero} — Actual</option>}
              {opcionesHabitaciones.map(h => <option key={h.id} value={h.id}>
                Habitación {h.numero} — {h.tipo} — {h.cuposDisponibles} {h.cuposDisponibles === 1 ? 'cupo disponible' : 'cupos disponibles'}{editing && h.id === habitacionActual ? ' — Actual' : ''}
              </option>)}
            </select>
            {habitaciones.loading && <p role="status" className="text-xs mt-1">Cargando habitaciones…</p>}
            {habitaciones.error && <ErrorNotice message={habitaciones.error} retry={habitaciones.reload} />}
            {!habitaciones.loading && !habitaciones.error && opcionesHabitaciones.length === 0 && !mostrarActual && <p role="status" className="text-xs mt-1">No hay habitaciones con cupos disponibles.</p>}
            {errors.habitacionId && <p id="habitacionId-error" className="text-xs text-red-700 mt-1">{errors.habitacionId}</p>}
            {editing && current.data && <p className="text-xs mt-1">Habitación actual: {current.data.habitacionNumero}</p>}
          </div>
          {!editing && <div>
            <label htmlFor="estadoInicialId" className="block text-xs font-medium mb-1">Estado inicial *</label>
            <select id="estadoInicialId" name="estadoInicialId" required defaultValue="" disabled={estados.loading || !!estados.error} aria-invalid={!!errors.estadoInicialId}
              aria-describedby={errors.estadoInicialId ? 'estadoInicialId-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
              <option value="">Seleccione un estado</option>
              {estados.data?.map(estado => <option key={estado.id} value={estado.id}>{estado.nombre}</option>)}
            </select>
            {estados.loading && <p role="status" className="text-xs mt-1">Cargando estados…</p>}
            {estados.error && <ErrorNotice message={estados.error} retry={estados.reload} />}
            {estados.data?.length === 0 && <p className="text-xs mt-1">No hay estados disponibles.</p>}
            {errors.estadoInicialId && <p id="estadoInicialId-error" className="text-xs text-red-700 mt-1">{errors.estadoInicialId}</p>}
          </div>}
        </fieldset>
        <div className="flex gap-3 mt-6 justify-end">
          <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={inputStyle}>Cancelar</button>
          <button disabled={!catalogosListos || busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : 'Guardar residente'}</button>
        </div>
      </form>
    )}
  </ResidenteModal>;
}
