import { useRef, useState, type FormEvent } from 'react';
import * as api from '../../api/personalApi';
import { useAuth } from '../../auth/AuthContext';
import { canAccessPersonal } from '../../auth/personalPermissions';
import { ResidenteModal as Modal } from '../residentes/ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, inputStyle, primaryStyle, useApiResource } from '../residentes/shared';

export type PersonalAction = { mode: 'crear' } | { mode: 'cargo' } | { mode: 'turno' }
  | { mode: 'editar'; empleado: api.EmpleadoResponse }
  | { mode: 'baja'; empleado: api.EmpleadoResponse }
  | { mode: 'asignar'; empleado: api.EmpleadoResponse };
type Field = { name: string; label: string; required?: boolean; max?: number; type?: string };
const empleadoFields: Field[] = [
  { name: 'apellido', label: 'Apellido', required: true, max: 100 },
  { name: 'nombre', label: 'Nombre', required: true, max: 100 },
  { name: 'dni', label: 'DNI', required: true, max: 20 },
  { name: 'fechaNacimiento', label: 'Fecha de nacimiento', required: true, type: 'date' },
  { name: 'direccion', label: 'Dirección', max: 255 },
  { name: 'telefono', label: 'Teléfono', max: 30 },
  { name: 'email', label: 'Email', type: 'email', max: 150 },
];
const fields: Record<PersonalAction['mode'], Field[]> = {
  crear: empleadoFields, editar: empleadoFields,
  baja: [{ name: 'fechaBaja', label: 'Fecha de baja', required: true, type: 'date' }],
  cargo: [{ name: 'nombre', label: 'Nombre', required: true, max: 100 }, { name: 'sector', label: 'Sector', max: 100 }, { name: 'matricula', label: 'Matrícula', max: 50 }, { name: 'especialidad', label: 'Especialidad', max: 100 }],
  turno: [{ name: 'descripcion', label: 'Descripción', required: true, max: 50 }, { name: 'horaInicio', label: 'Hora de inicio', type: 'time', required: true }, { name: 'horaFin', label: 'Hora de fin', type: 'time', required: true }],
  asignar: [{ name: 'fechaDesde', label: 'Fecha desde', required: true, type: 'date' }, { name: 'motivoCambio', label: 'Motivo del cambio', max: 255 }],
};
const titles = { crear: 'Nuevo empleado', editar: 'Editar empleado', baja: 'Dar de baja', cargo: 'Nuevo cargo', turno: 'Nuevo turno', asignar: 'Asignar turno' };
function localDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
const timeValue = (value: string) => value.length === 5 ? `${value}:00` : value;

export function PersonalModal({ action, onClose, onSaved }: { action: PersonalAction; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const allowed = canAccessPersonal(user?.rol) && (!('empleado' in action) || !['baja', 'asignar'].includes(action.mode) || action.empleado.activo);
  const employeeForm = action.mode === 'crear' || action.mode === 'editar';
  const cargos = useApiResource(api.listarCargos, 'cargos-form', allowed && employeeForm);
  const turnos = useApiResource(api.listarTurnos, 'turnos-form', allowed && action.mode === 'asignar');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const empleado = 'empleado' in action ? action.empleado : undefined;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const blocked = (employeeForm && (cargos.loading || !!cargos.error || (!cargos.data?.length && !empleado)))
    || (action.mode === 'asignar' && (turnos.loading || !!turnos.error || !turnos.data?.length));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed || blocked || submitting.current) return;
    const data = new FormData(event.currentTarget);
    const value = (key: string) => key === 'dni' && action.mode === 'editar' ? action.empleado.dni : String(data.get(key) ?? '').trim();
    const validation: Record<string, string> = {};
    for (const field of fields[action.mode]) {
      if (field.required && !value(field.name)) validation[field.name] = 'Este campo es obligatorio.';
      else if (field.max && value(field.name).length > field.max) validation[field.name] = `Máximo ${field.max} caracteres.`;
    }
    if (employeeForm) {
      if (!value('cargoId')) validation.cargoId = 'Seleccione un cargo.';
      if (value('fechaNacimiento') >= localDate(new Date())) validation.fechaNacimiento = 'La fecha de nacimiento debe ser pasada.';
    }
    if (action.mode === 'asignar' && !value('turnoId')) validation.turnoId = 'Seleccione un turno.';
    setError(''); setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true; setBusy(true);
    try {
      if (action.mode === 'crear' || action.mode === 'editar') {
        const body: api.EmpleadoRequest = { cargoId: Number(value('cargoId')), apellido: value('apellido'), nombre: value('nombre'), dni: value('dni'), fechaNacimiento: value('fechaNacimiento'), direccion: value('direccion') || null, telefono: value('telefono') || null, email: value('email') || null };
        if (action.mode === 'crear') await api.crearEmpleado(body);
        else await api.actualizarEmpleado(action.empleado.id, body);
      } else if (action.mode === 'baja') await api.darBajaEmpleado(action.empleado.id, { fechaBaja: value('fechaBaja') });
      else if (action.mode === 'cargo') await api.crearCargo({ nombre: value('nombre'), sector: value('sector') || null, matricula: value('matricula') || null, especialidad: value('especialidad') || null });
      else if (action.mode === 'turno') await api.crearTurno({ descripcion: value('descripcion'), horaInicio: timeValue(value('horaInicio')), horaFin: timeValue(value('horaFin')) });
      else await api.asignarTurno(action.empleado.id, { turnoId: Number(value('turnoId')), fechaDesde: value('fechaDesde'), motivoCambio: value('motivoCambio') || null });
      onSaved();
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }

  if (!allowed) return null;
  return <Modal title={titles[action.mode]} busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      {empleado && <p className="rounded-lg p-3 text-sm" style={{ background: 'var(--muted)' }}>{empleado.apellido}, {empleado.nombre} · DNI {empleado.dni}</p>}
      {action.mode === 'baja' && <p className="text-sm">Confirme la baja de este empleado. Su asignación activa de turno se cerrará con la fecha indicada.</p>}
      {error && <ErrorNotice message={error} />}
      {employeeForm && <>
        {cargos.loading && <p role="status">Cargando cargos…</p>}
        {cargos.error && <ErrorNotice message={cargos.error} retry={cargos.reload} />}
        {cargos.data?.length === 0 && <p className="text-sm">No hay cargos registrados. Puede crear uno en la pestaña Cargos.</p>}
      </>}
      {action.mode === 'asignar' && <>
        {turnos.loading && <p role="status">Cargando turnos…</p>}
        {turnos.error && <ErrorNotice message={turnos.error} retry={turnos.reload} />}
        {turnos.data?.length === 0 && <p className="text-sm">No hay turnos registrados. Puede crear uno en la pestaña Turnos.</p>}
      </>}
      <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {employeeForm && <div className="sm:col-span-2">
          <label htmlFor="personal-cargoId" className="block text-xs font-medium mb-1">Cargo *</label>
          <select id="personal-cargoId" name="cargoId" required defaultValue={empleado?.cargoId ?? ''} disabled={cargos.loading || !!cargos.error} aria-invalid={!!errors.cargoId} aria-describedby={errors.cargoId ? 'cargoId-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione un cargo</option>
            {empleado && !cargos.data?.some(c => c.id === empleado.cargoId) && <option value={empleado.cargoId}>{empleado.cargoNombre}</option>}
            {cargos.data?.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.sector ? ` — ${c.sector}` : ''} (#{c.id})</option>)}
          </select>
          {errors.cargoId && <p id="cargoId-error" className="text-xs text-red-700">{errors.cargoId}</p>}
        </div>}
        {action.mode === 'asignar' && <div className="sm:col-span-2">
          <label htmlFor="personal-turnoId" className="block text-xs font-medium mb-1">Turno *</label>
          <select id="personal-turnoId" name="turnoId" required defaultValue="" disabled={turnos.loading || !!turnos.error} aria-invalid={!!errors.turnoId} aria-describedby={errors.turnoId ? 'turnoId-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione un turno</option>
            {turnos.data?.map(t => <option key={t.id} value={t.id}>{t.descripcion} — {t.horaInicio} a {t.horaFin}</option>)}
          </select>
          {errors.turnoId && <p id="turnoId-error" className="text-xs text-red-700">{errors.turnoId}</p>}
        </div>}
        {fields[action.mode].map(field => <div key={field.name}>
          <label htmlFor={`personal-${field.name}`} className="block text-xs font-medium mb-1">{field.label}{field.required ? ' *' : ''}</label>
          <input id={`personal-${field.name}`} name={field.name} type={field.type ?? 'text'} required={field.required} maxLength={field.max}
            readOnly={action.mode === 'editar' && field.name === 'dni'} max={field.name === 'fechaNacimiento' ? localDate(yesterday) : undefined} step={field.type === 'time' ? 1 : undefined}
            defaultValue={action.mode === 'editar' ? String(action.empleado[field.name as keyof api.EmpleadoResponse] ?? '') : ''}
            aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm read-only:opacity-70" style={inputStyle} />
          {action.mode === 'editar' && field.name === 'dni' && <p className="text-xs mt-1">El DNI no se puede modificar.</p>}
          {errors[field.name] && <p id={`${field.name}-error`} className="text-xs text-red-700 mt-1">{errors[field.name]}</p>}
        </div>)}
      </fieldset>
      <div className="flex justify-end gap-3">
        <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}>Cancelar</button>
        <button type="submit" disabled={busy || blocked} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : action.mode === 'baja' ? 'Confirmar baja' : 'Guardar'}</button>
      </div>
    </form>
  </Modal>;
}
