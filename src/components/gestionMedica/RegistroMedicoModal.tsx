import { useRef, useState, type FormEvent } from 'react';
import * as api from '../../api/gestionMedicaApi';
import { listarEmpleados } from '../../api/personalApi';
import type { ResidenteResponse } from '../../api/residentesApi';
import type { DetalleHistoriaClinicaResponse } from '../../api/historiasClinicasApi';
import { useAuth } from '../../auth/AuthContext';
import { gestionMedicaPermissions } from '../../auth/gestionMedicaPermissions';
import { ResidenteModal as Modal } from '../residentes/ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, formatFecha, inputStyle, primaryStyle, useApiResource } from '../residentes/shared';

export type RegistroAction = { mode: 'atencion' }
  | { mode: 'evaluacion'; atencion: api.AtencionMedicaResponse }
  | { mode: 'diagnostico' | 'tratamiento' | 'medicacion'; detalle: DetalleHistoriaClinicaResponse };

type Field = { name: string; label: string; required?: boolean; max?: number; date?: boolean };
const fields: Record<RegistroAction['mode'], Field[]> = {
  atencion: [
    { name: 'fecha', label: 'Fecha', required: true, date: true },
    { name: 'motivo', label: 'Motivo', max: 500 },
    { name: 'tipoIntervencion', label: 'Tipo de intervención', max: 100 },
    { name: 'observaciones', label: 'Observaciones', max: 1000 },
  ],
  evaluacion: [
    { name: 'tipoEvaluacion', label: 'Tipo de evaluación', required: true, max: 100 },
    { name: 'descripcion', label: 'Descripción', required: true, max: 2000 },
    { name: 'planIntervencion', label: 'Plan de intervención', max: 2000 },
  ],
  diagnostico: [{ name: 'descripcion', label: 'Descripción', required: true, max: 2000 }],
  tratamiento: [{ name: 'nombre', label: 'Nombre', required: true, max: 150 }, { name: 'descripcion', label: 'Descripción', max: 2000 }],
  medicacion: [{ name: 'nombre', label: 'Nombre', required: true, max: 150 }, { name: 'dosis', label: 'Dosis', required: true, max: 100 }, { name: 'frecuencia', label: 'Frecuencia', required: true, max: 150 }],
};
const titles = { atencion: 'Nueva atención', evaluacion: 'Agregar evaluación', diagnostico: 'Agregar diagnóstico', tratamiento: 'Agregar tratamiento', medicacion: 'Agregar medicación' };

export function RegistroMedicoModal({ action, residente, detalles, onClose, onSaved }: {
  action: RegistroAction; residente: ResidenteResponse; detalles: DetalleHistoriaClinicaResponse[]; onClose: () => void; onSaved: () => void;
}) {
  const { user } = useAuth();
  const permissions = gestionMedicaPermissions(user?.rol);
  const allowed = action.mode === 'atencion' || action.mode === 'evaluacion' ? permissions.canAccess : permissions.canClinical;
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const seleccionarEmpleado = action.mode === 'atencion' && user?.rol === 'ADMINISTRADOR';
  const empleados = useApiResource(listarEmpleados, 'empleados-atencion', seleccionarEmpleado);
  const empleadosActivos = empleados.data?.filter(empleado => empleado.activo === true) ?? [];
  const empleadoValido = typeof user?.empleadoId === 'number' && Number.isSafeInteger(user.empleadoId) && user.empleadoId > 0;
  const bloqueado = (action.mode === 'atencion' && (seleccionarEmpleado
    ? empleados.loading || !!empleados.error || empleadosActivos.length === 0
    : !empleadoValido)) || (action.mode === 'evaluacion' && detalles.length === 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed || submitting.current || bloqueado) return;
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    const validation: Record<string, string> = {};
    const empleadoId = seleccionarEmpleado ? Number(value('empleadoId')) : user?.empleadoId;
    if (seleccionarEmpleado && !empleadosActivos.some(empleado => empleado.id === empleadoId)) validation.empleadoId = 'Seleccione un profesional activo.';
    for (const field of fields[action.mode]) {
      if (field.required && !value(field.name)) validation[field.name] = 'Este campo es obligatorio.';
      else if (field.max && value(field.name).length > field.max) validation[field.name] = `Máximo ${field.max} caracteres.`;
    }
    const detalleId = action.mode === 'evaluacion' ? Number(value('detalleHistoriaClinicaId')) : 'detalle' in action ? action.detalle.id : undefined;
    if (action.mode !== 'atencion' && !detalles.some(detalle => detalle.id === detalleId)) validation.detalleHistoriaClinicaId = 'Seleccione una evolución de este residente.';
    if (action.mode === 'evaluacion' && action.atencion.residenteId !== residente.id) validation.atencionMedicaId = 'La atención debe pertenecer al residente seleccionado.';
    setError(''); setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true; setBusy(true);
    try {
      switch (action.mode) {
        case 'atencion': await api.crearAtencion({ residenteId: residente.id, empleadoId: empleadoId!, fecha: value('fecha'), motivo: value('motivo') || null, tipoIntervencion: value('tipoIntervencion') || null, observaciones: value('observaciones') || null }); break;
        case 'evaluacion': await api.crearEvaluacion({ atencionMedicaId: action.atencion.id, detalleHistoriaClinicaId: detalleId!, tipoEvaluacion: value('tipoEvaluacion'), descripcion: value('descripcion'), planIntervencion: value('planIntervencion') || null }); break;
        case 'diagnostico': await api.crearDiagnostico({ detalleHistoriaClinicaId: detalleId!, descripcion: value('descripcion') }); break;
        case 'tratamiento': await api.crearTratamiento({ detalleHistoriaClinicaId: detalleId!, nombre: value('nombre'), descripcion: value('descripcion') || null }); break;
        case 'medicacion': await api.crearMedicacion({ detalleHistoriaClinicaId: detalleId!, nombre: value('nombre'), dosis: value('dosis'), frecuencia: value('frecuencia') }); break;
      }
      onSaved();
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }

  if (!allowed) return null;
  return <Modal title={titles[action.mode]} busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg p-3 text-sm" style={{ background: 'var(--muted)' }}>Residente: {residente.apellido}, {residente.nombre} · DNI {residente.dni}</p>
      {action.mode === 'atencion' && !seleccionarEmpleado && <p className="text-sm">Profesional asociado a la sesión{!empleadoValido && ': la sesión no incluye un empleado válido.'}</p>}
      {seleccionarEmpleado && empleados.loading && <p role="status" className="text-sm">Cargando profesionales…</p>}
      {seleccionarEmpleado && empleados.error && <ErrorNotice message={empleados.error} retry={empleados.reload} />}
      {seleccionarEmpleado && !empleados.loading && !empleados.error && empleadosActivos.length === 0 && <p role="status" className="text-sm">No hay empleados activos disponibles para registrar una atención.</p>}
      {action.mode === 'evaluacion' && <p className="text-sm">Atención del {formatFecha(action.atencion.fecha)} · {action.atencion.motivo || 'Sin motivo informado'}</p>}
      {'detalle' in action && <p className="text-sm whitespace-pre-wrap">Evolución del {formatFecha(action.detalle.fecha)} · {action.detalle.observaciones || 'Sin observaciones'}</p>}
      {error && <ErrorNotice message={error} />}
      {errors.residenteId && <ErrorNotice message={errors.residenteId} />}
      {!seleccionarEmpleado && errors.empleadoId && <ErrorNotice message={errors.empleadoId} />}
      {errors.atencionMedicaId && <ErrorNotice message={errors.atencionMedicaId} />}
      <fieldset disabled={busy} className="space-y-4">
        {seleccionarEmpleado && <div>
          <label htmlFor="empleadoId" className="block text-xs font-medium mb-1">Profesional *</label>
          <select id="empleadoId" name="empleadoId" required defaultValue="" disabled={empleados.loading || !!empleados.error || empleadosActivos.length === 0}
            aria-invalid={!!errors.empleadoId} aria-describedby={errors.empleadoId ? 'empleadoId-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione un profesional</option>
            {empleadosActivos.map(empleado => <option key={empleado.id} value={empleado.id}>{empleado.apellido}, {empleado.nombre} — {empleado.cargoNombre} — DNI {empleado.dni}</option>)}
          </select>
          {errors.empleadoId && <p id="empleadoId-error" className="text-xs text-red-700 mt-1">{errors.empleadoId}</p>}
        </div>}
        {action.mode === 'evaluacion' && <div>
          <label htmlFor="detalleHistoriaClinicaId" className="block text-xs font-medium mb-1">Evolución clínica *</label>
          <select id="detalleHistoriaClinicaId" name="detalleHistoriaClinicaId" required defaultValue="" aria-invalid={!!errors.detalleHistoriaClinicaId} aria-describedby={errors.detalleHistoriaClinicaId ? 'detalle-error' : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione una evolución</option>
            {detalles.map(detalle => <option key={detalle.id} value={detalle.id}>{formatFecha(detalle.fecha)} · {detalle.observaciones || 'Sin observaciones'} (#{detalle.id})</option>)}
          </select>
          {detalles.length === 0 && <p className="text-sm">Primero debe existir una evolución clínica para registrar la evaluación.</p>}
        </div>}
        {errors.detalleHistoriaClinicaId && <p id="detalle-error" className="text-xs text-red-700">{errors.detalleHistoriaClinicaId}</p>}
        {fields[action.mode].map(field => <div key={field.name}>
          <label htmlFor={field.name} className="block text-xs font-medium mb-1">{field.label}{field.required ? ' *' : ''}</label>
          {field.max && field.max > 150 ? <textarea id={field.name} name={field.name} required={field.required} maxLength={field.max} rows={3} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
            : <input id={field.name} name={field.name} type={field.date ? 'date' : 'text'} required={field.required} maxLength={field.max} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />}
          {errors[field.name] && <p id={`${field.name}-error`} className="text-xs text-red-700 mt-1">{errors[field.name]}</p>}
        </div>)}
      </fieldset>
      <div className="flex justify-end gap-3">
        <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}>Cancelar</button>
        <button type="submit" disabled={busy || bloqueado} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  </Modal>;
}
