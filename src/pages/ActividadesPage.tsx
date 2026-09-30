import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { listarActividades } from '../api/actividadesApi';
import { useAuth } from '../auth/AuthContext';
import { canViewActividades, canCreateActividad } from '../auth/actividadesPermissions';
import { ActividadModal } from '../components/actividades/ActividadModal';
import { ActividadDetalle } from '../components/actividades/ActividadDetalle';
import { ErrorNotice, cardStyle, primaryStyle, useApiResource } from '../components/residentes/shared';

export function ActividadesPage() {
  const { user } = useAuth();
  const allowed = canViewActividades(user?.rol);
  const actividades = useApiResource(listarActividades, 'actividades', allowed);
  const [params, setParams] = useSearchParams();
  const idParam = params.get('actividadId');
  const id = idParam !== null && /^\d+$/.test(idParam) && Number.isSafeInteger(Number(idParam)) && Number(idParam) > 0 ? Number(idParam) : null;
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  function select(actividadId: number) {
    const next = new URLSearchParams(params);
    if (id === actividadId) next.delete('actividadId'); else next.set('actividadId', String(actividadId));
    setParams(next);
  }
  if (!allowed) return <ErrorNotice message="Acceso no autorizado al módulo Actividades." />;
  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{actividades.data ? `${actividades.data.length} actividades registradas` : 'Actividades'}</p>
      {canCreateActividad(user?.rol) && <button onClick={() => { setSuccess(''); setCreating(true); }} className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={primaryStyle}>+ Crear actividad</button>}
    </div>
    {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
    <label className="block text-sm font-medium">Buscar actividad<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre, tipo o estado" className="block mt-2 w-full rounded-lg border border-border bg-card px-4 py-2.5" /></label>
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
      <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
        {actividades.loading && <p role="status">Cargando actividades…</p>}
        {actividades.error && <ErrorNotice message={actividades.error} retry={actividades.reload} />}
        {actividades.data && actividades.data.length > 0 && !actividades.data.some(a => (a.nombre + ' ' + a.tipo + ' ' + a.estado).toLowerCase().includes(search.trim().toLowerCase())) && <p role="status" className="text-sm">No hay actividades que coincidan con la búsqueda.</p>}
        {actividades.data?.length === 0 && <div className="rounded-xl p-5 text-sm" style={cardStyle}>No hay actividades registradas.</div>}
        {actividades.data?.filter(a => `${a.nombre} ${a.tipo} ${a.estado}`.toLowerCase().includes(search.trim().toLowerCase())).map(a => <button key={a.id} onClick={() => select(a.id)} aria-pressed={id === a.id} className="activity-card w-full text-left rounded-xl p-4 transition-all hover:shadow-sm" style={{ background: 'var(--card)', border: id === a.id ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
          <p className="font-semibold" style={{ color: 'var(--primary)', fontFamily: 'Lora, serif' }}>{a.nombre}</p>
          <p className="text-sm line-clamp-2 break-words mt-1">{a.descripcion || 'Sin descripción'}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}><span className="rounded-full bg-muted px-2 py-1 text-primary">{a.tipo}</span><span>Duración: {a.duracion}</span><span>Cupo máximo: {a.cupoMaximo}</span><span className="rounded-full bg-muted px-2 py-1 text-primary">{a.estado}</span></div>
          {user?.rol === 'TERAPISTA_OCUPACIONAL' && a.empleadoId === user.empleadoId && <p className="text-xs mt-1">Actividad propia</p>}
        </button>)}
      </div>
      <div>{id !== null ? <ActividadDetalle key={`${id}-${user?.rol}`} actividadId={id} /> : idParam !== null ? <ErrorNotice message="El identificador de actividad no es válido." /> : <div className="rounded-xl p-8 text-center" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}><p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Seleccione una actividad para consultar su información.</p></div>}</div>
    </div>
    {creating && canCreateActividad(user?.rol) && <ActividadModal onClose={() => setCreating(false)} onSaved={actividad => {
      setCreating(false); setSuccess('Actividad creada correctamente.'); const next = new URLSearchParams(params); next.set('actividadId', String(actividad.id)); setParams(next); actividades.reload();
    }} />}
  </div>;
}
