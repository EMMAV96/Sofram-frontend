export function NavIcon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    residentes: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    habitaciones: 'M3 21V3 M3 14h18v7 M3 18h18 M7 14V8h10a4 4 0 0 1 4 4v2 M7 8H3',
    'historia-clinica': 'M9 3h6v4H9z M9 5H5v16h14V5h-4 M8 12h8 M8 16h5',
    'gestion-medica': 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
    personal: 'M8 7V3h8v4 M3 7h18v14H3z M3 12h18 M10 12v3h4v-3',
    calendario: 'M3 5h18v16H3z M7 3v4 M17 3v4 M3 11h18 M7 15h2 M13 15h2',
    actividades: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    reportes: 'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h8',
    auditoria: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z M8 12l3 3 5-6',
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] ?? paths.dashboard} /></svg>;
}
