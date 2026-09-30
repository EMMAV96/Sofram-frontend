import type { HabitacionResponse } from '../../api/habitacionesApi';
import type { ResidenteResponse } from '../../api/residentesApi';

export function groupCounts(values: (string | null | undefined)[], fallback: string) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const name = value?.trim() ? value : fallback;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, value]) => ({ name, value }));
}

export function occupancySummary(rooms: HabitacionResponse[]) {
  const capacity = rooms.reduce((sum, room) => sum + room.capacidad, 0);
  const occupied = rooms.reduce((sum, room) => sum + room.ocupacionActual, 0);
  const available = rooms.reduce((sum, room) => sum + room.cuposDisponibles, 0);
  return { capacity, occupied, available, percentage: capacity > 0 ? occupied / capacity * 100 : 0 };
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

export function recentResidents(residents: ResidenteResponse[]) {
  return residents.filter(r => validDate(r.fechaIngreso)).sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso)).slice(0, 5);
}

export function localDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}` : value;
}
