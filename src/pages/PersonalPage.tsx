import { useState } from 'react';
import * as api from '../api/personalApi';
import { useAuth } from '../auth/AuthContext';
import { canAccessPersonal } from '../auth/personalPermissions';
import { PersonalModal, type PersonalAction } from '../components/personal/PersonalModal';
import { ErrorNotice, cardStyle, formatFecha, inputStyle, primaryStyle, useApiResource } from '../components/residentes/shared';

type Tab = 'empleados' | 'cargos' | 'turnos' | 'asignaciones';
type EmployeeMode = 'editar' | 'baja' | 'asignar';
function Status({ resource }: { resource: { loading: boolean; error: string; reload: () => void } }) {
  return resource.loading ? <p role="status" className="text-sm p-4">Cargando…</p> : resource.error ? <ErrorNotice message={resource.error} retry={resource.reload} /> : null;
}
function Success({ message }: { message: string }) {
  return message ? <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{message}</p> : null;
}
function Estado({ empleado }: { empleado: api.EmpleadoResponse }) {
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: empleado.activo ? '#DCFCE7' : '#FEE2E2', color: empleado.activo ? '#166534' : '#991B1B' }}>{empleado.activo ? 'Activo' : 'Dado de baja'}</span>;
}

export function PersonalPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('empleados');
  if (!canAccessPersonal(user?.rol)) return <ErrorNotice message="Acceso no autorizado al módulo Personal." />;
  return <div className="space-y-5">
    <div className="flex gap-0.5 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
      {([{ key: 'empleados', label: 'Empleados' }, { key: 'cargos', label: 'Cargos' }, { key: 'turnos', label: 'Turnos' }, { key: 'asignaciones', label: 'Asignaciones de turno' }] as const).map(t => <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={tab === t.key} className="px-4 py-2.5 text-sm font-medium whitespace-nowrap" style={{ borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t.key ? 'var(--primary)' : 'var(--muted-foreground)' }}>{t.label}</button>)}
    </div>
    {tab === 'empleados' || tab === 'asignaciones' ? <Empleados key={tab} asignaciones={tab === 'asignaciones'} /> : <Catalogo key={tab} tab={tab} />}
  </div>;
}

function Empleados({ asignaciones }: { asignaciones: boolean }) {
  const { user } = useAuth();
  const empleados = useApiResource(api.listarEmpleados, 'personal-empleados', canAccessPersonal(user?.rol));
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<{ id: number; mode?: EmployeeMode } | null>(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const filtered = empleados.data?.filter(e => `${e.nombre} ${e.apellido} ${e.dni} ${e.cargoNombre}`.toLowerCase().includes(search.trim().toLowerCase()) && (!filter || (filter === 'activos' ? e.activo : !e.activo))) ?? [];
  if (!canAccessPersonal(user?.rol)) return null;
  if (selected) return <EmpleadoDetalle key={`${selected.id}-${selected.mode}`} id={selected.id} initialMode={selected.mode} onBack={() => setSelected(null)} onChanged={empleados.reload} />;
  return <div className="space-y-5">
    <Success message={success} />
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <input type="search" aria-label="Buscar empleado" placeholder="Nombre, apellido, DNI o cargo…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg text-sm" style={inputStyle} />
      <select aria-label="Estado del empleado" value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2.5 rounded-lg text-sm" style={inputStyle}><option value="">Todos</option><option value="activos">Activos</option><option value="baja">Dados de baja</option></select>
      {!asignaciones && <button onClick={() => { setSuccess(''); setCreating(true); }} className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={primaryStyle}>+ Nuevo empleado</button>}
    </div>
    {asignaciones && <p className="text-sm">Seleccione un empleado para consultar su historial o asignar un turno.</p>}
    <Status resource={empleados} />
    {empleados.data && <div className="rounded-xl overflow-x-auto" style={cardStyle}>
      <table className="w-full text-sm">
        <thead><tr style={{ background: 'var(--muted)' }}>{['Apellido y nombre', 'DNI', 'Cargo', 'Contacto', 'Estado', 'Acciones'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted-foreground)' }}>{h}</th>)}</tr></thead>
        <tbody>{filtered.length === 0 ? <tr><td colSpan={6} className="p-8 text-center">{empleados.data.length ? 'Sin resultados para la búsqueda o el filtro.' : 'No hay empleados registrados.'}</td></tr> : filtered.map(e => <tr key={e.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid var(--border)' }}>
          <td className="px-4 py-3 font-medium">{e.apellido}, {e.nombre}</td><td className="px-4 py-3 font-mono text-xs">{e.dni}</td>
          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--muted)', color: 'var(--secondary)' }}>{e.cargoNombre}</span></td>
          <td className="px-4 py-3 text-xs"><p>{e.telefono || '—'}</p><p>{e.email || '—'}</p></td>
          <td className="px-4 py-3"><Estado empleado={e} />{!e.activo && e.fechaBaja && <p className="text-xs mt-1">{formatFecha(e.fechaBaja)}</p>}</td>
          <td className="px-4 py-3"><div className="flex flex-wrap gap-1">
            <button onClick={() => setSelected({ id: e.id })} className="px-2 py-1 rounded text-xs" style={inputStyle}>{asignaciones ? 'Ver historial' : 'Ver'}</button>
            {!asignaciones && <button onClick={() => setSelected({ id: e.id, mode: 'editar' })} className="px-2 py-1 rounded text-xs" style={inputStyle}>Editar</button>}
            {!asignaciones && e.activo && <button onClick={() => setSelected({ id: e.id, mode: 'baja' })} className="px-2 py-1 rounded text-xs" style={{ ...inputStyle, color: '#DC2626' }}>Dar de baja</button>}
            {e.activo && <button onClick={() => setSelected({ id: e.id, mode: 'asignar' })} className="px-2 py-1 rounded text-xs" style={inputStyle}>Asignar turno</button>}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>}
    {creating && <PersonalModal action={{ mode: 'crear' }} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setSuccess('Empleado creado correctamente.'); setSearch(''); setFilter(''); empleados.reload(); }} />}
  </div>;
}

function EmpleadoDetalle({ id, initialMode, onBack, onChanged }: { id: number; initialMode?: EmployeeMode; onBack: () => void; onChanged: () => void }) {
  const { user } = useAuth();
  const allowed = canAccessPersonal(user?.rol);
  const empleado = useApiResource(signal => api.obtenerEmpleado(id, signal), `empleado-${id}`, allowed);
  const historial = useApiResource(signal => api.listarAsignacionesTurno(id, signal), `asignaciones-${id}`, allowed);
  const [mode, setMode] = useState<EmployeeMode | null>(initialMode ?? null);
  const [success, setSuccess] = useState('');
  function saved() {
    setSuccess(mode === 'baja' ? 'Empleado dado de baja correctamente.' : mode === 'asignar' ? 'Turno asignado correctamente.' : 'Empleado actualizado correctamente.');
    if (mode === 'asignar') historial.reload();
    else { empleado.reload(); onChanged(); if (mode === 'baja') historial.reload(); }
    setMode(null);
  }
  if (!allowed) return null;
  const e = empleado.data;
  return <div className="space-y-5">
    <button onClick={onBack} className="text-sm hover:underline" style={{ color: 'var(--secondary)' }}>← Volver al listado</button>
    <Success message={success} /><Status resource={empleado} />
    {e && <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
      <h3 className="font-semibold" style={{ fontFamily: 'Lora, serif', color: 'var(--primary)' }}>{e.apellido}, {e.nombre}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ['DNI', e.dni], ['Fecha de nacimiento', formatFecha(e.fechaNacimiento)], ['Cargo', e.cargoNombre], ['Dirección', e.direccion], ['Teléfono', e.telefono], ['Email', e.email], ['Estado', e.activo ? 'Activo' : 'Dado de baja'], ['Fecha de baja', formatFecha(e.fechaBaja)],
        ].map(([label, value]) => <div key={label}><p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{label}</p><p className="text-sm break-words">{value || '—'}</p></div>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setSuccess(''); setMode('editar'); }} className="px-3 py-2 rounded-lg text-sm" style={primaryStyle}>Editar empleado</button>
        {e.activo && <><button onClick={() => { setSuccess(''); setMode('baja'); }} className="px-3 py-2 rounded-lg text-sm" style={inputStyle}>Dar de baja</button><button onClick={() => { setSuccess(''); setMode('asignar'); }} className="px-3 py-2 rounded-lg text-sm" style={inputStyle}>Asignar turno</button></>}
      </div>
    </div>}
    <div className="rounded-xl p-5" style={cardStyle}>
      <h3 className="font-semibold mb-4" style={{ fontFamily: 'Lora, serif', color: 'var(--primary)' }}>Historial de turnos</h3>
      <Status resource={historial} />
      {historial.data?.length === 0 && <p className="text-sm">El empleado no tiene asignaciones de turno.</p>}
      {!!historial.data?.length && <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr>{['Turno', 'Horario', 'Desde', 'Hasta', 'Motivo'].map(h => <th key={h} className="py-3 pr-4 text-left text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>{h}</th>)}</tr></thead>
        <tbody>{historial.data.map(a => <tr key={a.id} style={{ borderTop: '1px solid var(--border)' }}><td className="py-3 pr-4">{a.turnoDescripcion}</td><td className="py-3 pr-4 whitespace-nowrap">{a.horaInicio} a {a.horaFin}</td><td className="py-3 pr-4">{formatFecha(a.fechaDesde)}</td><td className="py-3 pr-4">{a.fechaHasta === null ? <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#DCFCE7', color: '#166534' }}>Actual / activa</span> : formatFecha(a.fechaHasta)}</td><td className="py-3 whitespace-pre-wrap">{a.motivoCambio || '—'}</td></tr>)}</tbody>
      </table></div>}
    </div>
    {mode && e && (mode === 'editar' || e.activo) && <PersonalModal action={{ mode, empleado: e }} onClose={() => setMode(null)} onSaved={saved} />}
  </div>;
}

function Catalogo({ tab }: { tab: 'cargos' | 'turnos' }) {
  const { user } = useAuth();
  const allowed = canAccessPersonal(user?.rol);
  const cargos = useApiResource(api.listarCargos, 'personal-cargos', allowed && tab === 'cargos');
  const turnos = useApiResource(api.listarTurnos, 'personal-turnos', allowed && tab === 'turnos');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const resource = tab === 'cargos' ? cargos : turnos;
  if (!allowed) return null;
  return <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
    <Success message={success} />
    <div className="flex items-center justify-between gap-3"><h3 className="font-semibold" style={{ fontFamily: 'Lora, serif', color: 'var(--primary)' }}>{tab === 'cargos' ? 'Cargos' : 'Turnos'}</h3><button onClick={() => { setSuccess(''); setCreating(true); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={primaryStyle}>{tab === 'cargos' ? '+ Nuevo cargo' : '+ Nuevo turno'}</button></div>
    <Status resource={resource} />
    {resource.data?.length === 0 && <p className="text-sm">No hay {tab} registrados.</p>}
    {tab === 'cargos' ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{cargos.data?.map(c => <div key={c.id} className="p-3 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--background)' }}><p className="text-sm font-medium">{c.nombre}</p><p className="text-xs">Sector: {c.sector || '—'}</p><p className="text-xs">Matrícula: {c.matricula || '—'}</p><p className="text-xs">Especialidad: {c.especialidad || '—'}</p></div>)}</div>
      : <div className="space-y-3">{turnos.data?.map(t => <div key={t.id} className="p-3 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--background)' }}><p className="text-sm font-semibold">{t.descripcion}</p><p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.horaInicio} a {t.horaFin}</p></div>)}</div>}
    {creating && <PersonalModal action={{ mode: tab === 'cargos' ? 'cargo' : 'turno' }} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setSuccess(tab === 'cargos' ? 'Cargo creado correctamente.' : 'Turno creado correctamente.'); resource.reload(); }} />}
  </div>;
}
