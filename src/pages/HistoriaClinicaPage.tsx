import { useSearchParams } from 'react-router';
import { ResidentSelector } from '../components/residentes/ResidentSelector';
import { useState } from 'react';
import { ApiError } from '../api/apiClient';
import { listarResidentes, type ResidenteResponse } from '../api/residentesApi';
import { listarDetalles, obtenerHistoriaPorResidente, type HistoriaClinicaResponse } from '../api/historiasClinicasApi';
import { useAuth } from '../auth/AuthContext';
import { historiasClinicasPermissions } from '../auth/historiasClinicasPermissions';
import { HistoriaClinicaModal, type HistoriaAction } from '../components/historiasClinicas/HistoriaClinicaModal';
import { ErrorNotice, cardStyle, formatFecha, primaryStyle, useApiResource } from '../components/residentes/shared';

export function HistoriaClinicaPage() {
  const { user } = useAuth();
  const permissions = historiasClinicasPermissions(user?.rol);
  const residentes = useApiResource(listarResidentes, 'residentes-historia', permissions.canRead);
  const [params] = useSearchParams();
  const [residenteId, setResidenteId] = useState(params.get('residenteId') ?? '');
  const selected = residentes.data?.find(r => String(r.id) === residenteId);
  if (!permissions.canRead) return <ErrorNotice message="Acceso no autorizado al módulo Historia Clínica." />;
  return <div className="space-y-5">
    <ResidentSelector residentes={residentes.data ?? []} value={residenteId} onChange={setResidenteId} loading={residentes.loading} disabled={!!residentes.error} />
    {residentes.loading ? <p role="status">Cargando residentes…</p> : residentes.error ? <ErrorNotice message={residentes.error} retry={residentes.reload} />
      : residentes.data?.length === 0 ? <p role="status">No hay residentes registrados.</p>
      : <>

        {selected ? <HistoriaResidente key={`${selected.id}-${user?.rol}`} residente={selected} /> : <div className="rounded-xl p-5 text-sm" style={cardStyle}>Seleccione un residente para consultar su historia clínica.</div>}
      </>}
  </div>;
}

function HistoriaResidente({ residente }: { residente: ResidenteResponse }) {
  const { user } = useAuth();
  const permissions = historiasClinicasPermissions(user?.rol);
  const historia = useApiResource<HistoriaClinicaResponse | null>(async signal => {
    try { return await obtenerHistoriaPorResidente(residente.id, signal); }
    catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404 && error.message.trim() === 'El residente no tiene historia clínica') return null;
      throw error;
    }
  }, `historia-${residente.id}`, permissions.canRead);
  const [action, setAction] = useState<HistoriaAction | null>(null);
  const [success, setSuccess] = useState('');
  const [detallesRevision, setDetallesRevision] = useState(0);
  function open(value: HistoriaAction) { setSuccess(''); setAction(value); }
  function saved() {
    setSuccess(action?.mode === 'crear' ? 'Historia clínica creada correctamente.' : action?.mode === 'evolucion' ? 'Evolución agregada correctamente.' : 'Antecedentes y alergias actualizados correctamente.');
    if (action?.mode === 'evolucion') setDetallesRevision(value => value + 1);
    else historia.reload();
    setAction(null);
  }
  if (!permissions.canRead) return null;
  const data = historia.data;
  return <div className="space-y-5">
    {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
    {historia.loading ? <p role="status">Cargando historia clínica…</p>
      : historia.error ? <ErrorNotice message={historia.error} retry={historia.reload} />
      : data === null ? <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
        <p className="text-sm">El residente aún no tiene historia clínica.</p>
        {permissions.canCreate && <button onClick={() => open({ mode: 'crear' })} className="px-4 py-2 rounded-lg text-sm font-semibold" style={primaryStyle}>Crear historia clínica</button>}
      </div> : data && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 style={{ fontFamily: 'Lora, serif', fontWeight: 600, fontSize: 16, color: 'var(--primary)' }}>Datos de la historia clínica</h3>
            {permissions.canUpdateAntecedentes && <button onClick={() => open({ mode: 'antecedentes', historia: data })} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--secondary)' }}>Editar antecedentes y alergias</button>}
          </div>
          <div className="space-y-4">
            {[
              ['Residente', `${residente.apellido}, ${residente.nombre}`], ['Fecha de creación', formatFecha(data.fechaCreacion)],
              ['Observaciones generales', data.observaciones], ['Antecedentes personales', data.antecedentesPersonales],
              ['Antecedentes familiares', data.antecedentesFamiliares], ['Alergias', data.alergias],
            ].map(([label, value]) => <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--foreground)' }}>{value || '—'}</p>
            </div>)}
          </div>
        </div>
        <Evoluciones key={`${data.id}-${detallesRevision}`} historia={data} onAdd={() => open({ mode: 'evolucion', historia: data })} />
      </div>}
    {action && <HistoriaClinicaModal action={action} residente={residente} onClose={() => setAction(null)} onSaved={saved} />}
  </div>;
}

function formatCargo(value: string): string {
  const text = value.trim().replace(/_+/g, ' ').replace(/\s+/g, ' ').toLocaleLowerCase('es');
  const accented = text.replace(/\bmedico\b/g, 'médico').replace(/\bmedica\b/g, 'médica')
    .replace(/\bpsicologo\b/g, 'psicólogo').replace(/\bpsicologa\b/g, 'psicóloga')
    .replace(/\benfermeria\b/g, 'enfermería');
  return accented.charAt(0).toLocaleUpperCase('es') + accented.slice(1);
}

function Evoluciones({ historia, onAdd }: { historia: HistoriaClinicaResponse; onAdd: () => void }) {
  const { user } = useAuth();
  const permissions = historiasClinicasPermissions(user?.rol);
  const detalles = useApiResource(signal => listarDetalles(historia.id, signal), `detalles-${historia.id}`, permissions.canRead);
  if (!permissions.canRead) return null;
  return <div className="rounded-xl p-5" style={cardStyle}>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h3 style={{ fontFamily: 'Lora, serif', fontWeight: 600, fontSize: 16, color: 'var(--primary)' }}>Evoluciones clínicas</h3>
      {permissions.canAddDetalle && <button onClick={onAdd} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={primaryStyle}>Agregar evolución</button>}
    </div>
    {detalles.loading && <p role="status" className="text-sm">Cargando evoluciones…</p>}
    {detalles.error && <ErrorNotice message={detalles.error} retry={detalles.reload} />}
    {detalles.data?.length === 0 && <p className="text-sm">Esta historia clínica aún no tiene evoluciones.</p>}
    <div className="clinical-timeline space-y-0">{detalles.data?.map((detalle, index, all) => <div key={detalle.id} data-detalle-id={detalle.id} data-historia-id={detalle.historiaClinicaId} className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full mt-2 shrink-0" style={{ background: 'var(--secondary)', border: '2px solid var(--card)', boxShadow: '0 0 0 2px var(--secondary)' }} />
        {index < all.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)' }} />}
      </div>
      <div className="pb-6 min-w-0 flex-1">
        <p className="text-xs font-semibold mt-1.5 mb-1" style={{ color: 'var(--muted-foreground)' }}>{formatFecha(detalle.fecha)}</p>
        <p className="text-sm font-semibold break-words" style={{ color: 'var(--primary)' }}>
          {detalle.profesionalNombre == null || detalle.profesionalApellido == null
            ? 'Profesional no informado'
            : `${detalle.profesionalNombre} ${detalle.profesionalApellido}`}
        </p>
        {detalle.profesionalCargo && <p className="text-xs break-words mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{formatCargo(detalle.profesionalCargo)}</p>}
        <p className="text-xs font-medium mt-3 mb-1" style={{ color: 'var(--muted-foreground)' }}>Evolución clínica</p>
        <p className="text-sm leading-7 whitespace-pre-wrap break-words rounded-lg p-3 bg-muted" style={{ color: 'var(--foreground)' }}>{detalle.observaciones || '—'}</p>
      </div>
    </div>)}</div>
  </div>;
}
