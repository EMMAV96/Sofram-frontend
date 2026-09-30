import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useActividadesCalendario, type ActividadesFranja } from '../components/actividades/useActividadesCalendario';
import * as api from '../api/calendariosApi';
import { useAuth } from '../auth/AuthContext';
import { canViewCalendario, canCreateCalendario, canCreateDetalleCalendario } from '../auth/calendarioPermissions';
import { CalendarioModal } from '../components/calendario/CalendarioModal';
import { ErrorNotice, cardStyle, formatFecha, inputStyle, useApiResource } from '../components/residentes/shared';

export function CalendarioPage() {
  const { user } = useAuth();
  const allowed = canViewCalendario(user?.rol);
  const canManage = canCreateCalendario(user?.rol);
  const calendarios = useApiResource(api.listarCalendarios, 'calendarios', allowed);
  const [preferredCalendarioId, setPreferredCalendarioId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  // Conservar la elección si sigue disponible; de lo contrario usar el primero
  // recibido, sin atribuir al orden de la API un significado cronológico.
  const selected = calendarios.data?.find(c => c.id === preferredCalendarioId) ?? calendarios.data?.[0];
  const selectedCalendarioId = selected?.id;
  const selector = <select aria-label="Cambiar calendario" value={selectedCalendarioId ?? ''}
    onChange={e => { setPreferredCalendarioId(Number(e.target.value)); setSuccess(''); }}
    className="max-w-full sm:max-w-xs px-2 py-1.5 rounded-lg text-xs" style={inputStyle}>
    {calendarios.data?.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.periodo} — {c.anio} — {c.estado}</option>)}
  </select>;
  const controls = canManage ? <details className="relative text-sm">
    <summary className="cursor-pointer px-3 py-1.5 rounded-lg text-xs" style={inputStyle}>Administrar calendarios</summary>
    <div className="absolute right-0 z-20 mt-2 w-72 max-w-[85vw] rounded-xl p-4 shadow-lg space-y-3" style={cardStyle}>
      <p className="text-xs font-medium">Calendarios existentes</p>
      {selector}
      <button onClick={() => { setSuccess(''); setCreating(true); }} className="block px-3 py-2 rounded-lg text-xs font-medium" style={inputStyle}>Nuevo calendario</button>
    </div>
  </details> : (calendarios.data?.length ?? 0) > 1 ? selector : null;
  if (!allowed) return <ErrorNotice message="Acceso no autorizado al módulo Calendario." />;
  return <div className="space-y-4">
    {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
    {calendarios.loading ? <p role="status">Cargando calendarios…</p> : calendarios.error ? <ErrorNotice message={calendarios.error} retry={calendarios.reload} /> : calendarios.data && (
      selectedCalendarioId !== undefined ? <CalendarioSeleccionado key={`${selectedCalendarioId}-${user?.rol}`} calendarioId={selectedCalendarioId} controls={controls} />
        : <div className="rounded-xl p-5 space-y-3 text-sm" style={cardStyle}>
          <p>No hay un calendario disponible.</p>
          {canManage && <button onClick={() => { setSuccess(''); setCreating(true); }} className="px-3 py-2 rounded-lg text-xs font-medium" style={inputStyle}>Crear calendario</button>}
        </div>
    )}
    {creating && canManage && <CalendarioModal mode="calendario" onClose={() => setCreating(false)} onSaved={calendario => {
      setCreating(false); setSuccess('Calendario creado correctamente.'); setPreferredCalendarioId(calendario.id); calendarios.reload();
    }} />}
  </div>;
}

function CalendarioSeleccionado({ calendarioId, controls }: { calendarioId: number; controls: ReactNode }) {
  const { user } = useAuth();
  const allowed = canViewCalendario(user?.rol);
  const calendario = useApiResource(signal => api.obtenerCalendario(calendarioId, signal), `calendario-${calendarioId}`, allowed);
  const detalles = useApiResource(signal => api.listarDetalles(calendarioId, signal), `detalles-calendario-${calendarioId}`, allowed);
  const actividades = useActividadesCalendario(detalles.data?.map(d => d.id) ?? [], allowed);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [focusDate, setFocusDate] = useState<string | undefined>();
  if (!allowed) return null;
  return <div className="space-y-5">
    {success && <p role="status" className="rounded-lg p-3 text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>{success}</p>}
    {calendario.loading ? <p role="status">Cargando calendario…</p> : calendario.error ? <ErrorNotice message={calendario.error} retry={calendario.reload} /> : calendario.data && <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h2 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}>{calendario.data.nombre}</h2><p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{calendario.data.periodo} · {calendario.data.anio} · {calendario.data.estado}</p></div>
        <div className="flex flex-wrap items-center gap-2">{canCreateDetalleCalendario(user?.rol) && <button onClick={() => { setSuccess(''); setCreating(true); }} className="px-3 py-1.5 rounded-lg text-xs" style={inputStyle}>Agregar detalle</button>}{controls}</div>
      </div>
      {detalles.loading ? <p role="status">Cargando detalles…</p> : detalles.error ? <ErrorNotice message={detalles.error} retry={detalles.reload} /> : detalles.data && (
        detalles.data.length === 0 ? <div className="rounded-xl p-5 text-sm" style={cardStyle}>Este calendario aún no tiene detalles.</div>
          : <VistaTemporal detalles={detalles.data} initialDate={focusDate ?? detalles.data[0].fecha} actividades={actividades} />
      )}
    </>}
    {creating && calendario.data && <CalendarioModal mode="detalle" calendario={calendario.data} onClose={() => setCreating(false)} onSaved={detalle => {
      setCreating(false); setSuccess('Detalle agregado correctamente.'); setFocusDate(detalle.fecha); detalles.reload();
    }} />}
  </div>;
}

// Sólo navegación visual: las fechas/horas de los DTO se mantienen como strings locales.
function dateString(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function localDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); }
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
type Vista = 'mes' | 'semana' | 'dia' | 'agenda';
type ActividadesCalendario = { entries: Record<number, ActividadesFranja>; retry: (id: number) => void };
function Franja({ detalle, actividades }: { detalle: api.DetalleCalendarioResponse; actividades: ActividadesCalendario }) {
  const items = actividades.entries[detalle.id];
  return <div data-calendario-id={detalle.calendarioId} data-detalle-calendario-id={detalle.id} className="text-xs px-1.5 py-1 rounded mb-1 break-words" style={{ background: 'rgba(27,67,50,0.1)', color: 'var(--primary)' }} title={`${formatFecha(detalle.fecha)} · ${detalle.horaInicio} - ${detalle.horaFin} · ${detalle.estado}`}>
    <p className="font-semibold">{detalle.horaInicio} - {detalle.horaFin}</p><p>{detalle.estado}</p>
    {(!items || items.loading) && <p role="status" className="mt-1 opacity-70">Cargando actividades…</p>}
    {items?.error && <div role="alert" className="mt-1 text-red-700"><p>{items.error}</p><button type="button" onClick={() => actividades.retry(detalle.id)} className="underline">Reintentar actividades</button></div>}
    {items?.data?.map(actividad => <Link key={actividad.id} to={`/actividades?actividadId=${actividad.id}`} data-actividad-id={actividad.id} data-detalle-calendario-id={actividad.detalleCalendarioId} className="block mt-2 rounded p-1 hover:underline" style={{ background: 'var(--card)' }}>
      <p className="font-semibold">{actividad.nombre}</p><p>{actividad.tipo} · {actividad.estado}</p>
    </Link>)}
  </div>;
}
function VistaTemporal({ detalles, initialDate, actividades }: { detalles: api.DetalleCalendarioResponse[]; initialDate: string; actividades: ActividadesCalendario }) {
  const [vista, setVista] = useState<Vista>('mes');
  const [date, setDate] = useState(initialDate);
  const current = localDate(date);
  const year = current.getFullYear(), month = current.getMonth();
  const first = new Date(year, month, 1, 12);
  const days = new Date(year, month + 1, 0, 12).getDate();
  const cells: Array<Date | null> = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= days; day++) cells.push(new Date(year, month, day, 12));
  while (cells.length % 7) cells.push(null);
  const startWeek = localDate(date); startWeek.setDate(startWeek.getDate() - startWeek.getDay());
  const week = Array.from({ length: 7 }, (_, i) => { const day = new Date(startWeek); day.setDate(day.getDate() + i); return day; });
  const shownDays = vista === 'mes' ? cells : week;
  const today = dateString(new Date());
  const periodDetails = detalles.filter(d => vista === 'agenda' || (vista === 'mes' ? d.fecha.slice(0, 7) === date.slice(0, 7) : vista === 'dia' ? d.fecha === date : d.fecha >= dateString(week[0]) && d.fecha <= dateString(week[6])));
  function move(direction: number) {
    const next = vista === 'mes' ? new Date(year, month + direction, 1, 12) : localDate(date);
    if (vista !== 'mes') next.setDate(next.getDate() + direction * (vista === 'semana' ? 7 : 1));
    setDate(dateString(next));
  }
  return <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center flex-wrap gap-3">
        {vista !== 'agenda' && <><button onClick={() => move(-1)} aria-label="Período anterior" className="p-2 rounded-lg" style={inputStyle}>‹</button><h3 className="font-semibold capitalize" style={{ fontFamily: 'Lora, serif', color: 'var(--primary)' }}>{vista === 'mes' ? current.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : vista === 'semana' ? `${formatFecha(dateString(week[0]))} — ${formatFecha(dateString(week[6]))}` : formatFecha(date)}</h3><button onClick={() => move(1)} aria-label="Período siguiente" className="p-2 rounded-lg" style={inputStyle}>›</button>
          <input type="date" aria-label="Ir a fecha" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} className="px-2 py-1 rounded-lg text-sm" style={inputStyle} /></>}
      </div>
      <div className="flex rounded-lg overflow-hidden self-start" style={{ border: '1px solid var(--border)' }}>
        {(['mes', 'semana', 'dia', 'agenda'] as const).map(v => <button key={v} onClick={() => setVista(v)} aria-pressed={vista === v} className="px-3 py-2 text-xs font-medium capitalize" style={{ background: vista === v ? 'var(--primary)' : 'var(--card)', color: vista === v ? 'white' : 'var(--muted-foreground)' }}>{v === 'dia' ? 'Día' : v}</button>)}
      </div>
    </div>
    {periodDetails.length === 0 && <p className="text-sm">No hay detalles en el período visible. Consulte la agenda para ver todos los detalles del calendario.</p>}
    {vista === 'mes' || vista === 'semana' ? <div className="rounded-xl overflow-x-auto" style={cardStyle}><div className="min-w-[640px]">
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>{diasSemana.map(d => <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold uppercase" style={{ color: 'var(--muted-foreground)' }}>{d}</div>)}</div>
      <div className="grid grid-cols-7">{shownDays.map((day, index) => {
        const key = day ? dateString(day) : '';
        return <div key={key || `empty-${index}`} className={`${vista === 'mes' ? 'min-h-[90px]' : 'min-h-[200px]'} p-1.5`} style={{ border: '1px solid var(--border)', background: !day ? 'var(--muted)' : key === today ? 'rgba(27,67,50,0.04)' : 'var(--card)' }}>
          {day && <><button onClick={() => { setDate(key); setVista('dia'); }} aria-label={`Ver ${formatFecha(key)}`} className="w-6 h-6 rounded-full text-xs mb-1" style={{ background: key === today ? 'var(--primary)' : 'transparent', color: key === today ? 'white' : 'var(--foreground)' }}>{day.getDate()}</button>
            {detalles.filter(d => d.fecha === key).map(d => <Franja key={d.id} detalle={d} actividades={actividades} />)}</>}
        </div>;
      })}</div>
    </div></div> : <div className="rounded-xl p-5 space-y-3" style={cardStyle}>
      {periodDetails.map(d => <div key={d.id} className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--background)' }}><p className="text-sm font-semibold shrink-0" style={{ color: 'var(--primary)' }}>{formatFecha(d.fecha)}</p><Franja detalle={d} actividades={actividades} /></div>)}
    </div>}
  </div>;
}
