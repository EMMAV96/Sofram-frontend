import { useState } from 'react';
import { ApiError } from '../api/apiClient';
import * as api from '../api/gestionMedicaApi';
import { listarResidentes, type ResidenteResponse } from '../api/residentesApi';
import { obtenerHistoriaPorResidente, listarDetalles, type DetalleHistoriaClinicaResponse } from '../api/historiasClinicasApi';
import { useAuth } from '../auth/AuthContext';
import { gestionMedicaPermissions } from '../auth/gestionMedicaPermissions';
import { RegistroMedicoModal, type RegistroAction } from '../components/gestionMedica/RegistroMedicoModal';
import { ErrorNotice, cardStyle, formatFecha, inputStyle, primaryStyle, useApiResource } from '../components/residentes/shared';

type Tab = 'atenciones' | 'evaluaciones' | 'diagnosticos' | 'tratamientos' | 'medicacion';
const tabs: { key: Tab; label: string }[] = [{ key: 'atenciones', label: 'Atenciones' }, { key: 'evaluaciones', label: 'Evaluaciones' }, { key: 'diagnosticos', label: 'Diagnósticos' }, { key: 'tratamientos', label: 'Tratamientos' }, { key: 'medicacion', label: 'Medicación' }];
type Resource<T> = { data?: T; loading: boolean; error: string; reload: () => void };
function Feedback({ resource }: { resource: Resource<unknown> }) {
  return resource.loading ? <p role="status" className="text-sm">Cargando…</p> : resource.error ? <ErrorNotice message={resource.error} retry={resource.reload} /> : null;
}

export function GestionMedicaPage() {
  const { user } = useAuth();
  const permission = gestionMedicaPermissions(user?.rol);
  const residentes = useApiResource(listarResidentes, 'residentes-medica', permission.canAccess);
  const [id, setId] = useState('');
  const [search, setSearch] = useState('');
  const selected = residentes.data?.find(r => String(r.id) === id);
  const filtered = residentes.data?.filter(r => String(r.id) === id || `${r.nombre} ${r.apellido} ${r.dni}`.toLowerCase().includes(search.trim().toLowerCase())) ?? [];
  if (!permission.canAccess) return <ErrorNotice message="Acceso no autorizado a Gestión Médica." />;
  return <div className="space-y-5">
    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Gestión médica integral de residentes. Seleccione un residente para ver sus registros específicos.</p>
    <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4" style={cardStyle}>
      <label htmlFor="medica-residente" className="text-sm font-medium">Residente:</label>
      <input type="search" aria-label="Buscar residente" placeholder="Nombre, apellido o DNI…" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={inputStyle} />
      <select id="medica-residente" disabled={residentes.loading || !!residentes.error} value={id} onChange={e => setId(e.target.value)} className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm" style={inputStyle}>
        <option value="">Seleccione un residente</option>
        {filtered.map(r => <option key={r.id} value={r.id}>{r.apellido}, {r.nombre} — DNI {r.dni} — Hab. {r.habitacionNumero}</option>)}
      </select>
    </div>
    <Feedback resource={residentes} />
    {residentes.data && (residentes.data.length === 0 ? <p>No hay residentes registrados.</p> : <>
      {filtered.length === 0 && <p className="text-sm">No hay resultados para la búsqueda.</p>}
      {selected ? <ResidenteMedico key={`${selected.id}-${user?.rol}`} residente={selected} /> : <p className="text-sm">Seleccione un residente para consultar sus registros.</p>}
    </>)}
  </div>;
}

function ResidenteMedico({ residente }: { residente: ResidenteResponse }) {
  const { user } = useAuth();
  const permissions = gestionMedicaPermissions(user?.rol);
  const [tab, setTab] = useState<Tab>('atenciones');
  const [atencionId, setAtencionId] = useState<number | null>(null);
  const [detalleId, setDetalleId] = useState('');
  const [action, setAction] = useState<RegistroAction | null>(null);
  const [success, setSuccess] = useState('');
  const [evaluationRevision, setEvaluationRevision] = useState(0);
  const [clinicalRevision, setClinicalRevision] = useState(0);
  const atenciones = useApiResource(signal => api.listarAtencionesPorResidente(residente.id, signal), `atenciones-${residente.id}`, permissions.canAccess);
  const historia = useApiResource(async signal => {
    try { return await obtenerHistoriaPorResidente(residente.id, signal); }
    catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404 && error.message.trim() === 'El residente no tiene historia clínica') return null;
      throw error;
    }
  }, `historia-medica-${residente.id}`, permissions.canAccess);
  const detalles = useApiResource(signal => listarDetalles(historia.data!.id, signal), `detalles-medica-${historia.data?.id}`, permissions.canAccess && !!historia.data);
  const atencion = atenciones.data?.find(a => a.id === atencionId && a.residenteId === residente.id);
  const detalle = detalles.data?.find(d => String(d.id) === detalleId);
  const detallesActuales = detalles.data?.filter(d => d.historiaClinicaId === historia.data?.id) ?? [];
  const detallesListos = !!historia.data && !historia.loading && !historia.error && !detalles.loading && !detalles.error;
  function open(value: RegistroAction) { setSuccess(''); setAction(value); }
  function saved() {
    setSuccess('Registro guardado correctamente.');
    if (action?.mode === 'atencion') atenciones.reload();
    else if (action?.mode === 'evaluacion') setEvaluationRevision(value => value + 1);
    else setClinicalRevision(value => value + 1);
    setAction(null);
  }
  if (!permissions.canAccess) return null;
  const detalleStatus = <>
    <Feedback resource={historia} />
    {historia.data === null && <p className="text-sm">El residente aún no tiene historia clínica. Primero necesita una historia con una evolución clínica para registrar esta información.</p>}
    {historia.data && <>
      <Feedback resource={detalles} />
      {detallesActuales.length === 0 && detallesListos && <p className="text-sm">La historia clínica aún no tiene evoluciones. Primero debe existir una evolución clínica.</p>}
    </>}
  </>;
  return <div className="space-y-5">
    {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
    <div className="flex gap-0.5 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
      {tabs.filter(t => permissions.canClinical || t.key === 'atenciones' || t.key === 'evaluaciones').map(t => <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={tab === t.key} className="px-4 py-2.5 text-sm font-medium whitespace-nowrap" style={{ borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t.key ? 'var(--primary)' : 'var(--muted-foreground)' }}>{t.label}</button>)}
    </div>
    <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
      {tab === 'atenciones' ? <>
        <div className="flex justify-between items-center gap-3">
          <h3 className="font-semibold" style={{ fontFamily: 'Lora, serif', color: 'var(--primary)' }}>Atenciones</h3>
          <button onClick={() => open({ mode: 'atencion' })} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={primaryStyle}>Nueva atención</button>
        </div>
        <Feedback resource={atenciones} />
        {atenciones.data?.length === 0 && <p className="text-sm">No hay atenciones registradas.</p>}
        {!!atenciones.data?.length && <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Fecha', 'Motivo', 'Tipo de intervención', 'Observaciones', 'Evaluación'].map(h => <th key={h} className="py-3 pr-4 text-left text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>{h}</th>)}</tr></thead>
          <tbody>{atenciones.data.map(a => <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', background: atencionId === a.id ? 'var(--muted)' : undefined }}>
            <td className="py-3 pr-4 whitespace-nowrap">{formatFecha(a.fecha)}</td><td className="py-3 pr-4 whitespace-pre-wrap">{a.motivo || '—'}</td><td className="py-3 pr-4">{a.tipoIntervencion || '—'}</td><td className="py-3 pr-4 whitespace-pre-wrap">{a.observaciones || '—'}</td>
            <td className="py-3"><button onClick={() => setAtencionId(a.id)} className="px-3 py-1.5 rounded text-xs" style={inputStyle}>{atencionId === a.id ? 'Seleccionada' : 'Seleccionar'}</button></td>
          </tr>)}</tbody>
        </table></div>}
        {atencion && <>
          <p className="text-sm font-medium">Atención seleccionada: {formatFecha(atencion.fecha)} · {atencion.motivo || 'Sin motivo informado'}</p>
          <EvaluacionAtencion key={`${atencion.id}-${evaluationRevision}`} atencion={atencion} canAdd={detallesListos && detallesActuales.length > 0} onAdd={() => open({ mode: 'evaluacion', atencion })} />
          {detalleStatus}
        </>}
      </> : <>
        <h3 className="font-semibold" style={{ fontFamily: 'Lora, serif', color: 'var(--primary)' }}>{tabs.find(t => t.key === tab)?.label}</h3>
        {detalleStatus}
        {detallesListos && detallesActuales.length > 0 && <>
          <label htmlFor="medica-detalle" className="block text-xs font-medium">Evolución clínica</label>
          <select id="medica-detalle" value={detalleId} onChange={e => { setDetalleId(e.target.value); setSuccess(''); }} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
            <option value="">Seleccione una evolución</option>
            {detallesActuales.map(d => <option key={d.id} value={d.id}>{formatFecha(d.fecha)} · {d.observaciones || 'Sin observaciones'} (#{d.id})</option>)}
          </select>
          {detalle ? <RegistrosDetalle key={`${detalle.id}-${tab}-${tab === 'evaluaciones' ? evaluationRevision : clinicalRevision}`} tab={tab} detalle={detalle} onAdd={open} /> : <p className="text-sm">Seleccione una evolución para consultar sus registros.</p>}
        </>}
      </>}
    </div>
    {action && <RegistroMedicoModal action={action} residente={residente} detalles={detallesListos ? detallesActuales : []} onClose={() => setAction(null)} onSaved={saved} />}
  </div>;
}

function EvaluacionAtencion({ atencion, canAdd, onAdd }: { atencion: api.AtencionMedicaResponse; canAdd: boolean; onAdd: () => void }) {
  const { user } = useAuth();
  const { canAccess } = gestionMedicaPermissions(user?.rol);
  const evaluacion = useApiResource(async signal => {
    try { return await api.obtenerEvaluacionPorAtencion(atencion.id, signal); }
    catch (error: unknown) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
  }, `evaluacion-atencion-${atencion.id}`, canAccess);
  if (!canAccess) return null;
  return <div className="rounded-lg p-4 space-y-3" style={{ border: '1px solid var(--border)', background: 'var(--background)' }}>
    <Feedback resource={evaluacion} />
    {evaluacion.data === null && <>
      <p className="text-sm">Esta atención aún no tiene evaluación.</p>
      <button disabled={!canAdd} onClick={onAdd} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={primaryStyle}>Agregar evaluación</button>
    </>}
    {evaluacion.data && <EvaluacionCard evaluacion={evaluacion.data} />}
  </div>;
}
function EvaluacionCard({ evaluacion }: { evaluacion: api.EvaluacionResponse }) {
  return <div className="space-y-2" data-evaluacion-id={evaluacion.id} data-detalle-id={evaluacion.detalleHistoriaClinicaId}>
    <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{evaluacion.tipoEvaluacion}</p>
    <p className="text-sm whitespace-pre-wrap break-words">{evaluacion.descripcion}</p>
    <p className="text-sm whitespace-pre-wrap break-words">Plan de intervención: {evaluacion.planIntervencion || '—'}</p>
  </div>;
}

function RegistrosDetalle({ tab, detalle, onAdd }: { tab: Exclude<Tab, 'atenciones'>; detalle: DetalleHistoriaClinicaResponse; onAdd: (action: RegistroAction) => void }) {
  const { user } = useAuth();
  const permissions = gestionMedicaPermissions(user?.rol);
  const allowed = tab === 'evaluaciones' ? permissions.canAccess : permissions.canClinical;
  const registros = useApiResource<Array<{ id: number; content: React.ReactNode }>>(async signal => {
    switch (tab) {
      case 'evaluaciones': return (await api.listarEvaluacionesPorDetalle(detalle.id, signal)).map(item => ({ id: item.id, content: <EvaluacionCard evaluacion={item} /> }));
      case 'diagnosticos': return (await api.listarDiagnosticosPorDetalle(detalle.id, signal)).map(item => ({ id: item.id, content: <p className="whitespace-pre-wrap break-words">{item.descripcion}</p> }));
      case 'tratamientos': return (await api.listarTratamientosPorDetalle(detalle.id, signal)).map(item => ({ id: item.id, content: <><p className="font-semibold">{item.nombre}</p><p className="whitespace-pre-wrap break-words">{item.descripcion || '—'}</p></> }));
      case 'medicacion': return (await api.listarMedicacionesPorDetalle(detalle.id, signal)).map(item => ({ id: item.id, content: <><p className="font-semibold">{item.nombre}</p><p>Dosis: {item.dosis}</p><p>Frecuencia: {item.frecuencia}</p></> }));
    }
  }, `registros-${tab}-${detalle.id}`, allowed);
  if (!allowed) return null;
  const mode = tab === 'diagnosticos' ? 'diagnostico' : tab === 'tratamientos' ? 'tratamiento' : 'medicacion';
  const label = tab === 'diagnosticos' ? 'diagnóstico' : tab === 'tratamientos' ? 'tratamiento' : 'medicación';
  const empty = { evaluaciones: 'No hay evaluaciones para esta evolución.', diagnosticos: 'No hay diagnósticos para esta evolución.', tratamientos: 'No hay tratamientos para esta evolución.', medicacion: 'No hay medicaciones para esta evolución.' };
  return <div className="space-y-3">
    <p className="text-sm whitespace-pre-wrap">Evolución seleccionada: {formatFecha(detalle.fecha)} · {detalle.observaciones || 'Sin observaciones'}</p>
    {tab !== 'evaluaciones' ? <button onClick={() => onAdd({ mode, detalle })} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={primaryStyle}>Agregar {label}</button> : <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Para agregar una evaluación, seleccione una atención en la pestaña Atenciones.</p>}
    <Feedback resource={registros} />
    {registros.data?.length === 0 && <p className="text-sm">{empty[tab]}</p>}
    {registros.data?.map(item => <div key={item.id} className="p-4 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--background)' }}>{item.content}</div>)}
  </div>;
}
