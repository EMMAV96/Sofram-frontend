import { NavIcon } from '../NavIcon';
import type { CSSProperties } from 'react';
import type { ReactNode } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { cardStyle, ErrorNotice } from '../residentes/shared';

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--olive)', '#9CB8A8', '#A97832', '#D3D99A'];
export interface ResourceState { loading: boolean; error: string; reload: () => void }

export function ResourceContent({ resource, children }: { resource: ResourceState; children: ReactNode }) {
  if (resource.loading) return <p role="status" className="text-sm py-3">Cargando…</p>;
  if (resource.error) return <ErrorNotice message={resource.error} retry={resource.reload} />;
  return <>{children}</>;
}

export function DashboardPanel({ title, resource, children }: { title: string; resource: ResourceState; children: ReactNode }) {
  return <section className="rounded-xl p-5 min-w-0" style={cardStyle}>
    <h3 className="dashboard-panel-title mb-4" style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>{title}</h3>
    <ResourceContent resource={resource}>{children}</ResourceContent>
  </section>;
}

export function DashboardStatCard({ label, value, sub, resource }: { label: string; value: string | number; sub?: string; resource: ResourceState }) {
  const appearance = label.includes('Ocupación') ? ['habitaciones', 'var(--olive)', 'var(--olive-soft)'] : label.includes('Cupos') ? ['habitaciones', 'var(--accent)', 'var(--gold-soft)'] : label.includes('Actividades') ? ['actividades', 'var(--accent)', 'var(--gold-soft)'] : label.includes('Empleados') ? ['personal', 'var(--secondary)', 'var(--green-soft)'] : ['residentes', 'var(--primary)', 'var(--green-soft)'];
  return <section className="dashboard-stat rounded-xl p-5 min-w-0 space-y-2" style={{ ...cardStyle, '--stat-accent': appearance[1], '--stat-surface': appearance[2] } as CSSProperties}>
    <div className="stat-icon"><NavIcon name={appearance[0]} /></div>
    <h3 className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</h3>
    <ResourceContent resource={resource}>
      <p style={{ fontFamily: 'Lora, serif', fontSize: 38, fontWeight: 700, color: 'var(--primary)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>}
    </ResourceContent>
  </section>;
}

export function DistributionChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No hay registros disponibles.</p>;
  return <>
    <ResponsiveContainer width="100%" height={180}>
      <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
        {data.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
      </Pie><Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} /></PieChart>
    </ResponsiveContainer>
    <ul className="space-y-3 max-h-48 overflow-y-auto">
      {data.map((item, index) => <li key={item.name} className="flex items-start justify-between gap-3 text-xs">
        <span className="flex items-start gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: COLORS[index % COLORS.length] }} /><span className="break-words min-w-0">{item.name}</span></span>
        <strong>{item.value}</strong>
      </li>)}
    </ul>
  </>;
}
