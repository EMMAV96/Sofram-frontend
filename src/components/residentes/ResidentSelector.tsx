import { useId, useState } from 'react';
import type { ResidenteResponse } from '../../api/residentesApi';
import { cardStyle, inputStyle } from './shared';

export function normalizeResidentSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.,\s-]+/g, ' ').trim();
}
export function ResidentSelector({ residentes, value, onChange, loading = false, disabled = false }: {
  residentes: ResidenteResponse[]; value: string; onChange: (id: string) => void; loading?: boolean; disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = residentes.find(r => String(r.id) === value);
  const terms = normalizeResidentSearch(query).split(' ').filter(Boolean);
  const matches = residentes.filter(r => {
    const haystack = normalizeResidentSearch(`${r.nombre} ${r.apellido} ${r.dni}`);
    const digits = query.replace(/\D/g, '');
    return terms.every(term => haystack.includes(term)) || (!!digits && /^[\d.\s-]+$/.test(query) && r.dni.replace(/\D/g, '').includes(digits));
  });
  if (selected && !open) return <section className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3" style={{ ...cardStyle, borderLeft: '4px solid var(--olive)' }}>
    <div><p className="font-semibold text-primary">{selected.nombre} {selected.apellido}</p><p className="text-xs text-muted-foreground">DNI {selected.dni}{selected.habitacionNumero ? ` · Habitación ${selected.habitacionNumero}` : ''}</p></div>
    <button type="button" disabled={disabled || loading} className="px-3 py-2 text-sm rounded-lg border border-border bg-card" onClick={() => { setOpen(true); requestAnimationFrame(() => document.getElementById(id)?.focus()); }}>Cambiar residente</button>
  </section>;
  return <section className="rounded-xl p-4 space-y-3" style={cardStyle}>
    <label htmlFor={id} className="block text-sm font-semibold">Buscar residente</label>
    <input id={id} type="search" value={query} disabled={disabled || loading} placeholder="Nombre, apellido o DNI"
      aria-controls={`${id}-results`} aria-expanded={open} onFocus={() => setOpen(true)}
      onChange={e => { setQuery(e.target.value); setOpen(true); }}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (matches.length === 1) { onChange(String(matches[0].id)); setOpen(false); setQuery(''); } } if (e.key === 'Escape') setOpen(false); if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); requestAnimationFrame(() => document.getElementById(`${id}-results`)?.querySelector('button')?.focus()); } }}
      className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
    {loading && <p role="status" className="text-sm">Cargando residentes…</p>}
    {open && !loading && !disabled && <div id={`${id}-results`} className="max-h-52 overflow-y-auto divide-y divide-border" onKeyDown={e => {
      if (e.key === 'Escape') { setOpen(false); document.getElementById(id)?.focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); const buttons = Array.from(e.currentTarget.querySelectorAll('button')); const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[Math.max(0, Math.min(buttons.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
      }
    }}>
      {!matches.length && <p role="status" className="text-sm py-3">No se encontraron residentes.</p>}
      {matches.slice(0, 30).map(r => <button type="button" key={r.id} className="block w-full text-left p-3 rounded-lg hover:bg-muted" onClick={() => { onChange(String(r.id)); setOpen(false); setQuery(''); }}>
        <span className="block font-medium text-sm">{r.apellido}, {r.nombre}</span>
        <span className="block text-xs text-muted-foreground">DNI {r.dni}{r.habitacionNumero ? ` · Habitación ${r.habitacionNumero}` : ''}</span>
      </button>)}
      {matches.length > 30 && <p className="text-xs p-2">Mostrando 30 coincidencias. Afine la búsqueda para ver otros residentes.</p>}
    </div>}
    {selected && <div className="rounded-lg p-3 bg-muted border-l-4 border-primary" aria-live="polite">
      <p className="text-xs text-muted-foreground">Residente seleccionado</p><p className="font-semibold">{selected.nombre} {selected.apellido}</p>
      <p className="text-xs">DNI {selected.dni}{selected.habitacionNumero ? ` · Habitación ${selected.habitacionNumero}` : ''}</p>
    </div>}
  </section>;
}
