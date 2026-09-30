import { useRef, useState, type FormEvent } from 'react';
import { crearActividad, type ActividadResponse } from '../../api/actividadesApi';
import { listarCalendarios, listarDetalles } from '../../api/calendariosApi';
import { listarEmpleados } from '../../api/personalApi';
import { useAuth } from '../../auth/AuthContext';
import { canCreateActividad } from '../../auth/actividadesPermissions';
import { ResidenteModal as Modal } from '../residentes/ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, formatFecha, inputStyle, primaryStyle, useApiResource } from '../residentes/shared';

const fields = [
  { name: 'nombre', label: 'Nombre', max: 150, required: true },
  { name: 'descripcion', label: 'Descripción', max: 2000 },
  { name: 'tipo', label: 'Tipo', max: 100, required: true },
  { name: 'duracion', label: 'Duración', type: 'number', required: true },
  { name: 'cupoMaximo', label: 'Cupo máximo', type: 'number', required: true },
  { name: 'estado', label: 'Estado', max: 50, required: true },
];
export function ActividadModal({ onClose, onSaved }: { onClose: () => void; onSaved: (actividad: ActividadResponse) => void }) {
  const { user } = useAuth();
  const allowed = canCreateActividad(user?.rol);
  const admin = user?.rol === 'ADMINISTRADOR';
  const calendarios = useApiResource(listarCalendarios, 'calendarios-actividad', allowed);
  const [calendarioId, setCalendarioId] = useState('');
  const detalles = useApiResource(signal => listarDetalles(Number(calendarioId), signal), `franjas-${calendarioId}`, allowed && !!calendarioId);
  const empleados = useApiResource(listarEmpleados, 'empleados-actividad', allowed && admin);
  const activos = empleados.data?.filter(e => e.activo === true) ?? [];
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const identityMissing = !admin && (!Number.isSafeInteger(user?.empleadoId) || !user?.empleadoId);
  const blocked = !calendarioId || calendarios.loading || !!calendarios.error || detalles.loading || !!detalles.error || !detalles.data?.length
    || (admin ? empleados.loading || !!empleados.error || activos.length === 0 : identityMissing);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed || blocked || submitting.current) return;
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    const validation: Record<string, string> = {};
    const detalleCalendarioId = Number(value('detalleCalendarioId'));
    const empleadoId = admin ? Number(value('empleadoId')) : user!.empleadoId;
    if (!detalles.data?.some(d => d.id === detalleCalendarioId && d.calendarioId === Number(calendarioId))) validation.detalleCalendarioId = 'Seleccione una franja del calendario.';
    if (admin && !activos.some(e => e.id === empleadoId)) validation.empleadoId = 'Seleccione un empleado activo.';
    for (const field of fields) {
      if (field.required && !value(field.name)) validation[field.name] = 'Este campo es obligatorio.';
      else if (field.max && value(field.name).length > field.max) validation[field.name] = `Máximo ${field.max} caracteres.`;
      if (field.type === 'number' && (!Number.isInteger(Number(value(field.name))) || Number(value(field.name)) <= 0)) validation[field.name] = 'Ingrese un entero positivo.';
    }
    setError(''); setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true; setBusy(true);
    try { onSaved(await crearActividad({ detalleCalendarioId, empleadoId, nombre: value('nombre'), descripcion: value('descripcion') || null, tipo: value('tipo'), duracion: Number(value('duracion')), cupoMaximo: Number(value('cupoMaximo')), estado: value('estado') })); }
    catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (!allowed) return null;
  return <Modal title="Nueva actividad" busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorNotice message={error} />}
      {identityMissing && <ErrorNotice message="La sesión no tiene un empleado asociado válido. No se puede crear la actividad." />}
      {calendarios.loading && <p role="status">Cargando calendarios…</p>}
      {calendarios.error && <ErrorNotice message={calendarios.error} retry={calendarios.reload} />}
      {calendarios.data?.length === 0 && <p>No hay calendarios disponibles. Primero cree un calendario y una franja en Calendario.</p>}
      <fieldset disabled={busy} className="space-y-4">
        <div><label htmlFor="actividad-calendario" className="block text-xs font-medium mb-1">Calendario *</label>
          <select id="actividad-calendario" required value={calendarioId} onChange={e => setCalendarioId(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione un calendario</option>{calendarios.data?.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.periodo} — {c.anio}</option>)}
          </select>
        </div>
        {calendarioId && <div>
          <label htmlFor="actividad-detalle" className="block text-xs font-medium mb-1">Franja del calendario *</label>
          <select key={calendarioId} id="actividad-detalle" name="detalleCalendarioId" required defaultValue="" disabled={detalles.loading || !!detalles.error} aria-invalid={!!errors.detalleCalendarioId} aria-describedby={errors.detalleCalendarioId ? 'actividad-detalle-error' : undefined} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione una franja</option>{detalles.data?.map(d => <option key={d.id} value={d.id}>{formatFecha(d.fecha)} — {d.horaInicio} a {d.horaFin} — {d.estado} (#{d.id})</option>)}
          </select>
          {detalles.loading && <p role="status">Cargando franjas…</p>}{detalles.error && <ErrorNotice message={detalles.error} retry={detalles.reload} />}
          {detalles.data?.length === 0 && <p className="text-sm">Este calendario no tiene franjas. Agregue un detalle desde Calendario.</p>}
          {errors.detalleCalendarioId && <p id="actividad-detalle-error" className="text-xs text-red-700">{errors.detalleCalendarioId}</p>}
        </div>}
        {admin ? <div>
          <label htmlFor="actividad-empleado" className="block text-xs font-medium mb-1">Responsable *</label>
          <select id="actividad-empleado" name="empleadoId" required defaultValue="" disabled={empleados.loading || !!empleados.error} aria-invalid={!!errors.empleadoId} aria-describedby={errors.empleadoId ? 'actividad-empleado-error' : undefined} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione un empleado</option>{activos.map(e => <option key={e.id} value={e.id}>{e.apellido}, {e.nombre} — {e.cargoNombre} — DNI {e.dni}</option>)}
          </select>
          {empleados.loading && <p role="status">Cargando empleados…</p>}{empleados.error && <ErrorNotice message={empleados.error} retry={empleados.reload} />}
          {!empleados.loading && !empleados.error && activos.length === 0 && <p className="text-sm">No hay empleados activos disponibles.</p>}
        </div> : <p className="text-sm">Responsable asociado a la sesión.</p>}
        {errors.empleadoId && <p id="actividad-empleado-error" className="text-xs text-red-700">{errors.empleadoId}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{fields.map(field => <div key={field.name}>
          <label htmlFor={`actividad-${field.name}`} className="block text-xs font-medium mb-1">{field.label}{field.required ? ' *' : ''}</label>
          {field.name === 'descripcion' ? <textarea id={`actividad-${field.name}`} name={field.name} maxLength={field.max} rows={3} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            : <input id={`actividad-${field.name}`} name={field.name} type={field.type ?? 'text'} min={field.type === 'number' ? 1 : undefined} step={field.type === 'number' ? 1 : undefined} maxLength={field.max} required={field.required} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />}
          {errors[field.name] && <p id={`${field.name}-error`} className="text-xs text-red-700">{errors[field.name]}</p>}
        </div>)}</div>
      </fieldset>
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={inputStyle}>Cancelar</button><button type="submit" disabled={busy || blocked} className="px-4 py-2 rounded-lg text-sm disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : 'Crear actividad'}</button></div>
    </form>
  </Modal>;
}
