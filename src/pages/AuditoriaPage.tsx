import { useState } from 'react';
import { listarAuditorias } from '../api/auditoriaApi';
import { useAuth } from '../auth/AuthContext';
import { canViewAuditoria } from '../auth/auditoriaPermissions';
import { cardStyle, inputStyle, ErrorNotice, EstadoBadge, useApiResource } from '../components/residentes/shared';

const FILTERS = [
  { field: 'rol', label: 'Rol', all: 'Todos los roles' },
  { field: 'accion', label: 'Acción', all: 'Todas las acciones' },
  { field: 'modulo', label: 'Módulo', all: 'Todos los módulos' },
  { field: 'entidad', label: 'Entidad', all: 'Todas las entidades' },
] as const;
const EMPTY_FILTERS = { rol: '', accion: '', modulo: '', entidad: '' };

function formatFechaHora(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}` : value;
}

function AuditoriaListado() {
  const resource = useApiResource(listarAuditorias, 'auditorias');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const records = resource.data ?? [];
  const query = search.trim().toLowerCase();
  const filtered = records.filter(record =>
    FILTERS.every(({ field }) => !filters[field] || record[field] === filters[field])
    && (!query || [record.username, record.detalle, record.entidad, record.accion, record.modulo, record.rol]
      .some(value => value?.toLowerCase().includes(query))));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const hasFilters = !!search || Object.values(filters).some(Boolean);

  function refresh() { setPage(1); resource.reload(); }

  return <div className="space-y-5 min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div aria-hidden="true" className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(27,67,50,0.1)' }}>🔒</div>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Consulta del historial de auditoría disponible. Solo lectura.</p>
      </div>
      <button type="button" onClick={refresh} disabled={resource.loading}
        className="px-3 py-2 rounded-lg text-sm disabled:opacity-50" style={cardStyle}>
        {resource.loading ? 'Cargando…' : 'Actualizar'}
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      <div>
        <label htmlFor="auditoria-search" className="block text-xs font-medium mb-1.5">Buscar</label>
        <input id="auditoria-search" type="search" value={search} placeholder="Usuario, detalle o entidad…"
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
      </div>
      {FILTERS.map(({ field, label, all }) => <div key={field}>
        <label htmlFor={`auditoria-${field}`} className="block text-xs font-medium mb-1.5">{label}</label>
        <select id={`auditoria-${field}`} value={filters[field]}
          onChange={e => { setFilters(previous => ({ ...previous, [field]: e.target.value })); setPage(1); }}
          className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
          <option value="">{all}</option>
          {[...new Set(records.map(record => record[field]))].map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>)}
    </div>
    {hasFilters && <button type="button" onClick={() => { setSearch(''); setFilters(EMPTY_FILTERS); setPage(1); }}
      className="px-3 py-2 rounded-lg text-sm" style={cardStyle}>Limpiar filtros</button>}

    {resource.loading ? <p role="status" className="p-6 text-sm">Cargando registros de auditoría…</p>
      : resource.error ? <ErrorNotice message={resource.error} retry={refresh} />
      : <>
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Registros de auditoría</caption>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                  {['Fecha y hora', 'Usuario', 'Rol', 'Acción', 'Módulo', 'Entidad', 'ID entidad', 'Detalle'].map(label =>
                    <th scope="col" key={label} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {!visible.length ? <tr><td colSpan={8} className="px-4 py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>
                  {!records.length ? 'No hay registros de auditoría.' : 'No se encontraron registros con los filtros seleccionados.'}
                </td></tr> : visible.map(record => <tr key={record.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">{formatFechaHora(record.fechaHora)}</td>
                  <td className="px-3 py-3 text-xs font-medium">{record.username}</td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">{record.rol}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><EstadoBadge estado={record.accion} /></td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">{record.modulo}</td>
                  <td className="px-3 py-3 text-xs">{record.entidad}</td>
                  <td className="px-3 py-3 font-mono text-xs text-center">{record.entidadId ?? '—'}</td>
                  <td className="px-3 py-3 text-xs min-w-64 max-w-sm">
                    {record.detalle == null ? '—' : record.detalle.length > 120
                      ? <details><summary className="cursor-pointer" title="Ver detalle completo">{record.detalle.slice(0, 120)}…</summary><p className="mt-2 whitespace-pre-wrap break-words">{record.detalle}</p></details>
                      : <span className="whitespace-pre-wrap break-words">{record.detalle}</span>}
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <p role="status">Mostrando {filtered.length ? start + 1 : 0}-{Math.min(start + pageSize, filtered.length)} de {filtered.length} registros</p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="auditoria-page-size">Registros por página</label>
            <select id="auditoria-page-size" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-2 rounded-lg" style={inputStyle}>
              {[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="px-3 py-2 rounded-lg disabled:opacity-40" style={cardStyle}>Anterior</button>
            <span>Página {currentPage} de {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="px-3 py-2 rounded-lg disabled:opacity-40" style={cardStyle}>Siguiente</button>
          </div>
        </div>
      </>}
  </div>;
}

export function AuditoriaPage() {
  const { user } = useAuth();
  if (!canViewAuditoria(user?.rol)) return <ErrorNotice message="Acceso no autorizado." />;
  return <AuditoriaListado key={user?.id} />;
}
