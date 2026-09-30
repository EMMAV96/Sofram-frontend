import { apiRequest } from './apiClient';

export interface CalendarioRequest {
  nombre: string;
  periodo: string;
  anio: number;
  estado: string;
}
export interface CalendarioResponse extends CalendarioRequest { id: number }
export interface DetalleCalendarioRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
}
export interface DetalleCalendarioResponse extends DetalleCalendarioRequest {
  id: number;
  calendarioId: number;
}

export const listarCalendarios = (signal?: AbortSignal) => apiRequest<CalendarioResponse[]>('/calendarios', { signal });
export const obtenerCalendario = (id: number, signal?: AbortSignal) => apiRequest<CalendarioResponse>(`/calendarios/${id}`, { signal });
export const crearCalendario = (request: CalendarioRequest) => apiRequest<CalendarioResponse>('/calendarios', { method: 'POST', body: request });
export const listarDetalles = (calendarioId: number, signal?: AbortSignal) => apiRequest<DetalleCalendarioResponse[]>(`/calendarios/${calendarioId}/detalles`, { signal });
export const crearDetalle = (calendarioId: number, request: DetalleCalendarioRequest) => apiRequest<DetalleCalendarioResponse>(`/calendarios/${calendarioId}/detalles`, { method: 'POST', body: request });
export const obtenerDetalle = (id: number, signal?: AbortSignal) => apiRequest<DetalleCalendarioResponse>(`/calendarios/detalles/${id}`, { signal });
