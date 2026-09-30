import { apiRequest } from './apiClient';

export interface HabitacionResponse {
  id: number;
  numero: string;
  capacidad: number;
  tipo: string | null;
  estado: string;
  ocupacionActual: number;
  cuposDisponibles: number;
}

export const listarHabitaciones = (signal?: AbortSignal): Promise<HabitacionResponse[]> => apiRequest<HabitacionResponse[]>('/habitaciones', { signal });

export interface HabitacionRequest {
  numero: string;
  capacidad: number;
  tipo: string | null;
  estado: string;
}

export const obtenerHabitacion = (id: number, signal?: AbortSignal): Promise<HabitacionResponse> => apiRequest<HabitacionResponse>(`/habitaciones/${id}`, { signal });
export const crearHabitacion = (request: HabitacionRequest): Promise<HabitacionResponse> => apiRequest<HabitacionResponse>('/habitaciones', { method: 'POST', body: request });
export const actualizarHabitacion = (id: number, request: HabitacionRequest): Promise<HabitacionResponse> => apiRequest<HabitacionResponse>(`/habitaciones/${id}`, { method: 'PUT', body: request });
