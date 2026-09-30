import { ReportDownloadButton } from '../components/reportes/ReportDownloadButton';
import { useState } from 'react';
import { listarHabitaciones, type HabitacionResponse } from '../api/habitacionesApi';
import { useAuth } from '../auth/AuthContext';
import { habitacionesPermissions } from '../auth/habitacionesPermissions';
import { HabitacionModal, type HabitacionModalAction } from '../components/habitaciones/HabitacionModal';
import { ErrorNotice, cardStyle, inputStyle, primaryStyle, useApiResource } from '../components/residentes/shared';

function EstadoTag({ estado }: { estado: string }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium break-words" style={{ background: 'var(--muted)', color: 'var(--primary)' }}>
    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--secondary)' }} />{estado}
  </span>;
}

export function HabitacionesPage() {
  const { user } = useAuth();
  const { canRead, canWrite } = habitacionesPermissions(user?.rol);
  const habitaciones = useApiResource(listarHabitaciones, 'habitaciones', canRead);
  const [vista, setVista] = useState<'tarjetas' | 'tabla'>('tarjetas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [disponibilidad, setDisponibilidad] = useState('');
  const [modal, setModal] = useState<HabitacionModalAction | null>(null);
  const [success, setSuccess] = useState('');
  const data = habitaciones.data ?? [];
  const estados = Array.from(new Set([...data.map(h => h.estado), ...(filtroEstado ? [filtroEstado] : [])]));
  const filtered = data.filter(h => h.numero.toLowerCase().includes(busqueda.trim().toLowerCase())
    && (!filtroEstado || h.estado === filtroEstado)
    && (!disponibilidad || (disponibilidad === 'con-cupos' ? h.cuposDisponibles > 0 : h.cuposDisponibles === 0)));

  function open(action: HabitacionModalAction) { setSuccess(''); setModal(action); }
  function saved() {
    setSuccess(modal?.mode === 'crear' ? 'Habitación creada correctamente.' : 'Habitación actualizada correctamente.');
    setModal(null);
    // Mostrar el resultado guardado aunque los filtros anteriores lo excluyeran.
    setBusqueda(''); setFiltroEstado(''); setDisponibilidad('');
    habitaciones.reload();
  }
  function actions(h: HabitacionResponse) {
    return <div className="flex gap-1.5">
      <button onClick={() => open({ mode: 'ver', id: h.id })} className="flex-1 px-2.5 py-1 rounded text-xs font-medium" style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}>Ver</button>
      {canWrite && <button onClick={() => open({ mode: 'editar', id: h.id })} className="flex-1 px-2.5 py-1 rounded text-xs font-medium" style={{ border: '1px solid var(--border)', color: 'var(--secondary)' }}>Editar</button>}
    </div>;
  }

  if (!canRead) return <ErrorNotice message="Acceso no autorizado al módulo Habitaciones." />;
  return <div className="space-y-5">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-xl p-4" style={cardStyle}>
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Total habitaciones</p>
        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--primary)', fontFamily: 'Lora, serif' }}>{habitaciones.data ? data.length : '—'}</p>
      </div>
    </div>
    {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <input type="search" aria-label="Buscar habitación por número" placeholder="Buscar por número…" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        <select aria-label="Filtrar por estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
          <option value="">Todos los estados</option>
          {estados.map(estado => <option key={estado} value={estado}>{estado}</option>)}
        </select>
        <select aria-label="Filtrar por disponibilidad" value={disponibilidad} onChange={e => setDisponibilidad(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
          <option value="">Todas</option><option value="con-cupos">Con cupos</option><option value="completas">Completas</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ReportDownloadButton />
        {canWrite && <button onClick={() => open({ mode: 'crear' })} className="px-3 py-2 rounded-lg text-sm font-semibold" style={primaryStyle}>+ Nueva habitación</button>}
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(['tarjetas', 'tabla'] as const).map(v => <button key={v} onClick={() => setVista(v)} aria-label={`Vista de ${v}`} aria-pressed={vista === v} className="px-3 py-2 text-xs font-medium transition-all capitalize" style={{ background: vista === v ? 'var(--primary)' : 'var(--card)', color: vista === v ? 'white' : 'var(--muted-foreground)' }}>{v === 'tarjetas' ? '⊞' : '≡'}</button>)}
        </div>
      </div>
    </div>
    {habitaciones.loading ? <div role="status" className="rounded-xl p-8 text-center text-sm" style={cardStyle}>Cargando habitaciones…</div>
      : habitaciones.error ? <ErrorNotice message={habitaciones.error} retry={habitaciones.reload} />
      : filtered.length === 0 ? <div role="status" className="rounded-xl p-8 text-center text-sm" style={cardStyle}>
        <p className="font-medium">{data.length ? 'Sin resultados' : 'No hay habitaciones registradas'}</p>
        {data.length > 0 && <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Ajuste los filtros para encontrar habitaciones.</p>}
      </div> : vista === 'tarjetas' ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {filtered.map(h => <div key={h.id} className="rounded-xl p-4 hover:shadow-md transition-all" style={cardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="break-all" style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{h.numero}</span>
            <span className="text-xs px-2 py-0.5 rounded break-words" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{h.tipo ?? '—'}</span>
          </div>
          <EstadoTag estado={h.estado} />
          <div className="mt-3 space-y-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <p>Capacidad: {h.capacidad}</p><p>Ocupación actual: {h.ocupacionActual}</p>
            <p style={{ color: h.cuposDisponibles > 0 ? '#16A34A' : '#DC2626' }}>Cupos disponibles: {h.cuposDisponibles}</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${h.capacidad > 0 ? Math.min(100, Math.max(0, h.ocupacionActual / h.capacidad * 100)) : 0}%`, background: h.cuposDisponibles === 0 ? '#DC2626' : 'var(--secondary)' }} />
            </div>
          </div>
          <div className="mt-3">{actions(h)}</div>
        </div>)}
      </div> : <div className="rounded-xl overflow-x-auto" style={cardStyle}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
            {['N°', 'Tipo', 'Estado', 'Capacidad', 'Ocupación actual', 'Cupos disponibles', 'Acciones'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map((h, i) => <tr key={h.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <td className="px-4 py-3 font-semibold" style={{ color: 'var(--primary)', fontFamily: 'Lora, serif' }}>{h.numero}</td>
            <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>{h.tipo ?? '—'}</td>
            <td className="px-4 py-3"><EstadoTag estado={h.estado} /></td>
            <td className="px-4 py-3 text-center">{h.capacidad}</td>
            <td className="px-4 py-3 text-center">{h.ocupacionActual}</td>
            <td className="px-4 py-3 text-center font-medium" style={{ color: h.cuposDisponibles > 0 ? '#16A34A' : '#DC2626' }}>{h.cuposDisponibles}</td>
            <td className="px-4 py-3">{actions(h)}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    {modal && <HabitacionModal key={modal.mode === 'crear' ? 'crear' : `${modal.mode}-${modal.id}`} action={modal} onClose={() => setModal(null)} onSaved={saved} />}
  </div>;
}
