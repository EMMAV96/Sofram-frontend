import { useState } from 'react';
import { useNavigate } from 'react-router';
import { listarResidentes } from '../api/residentesApi';
import { CambioEstadoModal } from '../components/residentes/CambioEstadoModal';
import { ResidenteFormModal } from '../components/residentes/ResidenteFormModal';
import { ErrorNotice, EstadoBadge, cardStyle, formatFecha, inputStyle, primaryStyle, useApiResource, useResidentesPermissions } from '../components/residentes/shared';

export function ResidentesPage() {
  const navigate = useNavigate();
  const { canRead, canWrite } = useResidentesPermissions();
  const residentes = useApiResource(listarResidentes, 'residentes', canRead);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modal, setModal] = useState<{ type: 'crear' | 'editar' | 'estado'; id?: number } | null>(null);
  const [success, setSuccess] = useState('');
  const data = residentes.data ?? [];
  const filtered = data.filter(r => `${r.nombre} ${r.apellido} ${r.dni}`.toLowerCase().includes(busqueda.toLowerCase()) && (!filtroEstado || r.estadoActual === filtroEstado));
  const estados = Array.from(new Set(data.map(r => r.estadoActual)));

  function saved() {
    setSuccess(modal?.type === 'crear' ? 'Residente creado correctamente.' : modal?.type === 'editar' ? 'Residente actualizado correctamente.' : 'Estado actualizado correctamente.');
    setModal(null);
    residentes.reload();
  }

  if (!canRead) return <ErrorNotice message="Acceso no autorizado al módulo de residentes." />;
  return <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>{residentes.data ? `${data.length} residentes registrados` : 'Residentes'}</p>
      {canWrite && <button onClick={() => { setSuccess(''); setModal({ type: 'crear' }); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={primaryStyle}>+ Nuevo residente</button>}
    </div>
    {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
    <div className="flex flex-col sm:flex-row gap-3">
      <input type="search" aria-label="Buscar residentes" placeholder="Buscar por nombre, apellido o DNI…" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none" style={{ ...inputStyle, background: 'var(--card)' }} />
      <select aria-label="Filtrar por estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="px-4 py-2.5 rounded-lg text-sm outline-none" style={{ ...inputStyle, background: 'var(--card)', minWidth: 160 }}>
        <option value="">Todos los estados</option>
        {Array.from(new Set([...estados, ...(filtroEstado ? [filtroEstado] : [])])).map(estado => <option key={estado}>{estado}</option>)}
      </select>
    </div>
    {residentes.error && <ErrorNotice message={residentes.error} retry={residentes.reload} />}
    <div className="rounded-xl overflow-x-auto" style={cardStyle}>
      <table className="w-full text-sm">
        <thead><tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
          {['Nombre y apellido', 'DNI', 'Habitación', 'Estado', 'Fecha de ingreso', 'Obra social', 'Acciones'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {residentes.loading ? <tr><td colSpan={7} className="px-4 py-12 text-center" role="status">Cargando residentes…</td></tr>
            : residentes.error ? <tr><td colSpan={7} className="px-4 py-12 text-center">No se pudo cargar el listado.</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
              <p className="font-medium">{data.length ? 'Sin resultados' : 'No hay residentes registrados'}</p>
              {data.length > 0 && <p className="text-xs mt-1">Ajuste los filtros para encontrar residentes.</p>}
            </td></tr> : filtered.map((r, i) => <tr key={r.id} className="hover:bg-gray-50 transition-colors cursor-pointer" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }} onClick={() => navigate(`/residentes/${r.id}`)}>
              <td className="px-4 py-3.5 font-medium" style={{ color: 'var(--foreground)' }}>{r.apellido}, {r.nombre}</td>
              <td className="px-4 py-3.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{r.dni}</td>
              <td className="px-4 py-3.5"><span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--secondary)' }}>Hab. {r.habitacionNumero}</span></td>
              <td className="px-4 py-3.5"><EstadoBadge estado={r.estadoActual} /></td>
              <td className="px-4 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{formatFecha(r.fechaIngreso)}</td>
              <td className="px-4 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{r.obraSocial || '—'}</td>
              <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}><div className="flex items-center gap-1.5">
                <button onClick={() => navigate(`/residentes/${r.id}`)} className="px-2.5 py-1 rounded text-xs font-medium hover:bg-green-50" style={{ color: 'var(--primary)', border: '1px solid var(--border)' }}>Ver</button>
                {canWrite && <>
                  <button onClick={() => { setSuccess(''); setModal({ type: 'editar', id: r.id }); }} className="px-2.5 py-1 rounded text-xs font-medium hover:bg-blue-50" style={{ color: '#1D4ED8', border: '1px solid var(--border)' }}>Editar</button>
                  <button onClick={() => { setSuccess(''); setModal({ type: 'estado', id: r.id }); }} className="px-2.5 py-1 rounded text-xs font-medium hover:bg-yellow-50" style={{ color: '#92400E', border: '1px solid var(--border)' }}>Estado</button>
                </>}
              </div></td>
            </tr>)}
        </tbody>
      </table>
    </div>
    {residentes.data && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Mostrando {filtered.length} de {data.length} registros</p>}
    {canWrite && modal && (modal.type === 'estado'
      ? <CambioEstadoModal residenteId={modal.id!} onClose={() => setModal(null)} onSaved={saved} />
      : <ResidenteFormModal residenteId={modal.id} onClose={() => setModal(null)} onSaved={saved} />)}
  </div>;
}
