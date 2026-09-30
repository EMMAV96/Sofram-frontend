import { useRef, useState, type FormEvent } from 'react';
import { actualizarAntecedentesYAlergias, crearDetalle, crearHistoriaClinica, type HistoriaClinicaResponse } from '../../api/historiasClinicasApi';
import type { ResidenteResponse } from '../../api/residentesApi';
import { useAuth } from '../../auth/AuthContext';
import { historiasClinicasPermissions } from '../../auth/historiasClinicasPermissions';
import { ResidenteModal as Modal } from '../residentes/ResidenteModal';
import { ErrorNotice, errorMessage, fieldErrors, inputStyle, primaryStyle } from '../residentes/shared';

export type HistoriaAction = { mode: 'crear' } | { mode: 'antecedentes' | 'evolucion'; historia: HistoriaClinicaResponse };

export function HistoriaClinicaModal({ action, residente, onClose, onSaved }: { action: HistoriaAction; residente: ResidenteResponse; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const permissions = historiasClinicasPermissions(user?.rol);
  const allowed = action.mode === 'crear' ? permissions.canCreate : action.mode === 'evolucion' ? permissions.canAddDetalle : permissions.canUpdateAntecedentes;
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const antecedentes = action.mode === 'antecedentes';
  const fechaField = action.mode === 'crear' ? 'fechaCreacion' : 'fecha';
  const textFields = antecedentes ? [
    { name: 'antecedentesPersonales', label: 'Antecedentes personales', value: action.historia.antecedentesPersonales, max: 2000 },
    { name: 'antecedentesFamiliares', label: 'Antecedentes familiares', value: action.historia.antecedentesFamiliares, max: 2000 },
    { name: 'alergias', label: 'Alergias', value: action.historia.alergias, max: 2000 },
  ] : [{ name: 'observaciones', label: 'Observaciones', value: '', max: 1000 }];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed || submitting.current) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const validation: Record<string, string> = {};
    if (!antecedentes && !value(fechaField)) validation[fechaField] = 'Ingrese la fecha.';
    if (action.mode === 'crear' && !residente.id) validation.residenteId = 'Seleccione un residente.';
    for (const field of textFields) if (value(field.name).length > field.max) validation[field.name] = `Máximo ${field.max} caracteres.`;
    setError(''); setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true; setBusy(true);
    try {
      if (action.mode === 'crear') await crearHistoriaClinica({ residenteId: residente.id, fechaCreacion: value('fechaCreacion'), observaciones: value('observaciones') || null });
      else if (action.mode === 'evolucion') await crearDetalle(action.historia.id, { fecha: value('fecha'), observaciones: value('observaciones') || null });
      else await actualizarAntecedentesYAlergias(action.historia.id, {
        antecedentesPersonales: value('antecedentesPersonales') || null,
        antecedentesFamiliares: value('antecedentesFamiliares') || null,
        alergias: value('alergias') || null,
      });
      onSaved();
    } catch (error: unknown) { setError(errorMessage(error)); setErrors(fieldErrors(error)); }
    finally { submitting.current = false; setBusy(false); }
  }

  if (!allowed) return null;
  return <Modal title={action.mode === 'crear' ? 'Crear historia clínica' : antecedentes ? 'Editar antecedentes y alergias' : 'Agregar evolución'} busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg p-3 text-sm" style={{ background: 'var(--muted)' }}>Residente: {residente.apellido}, {residente.nombre} · DNI {residente.dni}</p>
      {errors.residenteId && <ErrorNotice message={errors.residenteId} />}
      {error && <ErrorNotice message={error} />}
      <fieldset disabled={busy} className="space-y-4">
        {!antecedentes && <div>
          <label htmlFor={fechaField} className="block text-xs font-medium mb-1">{action.mode === 'crear' ? 'Fecha de creación' : 'Fecha'} *</label>
          <input id={fechaField} name={fechaField} type="date" required aria-invalid={!!errors[fechaField]} aria-describedby={errors[fechaField] ? `${fechaField}-error` : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          {errors[fechaField] && <p id={`${fechaField}-error`} className="text-xs text-red-700 mt-1">{errors[fechaField]}</p>}
        </div>}
        {textFields.map(field => <div key={field.name}>
          <label htmlFor={field.name} className="block text-xs font-medium mb-1">{field.label}</label>
          <textarea id={field.name} name={field.name} rows={3} maxLength={field.max} defaultValue={field.value ?? ''} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          {errors[field.name] && <p id={`${field.name}-error`} className="text-xs text-red-700 mt-1">{errors[field.name]}</p>}
        </div>)}
      </fieldset>
      <div className="flex justify-end gap-3 mt-6">
        <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}>Cancelar</button>
        <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  </Modal>;
}
