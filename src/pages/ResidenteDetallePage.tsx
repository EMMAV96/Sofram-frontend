import { useAuth } from '../auth/AuthContext';
import { historiasClinicasPermissions } from '../auth/historiasClinicasPermissions';
import { gestionMedicaPermissions } from '../auth/gestionMedicaPermissions';
import { ReportDownloadButton } from '../components/reportes/ReportDownloadButton';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { obtenerHistorial, obtenerResidente } from '../api/residentesApi';
import { CambioEstadoModal } from '../components/residentes/CambioEstadoModal';
import { EgresoResidenteModal } from '../components/residentes/EgresoResidenteModal';
import { ResidenteFormModal } from '../components/residentes/ResidenteFormModal';
import { ErrorNotice, EstadoBadge, cardStyle, formatFecha, primaryStyle, useApiResource, useResidentesPermissions } from '../components/residentes/shared';

type Tab = 'datos' | 'historia' | 'medica' | 'actividades' | 'historial';

export function ResidenteDetallePage() {
  const { id } = useParams();
  // Reiniciar formularios y avisos al navegar entre residentes.
  return <ResidenteDetalle key={id} id={id} />;
}

function ResidenteDetalle({ id }: { id: string | undefined }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canRead, canWrite } = useResidentesPermissions();
  const residenteId = Number(id);
  const validId = !!id && /^\d+$/.test(id) && Number.isSafeInteger(residenteId) && residenteId > 0;
  const detail = useApiResource(signal => obtenerResidente(residenteId, signal), `residente-${id}`, canRead && validId);
  const historial = useApiResource(signal => obtenerHistorial(residenteId, signal), `historial-${id}`, canRead && validId);
  const [tab, setTab] = useState<Tab>('datos');
  const [modal, setModal] = useState<'editar' | 'estado' | 'egreso' | null>(null);
  const [success, setSuccess] = useState('');
  const residente = detail.data;
  const tabs: { key: Tab; label: string }[] = [
    { key: 'datos', label: 'Datos personales' },
    { key: 'historia', label: 'Historia Clínica' },
    { key: 'medica', label: 'Gestión Médica' },
    { key: 'actividades', label: 'Actividades' },
    { key: 'historial', label: 'Historial' },
  ];

  function saved() {
    setSuccess(modal === 'egreso' ? 'Egreso registrado correctamente.' : modal === 'estado' ? 'Estado actualizado correctamente.' : 'Datos actualizados correctamente.');
    setModal(null);
    detail.reload();
    historial.reload();
  }

  if (!canRead) return <ErrorNotice message="Acceso no autorizado al módulo de residentes." />;
  return <div className="space-y-5">
    <button onClick={() => navigate('/residentes')} className="text-sm flex items-center gap-1.5 hover:underline" style={{ color: 'var(--secondary)' }}>← Volver a residentes</button>
    {!validId ? <ErrorNotice message="El identificador del residente no es válido." /> : <>
      {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
      {detail.loading && <div role="status" className="rounded-xl p-6" style={cardStyle}>Cargando residente…</div>}
      {detail.error && <ErrorNotice message={detail.error} retry={detail.reload} />}
      {residente && <>
        <div className="rounded-xl p-6" style={cardStyle}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold shrink-0" style={{ background: 'var(--primary)' }}>{residente.nombre[0]}{residente.apellido[0]}</div>
              <div>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{residente.apellido}, {residente.nombre}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>DNI {residente.dni}</span>
                  <EstadoBadge estado={residente.estadoActual} />
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Hab. {residente.habitacionNumero}</span>
                </div>
              </div>
            </div>
            <ReportDownloadButton residenteId={residente.id} />
          </div>
        </div>
        <div className="flex gap-0.5 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
          {tabs.filter(t => (t.key !== 'historia' || historiasClinicasPermissions(user?.rol).canRead) && (t.key !== 'medica' || gestionMedicaPermissions(user?.rol).canAccess)).map(t => <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={tab === t.key} className="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all" style={{ borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t.key ? 'var(--primary)' : 'var(--muted-foreground)', marginBottom: -1 }}>{t.label}</button>)}
        </div>
        {tab === 'datos' && <div className="rounded-xl p-6" style={cardStyle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: 'Nombre', value: residente.nombre },
              { label: 'Apellido', value: residente.apellido },
              { label: 'DNI', value: residente.dni },
              { label: 'Fecha de nacimiento', value: formatFecha(residente.fechaNacimiento) },
              { label: 'Dirección', value: residente.direccion },
              { label: 'Teléfono', value: residente.telefono },
              { label: 'Email', value: residente.email },
              { label: 'Tel. emergencia', value: residente.telefonoEmergencia },
              { label: 'Familiar a cargo', value: residente.familiarACargo },
              { label: 'Obra social', value: residente.obraSocial },
              { label: 'Fecha de ingreso', value: formatFecha(residente.fechaIngreso) },
              { label: 'Habitación', value: residente.habitacionNumero },
              { label: 'Estado', value: residente.estadoActual },
              { label: 'Fecha de egreso', value: formatFecha(residente.fechaEgreso) },
            ].map(field => <div key={field.label}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>{field.label}</p>
              <p className="text-sm font-medium break-words" style={{ color: 'var(--foreground)' }}>{field.value || '—'}</p>
            </div>)}
          </div>
          {canWrite && <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => { setSuccess(''); setModal('editar'); }} className="px-4 py-2 rounded-lg text-sm font-medium" style={primaryStyle}>Editar datos</button>
            <button onClick={() => { setSuccess(''); setModal('estado'); }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1.5px solid var(--border)', color: 'var(--muted-foreground)' }}>Cambiar estado</button>
            {residente.fechaEgreso === null && <button onClick={() => { setSuccess(''); setModal('egreso'); }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1.5px solid var(--border)', color: 'var(--primary)' }}>Egresar residente</button>}
          </div>}
        </div>}
        {['historia', 'medica', 'actividades'].includes(tab) && <div className="rounded-xl p-5" style={cardStyle}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--primary)', fontFamily: 'Lora, serif' }}>{tabs.find(item => item.key === tab)?.label}</h3>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Consulte la información y las acciones disponibles en el módulo correspondiente.</p><button type="button" className="mt-3 px-4 py-2 rounded-lg text-sm" style={primaryStyle} onClick={() => navigate(tab === 'historia' ? `/historia-clinica?residenteId=${residente.id}` : tab === 'medica' ? `/gestion-medica?residenteId=${residente.id}` : '/actividades')}>Abrir {tabs.find(item => item.key === tab)?.label}</button>
        </div>}
        {tab === 'historial' && <div className="rounded-xl p-5" style={cardStyle}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--primary)', fontFamily: 'Lora, serif' }}>Historial de estados</h3>
          {historial.loading && <p role="status" className="text-sm">Cargando historial…</p>}
          {historial.error && <ErrorNotice message={historial.error} retry={historial.reload} />}
          {historial.data?.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No hay cambios de estado registrados.</p>}
          <div className="space-y-3">{historial.data?.map(h => <div key={h.id} className="flex items-start gap-4 p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
            <div><p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{h.estado}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Desde {formatFecha(h.fechaCambio)}</p>
              <p className="text-xs mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{h.observacion || '—'}</p>
            </div>
          </div>)}</div>
        </div>}
      </>}
      {canWrite && modal === 'editar' && <ResidenteFormModal residenteId={residenteId} onClose={() => setModal(null)} onSaved={saved} />}
      {canWrite && modal === 'estado' && <CambioEstadoModal residenteId={residenteId} onClose={() => setModal(null)} onSaved={saved} />}
      {canWrite && modal === 'egreso' && residente && residente.fechaEgreso === null && <EgresoResidenteModal residente={residente} onClose={() => setModal(null)} onSaved={saved} />}
    </>}
  </div>;
}
